import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from 'shared/constants';
import { useAuth } from '../context/AuthContext.jsx';
import { connectSocket } from '../services/socket.js';
import {
  clearNotificationQueries,
  NOTIFICATIONS_LIST_KEY,
  NOTIFICATIONS_UNREAD_KEY,
} from './useNotifications.js';

/**
 * Listen for real-time notification events and refresh TanStack Query caches.
 * Mount once inside Layout when the user may be authenticated.
 */
export default function useNotificationSocket() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      clearNotificationQueries(queryClient);
      return undefined;
    }

    let active = true;
    let socket;
    let onNotification;

    (async () => {
      socket = await connectSocket();
      if (!active) return;

      onNotification = () => {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
      };

      socket.on(SOCKET_EVENTS.NOTIFICATION, onNotification);
    })();

    return () => {
      active = false;
      if (socket && onNotification) {
        socket.off(SOCKET_EVENTS.NOTIFICATION, onNotification);
      }
    };
  }, [isAuthenticated, queryClient]);
}
