import { createNotificationInputSchema } from 'shared';
import prisma from '../lib/prisma.js';
import { emitNotificationToUser } from '../socket/emitters.js';

function formatNotification(notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    data: notification.data,
    createdAt: notification.createdAt,
  };
}

/**
 * Whether this user already has a notification of this type for an auction (dedupe).
 */
export async function hasNotificationForAuction({ userId, type, auctionId }) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      data: {
        path: ['auctionId'],
        equals: auctionId,
      },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

/**
 * Persist a notification for a user and push it over Socket.io if they are online.
 */
export async function createNotification(input) {
  const { userId, type, title, body, data } = createNotificationInputSchema.parse(input);

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ?? undefined,
    },
  });

  const payload = formatNotification(notification);
  emitNotificationToUser(userId, payload);

  return payload;
}

/** Log notification failures without affecting the caller's main flow. */
export function notifySafely(promise) {
  promise.catch((error) => {
    console.error('Notification failed:', error);
  });
}
