import Icon from './Icon.jsx';
import NotificationPanel from './NotificationPanel.jsx';
import useDismissable from '../hooks/useDismissable.js';
import { useUnreadCount } from '../hooks/useNotifications.js';

export default function NotificationBell() {
  const panel = useDismissable();
  const { data: unreadCount = 0, isPending } = useUnreadCount();
  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={panel.ref} className="relative">
      <button
        type="button"
        onClick={panel.toggle}
        className={[
          'relative flex h-9 w-9 items-center justify-center rounded-sm transition-colors duration-jump',
          panel.open ? 'bg-high text-lume' : 'text-lume-faint hover:text-lume',
        ].join(' ')}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={panel.open}
        aria-haspopup="dialog"
      >
        <Icon name="notifications" className="text-[20px]" />
        {!isPending && unreadCount > 0 && (
          // Caution, not red: an unread notice needs attention but is not the
          // 60-second lamp, which is reserved for the closing window.
          <span className="numeral absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-sm bg-caution px-1 text-[0.5625rem] font-bold text-dial">
            {badge}
          </span>
        )}
      </button>

      {panel.open && (
        <div className="flyback absolute right-0 top-full z-40 origin-top-right pt-2">
          <NotificationPanel onClose={panel.close} />
        </div>
      )}
    </div>
  );
}
