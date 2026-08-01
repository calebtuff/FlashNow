import prisma from '../lib/prisma.js';
import { NOTIFICATION_TYPES } from 'shared/constants';
import { emitAuctionEnd } from '../socket/emitters.js';
import {
  creditSellerWallet,
  debitBuyerDirect,
  releaseBidHold,
} from './auctionCompletion.js';
import { createNotification, notifySafely } from './notificationService.js';

const formatAuctionForApi = auction => {
  if (!auction) return auction;
  return {
    ...auction,
    startingBid: parseFloat(auction.startingBid),
    buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
    currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
  };
};

export async function buyNowAuction(auctionId, buyerId) {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        category: true,
        _count: { select: { bids: true } },
      },
    });

    if (!auction) {
      throw { httpCode: 404, httpMessage: 'Auction not found' };
    }

    if (auction.sellerId === buyerId) {
      throw { httpCode: 403, httpMessage: 'You cannot buy your own auction' };
    }

    if (auction.buyNowPrice == null) {
      throw { httpCode: 400, httpMessage: 'This auction has no buy now option' };
    }

    if (auction.status !== 'live') {
      throw { httpCode: 400, httpMessage: 'This auction is not available for buy now' };
    }

    if (new Date(auction.endsAt) <= now) {
      throw { httpCode: 400, httpMessage: 'This auction has ended' };
    }

    const price = Number(auction.buyNowPrice);

    if (auction.currentWinnerId && auction.currentBid != null) {
      await releaseBidHold(tx, {
        userId: auction.currentWinnerId,
        amount: Number(auction.currentBid),
        auctionId,
        description:
          auction.currentWinnerId === buyerId
            ? 'Buy now release prior hold'
            : 'Outbid release',
      });
    }

    const debit = await debitBuyerDirect(tx, {
      userId: buyerId,
      amount: price,
      auctionId,
      description: 'Buy now purchase',
    });

    if (!debit.ok) {
      throw {
        httpCode: 400,
        httpMessage: 'Insufficient wallet balance. Top up to buy now.',
      };
    }

    await creditSellerWallet(tx, {
      sellerId: auction.sellerId,
      amount: price,
      auctionId,
      description: 'Buy now sale proceeds',
    });

    await tx.bid.create({
      data: { auctionId, userId: buyerId, amount: price },
    });

    const updated = await tx.auction.updateMany({
      where: { id: auctionId, status: 'live' },
      data: {
        status: 'completed',
        currentBid: price,
        currentWinnerId: buyerId,
        endsAt: now,
      },
    });

    if (updated.count === 0) {
      throw { httpCode: 409, httpMessage: 'Someone just bought this item.' };
    }

    const completed = await tx.auction.findUnique({
      where: { id: auctionId },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        category: true,
        _count: { select: { bids: true } },
      },
    });

    return {
      auction: completed,
      amount: price,
      auctionTitle: auction.title,
      sellerId: auction.sellerId,
    };
  });

  emitAuctionEnd(auctionId, {
    auctionId,
    status: 'completed',
    currentBid: result.amount,
    currentWinnerId: buyerId,
  });

  notifySafely(
    createNotification({
      userId: buyerId,
      type: NOTIFICATION_TYPES.AUCTION_WON,
      title: 'Purchase complete!',
      body: `You bought "${result.auctionTitle}" for $${result.amount}`,
      data: { auctionId, auctionTitle: result.auctionTitle, bidAmount: result.amount },
    })
  );

  notifySafely(
    createNotification({
      userId: result.sellerId,
      type: NOTIFICATION_TYPES.AUCTION_SOLD,
      title: 'Your item sold!',
      body: `"${result.auctionTitle}" sold via Buy Now for $${result.amount}`,
      data: { auctionId, auctionTitle: result.auctionTitle, bidAmount: result.amount },
    })
  );

  return formatAuctionForApi(result.auction);
}
