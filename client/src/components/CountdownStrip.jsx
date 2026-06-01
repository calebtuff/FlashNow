import useCountdown from '../hooks/useCountdown.js';

export default function CountdownStrip({ endsAt, tone = 'light' }) {
  const { ended, parts } = useCountdown(endsAt);

  const numClass = tone === 'dark' ? 'text-neutral-900' : 'text-white';
  const labClass = tone === 'dark' ? 'text-neutral-500' : 'text-white/70';

  if (ended || !parts) {
    return <span className={`text-xs font-semibold ${numClass}`}>{ended ? 'Ended' : '—'}</span>;
  }

  const unit = (v, lab) => (
    <span className="inline-flex flex-col items-center px-1">
      <span className={`font-mono text-[11px] font-bold tabular-nums ${numClass}`}>{String(v).padStart(2, '0')}</span>
      <span className={`text-[9px] font-semibold uppercase tracking-wide ${labClass}`}>{lab}</span>
    </span>
  );

  return (
    <div className="flex items-center justify-center gap-0.5">
      {unit(parts.d, 'days')}
      {unit(parts.h, 'hrs')}
      {unit(parts.m, 'min')}
      {unit(parts.s, 'sec')}
    </div>
  );
}
