import { ZodError } from 'zod';
import { placeBidSchema, searchAuctionsQuerySchema } from 'shared';
import { MIN_BID_INCREMENT } from 'shared/constants';
import prisma from '../lib/prisma.js';
import { trySettleAuctionIfExpired } from '../services/auctionEngine.js';
import { computeExtendedEndsAt } from '../utils/bidExtension.js';
import { emitBidUpdate } from '../socket/emitters.js';

export const getAllAuctions = async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = auctions.map(a => ({
      ...a,
      startingBid: parseFloat(a.startingBid),
      buyNowPrice: a.buyNowPrice ? parseFloat(a.buyNowPrice) : null,
      currentBid: a.currentBid ? parseFloat(a.currentBid) : null,
    }));

    res.json({ success: true, auctions: formatted });
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

    const formatted = {
      ...auction,
      startingBid: parseFloat(auction.startingBid),
      buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
      currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
      bids: auction.bids.map(b => ({
        ...b,
        amount: parseFloat(b.amount),
      })),
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
      };
    });

    emitBidUpdate(auctionId, {
      auctionId,
      currentBid: result.currentBid,
      currentWinnerId: userId,
      previousWinnerId: result.previousWinnerId,
      endsAt: result.endsAt.toISOString(),
      extended: result.extended,
      bid: {
        id: result.bid.id,
        amount: parseFloat(result.bid.amount),
        placedAt: result.bid.placedAt,
        user: result.bid.user,
      },
    });

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

export const updateAuction = async (req, res) => {
  return res
    .status(501)
    .json({ success: false, message: 'updateAuction not implemented yet' });
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

    await prisma.auction.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return res.status(200).json({ success: true, message: 'Auction cancelled' });
  } catch (error) {
    console.error('deleteAuction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel auction' });
  }
};

const formatAuctionForApi = auction => {
  if (!auction) return auction;
  return {
    ...auction,
    startingBid: parseFloat(auction.startingBid),
    buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
    currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
  };
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

    if (categoryId) where.categoryId = categoryId;

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['live', 'scheduled'] };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
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

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          seller: { select: { id: true, username: true, avatarUrl: true } },
          category: true,
          _count: { select: { bids: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.auction.count({ where }),
    ]);

    return res.json({
      success: true,
      query: { q, categoryId, status, minPrice, maxPrice, sortBy, page, limit },
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