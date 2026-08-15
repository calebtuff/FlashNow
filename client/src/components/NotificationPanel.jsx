import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useNotificationMutations, useNotificationsList } from '../hooks/useNotifications.js';
import { formatNotificationTime, notificationIcon, notificationLink } from '../utils/notifications.js';

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
    if (link) onNavigate(link);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-t3 border-b border-steel px-t3 py-t3 text-left transition-colors duration-jump last:border-0 hover:bg-high"
    >
      {/* Unread is carried by a lit edge, not a background wash, so the row's
          text contrast never changes with its state. */}
      <span className={`mt-0.5 h-8 w-[3px] shrink-0 ${item.read ? 'bg-steel' : 'bg-caution'}`} aria-hidden />
      <Icon name={icon} className={`mt-0.5 shrink-0 text-[18px] ${item.read ? 'text-lume-faint' : 'text-caution'}`} />
      <span className="min-w-0 flex-1">
        <span className={`block text-body text-lume ${item.read ? 'font-medium' : 'font-semibold'}`}>
          {item.title}
        </span>
        <span className="mt-0.5 block text-micro leading-relaxed text-lume-dim">{item.body}</span>
        <span className="legend numeral mt-1.5 block text-tick text-lume-faint">
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
    <div role="dialog" aria-label="Notifications" className="register w-[min(100vw-2rem,23rem)]">
      <div className="flex items-center justify-between gap-t3 border-b border-steel px-t3 py-t3">
        <h2 className="legend text-tick text-lume-faint">
          Notices{' '}
          {unreadCount > 0 && <span className="numeral text-caution">{unreadCount}</span>}
        </h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="legend text-tick text-lume-faint transition-colors hover:text-lume disabled:opacity-40"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isPending && (
          <div className="space-y-t2 p-t3" aria-busy="true" aria-label="Loading notices">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-14 animate-pulse bg-high" />
            ))}
          </div>
        )}

        {isError && (
          <div className="px-t3 py-t8 text-center">
            <Icon name="error" className="text-[24px] text-hand" />
            <p className="legend mt-t2 text-tick text-lume-dim">Could not load notices</p>
          </div>
        )}

        {!isPending && !isError && notifications.length === 0 && (
          <div className="px-t3 py-t8 text-center">
            <div className="scale-rule mx-auto w-24 opacity-40" aria-hidden />
            <p className="legend mt-t3 text-tick text-lume-faint">No notices</p>
          </div>
        )}

        {!isPending &&
          !isError &&
          notifications.map((item) => <NotificationRow key={item.id} item={item} onNavigate={go} />)}
      </div>

      <div className="border-t border-steel p-t2">
        <Link
          to="/notifications"
          onClick={() => onClose?.()}
          className="legend block py-2 text-center text-tick text-lume-dim no-underline transition-colors hover:text-lume"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
