import Icon from './Icon.jsx';

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  function go(next) {
    onChange(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <nav className="flex items-center justify-between gap-t3 border-t border-steel pt-t4" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => go(page - 1)} className="ctl-ghost">
        <Icon name="arrow_back" className="text-[16px]" />
        Prev
      </button>

      <span className="legend text-tick text-lume-faint">
        <span className="numeral text-lume">{String(page).padStart(2, '0')}</span>
        <span className="mx-1">/</span>
        <span className="numeral">{String(totalPages).padStart(2, '0')}</span>
      </span>

      <button type="button" disabled={page >= totalPages} onClick={() => go(page + 1)} className="ctl-ghost">
        Next
        <Icon name="arrow_forward" className="text-[16px]" />
      </button>
    </nav>
  );
}
