import prisma from '../lib/prisma.js';
import { emitAuctionEnd } from '../socket/emitters.js';

const TERMINAL_STATUSES = ['ended', 'completed', 'cancelled'];

/**
 * Promote scheduled auctions whose start time has passed to live.
 */
export async function promoteScheduledAuctions(now = new Date()) {
  const result = await prisma.auction.updateMany({
    where: {
      status: 'scheduled',
      startsAt: { lte: now },
    },
    data: { status: 'live' },
  });
  return result.count;
}

/**
 * Settle a single expired live auction (idempotent).
 * - No bids → status `ended`
 * - Has winner → debit buyer hold, credit seller, status `completed`
 */
export async function settleAuction(auctionId, now = new Date()) {
  const result = await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUnique({ where: { id: auctionId } });
    if (!auction) return { ok: false, reason: 'not_found' };

    if (TERMINAL_STATUSES.includes(auction.status)) {
      return { ok: true, reason: 'already_terminal', status: auction.status };
    }
    if (auction.status !== 'live') {
      return { ok: false, reason: 'not_live', status: auction.status };
    }
    if (new Date(auction.endsAt) > now) {
      return { ok: false, reason: 'not_expired' };
    }

    if (!auction.currentWinnerId || auction.currentBid == null) {
      const updated = await tx.auction.updateMany({
        where: { id: auctionId, status: 'live' },
        data: { status: 'ended' },
      });
      return { ok: updated.count > 0, reason: 'ended_no_bids', status: 'ended', currentBid: null, currentWinnerId: null };
    }

    const winAmount = Number(auction.currentBid);
    const winnerId = auction.currentWinnerId;
    const sellerId = auction.sellerId;

    const winnerWallet = await tx.wallet.findUnique({ where: { userId: winnerId } });
    if (!winnerWallet) {
      console.error(`Settlement: winner wallet missing for auction ${auctionId}`);
      const updated = await tx.auction.updateMany({
        where: { id: auctionId, status: 'live' },
        data: { status: 'ended' },
      });
      return { ok: updated.count > 0, reason: 'winner_wallet_missing', status: 'ended' };
    }

    const winnerBalance = Number(winnerWallet.balance);
    const winnerHeld = Number(winnerWallet.heldBalance);
    if (winnerHeld < winAmount || winnerBalance < winAmount) {
      console.error(
        `Settlement: winner funds mismatch for auction ${auctionId} (held=${winnerHeld}, balance=${winnerBalance}, win=${winAmount})`
      );
      const updated = await tx.auction.updateMany({
        where: { id: auctionId, status: 'live' },
        data: { status: 'ended' },
      });
      return { ok: false, reason: 'winner_insufficient_funds', status: 'ended' };
    }

    await tx.wallet.update({
      where: { id: winnerWallet.id },
      data: {
        balance: { decrement: winAmount },
        heldBalance: { decrement: winAmount },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: winnerWallet.id,
        type: 'debit',
        amount: winAmount,
        auctionId,
        description: 'Auction payment',
      },
    });

    let sellerWallet = await tx.wallet.findUnique({ where: { userId: sellerId } });
    if (!sellerWallet) {
      sellerWallet = await tx.wallet.create({
        data: { userId: sellerId, balance: 0, heldBalance: 0 },
      });
    }
    await tx.wallet.update({
      where: { id: sellerWallet.id },
      data: { balance: { increment: winAmount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: sellerWallet.id,
        type: 'credit',
        amount: winAmount,
        auctionId,
        description: 'Sale proceeds',
      },
    });

    const updated = await tx.auction.updateMany({
      where: { id: auctionId, status: 'live' },
      data: { status: 'completed' },
    });
    if (updated.count === 0) {
      throw new Error(`Settlement race detected for auction ${auctionId}`);
    }

    return {
      ok: true,
      reason: 'completed',
      status: 'completed',
      amount: winAmount,
      currentBid: winAmount,
      currentWinnerId: winnerId,
    };
  });

  if (result.ok && (result.status === 'completed' || result.status === 'ended')) {
    emitAuctionEnd(auctionId, {
      auctionId,
      status: result.status,
      currentBid: result.currentBid != null ? result.currentBid : null,
      currentWinnerId: result.currentWinnerId ?? null,
    });
  }

  return result;
}

/**
 * Settle one auction if it is live and past endsAt. Safe to call from HTTP handlers.
 */
export async function trySettleAuctionIfExpired(auctionId, now = new Date()) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { id: true, status: true, endsAt: true },
  });
  if (!auction) return null;
  if (auction.status !== 'live') return null;
  if (new Date(auction.endsAt) > now) return null;
  return settleAuction(auctionId, now);
}

/**
 * Find all expired live auctions and settle each one.
 */
export async function endExpiredAuctions(now = new Date()) {
  const expired = await prisma.auction.findMany({
    where: {
      status: 'live',
      endsAt: { lte: now },
    },
    select: { id: true },
    orderBy: { endsAt: 'asc' },
  });

  const results = [];
  for (const { id } of expired) {
    results.push({ id, ...(await settleAuction(id, now)) });
  }
  return results;
}

/**
 * Full lifecycle pass: promote scheduled → live, then settle expired live auctions.
 */
export async function runAuctionLifecycleTick(now = new Date()) {
  const promoted = await promoteScheduledAuctions(now);
  const settlements = await endExpiredAuctions(now);

  const settled = settlements.filter((r) => r.ok && r.reason === 'completed').length;
  const endedNoBids = settlements.filter((r) => r.reason === 'ended_no_bids').length;

  if (promoted > 0 || settlements.length > 0) {
    console.log(
      `[auction-engine] promoted=${promoted} settled=${settled} ended_no_bids=${endedNoBids} processed=${settlements.length}`
    );
  }

  return { promoted, settlements };
}
