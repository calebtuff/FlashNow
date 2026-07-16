export const SORT_OPTIONS = [
  { value: 'ending_soon', label: 'Ending soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
];

export const STATUS_OPTIONS = [
  { value: '', label: 'Live & upcoming' },
  { value: 'live', label: 'Live only' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ended', label: 'Ended' },
];

const DEFAULT_SORT = 'ending_soon';

export function parseSearchFilters(params) {
  return {
    q: params.get('q')?.trim() || '',
    categoryId: params.get('categoryId') || '',
    status: params.get('status') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sortBy: params.get('sortBy') || DEFAULT_SORT,
  };
}

export function hasSearchCriteria(filters) {
  return Boolean(filters.q || filters.categoryId || filters.status || filters.minPrice || filters.maxPrice);
}

export function filtersToApiQuery(filters) {
  const query = { sortBy: filters.sortBy || DEFAULT_SORT };
  if (filters.q) query.q = filters.q;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.status) query.status = filters.status;
  if (filters.minPrice) query.minPrice = filters.minPrice;
  if (filters.maxPrice) query.maxPrice = filters.maxPrice;
  return query;
}

export function filtersToURLSearchParams(filters) {
  const next = new URLSearchParams();
  if (filters.q) next.set('q', filters.q);
  if (filters.categoryId) next.set('categoryId', filters.categoryId);
  if (filters.status) next.set('status', filters.status);
  if (filters.minPrice) next.set('minPrice', filters.minPrice);
  if (filters.maxPrice) next.set('maxPrice', filters.maxPrice);
  if (filters.sortBy && filters.sortBy !== DEFAULT_SORT) next.set('sortBy', filters.sortBy);
  return next;
}

export function countActiveFilters(filters) {
  let n = 0;
  if (filters.categoryId) n += 1;
  if (filters.status) n += 1;
  if (filters.minPrice) n += 1;
  if (filters.maxPrice) n += 1;
  return n;
}
