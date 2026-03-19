import { ZodError, z } from 'zod';
import prisma from '../lib/prisma.js';
import { createRatingSchema } from 'shared';

function getUserIdFromRequest(req) {
  return req.user?.id || req.query?.userId || req.body?.userId || null;
}

export const createRating = async (req, res) => {
  try {
    const fromUserIdRaw = getUserIdFromRequest(req);
    if (!fromUserIdRaw) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized (missing user). Provide auth or userId temporarily.',
      });
    }

    const { toUserId, auctionId, score, comment } = createRatingSchema.parse(req.body);

    const fromUserId = z.string().uuid().parse(fromUserIdRaw);

    if (toUserId === fromUserId) {
      return res.status(400).json({ success: false, message: 'Cannot rate yourself' });
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        status: true,
        sellerId: true,
        currentWinnerId: true,
      },
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate after the auction is completed',
      });
    }

    // Only the auction winner (buyer) can rate in this MVP.
    if (!auction.currentWinnerId || auction.currentWinnerId !== fromUserId) {
      return res.status(400).json({
        success: false,
        message: 'Only the auction winner can rate',
      });
    }

    // Buyers rate sellers in this MVP.
    if (auction.sellerId !== toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Winners can only rate the auction seller',
      });
    }

    const rating = await prisma.rating.create({
      data: {
        fromUserId,
        toUserId,
        auctionId,
        score,
        comment: comment ?? null,
      },
    });

    const summaryAgg = await prisma.rating.aggregate({
      where: { toUserId },
      _avg: { score: true },
      _count: { score: true },
    });

    return res.status(201).json({
      success: true,
      rating,
      summary: {
        average: summaryAgg._avg.score || 0,
        count: summaryAgg._count.score,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    // Unique constraint: @@unique([fromUserId, auctionId])
    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'You have already rated this auction',
      });
    }

    console.error('createRating error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create rating' });
  }
};

export const getUserRatings = async (req, res) => {
  try {
    const userId = z.string().uuid().parse(req.params.userId);

    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
        auction: {
          select: { id: true, title: true, status: true, endsAt: true },
        },
      },
    });

    const summaryAgg = await prisma.rating.aggregate({
      where: { toUserId: userId },
      _avg: { score: true },
      _count: { score: true },
    });

    return res.json({
      success: true,
      ratings: ratings.map(r => ({
        ...r,
        score: r.score, // score is already a number in DB
      })),
      summary: {
        average: summaryAgg._avg.score || 0,
        count: summaryAgg._count.score,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
        errors: error.errors,
      });
    }

    console.error('getUserRatings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch ratings' });
  }
};

