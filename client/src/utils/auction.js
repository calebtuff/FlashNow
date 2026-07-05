export function money(n) {
  if (n === null || n === undefined) return '—';
  const v = typeof n === 'number' ? n : Number.parseFloat(String(n));
  if (Number.isNaN(v)) return '—';
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function bidCountOf(a) {
  return a?._count?.bids ?? a?.bidCount ?? 0;
}

export function currentPrice(a) {
  if (!a) return 0;
  if (a.currentBid != null) {
    const v = typeof a.currentBid === 'number' ? a.currentBid : Number.parseFloat(String(a.currentBid));
    if (!Number.isNaN(v)) return v;
  }
  const s = typeof a.startingBid === 'number' ? a.startingBid : Number.parseFloat(String(a.startingBid));
  return Number.isNaN(s) ? 0 : s;
}

export function imageOf(a, size = 600) {
  if (Array.isArray(a?.images) && a.images.length > 0) return a.images[0];
  return `https://picsum.photos/seed/${a?.id ?? 'flashnow'}/${size}/${size}`;
}

export function formatAuctionDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const TERMINAL_STATUSES = ['ended', 'completed', 'cancelled'];

/** Countdown target + readable label for cards and detail headers. */
export function auctionTimeMeta(a, nowMs = Date.now()) {
  if (!a) {
    return { kind: 'unknown', countdownIso: null, dateTime: '—', heading: 'Time' };
  }

  const ends = a.endsAt ? new Date(a.endsAt).getTime() : null;
  const starts = a.startsAt ? new Date(a.startsAt).getTime() : null;
  const terminal = TERMINAL_STATUSES.includes(a.status) || (ends != null && ends <= nowMs);

  if (terminal) {
    return {
      kind: 'ended',
      countdownIso: null,
      dateTime: formatAuctionDateTime(a.endsAt),
      heading: 'Ended',
    };
  }

  if ((a.status === 'scheduled' || a.status === 'draft') && starts != null && starts > nowMs) {
    return {
      kind: 'scheduled',
      countdownIso: a.startsAt,
      dateTime: formatAuctionDateTime(a.startsAt),
      heading: 'Starts in',
    };
  }

  return {
    kind: 'live',
    countdownIso: a.endsAt,
    dateTime: formatAuctionDateTime(a.endsAt),
    heading: 'Ends in',
  };
}
