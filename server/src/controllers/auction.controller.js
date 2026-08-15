import { ZodError } from 'zod';
import { placeBidSchema, searchAuctionsQuerySchema, updateAuctionSchema } from 'shared';
import { MIN_BID_INCREMENT, NOTIFICATION_TYPES } from 'shared/constants';
import prisma from '../lib/prisma.js';
import { trySettleAuctionIfExpired } from '../services/auctionEngine.js';
import { computeExtendedEndsAt } from '../utils/bidExtension.js';
import { emitBidUpdate, emitAuctionEnd } from '../socket/emitters.js';
import { createNotification, notifySafely } from '../services/notificationService.js';
import { buyNowAuction as executeBuyNow } from '../services/buyNowService.js';
import { descendantIds, isSelectable } from './categories.controller.js';

/** Caps the clause count so a pasted paragraph cannot build a monstrous query. */
const MAX_SEARCH_TERMS = 8;

/* ---------------------------------------------------------------------------
 * The board
 *
 * Three bounded queries rather than one unbounded read of the table. What the
 * board is for is everything running, the lots about to open, and the handful
 * that just closed; reading every auction ever created meant a payload that
 * grew without limit and a client that mounted a live countdown per row.
 *
 * The status filters are also load-bearing rather than cosmetic. `draft` is the
 * schema default, so an unfiltered read published every seller's unlisted lot
 * on the front page, and `cancelled` lots have no reason to be advertised.
 * ------------------------------------------------------------------------- */
const BOARD_LIVE_LIMIT = 60;
const BOARD_OPENING_LIMIT = 20;
const BOARD_CLOSED_LIMIT = 5;
const BOARD_OPENING_WINDOW_MS = 24 * 60 * 60 * 1000;

const BOARD_INCLUDE = {
  seller: { select: { id: true, username: true, avatarUrl: true } },
  category: true,
  _count: { select: { bids: true } },
};

export const getAllAuctions = async (req, res) => {
  try {
    const opensBy = new Date(Date.now() + BOARD_OPENING_WINDOW_MS);

    const [live, opening, closed, liveTotal] = await Promise.all([
      prisma.auction.findMany({
        where: { status: 'live' },
        include: BOARD_INCLUDE,
        // Whatever closes first is the thing a bidder can still act on, so that
        // is what survives the cap.
        orderBy: { endsAt: 'asc' },
        take: BOARD_LIVE_LIMIT,
      }),
      prisma.auction.findMany({
        // Bounded by start time, not by now: a lot whose start has passed but
        // which the promoter has not flipped to live yet still belongs here.
        where: { status: 'scheduled', startsAt: { lte: opensBy } },
        include: BOARD_INCLUDE,
        orderBy: { startsAt: 'asc' },
        take: BOARD_OPENING_LIMIT,
      }),
      prisma.auction.findMany({
        where: { status: { in: ['ended', 'completed'] } },
        include: BOARD_INCLUDE,
        orderBy: { endsAt: 'desc' },
        take: BOARD_CLOSED_LIMIT,
      }),
      prisma.auction.count({ where: { status: 'live' } }),
    ]);

    res.json({
      success: true,
      auctions: [...live, ...opening, ...closed].map(formatAuctionForApi),
      // The list is capped, so the true running count is no longer something
      // the client can get by counting rows. The bezel prints it permanently.
      counts: { live: liveTotal, liveTruncated: live.length < liveTotal },
    });
  } catch (error) {
    console.error('getAllAuctions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch auctions' });
  }
};

