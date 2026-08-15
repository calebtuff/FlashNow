import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import PageHeader from '../components/PageHeader.jsx';
import FilterPills from '../components/FilterPills.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import Alert from '../components/Alert.jsx';
import {
  NOTIFICATIONS_LIST_KEY,
  NOTIFICATIONS_UNREAD_KEY,
  useNotificationMutations,
} from '../hooks/useNotifications.js';
import { api } from '../services/api.js';
import { formatNotificationTime, notificationIcon, notificationLink } from '../utils/notifications.js';

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
      if (item && !item.read) await api.patch(`/notifications/${id}/read`);
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notices"
        reading={String(unreadCount).padStart(2, '0')}
        subtitle={unreadCount > 0 ? 'unread' : 'All caught up.'}
      >
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="ctl-ghost"
          >
            Mark all read
          </button>
        )}
        <button
          type="button"
          onClick={() => clearRead.mutate()}
          disabled={clearRead.isPending}
          className="ctl-ghost"
        >
          Clear read
        </button>
      </PageHeader>

      <div className="mb-t4">
        <FilterPills
          options={FILTERS}
          value={filter}
          onChange={(key) => {
            setFilter(key);
            setPage(1);
          }}
          label="Filter notices"
        />
      </div>

      {isError && <Alert title="Could not load">{error?.message || 'Notices are unavailable.'}</Alert>}

      {isPending ? (
        <div className="register divide-y divide-steel" aria-busy="true" aria-label="Loading notices">
          {[1, 2, 3, 4].map((k) => (
            // Same row shape as a notice: lit edge, icon, title, body, time.
            <div key={k} className="flex items-start gap-t3 px-t4 py-t3">
              <span className="mt-1 h-8 w-[3px] shrink-0 animate-pulse bg-high" />
              <span className="mt-0.5 h-[18px] w-[18px] shrink-0 animate-pulse bg-high" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 max-w-full animate-pulse bg-high" />
                <div className="mt-1 h-3 w-full max-w-[22rem] animate-pulse bg-high" />
                <div className="mt-1.5 h-3 w-20 animate-pulse bg-high" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications_none"
          title="No notices"
          body={filter === 'unread' ? 'Nothing unread.' : 'Outbid alerts and closing warnings land here.'}
        >
          <Link to="/" className="ctl-primary">
            Back to the board
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-t6">
          <ul className="register divide-y divide-steel">
            {notifications.map((item) => {
              const link = notificationLink(item.data);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markReadAndGo.mutate({ id: item.id, link })}
                    className="flex w-full items-start gap-t3 px-t4 py-t3 text-left transition-colors duration-jump hover:bg-high"
                  >
                    <span
                      className={`mt-1 h-8 w-[3px] shrink-0 ${item.read ? 'bg-steel' : 'bg-caution'}`}
                      aria-hidden
                    />
                    <Icon
                      name={notificationIcon(item.type)}
                      className={`mt-0.5 shrink-0 text-[18px] ${item.read ? 'text-lume-faint' : 'text-caution'}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-body text-lume ${item.read ? 'font-medium' : 'font-semibold'}`}>
                        {item.title}
                      </span>
                      <span className="mt-1 block text-micro leading-relaxed text-lume-dim">{item.body}</span>
                      <span className="legend numeral mt-1.5 block text-tick text-lume-faint">
                        {formatNotificationTime(item.createdAt)}
                      </span>
                    </span>
                    {link && <Icon name="chevron_right" className="shrink-0 text-[18px] text-lume-faint" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <Pagination page={page} totalPages={pagination?.totalPages ?? 1} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
