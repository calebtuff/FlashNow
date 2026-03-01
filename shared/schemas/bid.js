import { z } from 'zod';

export const bidSchema = z.object({
  id: z.string().uuid(),
  auctionId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  placedAt: z.coerce.date(),
});

export const placeBidSchema = z.object({
  auctionId: z.string().uuid(),
  amount: z.number().positive(),
});

export const bidResponseSchema = z.object({
  success: z.boolean(),
  bid: bidSchema.optional(),
  error: z.string().optional(),
  currentBid: z.number().positive().optional(),
  currentWinnerId: z.string().uuid().optional(),
});
