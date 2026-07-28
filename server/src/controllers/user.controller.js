import { ZodError, z } from 'zod';
import { updateUserSchema } from 'shared';
import prisma from '../lib/prisma.js';

const PUBLIC_LISTING_STATUSES = ['live', 'scheduled', 'completed', 'ended'];

function formatAuctionForApi(auction) {
  if (!auction) return auction;
  return {
    ...auction,
    startingBid: parseFloat(auction.startingBid),
    buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
    currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
  };
}

export const getUserAuctions = async (req, res) => {
  try {
    const userId = z.string().uuid().parse(req.params.id);
    const statusParam = req.query.status?.toString();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const statusFilter =
      statusParam && PUBLIC_LISTING_STATUSES.includes(statusParam)
        ? { status: statusParam }
        : { status: { in: PUBLIC_LISTING_STATUSES } };

    const auctions = await prisma.auction.findMany({
      where: { sellerId: userId, ...statusFilter },
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
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
        errors: error.errors,
      });
    }
    console.error('getUserAuctions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user auctions' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            auctions: true,
            bids: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ratings = await prisma.rating.aggregate({
      where: { toUserId: id },
      _avg: { score: true },
      _count: { score: true },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        stats: {
          auctions: user._count.auctions,
          bids: user._count.bids,
          rating: {
            average: ratings._avg.score || 0,
            count: ratings._count.score,
          },
        },
      },
    });
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ratings = await prisma.rating.aggregate({
      where: { toUserId: userId },
      _avg: { score: true },
      _count: { score: true },
    });

    const wallet = user.wallet;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        createdAt: user.createdAt,
        wallet: wallet
          ? {
              balance: parseFloat(wallet.balance),
              heldBalance: parseFloat(wallet.heldBalance),
              availableBalance:
                parseFloat(wallet.balance) - parseFloat(wallet.heldBalance),
              updatedAt: wallet.updatedAt,
            }
          : null,
        rating: {
          average: ratings._avg.score || 0,
          count: ratings._count.score,
        },
      },
    });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch current user' });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { username, displayName, avatarUrl, phone } = updateUserSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username !== undefined && { username }),
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid profile data',
      });
    }
    console.error('updateCurrentUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

