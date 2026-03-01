import { z } from 'zod';

export const AUCTION_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const auctionStatusSchema = z.enum([
  AUCTION_STATUS.DRAFT,
  AUCTION_STATUS.SCHEDULED,
  AUCTION_STATUS.LIVE,
  AUCTION_STATUS.ENDED,
  AUCTION_STATUS.COMPLETED,
  AUCTION_STATUS.CANCELLED,
]);

export const auctionSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(5000),
  images: z.array(z.string().url()).min(1).max(10),
  startingBid: z.number().positive(),
  buyNowPrice: z.number().positive().nullable().optional(),
  currentBid: z.number().positive().nullable().optional(),
  currentWinnerId: z.string().uuid().nullable().optional(),
  durationMinutes: z.number().int().min(5).max(15),
  status: auctionStatusSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const createAuctionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000),
  images: z.array(z.string().url()).min(1).max(10),
  categoryId: z.string().uuid().optional(),
  startingBid: z.number().positive(),
  buyNowPrice: z.number().positive().optional(),
  durationMinutes: z.number().int().min(5).max(15),
  startsAt: z.coerce.date(),
});

export const updateAuctionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  images: z.array(z.string().url()).min(1).max(10).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  startingBid: z.number().positive().optional(),
  buyNowPrice: z.number().positive().nullable().optional(),
  durationMinutes: z.number().int().min(5).max(15).optional(),
  startsAt: z.coerce.date().optional(),
});

export const auctionFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  status: auctionStatusSchema.optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sellerId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'startsAt', 'endsAt', 'currentBid']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
