import { ZodError } from 'zod';
import { updateUserSchema } from 'shared';
import prisma from '../lib/prisma.js';

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

