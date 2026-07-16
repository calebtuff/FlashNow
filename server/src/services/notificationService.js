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
