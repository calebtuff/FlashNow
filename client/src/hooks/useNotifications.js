import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const NOTIFICATIONS_UNREAD_KEY = ['notifications-unread'];
export const NOTIFICATIONS_LIST_KEY = ['notifications'];

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.unreadCount ?? 0;
    },
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
}

export function useNotificationsList({ limit = 10, read, enabled = true } = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...NOTIFICATIONS_LIST_KEY, { limit, read }],
    queryFn: async () => {
      const query = { limit, page: 1 };
      if (read === true) query.read = 'true';
      if (read === false) query.read = 'false';
      return api.get('/notifications', { query });
    },
    enabled: isAuthenticated && enabled,
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  function invalidateNotifications() {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
  }

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidateNotifications,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: invalidateNotifications,
  });

  const clearRead = useMutation({
    mutationFn: () => api.delete('/notifications', { query: { readOnly: 'true' } }),
    onSuccess: invalidateNotifications,
  });

  return { markRead, markAllRead, clearRead, invalidateNotifications };
}

export function clearNotificationQueries(queryClient) {
  queryClient.removeQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
  queryClient.removeQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
}
