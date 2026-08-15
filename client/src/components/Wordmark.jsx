import { Link } from 'react-router-dom';

/**
 * The brand plate. Engraved caps in the narrow cut, the way an instrument
 * maker stamps a dial, with the bolt cut into the letterform gap rather than
 * sitting beside it as a separate badge.
 */
export default function Wordmark({ to = '/', className = '' }) {
  const content = (
    <span className={`inline-flex items-baseline gap-[3px] ${className}`}>
      <span className="legend text-[0.9375rem] font-bold tracking-[0.18em] text-lume">FLASH</span>
      <span aria-hidden className="relative -mx-[1px] inline-block h-[13px] w-[7px]">
        <span className="absolute inset-0 bg-hand [clip-path:polygon(58%_0,0_58%,42%_58%,30%_100%,100%_38%,52%_38%)]" />
      </span>
      <span className="legend text-[0.9375rem] font-bold tracking-[0.18em] text-lume-dim">NOW</span>
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="no-underline" aria-label="FlashNow, home">
      {content}
    </Link>
  );
}
