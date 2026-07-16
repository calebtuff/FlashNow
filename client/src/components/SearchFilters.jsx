import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { STATUS_OPTIONS } from '../utils/searchParams.js';

const labelClass = 'block text-xs font-bold uppercase tracking-wide text-neutral-500';
const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900';

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

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    setError('');
  }

  function handleApply(e) {
    e.preventDefault();
    const min = draft.minPrice === '' ? null : Number(draft.minPrice);
    const max = draft.maxPrice === '' ? null : Number(draft.maxPrice);

    if (min != null && (Number.isNaN(min) || min < 0)) {
      setError('Minimum price must be a valid number.');
      return;
    }
    if (max != null && (Number.isNaN(max) || max < 0)) {
      setError('Maximum price must be a valid number.');
      return;
    }
    if (min != null && max != null && min > max) {
      setError('Minimum price cannot be greater than maximum.');
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
        className={[
          'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
          open || activeCount > 0
            ? 'border-neutral-900 bg-neutral-900 text-white'
            : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
        ].join(' ')}
        aria-expanded={open}
      >
        <Icon name="tune" className="text-[18px]" />
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{activeCount}</span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-10 cursor-default bg-black/20"
            onClick={() => onToggle(false)}
          />
          <form
            onSubmit={handleApply}
            className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-extrabold text-neutral-900">Filters</h2>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    onToggle(false);
                  }}
                  className="text-xs font-bold uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className={labelClass} htmlFor="filter-category">
                  Category
                </label>
                <select
                  id="filter-category"
                  value={draft.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  className={inputClass}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="filter-status">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={draft.status}
                  onChange={(e) => update('status', e.target.value)}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || 'default'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="filter-min-price">
                    Min price ($)
                  </label>
                  <input
                    id="filter-min-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={draft.minPrice}
                    onChange={(e) => update('minPrice', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="filter-max-price">
                    Max price ($)
                  </label>
                  <input
                    id="filter-max-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Any"
                    value={draft.maxPrice}
                    onChange={(e) => update('maxPrice', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => onToggle(false)}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
