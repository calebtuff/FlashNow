import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Register from '../components/Register.jsx';
import { RegisterStackSkeleton } from '../components/RegisterStack.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PageHeader from '../components/PageHeader.jsx';
import FilterPills from '../components/FilterPills.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canEditAuction } from '../utils/auctionForm.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'live', label: 'Running', match: (a) => a.status === 'live' },
  { key: 'scheduled', label: 'Opens next', match: (a) => a.status === 'scheduled' || a.status === 'draft' },
  {
    key: 'ended',
    label: 'Closed',
    match: (a) => a.status === 'ended' || a.status === 'completed' || a.status === 'cancelled',
  },
];

const TERMINAL_STATUSES = ['completed', 'cancelled'];

function bidCountOf(auction) {
  return auction._count?.bids ?? 0;
}

function canCancelAuction(auction) {
  if (TERMINAL_STATUSES.includes(auction.status)) return false;
  return bidCountOf(auction) === 0;
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
    onError: (err) => setCancelError(err?.message || 'Could not cancel this lot.'),
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

  return (
    <div>
      <PageHeader
        title="My lots"
        reading={String(counts.live).padStart(2, '0')}
        subtitle={
          auctions.length > 0
            ? `running. ${counts.scheduled} scheduled, ${counts.ended} closed.`
            : 'Lots you are selling.'
        }
      >
        <Link to="/sell" className="ctl-primary">
          <Icon name="add" className="text-[16px]" />
          List a lot
        </Link>
      </PageHeader>

      <div className="mb-t4">
        <FilterPills options={STATUS_FILTERS} value={filter} onChange={setFilter} label="Filter lots" />
      </div>

      {isError && <Alert title="Could not load">{error?.message || 'Your lots are unavailable.'}</Alert>}

      {isPending ? (
        <RegisterStackSkeleton count={3} />
      ) : auctions.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="Nothing listed"
          body="A lot runs for five to thirty minutes from the moment it opens."
        >
          <Link to="/sell" className="ctl-primary">
            <Icon name="add" className="text-[16px]" />
            List a lot
          </Link>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState icon="filter_alt_off" title="None in this state" body="Your lots are all elsewhere.">
          <button type="button" onClick={() => setFilter('all')} className="ctl-primary">
            Show all
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-px bg-steel">
          {filtered.map((a, i) => (
            <div key={a.id}>
              <Register auction={a} row={i} />
              <div className="flex flex-wrap items-center gap-t2 border-t border-steel bg-sunken px-t4 py-t2">
                <span className="legend text-tick text-lume-faint">{a.status}</span>
                <div className="ml-auto flex flex-wrap gap-t2">
                  {canEditAuction(a) && (
                    <Link
                      to={`/sell/${a.id}/edit`}
                      className="legend text-tick text-lume-dim no-underline transition-colors hover:text-lume"
                    >
                      Edit
                    </Link>
                  )}
                  {canCancelAuction(a) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelError('');
                        setCancelTarget(a);
                      }}
                      className="legend text-tick text-lume-faint transition-colors hover:text-hand"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Withdraw this lot"
        message={
          cancelTarget
            ? `"${cancelTarget.title}" will be removed from the board. This cannot be undone.`
            : ''
        }
        confirmLabel="Withdraw"
        cancelLabel="Keep it listed"
        destructive
        isPending={cancelAuction.isPending}
        onClose={() => {
          if (cancelAuction.isPending) return;
          setCancelTarget(null);
          setCancelError('');
        }}
        onConfirm={() => {
          if (cancelTarget) cancelAuction.mutate(cancelTarget.id);
        }}
      />

      {cancelError && cancelTarget && (
        <div className="fixed bottom-24 left-1/2 z-[60] w-[min(100vw-2rem,24rem)] -translate-x-1/2 md:bottom-4">
          <div className="flyback">
            <Alert title="Withdraw failed">{cancelError}</Alert>
          </div>
        </div>
      )}
    </div>
  );
}
