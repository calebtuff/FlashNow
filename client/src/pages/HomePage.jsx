import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Register from '../components/Register.jsx';
import FilterPills from '../components/FilterPills.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useNow from '../hooks/useNow.js';
import { currentPrice, isTerminal, money, remainingMs } from '../utils/auction.js';

const SORTS = [
  { key: 'closing', label: 'Closing' },
  { key: 'priceDesc', label: 'Price' },
  { key: 'bids', label: 'Bids' },
];

/**
 * A ruled section head. The count is the reading; the name is the legend.
 */
function Rule({ label, count, children }) {
  return (
    <div className="mb-t3 flex items-end justify-between gap-t4 border-b border-steel pb-t2">
      <h2 className="legend flex items-baseline gap-t2 text-legend text-lume-dim">
        {label}
        <span className="numeral text-body text-lume-faint">{String(count).padStart(2, '0')}</span>
      </h2>
      {children}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="space-y-px" aria-busy="true" aria-label="Loading the board">
      {[0, 1, 2, 3, 4].map((k) => (
        <div key={k} className="register p-t4">
          <div className="flex gap-t4">
            <div className="h-20 w-20 shrink-0 animate-pulse bg-high sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-t3">
              <div className="scale-rule w-full opacity-40" />
              <div className="h-7 w-24 animate-pulse bg-high" />
              <div className="h-4 w-2/3 animate-pulse bg-high" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A single line stating the mechanism, shown only to signed-out visitors.
 *
 * This replaces the previous marketing stack (hero, "How it works", "Why
 * FlashNow"), which a returning bidder had to scroll past on every visit to
 * reach the lots. A first-time visitor still learns what this is; the board
 * itself is the demonstration.
 */
function MechanismStrip() {
  return (
    <div className="register mb-t6 flex flex-col gap-t3 p-t4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-t3">
        <span className="mt-1 h-8 w-[3px] shrink-0 bg-hand" aria-hidden />
        <div>
          <p className="text-title font-bold leading-snug text-lume">
            Auctions here run five to thirty minutes.
          </p>
          <p className="mt-1 max-w-[52ch] text-body text-lume-dim">
            A lot is an event you attend, not a listing you revisit. Funds are held while you lead and
            released the moment you are outbid.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-t2">
        <Link to="/register" className="ctl-primary">
          Create account
        </Link>
        <Link to="/login" className="ctl-ghost">
          Sign in
        </Link>
      </div>
    </div>
  );
}

/** The viewer's own stake, read off the board rather than a new endpoint. */
function PositionStrip({ leadingCount, held }) {
  if (leadingCount === 0 && !held) return null;

  return (
    <div className="mb-t6 flex flex-wrap items-center gap-x-t6 gap-y-t2 border-b border-steel pb-t3">
      <span className="legend flex items-baseline gap-t2 text-tick text-lume-faint">
        Leading
        <span className="numeral text-title font-bold text-radium">
          {String(leadingCount).padStart(2, '0')}
        </span>
      </span>
      {typeof held === 'number' && held > 0 && (
        <span className="legend flex items-baseline gap-t2 text-tick text-lume-faint">
          Held on bids
          <span className="numeral text-title font-bold text-caution">{money(held)}</span>
        </span>
      )}
      <Link
        to="/my-bids"
        className="legend ml-auto text-tick text-lume-faint no-underline transition-colors hover:text-lume"
      >
        All my bids
      </Link>
    </div>
  );
}

export default function HomePage() {
  const [sort, setSort] = useState('closing');
  const { isAuthenticated, userId } = useAuth();

  // The board re-sorts as lots drain, so it depends on the shared clock.
  const now = useNow();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => api.get('/auctions'),
    staleTime: 15_000,
  });

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => api.get('/wallet'),
    enabled: isAuthenticated,
  });
  const held = walletQuery.data?.wallet?.heldBalance;

  const { running, opening, closed, leadingCount } = useMemo(() => {
    const all = data?.auctions ?? [];

    const live = [];
    const next = [];
    const over = [];

    for (const a of all) {
      if (isTerminal(a)) over.push(a);
      else if (a.status === 'scheduled' || a.status === 'draft') next.push(a);
      else live.push(a);
    }

    const bySort = (x, y) => {
      if (sort === 'priceDesc') return currentPrice(y) - currentPrice(x);
      if (sort === 'bids') return (y._count?.bids ?? 0) - (x._count?.bids ?? 0);
      // Default: whatever closes first is the thing you can still act on.
      return (remainingMs(x, now) ?? Infinity) - (remainingMs(y, now) ?? Infinity);
    };

    return {
      running: [...live].sort(bySort),
      opening: [...next].sort(
        (x, y) => new Date(x.startsAt ?? 0).getTime() - new Date(y.startsAt ?? 0).getTime()
      ),
      closed: [...over]
        .sort((x, y) => new Date(y.endsAt ?? 0).getTime() - new Date(x.endsAt ?? 0).getTime())
        .slice(0, 5),
      leadingCount: userId ? live.filter((a) => a.currentWinnerId === userId).length : 0,
    };
  }, [data?.auctions, sort, now, userId]);

  return (
    <div>
      {!isAuthenticated && <MechanismStrip />}
      {isAuthenticated && <PositionStrip leadingCount={leadingCount} held={held} />}

      {isError && (
        <Alert title="Board offline" className="mb-t6">
          {error?.message || 'Could not reach the auction service. Check your connection.'}
        </Alert>
      )}

      {isPending ? (
        <BoardSkeleton />
      ) : (
        <div className="space-y-t8">
          <section>
            <Rule label="Running now" count={running.length}>
              <FilterPills options={SORTS} value={sort} onChange={setSort} label="Sort the board" />
            </Rule>

            {running.length === 0 ? (
              <EmptyState
                icon="timer_off"
                title="Nothing running"
                body="No lot is live right now. Scheduled lots appear below as they open."
              >
                <Link to="/sell" className="ctl-primary">
                  <Icon name="add" className="text-[18px]" />
                  List a lot
                </Link>
              </EmptyState>
            ) : (
              // Hairline gaps on a steel ground make the stack read as one
              // ruled panel rather than a scatter of separate cards.
              <div className="space-y-px bg-steel">
                {running.map((a, i) => (
                  <Register key={a.id} auction={a} row={i} />
                ))}
              </div>
            )}
          </section>

          {opening.length > 0 && (
            <section>
              <Rule label="Opens next" count={opening.length} />
              <div className="space-y-px bg-steel">
                {opening.map((a, i) => (
                  <Register key={a.id} auction={a} row={i} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <Rule label="Just closed" count={closed.length} />
              <div className="space-y-px bg-steel opacity-60 transition-opacity duration-flyback hover:opacity-100">
                {closed.map((a, i) => (
                  <Register key={a.id} auction={a} row={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
