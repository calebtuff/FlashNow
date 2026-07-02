import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import CountdownStrip from '../components/CountdownStrip.jsx';
import { api } from '../services/api.js';
import { getCurrentUserId } from '../services/currentUser.js';
import { bidCountOf, currentPrice, imageOf, money } from '../utils/auction.js';

function Skeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-2xl bg-neutral-200/80" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200/80" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-neutral-200/80" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-neutral-200/80" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-neutral-200/80" />
      </div>
    </div>
  );
}

function SellerCard({ seller }) {
  if (!seller) return null;
  return (
    <Link
      to={`/profile/${seller.id}`}
      className="mt-6 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 no-underline transition-colors hover:bg-neutral-50"
    >
      <img
        src={seller.avatarUrl || `https://i.pravatar.cc/80?u=${seller.id}`}
        alt=""
        className="h-10 w-10 rounded-full object-cover"
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Seller</p>
        <p className="font-bold text-neutral-900">{seller.username || 'Unknown seller'}</p>
      </div>
      <Icon name="chevron_right" className="ml-auto text-[22px] text-neutral-400" />
    </Link>
  );
}

function BidBox({ auction }) {
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();
  const minNext = currentPrice(auction) + 1;
  const [amount, setAmount] = useState('');

  const endTime = auction.endsAt ? new Date(auction.endsAt).getTime() : null;
  const ended = endTime ? endTime <= Date.now() : false;

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => api.get('/wallet', { query: { userId } }),
    enabled: !!userId,
  });
  const available = walletQuery.data?.wallet?.availableBalance;

  const placeBid = useMutation({
    mutationFn: (value) => api.post(`/auctions/${auction.id}/bids`, { amount: value, userId }),
    onSuccess: () => {
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['auction', auction.id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const value = Number.parseFloat(amount);
  const tooLow = !Number.isNaN(value) && value < minNext;
  const disabled = ended || placeBid.isPending || amount === '' || Number.isNaN(value) || tooLow;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) placeBid.mutate(value);
      }}
      className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <label className="text-xs font-bold uppercase tracking-wide text-neutral-500" htmlFor="bid-amount">
        Your bid
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">$</span>
          <input
            id="bid-amount"
            type="number"
            inputMode="decimal"
            min={minNext}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(minNext)}
            disabled={ended}
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-7 pr-3 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-900 disabled:bg-neutral-100"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {placeBid.isPending ? 'Placing…' : 'Place bid'}
          {!placeBid.isPending && <Icon name="gavel" className="text-[18px]" />}
        </button>
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        {ended ? 'This auction has ended.' : `Enter ${money(minNext)} or more.`}
      </p>
      {userId && typeof available === 'number' && (
        <p className="mt-1 text-xs text-neutral-500">
          Available balance: <span className="font-semibold text-neutral-700">{money(available)}</span>
        </p>
      )}
      {tooLow && <p className="mt-1 text-xs font-semibold text-red-600">Bid must be at least {money(minNext)}.</p>}
      {placeBid.isError && (
        <p className="mt-1 text-xs font-semibold text-red-600">
          {placeBid.error?.message || 'Could not place bid. Try again.'}
        </p>
      )}
      {placeBid.isSuccess && <p className="mt-1 text-xs font-semibold text-emerald-600">Bid placed!</p>}
    </form>
  );
}

function BidHistory({ bids }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-10 text-center">
        <p className="font-headline text-base font-bold text-neutral-800">No bids yet</p>
        <p className="mt-1 text-sm text-neutral-600">Be the first to place a bid.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {bids.map((b) => (
        <li key={b.id} className="flex items-center gap-3 px-4 py-3">
          <img
            src={b.user?.avatarUrl || `https://i.pravatar.cc/64?u=${b.user?.id ?? b.id}`}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="font-semibold text-neutral-800">{b.user?.username || 'Bidder'}</span>
          <span className="ml-auto font-headline font-extrabold text-neutral-900">{money(b.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AuctionDetailPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => api.get(`/auctions/${id}`),
  });

  const auction = data?.auction ?? null;

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 no-underline hover:text-neutral-900">
        <Icon name="arrow_back" className="text-[18px]" />
        Back to auctions
      </Link>

      {isPending ? (
        <Skeleton />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error?.message || 'Could not load this auction.'}
        </div>
      ) : !auction ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <p className="font-headline text-lg font-bold text-neutral-800">Auction not found</p>
          <Link to="/" className="mt-4 inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline">
            Browse auctions
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                <img
                  src={
                    Array.isArray(auction.images) && auction.images[activeImage]
                      ? auction.images[activeImage]
                      : imageOf(auction, 800)
                  }
                  alt={auction.title}
                  className="h-full w-full object-cover"
                />
              </div>
              {Array.isArray(auction.images) && auction.images.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {auction.images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={[
                        'h-16 w-16 overflow-hidden rounded-lg border-2',
                        i === activeImage ? 'border-neutral-900' : 'border-transparent',
                      ].join(' ')}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                {auction.category?.name ? String(auction.category.name).toUpperCase() : 'AUCTION'}
              </p>
              <h1 className="mt-1 font-headline text-3xl font-extrabold leading-tight text-neutral-900">
                {auction.title}
              </h1>

              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Ends in</span>
                <CountdownStrip endsAt={auction.endsAt} />
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current bid</p>
                <p className="font-headline text-3xl font-extrabold text-neutral-900">
                  {money(currentPrice(auction))}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{bidCountOf(auction)} bids</p>
              </div>

              <BidBox auction={auction} />
              <SellerCard seller={auction.seller} />

              {auction.description && (
                <div className="mt-6">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Description</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                    {auction.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <section>
            <h2 className="mb-4 font-headline text-xl font-extrabold text-neutral-900">Bid history</h2>
            <BidHistory bids={auction.bids} />
          </section>
        </>
      )}
    </div>
  );
}
