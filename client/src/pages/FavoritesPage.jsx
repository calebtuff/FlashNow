import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'live', label: 'Live', match: (a) => a.status === 'live' },
  {
    key: 'scheduled',
    label: 'Scheduled',
    match: (a) => a.status === 'scheduled',
  },
  {
    key: 'ended',
    label: 'Ended',
    match: (a) => ['ended', 'completed', 'cancelled'].includes(a.status),
  },
];

export default function FavoritesPage() {
  const { userId, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['favorites', userId, page],
    queryFn: () => api.get('/favorites', { query: { page, limit: 20 } }),
    enabled: isAuthenticated,
  });

  const entries = useMemo(() => {
    return (data?.favorites ?? []).map((row) => row.auction).filter(Boolean);
  }, [data?.favorites]);

  const filtered = useMemo(() => {
    const matcher = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
    return entries.filter((auction) => matcher(auction));
  }, [entries, filter]);

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-neutral-900">Saved</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {pagination?.total
              ? `${pagination.total} saved ${pagination.total === 1 ? 'auction' : 'auctions'}`
              : 'Auctions you have saved for later.'}
          </p>
        </div>
        <Link
          to="/search?status=live"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-900 bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 no-underline transition-colors hover:bg-neutral-50"
        >
          <Icon name="search" className="text-[18px]" />
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
          {error?.message || 'Could not load saved auctions.'}
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
          <Icon name="favorite" className="text-[40px] text-neutral-400" />
          <p className="mt-2 font-headline text-lg font-bold text-neutral-800">Nothing saved yet</p>
          <p className="mt-2 text-sm text-neutral-600">Tap the heart on any auction to save it here.</p>
          <Link
            to="/search?status=live"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline"
          >
            <Icon name="search" className="text-[18px]" />
            Browse auctions
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <p className="font-headline text-lg font-bold text-neutral-800">No saved auctions in this filter</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-6 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white"
          >
            Show all
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((auction) => (
              <AuctionCard key={auction.id} a={auction} />
            ))}
          </div>

          {pagination && totalPages > 1 && filter === 'all' && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
