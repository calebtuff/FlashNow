import { z } from 'zod';

export const favoriteAuctionIdParamSchema = z.object({
  auctionId: z.string().uuid(),
});

export const listFavoritesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
