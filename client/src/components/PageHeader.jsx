/**
 * A dial plate: the surface's name engraved in the narrow cut, a reading
 * beneath it, and any controls set on the same rule.
 *
 * Page titles are deliberately small here. In the old design the h1 was the
 * largest type on every screen, which meant "Wallet" outweighed the balance
 * and "My bids" outweighed the clock. On an instrument the label is small and
 * the measurement is large.
 */
export default function PageHeader({ title, reading, subtitle, children }) {
  return (
    <div className="mb-t6 flex flex-col gap-t3 border-b border-steel pb-t4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="legend text-legend text-lume-faint">{title}</h1>
        {reading && <p className="numeral mt-t2 text-register font-bold text-lume">{reading}</p>}
        {subtitle && <p className="mt-t2 text-body text-lume-dim">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-t2">{children}</div>}
    </div>
  );
}
