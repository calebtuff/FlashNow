import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import SearchFilters from '../components/SearchFilters.jsx';
import { api } from '../services/api.js';
import {
  SORT_OPTIONS,
  STATUS_OPTIONS,
  filtersToApiQuery,
  filtersToURLSearchParams,
  hasSearchCriteria,
  parseSearchFilters,
} from '../utils/searchParams.js';

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm font-semibold text-neutral-800">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        aria-label={`Remove ${label} filter`}
      >
        <Icon name="close" className="text-[16px]" />
      </button>
    </span>
  );
}

function buildPageTitle(filters, categoryName) {
  if (filters.q && categoryName) {
    return (
      <>
        &ldquo;{filters.q}&rdquo; in {categoryName}
      </>
    );
  }
  if (filters.q) return <>Results for &ldquo;{filters.q}&rdquo;</>;
  if (categoryName) return <>Browse {categoryName}</>;
  if (hasSearchCriteria(filters)) return <>Filtered auctions</>;
  return <>Search auctions</>;
}

export default function SearchPage() {
  const [params, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseSearchFilters(params), [params]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });
  const categories = categoriesQuery.data?.categories ?? [];

  const categoryName = useMemo(
    () => categories.find((c) => c.id === filters.categoryId)?.name ?? '',
    [categories, filters.categoryId]
  );

  const canSearch = hasSearchCriteria(filters);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['search', filters],
    queryFn: () => api.get('/auctions/search', { query: filtersToApiQuery(filters) }),
    enabled: canSearch,
  });

  const results = data?.results ?? [];
  const total = data?.pagination?.total ?? results.length;

  function applyFilters(next) {
    setSearchParams(filtersToURLSearchParams(next));
  }

  function updateSort(sortBy) {
    applyFilters({ ...filters, sortBy });
  }

  function removeFilter(key) {
    applyFilters({ ...filters, [key]: '' });
  }

  function removePriceRange() {
    applyFilters({ ...filters, minPrice: '', maxPrice: '' });
  }

  function clearPanelFilters() {
    applyFilters({
      ...filters,
      categoryId: '',
      status: '',
      minPrice: '',
      maxPrice: '',
    });
  }

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filters.status)?.label;
  const priceLabel =
    filters.minPrice && filters.maxPrice
      ? `$${filters.minPrice}–$${filters.maxPrice}`
      : filters.minPrice
        ? `$${filters.minPrice}+`
        : filters.maxPrice
          ? `Up to $${filters.maxPrice}`
          : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-neutral-900">{buildPageTitle(filters, categoryName)}</h1>
        {canSearch && !isPending && !isError && (
          <p className="mt-1 text-sm text-neutral-600">
            {total} {total === 1 ? 'auction' : 'auctions'} found
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchFilters
          filters={filters}
          categories={categories}
          open={filtersOpen}
          onToggle={setFiltersOpen}
          onApply={applyFilters}
          onClearAll={clearPanelFilters}
        />

        {canSearch && (
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <span className="text-neutral-500">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => updateSort(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-900"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {!canSearch ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <Icon name="search" className="text-[40px] text-neutral-400" />
          <p className="mt-2 font-headline text-lg font-bold text-neutral-800">Search for an auction</p>
          <p className="mt-1 text-sm text-neutral-600">
            Use the search bar above, or pick a category and price range from filters.
          </p>
        </div>
      ) : (
        <>
          {(categoryName || (statusLabel && filters.status) || priceLabel) && (
            <div className="flex flex-wrap gap-2">
              {categoryName && (
                <FilterChip label={categoryName} onRemove={() => removeFilter('categoryId')} />
              )}
              {statusLabel && filters.status && (
                <FilterChip label={statusLabel} onRemove={() => removeFilter('status')} />
              )}
              {priceLabel && <FilterChip label={priceLabel} onRemove={removePriceRange} />}
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error?.message || 'Could not run the search. Please try again.'}
            </div>
          )}

          {isPending ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div key={k} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200/80" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
              <p className="font-headline text-lg font-bold text-neutral-800">No matching auctions</p>
              <p className="mt-2 text-sm text-neutral-600">Try different keywords or adjust your filters.</p>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-800"
              >
                <Icon name="tune" className="text-[18px]" />
                Adjust filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((a) => (
                <AuctionCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
