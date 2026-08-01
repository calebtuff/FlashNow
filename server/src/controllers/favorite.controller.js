import { ZodError } from 'zod';
import { favoriteAuctionIdParamSchema, listFavoritesQuerySchema } from 'shared';
import prisma from '../lib/prisma.js';

const auctionInclude = {
  seller: {
    select: { id: true, username: true, avatarUrl: true },
  },
  category: true,
  _count: { select: { bids: true } },
};

function formatAuction(auction) {
  if (!auction) return auction;
  return {
    ...auction,
    startingBid: parseFloat(auction.startingBid),
    buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
    currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
  };
}

async function findSavableAuction(auctionId) {
  return prisma.auction.findUnique({
    where: { id: auctionId },
    select: { id: true, status: true },
  });
}

export const getFavoriteIds = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rows = await prisma.auctionFavorite.findMany({
      where: { userId },
      select: { auctionId: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      auctionIds: rows.map((row) => row.auctionId),
    });
  } catch (error) {
    console.error('getFavoriteIds error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch saved auctions' });
  }
};

export const listFavorites = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { page, limit } = listFavoritesQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      auction: { status: { not: 'draft' } },
    };

    const [total, favorites] = await Promise.all([
      prisma.auctionFavorite.count({ where }),
      prisma.auctionFavorite.findMany({
        where,
        include: {
          auction: { include: auctionInclude },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return res.json({
      success: true,
      favorites: favorites.map((row) => ({
        savedAt: row.createdAt,
        auction: formatAuction(row.auction),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid query parameters',
        errors: error.errors,
      });
    }
    console.error('listFavorites error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch saved auctions' });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { auctionId } = favoriteAuctionIdParamSchema.parse(req.params);
    const auction = await findSavableAuction(auctionId);

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.status === 'draft') {
      return res.status(400).json({ success: false, message: 'Draft auctions cannot be saved' });
    }

    await prisma.auctionFavorite.upsert({
      where: {
        userId_auctionId: { userId, auctionId },
      },
      create: { userId, auctionId },
      update: {},
    });

    return res.status(201).json({
      success: true,
      favorited: true,
      auctionId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid auction id',
        errors: error.errors,
      });
    }
    console.error('addFavorite error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save auction' });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { auctionId } = favoriteAuctionIdParamSchema.parse(req.params);

    await prisma.auctionFavorite.deleteMany({
      where: { userId, auctionId },
    });

    return res.json({
      success: true,
      favorited: false,
      auctionId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid auction id',
        errors: error.errors,
      });
    }
    console.error('removeFavorite error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove saved auction' });
  }
};
