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
