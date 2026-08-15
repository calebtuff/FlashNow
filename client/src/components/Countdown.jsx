import useCountdown from '../hooks/useCountdown.js';

const SIZES = {
  sm: 'text-body',
  md: 'text-title',
  lg: 'text-register',
  dial: 'text-readout',
};

const URGENCY_TEXT = {
  running: 'text-lume',
  closing: 'text-caution',
  critical: 'text-hand',
  over: 'text-lume-faint',
};

/**
 * The clock, set as a stopwatch reads: mm:ss, tabular, urgency-coloured.
 *
 * Colour is never the only signal. `aria-label` states the remaining time in
 * words, and callers pair the clock with a lamp that carries the same state as
 * text, so a red readout is confirmation rather than the sole cue.
 */
export default function Countdown({ endsAt, size = 'md', urgent = true, className = '' }) {
  const { ended, unset, ms, clock, urgency: rawUrgency } = useCountdown(endsAt);

  // Urgency describes a lot running out of time. A lot about to *open* is not
  // urgent, so a scheduled countdown passes `urgent={false}` and stays lume
  // instead of turning red 60 seconds before it starts.
  const urgency = urgent ? rawUrgency : 'running';

  if (unset) {
    return <span className={`numeral ${SIZES[size]} text-lume-faint ${className}`}>--:--</span>;
  }

  if (ended) {
    return <span className={`legend text-legend text-lume-faint ${className}`}>Closed</span>;
  }

  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const spoken = mins > 0 ? `${mins} minute${mins === 1 ? '' : 's'} ${secs} seconds left` : `${secs} seconds left`;

  return (
    <span
      className={[
        'numeral font-semibold tabular-nums',
        SIZES[size],
        URGENCY_TEXT[urgency],
        // Inside the anti-snipe window the readout pulses on the shared clock.
        // Under reduced motion this resolves to a steady lit state.
        urgency === 'critical' ? 'sweeping' : '',
        className,
      ].join(' ')}
      aria-label={spoken}
      role="timer"
    >
      {clock}
    </span>
  );
}
