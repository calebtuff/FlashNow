import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} from '../controllers/notifications.controller.js';

const router = express.Router();

// GET /api/notifications?userId=...&page=1&limit=20&read=false&type=outbid
router.get('/', getNotifications);

// GET /api/notifications/unread-count?userId=...
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all (userId in body/query)
router.patch('/read-all', markAllNotificationsRead);

// PATCH /api/notifications/:id/read (userId in body/query)
router.patch('/:id/read', markNotificationRead);

// DELETE /api/notifications/:id (userId in body/query)
router.delete('/:id', deleteNotification);

// DELETE /api/notifications?userId=...&readOnly=true
router.delete('/', clearNotifications);

export default router;

