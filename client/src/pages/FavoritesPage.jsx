import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import RegisterStack, { RegisterStackSkeleton } from '../components/RegisterStack.jsx';
import PageHeader from '../components/PageHeader.jsx';
import FilterPills from '../components/FilterPills.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import Alert from '../components/Alert.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isTerminal } from '../utils/auction.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'live', label: 'Running', match: (a) => a.status === 'live' && !isTerminal(a) },
  { key: 'scheduled', label: 'Opens next', match: (a) => a.status === 'scheduled' },
  { key: 'ended', label: 'Closed', match: (a) => isTerminal(a) },
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

  const entries = useMemo(
    () => (data?.favorites ?? []).map((row) => row.auction).filter(Boolean),
    [data?.favorites]
  );

  const filtered = useMemo(() => {
    const matcher = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
    return entries.filter((auction) => matcher(auction));
  }, [entries, filter]);

  const pagination = data?.pagination;
  const runningCount = entries.filter((a) => a.status === 'live' && !isTerminal(a)).length;

  return (
    <div>
      <PageHeader
        title="Saved"
        reading={pagination?.total ? String(pagination.total).padStart(2, '0') : '00'}
        subtitle={
          runningCount > 0
            ? `${runningCount} of your saved lots ${runningCount === 1 ? 'is' : 'are'} running now.`
            : 'Lots you are watching.'
        }
      >
        <Link to="/" className="ctl-ghost">
          <Icon name="stacked_bar_chart" className="text-[16px]" />
          Board
        </Link>
      </PageHeader>

      <div className="mb-t4">
        <FilterPills options={STATUS_FILTERS} value={filter} onChange={setFilter} label="Filter saved lots" />
      </div>

      {isError && <Alert title="Could not load">{error?.message || 'Saved lots are unavailable.'}</Alert>}

      {isPending ? (
        <RegisterStackSkeleton count={3} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Nothing saved"
          body="Save a lot from the board and it will wait here until it opens."
        >
          <Link to="/" className="ctl-primary">
            Browse the board
          </Link>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="filter_alt_off"
          title="None in this state"
          body="Your saved lots are all in another state right now."
        >
          <button type="button" onClick={() => setFilter('all')} className="ctl-primary">
            Show all
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-t6">
          <RegisterStack auctions={filtered} />
          {filter === 'all' && (
            <Pagination page={page} totalPages={pagination?.totalPages ?? 1} onChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}