export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    await trySettleAuctionIfExpired(id);

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
        bids: {
          orderBy: { placedAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { bids: true } },
      },
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const viewerId = req.user?.id ?? null;
    const [sellerRatingAgg, viewerExistingRating, viewerFavorite] = await Promise.all([
      prisma.rating.aggregate({
        where: { toUserId: auction.sellerId },
        _avg: { score: true },
        _count: { score: true },
      }),
      viewerId
        ? prisma.rating.findUnique({
            where: {
              fromUserId_auctionId: { fromUserId: viewerId, auctionId: id },
            },
            select: { score: true, comment: true, createdAt: true },
          })
        : Promise.resolve(null),
      viewerId
        ? prisma.auctionFavorite.findUnique({
            where: {
              userId_auctionId: { userId: viewerId, auctionId: id },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    let viewerRating = null;
    if (
      viewerId &&
      auction.status === 'completed' &&
      auction.currentWinnerId === viewerId &&
      auction.sellerId !== viewerId
    ) {
      viewerRating = {
        canRate: !viewerExistingRating,
        existing: viewerExistingRating,
      };
    } else if (viewerExistingRating) {
      viewerRating = {
        canRate: false,
        existing: viewerExistingRating,
      };
    }

    const formatted = {
      ...auction,
      startingBid: parseFloat(auction.startingBid),
      buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
      currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
      seller: {
        ...auction.seller,
        rating: {
          average: sellerRatingAgg._avg.score || 0,
          count: sellerRatingAgg._count.score,
        },
      },
      bids: auction.bids.map(b => ({
        ...b,
        amount: parseFloat(b.amount),
      })),
      viewerRating,
      isFavorited: Boolean(viewerFavorite),
    };

    res.json({ success: true, auction: formatted });
  } catch (error) {
    console.error('getAuctionById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch auction' });
  }
};

export const createAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      images,
      categoryId,
      startingBid,
      buyNowPrice,
      durationMinutes,
      startsAt,
    } = req.body;

    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Basic validation for now (you can replace this with Zod)
    if (!title || !description || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and at least one image are required',
      });
    }

    if (!startingBid || Number(startingBid) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'startingBid must be a positive number' });
    }

    if (!durationMinutes || durationMinutes < 5 || durationMinutes > 30) {
      return res.status(400).json({
        success: false,
        message: 'durationMinutes must be between 5 and 15',
      });
    }

    // A lot must be filed against a category that has no subcategories, or it
    // is invisible to anyone browsing a specific one.
    if (categoryId && !(await isSelectable(categoryId))) {
      return res.status(400).json({
        success: false,
        message: 'Choose a specific subcategory so buyers browsing can find this lot',
      });
    }

    const startsAtDate = startsAt ? new Date(startsAt) : new Date();
    if (Number.isNaN(startsAtDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'startsAt must be a valid date',
      });
    }

    const endsAt = new Date(startsAtDate.getTime() + durationMinutes * 60 * 1000);

    const auction = await prisma.auction.create({
      data: {
        sellerId,
        categoryId: categoryId || null,
        title,
        description,
        images,
        startingBid,
        buyNowPrice: buyNowPrice || null,
        durationMinutes,
        status: startsAtDate <= new Date() ? 'live' : 'scheduled',
        startsAt: startsAtDate,
        endsAt,
      },
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
      },
    });

    const formatted = {
      ...auction,
      startingBid: parseFloat(auction.startingBid),
      buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
      currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
    };

    res.status(201).json({ success: true, auction: formatted });
  } catch (error) {
    console.error('createAuction error:', error);
    res.status(500).json({ success: false, message: 'Failed to create auction' });
  }
};

