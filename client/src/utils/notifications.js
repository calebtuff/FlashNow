import { NOTIFICATION_TYPES } from 'shared/constants';

export function notificationIcon(type) {
  switch (type) {
    case NOTIFICATION_TYPES.OUTBID:
      return 'gavel';
    case NOTIFICATION_TYPES.AUCTION_WON:
      return 'emoji_events';
    case NOTIFICATION_TYPES.AUCTION_SOLD:
      return 'payments';
    case NOTIFICATION_TYPES.ENDING_SOON:
      return 'schedule';
    default:
      return 'notifications';
  }
}

export function formatNotificationTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function notificationLink(data) {
  const auctionId = data?.auctionId;
  return auctionId ? `/auctions/${auctionId}` : null;
}
