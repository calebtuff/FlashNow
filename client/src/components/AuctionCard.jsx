import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import CountdownStrip from './CountdownStrip.jsx';
import { auctionTimeMeta, bidCountOf, currentPrice, formatAuctionDateTime, imageOf, money } from '../utils/auction.js';

function cardBadges(a) {
  const bids = bidCountOf(a);
  const end = a.endsAt ? new Date(a.endsAt).getTime() : null;
  const soon = end && end > Date.now() && end - Date.now() < 86400000;
  const badges = [];
  if (soon) badges.push({ key: 'soon', text: 'ENDING SOON', className: 'bg-red-600 text-white' });
  if (bids >= 10) badges.push({ key: 'hot', text: 'HOT', className: 'bg-orange-500 text-white' });
  else if (bids >= 4) badges.push({ key: 'trend', text: 'TRENDING', className: 'bg-violet-600 text-white' });
  return badges;
}

export default function AuctionCard({ a }) {
  const img = imageOf(a, 600);
  const bids = bidCountOf(a);
  const badges = cardBadges(a);
  const cat = a.category?.name ? a.category.name : 'Auction';
  const dots = Array.isArray(a.images) ? Math.min(a.images.length, 3) : 0;
  const time = auctionTimeMeta(a);

  return (
    <article className="flex flex-col rounded-3xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        <img src={img} alt="" className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b.key} className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${b.className}`}>
              {b.text}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm transition-colors hover:text-red-500"
          aria-label="Save"
        >
          <Icon name="favorite" className="text-[18px]" />
        </button>
        {dots > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {Array.from({ length: dots }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-white/80'}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-3">
        <p className="text-xs font-semibold text-emerald-600">{cat}</p>
        <h3 className="mt-0.5 font-display text-base font-semibold leading-snug tracking-tight text-neutral-900 line-clamp-2">{a.title}</h3>

        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-2 py-1">
              <Icon name="schedule" className="shrink-0 text-[14px] text-white/80" />
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                {time.heading}
              </span>
              {time.kind === 'ended' ? (
                <span className="text-xs font-semibold text-white">Ended</span>
              ) : (
                <CountdownStrip endsAt={time.countdownIso} />
              )}
            </span>
            <span className="shrink-0 text-xs font-semibold text-neutral-500">{bids} bids</span>
          </div>
          <p className="text-[11px] font-medium text-neutral-500">
            {time.kind === 'scheduled' && `Starts ${time.dateTime}`}
            {time.kind === 'live' && `Ends ${time.dateTime}`}
            {time.kind === 'ended' && `Ended ${formatAuctionDateTime(a.endsAt)}`}
          </p>
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Current bid</p>
        <p className="font-display text-lg font-bold tracking-tight text-neutral-900">{money(currentPrice(a))}</p>
        <Link
          to={`/auctions/${a.id}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-neutral-800"
        >
          View auction
        </Link>
      </div>
    </article>
  );
}