export const placeBid = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: auctionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const amount = typeof req.body?.amount === 'string' ? Number(req.body.amount) : req.body?.amount;
    placeBidSchema.parse({ auctionId, amount });

    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({ where: { id: auctionId } });
      const now = new Date();

      if (!auction) throw { httpCode: 404, httpMessage: 'Auction not found' };
      if (auction.sellerId === userId) throw { httpCode: 403, httpMessage: 'You cannot bid on your own auction' };
      if (auction.currentWinnerId === userId) throw { httpCode: 400, httpMessage: 'You are already the highest bidder' };

      // Live-only: reject anything already finished or past its end time.
      const terminal = ['ended', 'completed', 'cancelled'];
      if (terminal.includes(auction.status) || new Date(auction.endsAt) <= now) {
        throw { httpCode: 400, httpMessage: 'Auction has ended' };
      }
      // Reject auctions that have not reached their start time yet.
      if (new Date(auction.startsAt) > now) {
        throw { httpCode: 400, httpMessage: 'Auction has not started yet' };
      }
      // At this point the auction is within its live window.

      const current = Number(auction.currentBid ?? auction.startingBid);
      const minNext = current + MIN_BID_INCREMENT;
      if (amount < minNext) {
        throw { httpCode: 400, httpMessage: `Bid must be at least ${minNext}` };
      }

      // Ensure the bidder has enough AVAILABLE balance (balance minus existing holds).
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId, balance: 0, heldBalance: 0 } });
      }
      const available = Number(wallet.balance) - Number(wallet.heldBalance);
      if (amount > available) {
        throw { httpCode: 400, httpMessage: 'Insufficient wallet balance. Top up to bid.' };
      }

      // Hold the new bidder's funds.
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { heldBalance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: 'hold', amount, auctionId, description: 'Bid hold' },
      });

      // Release the previous leader's hold (a different user, guaranteed by the guard above).
      if (auction.currentWinnerId && auction.currentBid != null) {
        const prevWallet = await tx.wallet.findUnique({ where: { userId: auction.currentWinnerId } });
        if (prevWallet) {
          await tx.wallet.update({
            where: { id: prevWallet.id },
            data: { heldBalance: { decrement: Number(auction.currentBid) } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: prevWallet.id,
              type: 'release',
              amount: Number(auction.currentBid),
              auctionId,
              description: 'Outbid release',
            },
          });
        }
      }

      // Anti-snipe: bid in the final minute extends the auction.
      const nextEndsAt = computeExtendedEndsAt(auction.endsAt, now);
      const extended = nextEndsAt.getTime() !== new Date(auction.endsAt).getTime();

      // Race-safe update: only succeeds if currentBid is unchanged since we read it.
      // Also lazily promotes a scheduled auction whose start time has passed to 'live'.
      const updated = await tx.auction.updateMany({
        where:
          auction.currentBid === null
            ? { id: auctionId, currentBid: null }
            : { id: auctionId, currentBid: auction.currentBid },
        data: {
          currentBid: amount,
          currentWinnerId: userId,
          status: 'live',
          endsAt: nextEndsAt,
        },
      });
      if (updated.count === 0) {
        throw { httpCode: 409, httpMessage: 'Someone just placed a higher bid. Please try again.' };
      }

      const bid = await tx.bid.create({ data: { auctionId, userId, amount } });
      const bidWithUser = await tx.bid.findUnique({
        where: { id: bid.id },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      return {
        bid: bidWithUser,
        currentBid: amount,
        endsAt: nextEndsAt,
        extended,
        previousWinnerId: auction.currentWinnerId,
        auctionTitle: auction.title,
      };
    });

    emitBidUpdate(auctionId, {
      auctionId,
      currentBid: result.currentBid,
      currentWinnerId: userId,
      previousWinnerId: result.previousWinnerId,
      endsAt: result.endsAt.toISOString(),
      extended: result.extended,
      title: result.auctionTitle,
      bid: {
        id: result.bid.id,
        amount: parseFloat(result.bid.amount),
        placedAt: result.bid.placedAt,
        user: result.bid.user,
      },
    });

    if (result.previousWinnerId && result.previousWinnerId !== userId) {
      notifySafely(
        createNotification({
          userId: result.previousWinnerId,
          type: NOTIFICATION_TYPES.OUTBID,
          title: "You've been outbid",
          body: `New bid of $${result.currentBid} on "${result.auctionTitle}"`,
          data: {
            auctionId,
            bidAmount: result.currentBid,
            auctionTitle: result.auctionTitle,
          },
        })
      );
    }

    return res.status(201).json({
      success: true,
      bid: { ...result.bid, amount: parseFloat(result.bid.amount) },
      currentBid: result.currentBid,
      currentWinnerId: userId,
      endsAt: result.endsAt,
      extended: result.extended,
    });
  } catch (error) {
    if (error?.httpCode) {
      return res.status(error.httpCode).json({ success: false, message: error.httpMessage });
    }
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }
    console.error('placeBid error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place bid' });
  }
};

export const buyNow = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id: auctionId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const auction = await executeBuyNow(auctionId, userId);

    return res.json({
      success: true,
      auction,
    });
  } catch (error) {
    if (error?.httpCode) {
      return res.status(error.httpCode).json({ success: false, message: error.httpMessage });
    }
    console.error('buyNow error:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete buy now purchase' });
  }
};

const EDITABLE_AUCTION_STATUSES = ['draft', 'scheduled'];
const BID_LOCKED_UPDATE_FIELDS = new Set(['startingBid', 'buyNowPrice', 'durationMinutes', 'startsAt']);

