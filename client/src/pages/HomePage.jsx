import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import RegisterStack, { RegisterStackSkeleton } from '../components/RegisterStack.jsx';
import FilterPills from '../components/FilterPills.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useNow from '../hooks/useNow.js';
import {
  CRITICAL_MS,
  auctionTimeMeta,
  currentPrice,
  formatClock,
  money,
  remainingMs,
} from '../utils/auction.js';

const SORTS = [
  { key: 'closing', label: 'Closing' },
  { key: 'priceDesc', label: 'Price' },
  { key: 'bids', label: 'Bids' },
];

/** A lot with no readable end time sorts last rather than to the front. */
function endsAtMs(a) {
  const t = a?.endsAt ? new Date(a.endsAt).getTime() : Number.NaN;
  return Number.isNaN(t) ? Infinity : t;
}

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

/** One sub-dial: a small tracked legend over a large tabular reading. */
function Reading({ label, value, tone = 'text-lume' }) {
  return (
    <div className="min-w-0">
      <p className="legend text-tick text-lume-faint">{label}</p>
      <p className={`numeral mt-1 truncate text-title font-bold ${tone}`}>{value}</p>
    </div>
  );
}

/**
 * The board's own readings, clustered above the lots they describe.
 *
 * An instrument gets its density from the small dials around the main one, and
 * the board used to state nothing about itself but a row count. Every figure
 * here is derived from data the page already holds, so the strip costs no
 * request, and the two that move are driven by the same shared clock as every
 * countdown beneath them.
 *
 * The shape is fixed at four readings even when one has nothing to report, so
 * the strip does not change width as lots open and close under it.
 */
function BoardSummary({ running, opening, liveTotal, now }) {
  if (running.length === 0 && opening.length === 0) return null;

  const closing = running.filter((a) => {
    const ms = remainingMs(a, now);
    return ms != null && ms > 0 && ms <= CRITICAL_MS;
  }).length;

  // Summed over the rows actually listed, which is what "on the board" says.
  // Above the server's cap that is a subset of everything running, and the
  // line under the stack already states that the board is showing a subset.
  const value = running.reduce((sum, a) => sum + currentPrice(a), 0);

  const nextMs = opening.length ? new Date(opening[0].startsAt ?? 0).getTime() - now : null;
  let nextOpens = '--';
  if (nextMs != null) nextOpens = nextMs > 0 ? formatClock(nextMs) : 'Now';

  return (
    // No bottom margin: this sits inside the board's own `space-y-t8` rhythm.
    <div className="register grid grid-cols-2 gap-x-t6 gap-y-t4 p-t4 sm:grid-cols-4">
      <Reading label="Running" value={String(liveTotal).padStart(2, '0')} />

      {/* A count of lots inside the anti-snipe window is a state, not
          emphasis, so it takes the hand lamp only while there is one in it. */}
      <Reading
        label="Closing under 60s"
        value={String(closing).padStart(2, '0')}
        tone={closing > 0 ? 'text-hand' : 'text-lume'}
      />
      <Reading label="On the board" value={money(value)} />
      {/* Counting toward an opening, so it stays lume: a lot about to open is
          not urgent, whatever its clock says. */}
      <Reading label="Next opens" value={nextOpens} />
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

    // Bucketed by the clock, not by the stored status, and deliberately by the
    // same helper a register uses to decide what it prints.
    //
    // Status is a fact about the last fetch. A lot opens when the server's cron
    // promotes it, which nothing tells the browser about: there is a socket
    // event for a bid and one for a close, but none for an opening. Filing by
    // status therefore left an open lot sitting under "Opens next" while the
    // row inside it, which has always read the clock directly, counted down to
    // its close. One derivation for both means they cannot disagree, and since
    // `now` is a dependency here the lot changes section on the tick it opens.
    for (const a of all) {
      const { kind } = auctionTimeMeta(a, now);
      if (kind === 'ended') over.push(a);
      else if (kind === 'scheduled') next.push(a);
      else if (kind === 'live') live.push(a);
      // 'unknown' is an entry with no lot behind it; there is nothing to draw.
    }

    const bySort = (x, y) => {
      if (sort === 'priceDesc') return currentPrice(y) - currentPrice(x);
      if (sort === 'bids') return (y._count?.bids ?? 0) - (x._count?.bids ?? 0);
      // Default: whatever closes first is the thing you can still act on.
      //
      // Compared on the end time itself rather than on time remaining. The two
      // orderings are identical, because a shared `now` subtracts out of both
      // sides, but time remaining made the comparison a function of the tick,
      // so the board re-sorted every second and rows could swap places under
      // the cursor as someone reached for one.
      return endsAtMs(x) - endsAtMs(y);
    };

    return {
      running: [...live].sort(bySort),
      opening: [...next].sort(
        (x, y) => new Date(x.startsAt ?? 0).getTime() - new Date(y.startsAt ?? 0).getTime()
      ),
      // The server caps this bucket too, but the cap has to be reapplied here:
      // a lot that closes mid-session is patched to a terminal status by the
      // live socket and re-buckets into this list without a refetch, so over a
      // long session the tail would otherwise keep growing.
      closed: [...over]
        .sort((x, y) => new Date(y.endsAt ?? 0).getTime() - new Date(x.endsAt ?? 0).getTime())
        .slice(0, 5),
      leadingCount: userId ? live.filter((a) => a.currentWinnerId === userId).length : 0,
    };
  }, [data?.auctions, sort, now, userId]);

  // Below the server's cap the rows are the truth, and they stay accurate as
  // the live socket patches lots closed. Above it, only the server knows.
  const liveTruncated = Boolean(data?.counts?.liveTruncated);
  const liveTotal = liveTruncated ? data.counts.live : running.length;

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
        <RegisterStackSkeleton label="Loading the board" />
      ) : (
        <div className="space-y-t8">
          <BoardSummary running={running} opening={opening} liveTotal={liveTotal} now={now} />

          <section>
            {/* The heading states the real number of running lots, which is
                also what the bezel prints, so the two never disagree. When the
                board is capped, the line beneath says what is actually listed. */}
            <Rule label="Running now" count={liveTotal}>
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
              <RegisterStack auctions={running} />
            )}

            {liveTruncated && (
              <p className="mt-t3 text-body text-lume-dim">
                Listing the {running.length} closing soonest.{' '}
                <Link to="/search?status=live" className="text-lume">
                  See all {liveTotal} running lots
                </Link>
                .
              </p>
            )}
          </section>

          {opening.length > 0 && (
            <section>
              <Rule label="Opens next" count={opening.length} />
              <RegisterStack auctions={opening} />
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <Rule label="Just closed" count={closed.length} />
              {/* No dimming. This stack used to rest at 60% and return to full
                  on hover, which does not exist on touch, so on a phone the
                  section was permanently faded with no way to restore it, and
                  its tick legends fell under the contrast floor at that
                  opacity. A closed lot already reads as spent without help: an
                  unlit lamp, a drained arc, and a wall-clock time where the
                  running rows carry a countdown. */}
              <RegisterStack auctions={closed} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
