import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { currentPrice, money } from '../utils/auction.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'winning', label: 'Winning', match: (s) => s === 'winning' },
  { key: 'live', label: 'Live', match: (_, a) => a.status === 'live' },
  {
    key: 'ended',
    label: 'Ended',
    match: (s) => s === 'won' || s === 'lost',
  },
];

const STATUS_STYLES = {
  winning: 'bg-emerald-100 text-emerald-700',
  outbid: 'bg-amber-100 text-amber-800',
  won: 'bg-violet-100 text-violet-700',
  lost: 'bg-neutral-200 text-neutral-700',
  scheduled: 'bg-sky-100 text-sky-700',
  unknown: 'bg-neutral-200 text-neutral-700',
};

const STATUS_LABELS = {
  winning: 'Winning',
  outbid: 'Outbid',
  won: 'Won',
  lost: 'Lost',
  scheduled: 'Scheduled',
  unknown: 'Unknown',
};

function dedupeBidsByAuction(bids) {
  const byAuction = new Map();
  for (const bid of bids) {
    if (!bid?.auction) continue;
    const existing = byAuction.get(bid.auction.id);
    if (!existing || new Date(bid.placedAt) > new Date(existing.placedAt)) {
      byAuction.set(bid.auction.id, bid);
    }
  }
  return [...byAuction.values()];
}

function bidStatus(auction, userId) {
  if (!auction || !userId) return 'unknown';
  const ended = ['ended', 'completed', 'cancelled'].includes(auction.status);
  const winning = auction.currentWinnerId === userId;

  if (ended) return winning ? 'won' : 'lost';
  if (auction.status === 'scheduled' || auction.status === 'draft') return 'scheduled';
  if (winning) return 'winning';
  return 'outbid';
}

function BidStatusChip({ status }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function MyBidsPage() {
  const { userId, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-bids', userId],
    queryFn: () => api.get('/auctions/my/bids'),
    enabled: isAuthenticated,
  });

  const entries = useMemo(() => {
    const bids = dedupeBidsByAuction(data?.bids ?? []);
    return bids.map((bid) => ({
      bid,
      auction: bid.auction,
      status: bidStatus(bid.auction, userId),
    }));
  }, [data?.bids, userId]);

  const counts = useMemo(() => {
    const c = { winning: 0, outbid: 0, ended: 0 };
    for (const { status } of entries) {
      if (status === 'winning') c.winning += 1;
      else if (status === 'outbid' || status === 'scheduled') c.outbid += 1;
      else if (status === 'won' || status === 'lost') c.ended += 1;
    }
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    const matcher = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
    return entries.filter(({ status, auction }) => matcher(status, auction));
  }, [entries, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-neutral-900">My bids</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {entries.length > 0
              ? `${counts.winning} winning · ${counts.outbid} active · ${counts.ended} ended`
              : 'Auctions you have bid on.'}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-900 bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 no-underline transition-colors hover:bg-neutral-50"
        >
          <Icon name="gavel" className="text-[18px]" />
          Browse auctions
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={[
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              filter === f.key
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white/70 text-neutral-800 hover:bg-white',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error?.message || 'Could not load your bids.'}
        </div>
      )}

      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200/80" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <Icon name="local_offer" className="text-[40px] text-neutral-400" />
          <p className="mt-2 font-headline text-lg font-bold text-neutral-800">You haven&apos;t placed any bids yet</p>
          <p className="mt-2 text-sm text-neutral-600">Find a live auction and place your first bid.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline"
          >
            <Icon name="gavel" className="text-[18px]" />
            Browse auctions
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <p className="font-headline text-lg font-bold text-neutral-800">No bids in this filter</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-6 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ bid, auction, status }) => (
            <div key={auction.id} className="flex flex-col gap-2">
              <BidStatusChip status={status} />
              <AuctionCard a={auction} />
              <p className="px-1 text-xs text-neutral-600">
                Your bid: <span className="font-semibold text-neutral-900">{money(bid.amount)}</span>
                {' · '}
                Current: <span className="font-semibold text-neutral-900">{money(currentPrice(auction))}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
