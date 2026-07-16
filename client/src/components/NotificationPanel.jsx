import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import {
  useNotificationMutations,
  useNotificationsList,
} from '../hooks/useNotifications.js';
import {
  formatNotificationTime,
  notificationIcon,
  notificationLink,
} from '../utils/notifications.js';

function NotificationRow({ item, onNavigate }) {
  const { markRead } = useNotificationMutations();
  const link = notificationLink(item.data);
  const icon = notificationIcon(item.type);

  async function handleClick() {
    if (!item.read) {
      try {
        await markRead.mutateAsync(item.id);
      } catch {
        // Still navigate even if mark-read fails
      }
    }
    if (link) {
      onNavigate(link);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-neutral-100',
        item.read ? 'opacity-80' : 'bg-neutral-50',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          item.read ? 'bg-neutral-200 text-neutral-600' : 'bg-neutral-900 text-white',
        ].join(' ')}
      >
        <Icon name={icon} className="text-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-sm ${item.read ? 'font-semibold' : 'font-bold'} text-neutral-900`}>
            {item.title}
          </span>
          {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">{item.body}</span>
        <span className="mt-1 block text-[11px] font-medium text-neutral-400">
          {formatNotificationTime(item.createdAt)}
        </span>
      </span>
    </button>
  );
}

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useNotificationsList({ limit: 10 });
  const { markAllRead } = useNotificationMutations();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function go(link) {
    onClose?.();
    navigate(link);
  }

  return (
    <div className="w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div>
          <h2 className="font-headline text-base font-extrabold text-neutral-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-neutral-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs font-bold uppercase tracking-wide text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {isPending && (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {isError && (
          <p className="px-3 py-6 text-center text-sm font-medium text-red-600">
            Could not load notifications.
          </p>
        )}

        {!isPending && !isError && notifications.length === 0 && (
          <div className="px-3 py-10 text-center">
            <Icon name="notifications_none" className="mx-auto text-[32px] text-neutral-300" />
            <p className="mt-2 text-sm font-semibold text-neutral-700">No notifications yet</p>
            <p className="mt-1 text-xs text-neutral-500">We&apos;ll notify you about bids and auctions here.</p>
          </div>
        )}

        {!isPending && !isError && notifications.length > 0 && (
          <div className="space-y-1">
            {notifications.map((item) => (
              <NotificationRow key={item.id} item={item} onNavigate={go} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-100 px-4 py-3">
        <Link
          to="/notifications"
          onClick={() => onClose?.()}
          className="block text-center text-sm font-semibold text-neutral-900 no-underline hover:underline"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
