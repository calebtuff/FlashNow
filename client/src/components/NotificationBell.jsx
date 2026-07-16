import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import NotificationPanel from './NotificationPanel.jsx';
import { useUnreadCount } from '../hooks/useNotifications.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { data: unreadCount = 0, isPending } = useUnreadCount();

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition-colors hover:bg-neutral-100"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <Icon name="notifications" className="text-[22px]" />
        {!isPending && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 pt-2">
          <NotificationPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
