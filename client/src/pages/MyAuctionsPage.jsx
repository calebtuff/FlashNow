import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AuctionCard from '../components/AuctionCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canEditAuction } from '../utils/auctionForm.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'live', label: 'Live', match: (a) => a.status === 'live' },
  { key: 'scheduled', label: 'Scheduled', match: (a) => a.status === 'scheduled' || a.status === 'draft' },
  {
    key: 'ended',
    label: 'Ended',
    match: (a) => a.status === 'ended' || a.status === 'completed' || a.status === 'cancelled',
  },
];

const STATUS_STYLES = {
  live: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-sky-100 text-sky-700',
  draft: 'bg-neutral-200 text-neutral-700',
  ended: 'bg-neutral-200 text-neutral-700',
  completed: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
};

const TERMINAL_STATUSES = ['completed', 'cancelled'];

function bidCountOf(auction) {
  return auction._count?.bids ?? 0;
}

function canCancelAuction(auction) {
  if (TERMINAL_STATUSES.includes(auction.status)) return false;
  return bidCountOf(auction) === 0;
}

function StatusChip({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-neutral-200 text-neutral-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

function SellerActions({ auction, onCancelClick }) {
  const showCancel = canCancelAuction(auction);
  const showEdit = canEditAuction(auction);

  return (
    <div className="flex flex-wrap gap-2 px-1">
      <Link
        to={`/auctions/${auction.id}`}
        className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 no-underline hover:bg-neutral-50"
      >
        <Icon name="visibility" className="text-[16px]" />
        View
      </Link>
      {showEdit && (
        <Link
          to={`/sell/${auction.id}/edit`}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 no-underline hover:bg-neutral-50"
        >
          <Icon name="edit" className="text-[16px]" />
          Edit
        </Link>
      )}
      {showCancel && (
        <button
          type="button"
          onClick={() => onCancelClick(auction)}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          <Icon name="cancel" className="text-[16px]" />
          Cancel
        </button>
      )}
    </div>
  );
}

export default function MyAuctionsPage() {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-selling', userId],
    queryFn: () => api.get('/auctions/my/selling'),
    enabled: isAuthenticated,
  });

  const cancelAuction = useMutation({
    mutationFn: (id) => api.delete(`/auctions/${id}`),
    onSuccess: () => {
      setCancelError('');
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ['my-selling'] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['profile-listings'] });
    },
    onError: (err) => {
      setCancelError(err?.message || 'Could not cancel this auction.');
    },
  });

  const auctions = useMemo(() => data?.auctions ?? [], [data?.auctions]);

  const counts = useMemo(() => {
    const c = { live: 0, scheduled: 0, ended: 0 };
    for (const a of auctions) {
      if (a.status === 'live') c.live += 1;
      else if (a.status === 'scheduled' || a.status === 'draft') c.scheduled += 1;
      else c.ended += 1;
    }
    return c;
  }, [auctions]);

  const filtered = useMemo(() => {
    const matcher = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
    return auctions.filter((a) => matcher(a));
  }, [auctions, filter]);

  function openCancelDialog(auction) {
    setCancelError('');
    setCancelTarget(auction);
  }

  function closeCancelDialog() {
    if (cancelAuction.isPending) return;
    setCancelTarget(null);
    setCancelError('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-neutral-900">My auctions</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {auctions.length > 0
              ? `${counts.live} live · ${counts.scheduled} scheduled · ${counts.ended} ended`
              : 'Items you are selling.'}
          </p>
        </div>
        <Link
          to="/sell"
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-neutral-800"
        >
          <Icon name="add" className="text-[18px]" />
          List an item
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
          {error?.message || 'Could not load your auctions.'}
        </div>
      )}

      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200/80" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <p className="font-headline text-lg font-bold text-neutral-800">You haven&apos;t listed anything yet</p>
          <p className="mt-2 text-sm text-neutral-600">Create your first auction to start selling.</p>
          <Link
            to="/sell"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline"
          >
            <Icon name="add" className="text-[18px]" />
            List an item
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <p className="font-headline text-lg font-bold text-neutral-800">No auctions in this status</p>
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
          {filtered.map((a) => (
            <div key={a.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <StatusChip status={a.status} />
                {bidCountOf(a) > 0 && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {bidCountOf(a)} bid{bidCountOf(a) === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <AuctionCard a={a} />
              <SellerActions auction={a} onCancelClick={openCancelDialog} />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this listing?"
        message={
          cancelTarget
            ? `"${cancelTarget.title}" will be removed from active listings. This can't be undone if bidders join later.`
            : ''
        }
        confirmLabel="Cancel auction"
        cancelLabel="Keep listing"
        destructive
        isPending={cancelAuction.isPending}
        onClose={closeCancelDialog}
        onConfirm={() => {
          if (cancelTarget) cancelAuction.mutate(cancelTarget.id);
        }}
      />

      {cancelError && cancelTarget && (
        <div className="fixed bottom-4 left-1/2 z-[60] w-[min(100vw-2rem,24rem)] -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-lg">
          {cancelError}
        </div>
      )}
    </div>
  );
}
