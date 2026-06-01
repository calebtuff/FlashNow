import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import CountdownStrip from './CountdownStrip.jsx';
import { bidCountOf, currentPrice, imageOf, money } from '../utils/auction.js';

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
