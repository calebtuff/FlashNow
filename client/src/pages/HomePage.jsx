import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

export default function HomePage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => api.get('/auctions'),
  });

  const auctions = data?.auctions ?? [];

  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Live Auctions</h1>
      <p className="mb-6 text-slate-600">
        Browse active listings. Data from <code className="rounded bg-slate-200 px-1">GET /api/auctions</code>.
      </p>

      {isPending && <p className="text-slate-600">Loading auctions…</p>}
      {isError && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-800">
          {error?.message || 'Failed to load auctions. Is the API running on port 3001?'}
        </p>
      )}

      {!isPending && !isError && auctions.length === 0 && (
        <p className="text-slate-600">No auctions yet. Seed the database or create one via the API.</p>
      )}

      <ul className="space-y-3">
        {auctions.map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow"
          >
            <Link to={`/auctions/${a.id}`} className="font-semibold text-blue-700 no-underline hover:underline">
              {a.title}
            </Link>
            <p className="mt-1 text-sm text-slate-600">
              Starting {typeof a.startingBid === 'number' ? `$${a.startingBid.toFixed(2)}` : '—'}
              {a.seller?.username ? ` · Seller: ${a.seller.username}` : ''}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-slate-500">
        <Link to="/auctions/demo-auction-id" className="text-blue-600 hover:underline">
          Open demo auction route
        </Link>{' '}
        (404 if that id does not exist).
      </p>
    </section>
  );
}
