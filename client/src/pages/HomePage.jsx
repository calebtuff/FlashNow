import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';

const PILL_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  {
    key: 'watches',
    label: 'Watches',
    match: (a) =>
      /watch|omega|moonwatch/i.test(a.title) ||
      (a.category?.name && /watch/i.test(a.category.name)) ||
      (a.category?.slug && /watch/i.test(a.category.slug)),
  },
  {
    key: 'sneakers',
    label: 'Sneakers',
    match: (a) =>
      /sneaker|jordan|air max|yeezy/i.test(a.title) ||
      (a.category?.name && /sneaker|shoe|footwear/i.test(a.category.name)) ||
      (a.category?.slug && /sneaker|shoe/i.test(a.category.slug)),
  },
  {
    key: 'bags',
    label: 'Bags',
    match: (a) =>
      /bag|birkin|hermès|hermes|tote/i.test(a.title) ||
      (a.category?.name && /bag|leather/i.test(a.category.name)),
  },
  {
    key: 'art',
    label: 'Art',
    match: (a) =>
      /art|canvas|painting|acrylic/i.test(a.title) ||
      (a.category?.name && /art/i.test(a.category.name)),
  },
  {
    key: 'cameras',
    label: 'Cameras',
    match: (a) =>
      /camera|leica|canon|nikon|lens/i.test(a.title) ||
      (a.category?.name && /camera|photo/i.test(a.category.name)),
  },
  {
    key: 'vintage',
    label: 'Vintage',
    match: (a) =>
      /vintage|retro|classic|console/i.test(a.title) ||
      (a.category?.name && /vintage|collect/i.test(a.category.name)),
  },
  {
    key: 'music',
    label: 'Music',
    match: (a) =>
      /vinyl|record|music|floyd|album/i.test(a.title) ||
      (a.category?.name && /music/i.test(a.category.name)),
  },
];

