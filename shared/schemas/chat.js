import { z } from 'zod';

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  auctionId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1).max(500),
  createdAt: z.coerce.date(),
});

export const sendMessageSchema = z.object({
  auctionId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

export const chatMessageWithUserSchema = chatMessageSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
});
