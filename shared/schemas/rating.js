import { z } from 'zod';

export const ratingSchema = z.object({
  id: z.string().uuid(),
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  auctionId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).nullable().optional(),
  createdAt: z.coerce.date(),
});

export const createRatingSchema = z.object({
  toUserId: z.string().uuid(),
  auctionId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const userRatingSummarySchema = z.object({
  userId: z.string().uuid(),
  averageScore: z.number().min(0).max(5),
  totalRatings: z.number().int().min(0),
});
