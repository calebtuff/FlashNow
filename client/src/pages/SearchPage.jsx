import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import { api } from '../services/api.js';

const SORT_OPTIONS = [
  { value: 'ending_soon', label: 'Ending soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const [sortBy, setSortBy] = useState('ending_soon');

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['search', q, sortBy],
    queryFn: () => api.get('/auctions/search', { query: { q, sortBy } }),
    enabled: q !== '',
  });

  const results = data?.results ?? [];
  const total = data?.pagination?.total ?? results.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-extrabold text-neutral-900">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : 'Search auctions'}
        </h1>
        {q && !isPending && !isError && (
          <p className="mt-1 text-sm text-neutral-600">
            {total} {total === 1 ? 'auction' : 'auctions'} found
          </p>
        )}
      </div>

      {q === '' ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <Icon name="search" className="text-[40px] text-neutral-400" />
          <p className="mt-2 font-headline text-lg font-bold text-neutral-800">Search for an auction</p>
          <p className="mt-1 text-sm text-neutral-600">Try a brand, item, or category from the search bar above.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <span className="text-neutral-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-900"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

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
              <p className="font-headline text-lg font-bold text-neutral-800">No auctions match &ldquo;{q}&rdquo;</p>
              <p className="mt-2 text-sm text-neutral-600">Try a different keyword or browse all auctions.</p>
              <Link
                to="/"
                className="mt-6 inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline"
              >
                Browse all
              </Link>
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
