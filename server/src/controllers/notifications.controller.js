import prisma from '../lib/prisma.js';

function getUserIdFromRequest(req) {
  return req.user?.id || req.query?.userId || req.body?.userId || null;
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const getNotifications = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Missing userId. Pass ?userId=... (temporary until auth is added).',
      });
    }

    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const readFilter =
      req.query.read === undefined
        ? undefined
        : req.query.read === 'true'
          ? true
          : req.query.read === 'false'
            ? false
            : undefined;
    const type = req.query.type?.toString();

    const where = {
      userId,
      ...(readFilter !== undefined ? { read: readFilter } : {}),
      ...(type ? { type } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Missing userId. Pass ?userId=... (temporary until auth is added).',
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Missing userId. Pass userId in body/query (temporary until auth is added).',
      });
    }

    const { id } = req.params;

    const existing = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, read: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (existing.read) {
      return res.json({
        success: true,
        notification: existing,
      });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Missing userId. Pass userId in body/query (temporary until auth is added).',
      });
    }

    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return res.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Missing userId. Pass userId in body/query (temporary until auth is added).',
      });
    }

    const { id } = req.params;
    const existing = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await prisma.notification.delete({ where: { id } });
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Missing userId. Pass userId in body/query (temporary until auth is added).',
      });
    }

    const readOnly =
      req.query.readOnly === 'true' || req.body?.readOnly === true || req.body?.readOnly === 'true';

    const where = readOnly ? { userId, read: true } : { userId };
    const result = await prisma.notification.deleteMany({ where });

    return res.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('clearNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
};