function money(n) {
  if (n === null || n === undefined) return '—';
  const v = typeof n === 'number' ? n : Number.parseFloat(String(n));
  if (Number.isNaN(v)) return '—';
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function bidCountOf(a) {
  return a._count?.bids ?? a.bidCount ?? 0;
}

function currentPrice(a) {
  if (a.currentBid != null) {
    const v = typeof a.currentBid === 'number' ? a.currentBid : Number.parseFloat(String(a.currentBid));
    if (!Number.isNaN(v)) return v;
  }
  const s = typeof a.startingBid === 'number' ? a.startingBid : Number.parseFloat(String(a.startingBid));
  return Number.isNaN(s) ? 0 : s;
}

function useCountdown(endIso) {
  const end = endIso ? new Date(endIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!end) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [end]);

  if (!end) {
    return { ended: false, label: '—', parts: null };
  }

  const diff = end - now;
  if (diff <= 0) {
    return { ended: true, label: 'Ended', parts: { d: 0, h: 0, m: 0, s: 0 } };
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { ended: false, label: null, parts: { d, h, m, s } };
}

function CountdownStrip({ endsAt }) {
  const { ended, parts } = useCountdown(endsAt);
  if (ended || !parts) {
    return <span className="text-xs font-semibold text-white">{ended ? 'Ended' : '—'}</span>;
  }
  const unit = (v, lab) => (
    <span className="inline-flex flex-col items-center px-1">
      <span className="font-mono text-[11px] font-bold tabular-nums text-white">{String(v).padStart(2, '0')}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-white/70">{lab}</span>
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

function cardBadges(a, endsAt) {
  const bids = bidCountOf(a);
  const end = endsAt ? new Date(endsAt).getTime() : null;
  const soon = end && end > Date.now() && end - Date.now() < 86400000;
  const badges = [];
  if (soon) badges.push({ key: 'soon', text: 'ENDING SOON', className: 'bg-red-600 text-white' });
  if (bids >= 10) badges.push({ key: 'hot', text: 'HOT', className: 'bg-orange-500 text-white' });
  else if (bids >= 4) badges.push({ key: 'trend', text: 'TRENDING', className: 'bg-violet-600 text-white' });
  return badges;
}

function AuctionCard({ a }) {
  const img = Array.isArray(a.images) && a.images.length > 0 ? a.images[0] : `https://picsum.photos/seed/${a.id}/600/600`;
  const bids = bidCountOf(a);
  const badges = cardBadges(a, a.endsAt);
  const cat = a.category?.name ? String(a.category.name).toUpperCase() : 'AUCTION';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-neutral-100">
        <img src={img} alt="" className="h-full w-full object-cover" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b.key} className={`rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${b.className}`}>
              {b.text}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/25"
          aria-label="Save"
        >
          <Icon name="favorite" className="text-[20px] drop-shadow-sm" />
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8">
          <div className="flex items-end justify-between gap-2">
            <CountdownStrip endsAt={a.endsAt} />
            <span className="shrink-0 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              {bids} bids
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{cat}</p>
        <h3 className="mt-1 font-headline text-base font-bold leading-snug text-neutral-900 line-clamp-2">{a.title}</h3>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Current bid</p>
        <p className="font-headline text-lg font-extrabold text-neutral-900">{money(currentPrice(a))}</p>
        <Link
          to={`/auctions/${a.id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-neutral-800"
        >
          View auction
          <Icon name="arrow_forward" className="text-[18px]" />
        </Link>
      </div>
    </article>
  );
}

function FeaturedFallback() {
  const [endIso] = useState(() => new Date(Date.now() + 23 * 60000 + 47000).toISOString());
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
      <div className="relative aspect-[4/3] bg-neutral-200">
        <img
          src="https://picsum.photos/seed/flashnow-featured/800/600"
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
          Ending now
        </span>
        <button
          type="button"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/25"
          aria-label="Save"
        >
          <Icon name="favorite" className="text-[22px] drop-shadow-sm" />
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Ends in</p>
          <div className="mt-1 flex justify-center">
            <CountdownStrip endsAt={endIso} />
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-headline text-xl font-extrabold text-neutral-900">Tiffany &amp; Co. Solitaire</h3>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">Current bid</p>
        <p className="font-headline text-2xl font-extrabold text-neutral-900">$9,200</p>
        <p className="mt-1 text-sm text-neutral-500">22 bids</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [pill, setPill] = useState('all');
  const [sort, setSort] = useState('ending');

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => api.get('/auctions'),
  });

  const filteredSorted = useMemo(() => {
    const listRaw = data?.auctions ?? [];
    const matcher = PILL_FILTERS.find((p) => p.key === pill)?.match ?? (() => true);
    let list = listRaw.filter((a) => matcher(a));
    list = [...list];
    if (sort === 'ending') {
      list.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
    } else if (sort === 'priceDesc') {
      list.sort((a, b) => currentPrice(b) - currentPrice(a));
    } else if (sort === 'priceAsc') {
      list.sort((a, b) => currentPrice(a) - currentPrice(b));
    }
    return list;
  }, [data?.auctions, pill, sort]);

  const featured = filteredSorted[0] ?? null;

  return (
    <div className="space-y-10">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Live auctions now
          </p>
          <h1 className="mt-5 font-headline text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.25rem]">
            Live auctions ending soon.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600">
            Authentic pieces, verified sellers, and fast payouts. Browse watches, sneakers, art, and more — all in
            real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={featured ? `/auctions/${featured.id}` : '/'}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white no-underline shadow-sm transition-colors hover:bg-neutral-800"
            >
              Start bidding
              <Icon name="arrow_forward" className="text-[20px]" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-900 bg-transparent px-6 py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-white/50"
              title="Coming soon"
            >
              Sell something
            </button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-neutral-300/60 pt-8">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Auctions</dt>
              <dd className="mt-1 font-headline text-lg font-extrabold text-neutral-900">42K+</dd>
              <dd className="text-xs text-neutral-500">hosted</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Trust</dt>
              <dd className="mt-1 font-headline text-lg font-extrabold text-neutral-900">98.7%</dd>
              <dd className="text-xs text-neutral-500">authenticated</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Payout</dt>
              <dd className="mt-1 font-headline text-lg font-extrabold text-neutral-900">&lt; 24h</dd>
              <dd className="text-xs text-neutral-500">avg</dd>
            </div>
          </dl>
        </div>

        <div>
          {isPending ? (
            <div className="h-[420px] animate-pulse rounded-2xl bg-neutral-200/80" />
          ) : featured ? (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
              <div className="relative aspect-[4/3] bg-neutral-100">
                <img
                  src={
                    Array.isArray(featured.images) && featured.images[0]
                      ? featured.images[0]
                      : `https://picsum.photos/seed/${featured.id}/800/600`
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  Ending now
                </span>
                <button
                  type="button"
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/25"
                  aria-label="Save"
                >
                  <Icon name="favorite" className="text-[22px] drop-shadow-sm" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-16 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Ends in</p>
                  <div className="mt-1 flex justify-center">
                    <CountdownStrip endsAt={featured.endsAt} />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h2 className="font-headline text-xl font-extrabold text-neutral-900">{featured.title}</h2>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">Current bid</p>
                <p className="font-headline text-2xl font-extrabold text-neutral-900">{money(currentPrice(featured))}</p>
                <p className="mt-1 text-sm text-neutral-500">{bidCountOf(featured)} bids</p>
                <Link
                  to={`/auctions/${featured.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white no-underline hover:bg-neutral-800"
                >
                  View auction
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              </div>
            </div>
          ) : (
            <FeaturedFallback />
          )}
        </div>
      </section>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error?.message || 'Could not load auctions. Start the API or check your connection.'}
        </div>
      )}

      <section className="flex flex-wrap gap-2">
        {PILL_FILTERS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPill(p.key)}
            className={[
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              pill === p.key
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white/70 text-neutral-800 hover:bg-white',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-headline text-2xl font-extrabold text-neutral-900">Ending soonest</h2>
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <span className="text-neutral-500">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-900"
            >
              <option value="ending">Ending soon</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="priceAsc">Price: low to high</option>
            </select>
          </label>
        </div>

        {isPending ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div key={k} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200/80" />
            ))}
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
            <p className="font-headline text-lg font-bold text-neutral-800">No auctions match this filter</p>
            <p className="mt-2 text-sm text-neutral-600">Try another category or clear filters.</p>
            <button
              type="button"
              onClick={() => setPill('all')}
              className="mt-6 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white"
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSorted.map((a) => (
              <AuctionCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
