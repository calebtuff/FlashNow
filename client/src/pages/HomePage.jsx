import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import CountdownStrip from '../components/CountdownStrip.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import { api } from '../services/api.js';
import { bidCountOf, currentPrice, money } from '../utils/auction.js';

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
        <h3 className="font-display text-xl font-semibold tracking-tight text-neutral-900">Tiffany &amp; Co. Solitaire</h3>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">Current bid</p>
        <p className="font-display text-2xl font-bold tracking-tight text-neutral-900">$9,200</p>
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
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-neutral-900 bg-transparent px-6 py-3 text-sm font-bold text-neutral-900 no-underline transition-colors hover:bg-white/50"
            >
              Sell something
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-4 border-t border-neutral-300/60 pt-8">
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
                <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-900">{featured.title}</h2>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">Current bid</p>
                <p className="font-display text-2xl font-bold tracking-tight text-neutral-900">{money(currentPrice(featured))}</p>
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

      <section className="rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10">
        <h2 className="font-headline text-2xl font-extrabold text-neutral-900">How it works</h2>
        <p className="mt-1 text-sm text-neutral-600">Win authentic items in three simple steps.</p>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: 'search',
              title: 'Discover',
              text: 'Browse live auctions across watches, sneakers, art, and more — all verified.',
            },
            {
              icon: 'gavel',
              title: 'Bid in real time',
              text: 'Place your bid and watch the countdown. Get outbid? Jump back in instantly.',
            },
            {
              icon: 'local_shipping',
              title: 'Win & get it fast',
              text: 'Win, pay securely, and receive your item quickly with full buyer protection.',
            },
          ].map((step, i) => (
            <div key={step.title} className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <Icon name={step.icon} className="text-[20px]" />
                </span>
                <span className="font-display text-sm font-bold uppercase tracking-wide text-neutral-400">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-neutral-900">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-headline text-2xl font-extrabold text-neutral-900">Why FlashNow</h2>
        <p className="mt-1 text-sm text-neutral-600">Built for trust, speed, and authenticity.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: 'verified', title: 'Verified authenticity', text: 'Every seller and item is vetted before going live.' },
            { icon: 'shield', title: 'Buyer protection', text: 'Your payment is protected from bid to delivery.' },
            { icon: 'bolt', title: 'Real-time bidding', text: 'Live countdowns and instant updates as bids land.' },
            { icon: 'payments', title: 'Fast payouts', text: 'Sellers get paid quickly — typically within 24 hours.' },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                <Icon name={f.icon} className="text-[22px]" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-neutral-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
