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

export const searchSortSchema = z.enum(['ending_soon', 'newest', 'price_low', 'price_high']);

function emptyToUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return value;
}

/** Query params for GET /api/auctions/search (aligned with client searchParams.js) */
export const searchAuctionsQuerySchema = z
  .object({
    q: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(200).optional()),
    categoryId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    status: z.preprocess(emptyToUndefined, auctionStatusSchema.optional()),
    minPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
    maxPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
    sortBy: z.preprocess(emptyToUndefined, searchSortSchema.default('ending_soon')),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine(
    (data) => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice,
    { message: 'minPrice cannot be greater than maxPrice', path: ['minPrice'] }
  );

/** @deprecated Use searchAuctionsQuerySchema — kept for older references */
export const auctionFiltersSchema = searchAuctionsQuerySchema;
