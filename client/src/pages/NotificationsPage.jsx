import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import {
  NOTIFICATIONS_LIST_KEY,
  NOTIFICATIONS_UNREAD_KEY,
  useNotificationMutations,
} from '../hooks/useNotifications.js';
import { api } from '../services/api.js';
import {
  formatNotificationTime,
  notificationIcon,
  notificationLink,
} from '../utils/notifications.js';

const FILTERS = [
  { key: 'all', label: 'All', read: undefined },
  { key: 'unread', label: 'Unread', read: false },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const readParam = FILTERS.find((f) => f.key === filter)?.read;

  const { data, isPending, isError, error } = useQuery({
    queryKey: [...NOTIFICATIONS_LIST_KEY, 'page', { page, read: readParam }],
    queryFn: () => {
      const query = { page, limit: 20 };
      if (readParam === false) query.read = 'false';
      return api.get('/notifications', { query });
    },
  });

  const { markAllRead, clearRead } = useNotificationMutations();

  const markReadAndGo = useMutation({
    mutationFn: async ({ id, link }) => {
      const item = data?.notifications?.find((n) => n.id === id);
      if (item && !item.read) {
        await api.patch(`/notifications/${id}/read`);
      }
      return link;
    },
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
      if (link) navigate(link);
    },
  });

  const notifications = data?.notifications ?? [];
  const pagination = data?.pagination;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-neutral-900">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => clearRead.mutate()}
            disabled={clearRead.isPending}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
          >
            Clear read
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={[
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              filter === f.key
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error?.message || 'Could not load notifications.'}
        </div>
      )}

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-20 animate-pulse rounded-2xl bg-neutral-200/80" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <Icon name="notifications_none" className="mx-auto text-[40px] text-neutral-400" />
          <p className="mt-2 font-headline text-lg font-bold text-neutral-800">No notifications</p>
          <p className="mt-1 text-sm text-neutral-600">
            {filter === 'unread' ? 'You have no unread notifications.' : 'Activity will show up here.'}
          </p>
          <Link to="/" className="mt-6 inline-block text-sm font-semibold text-neutral-900 no-underline hover:underline">
            Browse auctions
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {notifications.map((item, index) => {
            const link = notificationLink(item.data);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => markReadAndGo.mutate({ id: item.id, link })}
                className={[
                  'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-neutral-50',
                  index > 0 ? 'border-t border-neutral-100' : '',
                  item.read ? '' : 'bg-neutral-50/80',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    item.read ? 'bg-neutral-200 text-neutral-600' : 'bg-neutral-900 text-white',
                  ].join(' ')}
                >
                  <Icon name={notificationIcon(item.type)} className="text-[20px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-sm ${item.read ? 'font-semibold' : 'font-bold'} text-neutral-900`}>
                      {item.title}
                    </span>
                    {!item.read && <span className="h-2 w-2 rounded-full bg-red-500" />}
                  </span>
                  <span className="mt-1 block text-sm text-neutral-600">{item.body}</span>
                  <span className="mt-1 block text-xs text-neutral-400">
                    {formatNotificationTime(item.createdAt)}
                  </span>
                </span>
                {link && <Icon name="chevron_right" className="shrink-0 text-[20px] text-neutral-400" />}
              </button>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
