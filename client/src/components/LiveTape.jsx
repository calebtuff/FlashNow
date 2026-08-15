import { Link } from 'react-router-dom';
import useNow from '../hooks/useNow.js';
import { useLiveTapeStore } from '../stores/liveTapeStore.js';
import { money } from '../utils/auction.js';

/**
 * The tape: bids landing anywhere on the site, newest first.
 *
 * A board of countdowns tells you time is passing; it does not tell you the
 * market is moving. The tape is the reading that does, and it is the honest
 * version of a carousel: it moves because something happened, not on a timer,
 * so nothing on it can go stale while it sits on screen.
 *
 * Motion is a jump, not a scroll. A row animates once when it mounts and the
 * oldest falls off the end; a marquee would be a fourth motion in a system
 * that allows three, and would need its own pause control to be operable.
 */

/** Below this the panel would read as broken rather than quiet, so it hides. */
const MIN_ENTRIES = 3;

/** Coarse ages. The tape says how fresh a bid is, not when it happened. */
function ago(ms) {
  if (!Number.isFinite(ms) || ms < 1000) return 'now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function placedAtMs(entry) {
  const t = entry?.placedAt ? new Date(entry.placedAt).getTime() : Number.NaN;
  return Number.isNaN(t) ? null : t;
}

export default function LiveTape() {
  const entries = useLiveTapeStore((s) => s.entries);
  const now = useNow();

  if (entries.length < MIN_ENTRIES) return null;

  return (
    <section className="register p-t4" aria-label="Recent bids across the site">
      <h2 className="legend mb-t3 flex items-center gap-t2 border-b border-steel pb-t2 text-legend text-lume-dim">
        {/* The one circle the system permits: the live indicator. */}
        <span className="h-t2 w-t2 shrink-0 rounded-full bg-radium" aria-hidden />
        Live tape
      </h2>

      {/* Deliberately not a live region. Every row's age restates itself on the
          shared tick, so an aria-live list here would announce six changes a
          second and make the page unusable with a screen reader. The tape is
          ambient; it carries a heading and is read on demand. */}
      <ol className="space-y-t2">
        {entries.map((entry, i) => {
          const placed = placedAtMs(entry);

          return (
            <li
              key={entry.bidId}
              className="flyback flex items-baseline gap-t3"
              style={{ '--row': i }}
            >
              <span className="numeral shrink-0 text-body font-bold text-lume">
                {money(entry.amount)}
              </span>

              <span className="min-w-0 flex-1 truncate text-body text-lume-dim">
                <Link
                  to={`/auctions/${entry.auctionId}`}
                  className="no-underline transition-colors duration-jump hover:text-lume"
                >
                  {entry.title}
                </Link>
              </span>

              <span className="legend shrink-0 text-tick text-lume-faint">
                {placed == null ? 'now' : ago(now - placed)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