const formatAuctionForApi = auction => {
  if (!auction) return auction;
  return {
    ...auction,
    startingBid: parseFloat(auction.startingBid),
    buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
    currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
  };
};

export const updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = updateAuctionSchema.parse(req.body);

    const auction = await prisma.auction.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        status: true,
        startsAt: true,
        durationMinutes: true,
        startingBid: true,
        buyNowPrice: true,
      },
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.sellerId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!EDITABLE_AUCTION_STATUSES.includes(auction.status)) {
      return res.status(409).json({
        success: false,
        message: 'Only draft or scheduled auctions can be edited',
      });
    }

    const bidCount = await prisma.bid.count({ where: { auctionId: id } });
    const touchesBidLockedField = Object.keys(body).some(key => BID_LOCKED_UPDATE_FIELDS.has(key));

    if (bidCount > 0 && touchesBidLockedField) {
      return res.status(409).json({
        success: false,
        message: 'Cannot change pricing or schedule after bids have been placed',
      });
    }

    const nextStartingBid =
      body.startingBid !== undefined ? body.startingBid : Number(auction.startingBid);
    const nextBuyNowPrice =
      body.buyNowPrice !== undefined
        ? body.buyNowPrice
        : auction.buyNowPrice != null
          ? Number(auction.buyNowPrice)
          : null;

    if (nextBuyNowPrice != null && nextBuyNowPrice <= nextStartingBid) {
      return res.status(400).json({
        success: false,
        message: 'Buy now price must be higher than starting bid',
      });
    }

    // Same rule as create, but only when the seller is actually changing the
    // category: a pre-existing lot still filed under a parent stays editable.
    if (body.categoryId !== undefined && body.categoryId && !(await isSelectable(body.categoryId))) {
      return res.status(400).json({
        success: false,
        message: 'Choose a specific subcategory so buyers browsing can find this lot',
      });
    }

    const nextStartsAt = body.startsAt !== undefined ? body.startsAt : auction.startsAt;
    const nextDurationMinutes =
      body.durationMinutes !== undefined ? body.durationMinutes : auction.durationMinutes;

    const data = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.images !== undefined && { images: body.images }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.startingBid !== undefined && { startingBid: body.startingBid }),
      ...(body.buyNowPrice !== undefined && { buyNowPrice: body.buyNowPrice }),
      ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
      ...(body.startsAt !== undefined && { startsAt: body.startsAt }),
    };

    if (body.startsAt !== undefined || body.durationMinutes !== undefined) {
      data.endsAt = new Date(nextStartsAt.getTime() + nextDurationMinutes * 60 * 1000);
    }

    if (body.startsAt !== undefined) {
      data.status = nextStartsAt <= new Date() ? 'live' : 'scheduled';
    }

    const updated = await prisma.auction.update({
      where: { id },
      data,
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
        _count: { select: { bids: true } },
      },
    });

    return res.json({
      success: true,
      auction: formatAuctionForApi(updated),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('updateAuction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update auction' });
  }
};

export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const requesterId = req.user?.id;
    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.sellerId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const bidCount = await prisma.bid.count({ where: { auctionId: id } });
    if (bidCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Auction has bids and cannot be cancelled',
      });
    }

    if (auction.status === 'cancelled') {
      return res.status(200).json({ success: true, message: 'Auction already cancelled' });
    }

    if (auction.status === 'completed') {
      return res.status(409).json({
        success: false,
        message: 'Completed auctions cannot be cancelled',
      });
    }

    const updated = await prisma.auction.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        category: true,
        _count: { select: { bids: true } },
      },
    });

    emitAuctionEnd(id, { auctionId: id, status: 'cancelled' });

    return res.status(200).json({
      success: true,
      message: 'Auction cancelled',
      auction: formatAuctionForApi(updated),
    });
  } catch (error) {
    console.error('deleteAuction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel auction' });
  }
};

export const getMySellingAuctions = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const auctions = await prisma.auction.findMany({
      where: { sellerId: userId },
      include: {
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      auctions: auctions.map(formatAuctionForApi),
    });
  } catch (error) {
    console.error('getMySellingAuctions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch auctions' });
  }
};

