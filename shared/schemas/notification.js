import { z } from 'zod';
import { NOTIFICATION_TYPE_VALUES } from '../constants/notifications.js';

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPE_VALUES);

export const notificationDataSchema = z
  .object({
    auctionId: z.string().uuid().optional(),
    bidAmount: z.number().positive().optional(),
    auctionTitle: z.string().max(200).optional(),
    endsAt: z.string().datetime().optional(),
  })
  .passthrough();

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  read: z.boolean(),
  data: notificationDataSchema.nullable().optional(),
  createdAt: z.coerce.date(),
});

/** Input for server notificationService.createNotification */
export const createNotificationInputSchema = z.object({
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(1000),
  data: notificationDataSchema.optional(),
});
