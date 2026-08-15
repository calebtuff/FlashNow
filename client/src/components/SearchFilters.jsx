import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { STATUS_OPTIONS } from '../utils/searchParams.js';

function emptyDraft(filters) {
  return {
    categoryId: filters.categoryId || '',
    status: filters.status || '',
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
  };
}

export default function SearchFilters({ filters, categories, open, onToggle, onApply, onClearAll }) {
  const [draft, setDraft] = useState(() => emptyDraft(filters));
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(emptyDraft(filters));
      setError('');
    }
  }, [open, filters]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onToggle(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onToggle]);

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    setError('');
  }

  function handleApply(e) {
    e.preventDefault();
    const min = draft.minPrice === '' ? null : Number(draft.minPrice);
    const max = draft.maxPrice === '' ? null : Number(draft.maxPrice);

    if (min != null && (Number.isNaN(min) || min < 0)) {
      setError('Minimum must be a valid number.');
      return;
    }
    if (max != null && (Number.isNaN(max) || max < 0)) {
      setError('Maximum must be a valid number.');
      return;
    }
    if (min != null && max != null && min > max) {
      setError('Minimum cannot exceed maximum.');
      return;
    }

    onApply({
      ...filters,
      categoryId: draft.categoryId,
      status: draft.status,
      minPrice: draft.minPrice === '' ? '' : String(min),
      maxPrice: draft.maxPrice === '' ? '' : String(max),
    });
    onToggle(false);
  }

  const activeCount =
    (filters.categoryId ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(!open)}
        className={open || activeCount > 0 ? 'ctl-primary' : 'ctl-ghost'}
        aria-expanded={open}
      >
        <Icon name="tune" className="text-[16px]" />
        Filters
        {activeCount > 0 && <span className="numeral">{activeCount}</span>}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default bg-dial/70"
            onClick={() => onToggle(false)}
          />
          <form
            onSubmit={handleApply}
            className="register flyback absolute right-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] origin-top-right p-t4"
          >
            <div className="flex items-center justify-between gap-t3 border-b border-steel pb-t3">
              <h2 className="legend text-legend text-lume-dim">Filters</h2>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    onToggle(false);
                  }}
                  className="legend text-tick text-lume-faint transition-colors hover:text-lume"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-t4 space-y-t4">
              <div>
                <label className="field-label" htmlFor="filter-category">
                  Category
                </label>
                <select
                  id="filter-category"
                  value={draft.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  className="field"
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="filter-status">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={draft.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="field"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || 'default'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-t3">
                <div>
                  <label className="field-label" htmlFor="filter-min-price">
                    Min $
                  </label>
                  <input
                    id="filter-min-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={draft.minPrice}
                    onChange={(e) => update('minPrice', e.target.value)}
                    className="field numeral"
                    aria-invalid={Boolean(error)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="filter-max-price">
                    Max $
                  </label>
                  <input
                    id="filter-max-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Any"
                    value={draft.maxPrice}
                    onChange={(e) => update('maxPrice', e.target.value)}
                    className="field numeral"
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-t3 text-micro text-hand">
                {error}
              </p>
            )}

            <div className="mt-t4 flex gap-t2">
              <button type="button" onClick={() => onToggle(false)} className="ctl-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="ctl-primary flex-1">
                Apply
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