export const getMyBids = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const bids = await prisma.bid.findMany({
      where: { userId },
      include: {
        auction: {
          include: {
            seller: {
              select: { id: true, username: true, avatarUrl: true },
            },
            category: true,
            _count: { select: { bids: true } },
          },
        },
      },
      orderBy: { placedAt: 'desc' },
    });

    const formatted = bids.map(b => ({
      ...b,
      amount: parseFloat(b.amount),
      auction: formatAuctionForApi(b.auction),
    }));

    return res.json({
      success: true,
      bids: formatted,
    });
  } catch (error) {
    console.error('getMyBids error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bids' });
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const now = new Date();
    const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next 24h
    const endingSoon = new Date(now.getTime() + 30 * 60 * 1000); // next 30m

    // Main feed: live + scheduled starting soon
    const feedAuctions = await prisma.auction.findMany({
      where: {
        OR: [{ status: 'live' }, { status: 'scheduled', startsAt: { lte: soon } }],
      },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { endsAt: 'asc' },
      skip,
      take: limit,
    });

    // Trending MVP: take some live auctions and rank by bid count in JS
    const trendingPool = await prisma.auction.findMany({
      where: { status: 'live' },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { endsAt: 'asc' },
      take: 50,
    });

    const trendingAuctions = trendingPool
      .slice()
      .sort((a, b) => b._count.bids - a._count.bids)
      .slice(0, 5);

    const endingSoonAuctions = await prisma.auction.findMany({
      where: { status: 'live', endsAt: { lte: endingSoon } },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { endsAt: 'asc' },
      take: 5,
    });

    return res.json({
      success: true,
      feed: feedAuctions.map(formatAuctionForApi),
      trending: trendingAuctions.map(formatAuctionForApi),
      endingSoon: endingSoonAuctions.map(formatAuctionForApi),
    });
  } catch (error) {
    console.error('getFeed error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
};

export const searchAuctions = async (req, res) => {
  try {
    const { q, categoryId, status, minPrice, maxPrice, sortBy, page, limit } =
      searchAuctionsQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    const where = {};

    // A category filter matches the category itself plus its subcategories.
    // The category itself must be included: lots created before the taxonomy
    // gained a second level still point at what is now a parent.
    if (categoryId) {
      const ids = await descendantIds(categoryId);
      where.categoryId = ids.length > 1 ? { in: ids } : categoryId;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['live', 'scheduled'] };
    }

    // Match each word independently rather than the whole phrase. The previous
    // `contains: q` compiled to LIKE '%NBA jersey%', so "jersey NBA" found
    // nothing and neither did "NBA jersey" against a lot titled
    // "Chicago Bulls Jordan #23 jersey".
    const terms = q ? q.split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TERMS) : [];
    const termClause = (term) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ],
    });

    if (terms.length > 0) {
      where.AND = terms.map(termClause);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.startingBid = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    let orderBy = { endsAt: 'asc' };
    switch (sortBy) {
      case 'ending_soon':
        orderBy = { endsAt: 'asc' };
        break;
      case 'price_low':
        orderBy = { startingBid: 'asc' };
        break;
      case 'price_high':
        orderBy = { startingBid: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { endsAt: 'asc' };
    }

    const runQuery = (finalWhere) =>
      Promise.all([
        prisma.auction.findMany({
          where: finalWhere,
          include: {
            seller: { select: { id: true, username: true, avatarUrl: true } },
            category: true,
            _count: { select: { bids: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.auction.count({ where: finalWhere }),
      ]);

    let [auctions, total] = await runQuery(where);

    // Requiring every word narrows hard. When a multi-word query finds nothing,
    // fall back once to "any word" and label the response, so the UI can say
    // it is showing partial matches instead of rendering an empty state for a
    // query whose words plainly exist in the catalogue.
    let partial = false;
    if (total === 0 && terms.length > 1) {
      const loose = { ...where };
      delete loose.AND;
      loose.OR = terms.flatMap((term) => termClause(term).OR);
      [auctions, total] = await runQuery(loose);
      partial = total > 0;
    }

    return res.json({
      success: true,
      query: { q, categoryId, status, minPrice, maxPrice, sortBy, page, limit },
      partial,
      results: auctions.map(formatAuctionForApi),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid search parameters',
        errors: error.errors,
      });
    }
    console.error('searchAuctions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to search auctions' });
  }
};