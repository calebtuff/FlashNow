import useCountdown from '../hooks/useCountdown.js';
import { remainingFraction } from '../utils/auction.js';

const FILL = {
  running: 'bg-radium',
  closing: 'bg-caution',
  critical: 'bg-hand',
  over: 'bg-steel-bright',
};

/**
 * The draining arc along a register's top edge: the proportion of this lot's
 * own window that is left.
 *
 * Scaled with `transform`, never `width`, so a board of forty draining arcs
 * stays on the compositor instead of triggering forty layouts every second.
 * The 1s linear transition is what makes it read as a sweep rather than a
 * stepping progress bar, and linear is correct here for the same reason a
 * seconds hand does not ease.
 */
export default function TimeArc({ auction, className = '' }) {
  const { ended, unset, urgency } = useCountdown(auction?.endsAt);

  if (unset) return null;

  const fraction = ended ? 0 : remainingFraction(auction);

  return (
    <div
      className={`relative h-[3px] w-full overflow-hidden bg-steel ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
      aria-label="Time remaining in this lot"
    >
      <div
        className={`h-full w-full origin-left ${FILL[urgency]}`}
        style={{
          transform: `scaleX(${fraction})`,
          transition: 'transform 1s linear, background-color 140ms ease',
        }}
      />
    </div>
  );
}
