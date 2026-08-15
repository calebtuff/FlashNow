import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import Countdown from '../components/Countdown.jsx';
import TimeArc from '../components/TimeArc.jsx';
import Lamp from '../components/Lamp.jsx';
import RateSellerForm from '../components/RateSellerForm.jsx';
import Stars from '../components/Stars.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import BackLink from '../components/BackLink.jsx';
import NoImagePlate from '../components/NoImagePlate.jsx';
import useAuctionSocket from '../hooks/useAuctionSocket.js';
import useCountdown from '../hooks/useCountdown.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  auctionTimeMeta,
  bidCountOf,
  currentPrice,
  formatAuctionDateTime,
  isTerminal,
  money,
} from '../utils/auction.js';

function Skeleton() {
  return (
    <div className="grid gap-t6 lg:grid-cols-[1.15fr_1fr]" aria-busy="true" aria-label="Loading lot">
      <div className="aspect-[4/3] animate-pulse bg-high" />
      <div className="register space-y-t4 p-t5">
        <div className="scale-rule w-full opacity-40" />
        <div className="h-16 w-40 animate-pulse bg-high" />
        <div className="h-12 w-full animate-pulse bg-high" />
      </div>
    </div>
  );
}

/** One reading on the dial: a small engraved legend over a large numeral. */
function Reading({ label, children, tone = 'text-lume', className = '' }) {
  return (
    <div className={className}>
      <p className="legend text-tick text-lume-faint">{label}</p>
      <p className={`numeral mt-1 text-register font-bold ${tone}`}>{children}</p>
    </div>
  );
}

function BuyNowRow({ auction }) {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ended = isTerminal(auction);
  const buyNowPrice = auction.buyNowPrice != null ? Number(auction.buyNowPrice) : null;
  const isSeller = userId && auction.sellerId === userId;
  const canBuyNow = buyNowPrice != null && auction.status === 'live' && !ended && !isSeller;

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => api.get('/wallet'),
    enabled: isAuthenticated && canBuyNow,
  });
  const available = walletQuery.data?.wallet?.availableBalance;
  const insufficientFunds = isAuthenticated && typeof available === 'number' && available < buyNowPrice;

  const buyNow = useMutation({
    mutationFn: () => api.post(`/auctions/${auction.id}/buy-now`),
    onSuccess: (data) => {
      setConfirmOpen(false);
      if (data?.auction) {
        queryClient.setQueryData(['auction', auction.id], { success: true, auction: data.auction });
      }
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
    },
  });

  if (!canBuyNow) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-t4 border-t border-steel px-t4 py-t3">
        <div>
          <p className="legend text-tick text-lume-faint">Take it now</p>
          <p className="numeral text-title font-bold text-lume">{money(buyNowPrice)}</p>
        </div>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={buyNow.isPending || insufficientFunds}
            className="ctl-ghost shrink-0"
            title={insufficientFunds ? 'Not enough available balance' : undefined}
          >
            {buyNow.isPending ? 'Working' : 'Buy now'}
          </button>
        ) : (
          <Link to={`/login?redirect=/auctions/${auction.id}`} className="ctl-ghost shrink-0">
            Sign in
          </Link>
        )}
      </div>

      {insufficientFunds && (
        <p className="px-t4 pb-t3 text-micro text-caution">
          Not enough available balance.{' '}
          <Link to="/wallet" className="underline">
            Top up
          </Link>
        </p>
      )}
      {buyNow.isError && (
        <p className="px-t4 pb-t3 text-micro text-hand">
          {buyNow.error?.message || 'Could not complete the purchase.'}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Buy this lot now"
        message={`Take "${auction.title}" for ${money(buyNowPrice)}? This closes the auction immediately and cannot be undone.`}
        confirmLabel={`Buy for ${money(buyNowPrice)}`}
        onConfirm={() => buyNow.mutate()}
        onClose={() => {
          if (!buyNow.isPending) setConfirmOpen(false);
        }}
        isPending={buyNow.isPending}
      />
    </>
  );
}

/**
 * The control panel. Sticky on desktop and fixed to the bottom on mobile, so
 * the bid control is never scrolled away from the clock it is racing. In the
 * previous build this sat seventh in a stack of containers and left the
 * viewport as soon as you read the description.
 */
function ControlPanel({ auction, extendedAt }) {
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuth();
  const minNext = currentPrice(auction) + 1;
  const [amount, setAmount] = useState('');
  const [showExtended, setShowExtended] = useState(false);

  const time = auctionTimeMeta(auction);
  const { urgency, ended } = useCountdown(time.countdownIso);
  const over = isTerminal(auction);
  const leading = Boolean(userId && auction.currentWinnerId === userId);

  const walletQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => api.get('/wallet'),
    enabled: isAuthenticated,
  });
  const available = walletQuery.data?.wallet?.availableBalance;

  const placeBid = useMutation({
    mutationFn: (value) => api.post(`/auctions/${auction.id}/bids`, { amount: value }),
    onSuccess: () => {
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
    },
  });

  // Announce an extension for a few seconds after it lands.
  useEffect(() => {
    if (!extendedAt) return undefined;
    setShowExtended(true);
    const id = window.setTimeout(() => setShowExtended(false), 6000);
    return () => window.clearTimeout(id);
  }, [extendedAt]);

  const value = Number.parseFloat(amount);
  const tooLow = !Number.isNaN(value) && value < minNext;
  const overBalance = !Number.isNaN(value) && typeof available === 'number' && value > available;
  const disabled =
    over || ended || !isAuthenticated || placeBid.isPending || amount === '' || Number.isNaN(value) || tooLow;

  return (
    <div className="register">
      <TimeArc auction={auction} />

      <div className="p-t4">
        <div className="flex items-start justify-between gap-t4">
          <div>
            <p className="legend text-tick text-lume-faint">{time.heading}</p>
            <div className="mt-1">
              {over || ended ? (
                <span className="numeral text-register text-lume-faint">{time.dateTime}</span>
              ) : (
                <Countdown endsAt={time.countdownIso} size="dial" />
              )}
            </div>
          </div>

          <div className="shrink-0">
            {over || ended ? (
              <Lamp tone="off">Closed</Lamp>
            ) : leading ? (
              <Lamp tone="lead">You lead</Lamp>
            ) : urgency === 'critical' ? (
              <Lamp tone="critical" pulse>
                Final call
              </Lamp>
            ) : (
              <Lamp tone="live">Live</Lamp>
            )}
          </div>
        </div>

        {/* The signature mechanism, made visible. Without this the clock simply
            jumps backwards and the bidder has no idea why. */}
        {showExtended && (
          <p className="jumped mt-t3 flex items-center gap-1.5 text-micro font-semibold text-radium">
            <Icon name="restart_alt" className="text-[14px]" />
            Extended 60 seconds: a bid landed in the final minute.
          </p>
        )}

        <div className="mt-t4 flex items-end justify-between gap-t4 border-t border-steel pt-t3">
          <Reading label="Current bid">{money(currentPrice(auction))}</Reading>
          <div className="text-right">
            <p className="legend text-tick text-lume-faint">Bids</p>
            <p className="numeral mt-1 text-title font-semibold text-lume-dim">{bidCountOf(auction)}</p>
          </div>
        </div>
      </div>

      {!over && !ended && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled) placeBid.mutate(value);
          }}
          className="border-t border-steel p-t4"
        >
          <label className="field-label" htmlFor="bid-amount">
            Your bid
          </label>
          <div className="flex gap-t2">
            <div className="relative flex-1">
              <span className="numeral pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-lume-faint">
                $
              </span>
              <input
                id="bid-amount"
                type="number"
                inputMode="decimal"
                min={minNext}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(minNext)}
                aria-invalid={tooLow || overBalance}
                aria-describedby="bid-help"
                className="field numeral pl-7 font-semibold"
              />
            </div>
            <button type="submit" disabled={disabled} className="ctl-bid shrink-0 px-t5">
              {placeBid.isPending ? 'Placing' : 'Place bid'}
            </button>
          </div>

          {/* Figures a bidder reads while typing, so these stay sentence-case
              at body-adjacent size rather than tracked 10px caps. */}
          <p id="bid-help" className="mt-t2 flex flex-wrap gap-x-t4 text-micro text-lume-faint">
            <span>
              Minimum <span className="numeral font-semibold text-lume-dim">{money(minNext)}</span>
            </span>
            {isAuthenticated && typeof available === 'number' && (
              <span>
                Available <span className="numeral font-semibold text-lume-dim">{money(available)}</span>
              </span>
            )}
          </p>

          {tooLow && (
            <p role="alert" className="mt-t2 text-micro text-hand">
              Must be at least {money(minNext)}.
            </p>
          )}
          {overBalance && !tooLow && (
            <p role="alert" className="mt-t2 text-micro text-caution">
              Above your available balance.{' '}
              <Link to="/wallet" className="underline">
                Top up
              </Link>
            </p>
          )}
          {placeBid.isError && (
            <p role="alert" className="mt-t2 text-micro text-hand">
              {placeBid.error?.message || 'Could not place the bid.'}
            </p>
          )}
          {!isAuthenticated && (
            <p className="mt-t3 text-micro text-lume-dim">
              <Link to={`/login?redirect=/auctions/${auction.id}`} className="font-semibold text-lume underline">
                Sign in
              </Link>{' '}
              to bid.
            </p>
          )}
          {/* This is a sentence, not a label. All-caps tracked 10px made the
              product's signature rule the hardest thing on the panel to read. */}
          <p className="mt-t3 text-micro text-lume-faint">
            A bid in the final minute extends the lot by 60 seconds.
          </p>
        </form>
      )}

      <BuyNowRow auction={auction} />
    </div>
  );
}

/**
 * Bid history as a printed tape: rank, amount, bidder, in strict descending
 * order. The old version was an unordered list of names and prices with no
 * sequence, which is the one thing a bid history exists to show.
 */
function BidTape({ bids, winnerId }) {
  if (!bids || bids.length === 0) {
    return <EmptyState icon="receipt_long" title="No bids yet" body="This lot has not been opened by anyone." />;
  }

  const ordered = [...bids].sort((a, b) => Number(b.amount) - Number(a.amount));

  return (
    <ul className="register divide-y divide-steel">
      {ordered.map((b, i) => {
        const leading = i === 0;
        return (
          <li
            key={b.id}
            className={`flex items-center gap-t3 px-t4 py-t3 ${leading ? 'bg-radium-track' : ''}`}
          >
            <span className="legend numeral w-8 shrink-0 text-tick text-lume-faint">
              {String(ordered.length - i).padStart(2, '0')}
            </span>
            <UserAvatar user={b.user} size="sm" />
            <span className="min-w-0 flex-1 truncate text-body text-lume-dim">
              {b.user?.username || 'Bidder'}
              {b.user?.id && b.user.id === winnerId && (
                <span className="legend ml-t2 text-tick text-radium">high</span>
              )}
            </span>
            {b.placedAt && (
              <span className="legend numeral hidden shrink-0 text-tick text-lume-faint sm:block">
                {formatAuctionDateTime(b.placedAt)}
              </span>
            )}
            <span
              className={`numeral shrink-0 text-title font-bold ${leading ? 'text-radium' : 'text-lume-dim'}`}
            >
              {money(b.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function AuctionDetailPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const { userId } = useAuth();
  const { outbidMessage, extendedAt } = useAuctionSocket(id);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => api.get(`/auctions/${id}`),
  });

  const auction = data?.auction ?? null;
  const isWinner = userId && auction?.currentWinnerId === userId;
  const isCompleted = auction?.status === 'completed';
  const images = Array.isArray(auction?.images) ? auction.images : [];

  return (
    <div className="space-y-t6">
      <BackLink to="/">Back to the board</BackLink>

      {isPending ? (
        <Skeleton />
      ) : isError ? (
        <Alert title="Could not load lot">{error?.message || 'This lot could not be reached.'}</Alert>
      ) : !auction ? (
        <EmptyState icon="search_off" title="Lot not found" body="It may have been withdrawn by the seller.">
          <Link to="/" className="ctl-primary">
            Back to the board
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-t6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            <div className="space-y-t4">
              {/* The 4:3 frame is reserved only when there is a photograph to
                  put in it; without one the plate collapses to its own height
                  instead of holding open an empty room. */}
              <div className="relative border border-steel bg-sunken">
                {images[activeImage] ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={images[activeImage]}
                      alt={auction.title}
                      fetchPriority="high"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <NoImagePlate />
                )}
                <FavoriteButton auctionId={auction.id} variant="dial" />
              </div>

              {images.length > 1 && (
                <div className="flex flex-wrap gap-t2">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1} of ${images.length}`}
                      aria-pressed={i === activeImage}
                      className={[
                        'h-14 w-14 overflow-hidden border transition-colors duration-jump',
                        i === activeImage ? 'border-lume' : 'border-steel hover:border-edge',
                      ].join(' ')}
                    >
                      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div>
                <p className="legend text-tick text-lume-faint">{auction.category?.name || 'Uncategorised'}</p>
                <h1 className="mt-t2 text-title font-bold leading-tight text-lume sm:text-register">
                  {auction.title}
                </h1>
              </div>

              {auction.description && (
                <div className="border-t border-steel pt-t4">
                  <h2 className="legend text-tick text-lume-faint">Description</h2>
                  <p className="mt-t2 max-w-[68ch] whitespace-pre-line text-body leading-relaxed text-lume-dim">
                    {auction.description}
                  </p>
                </div>
              )}

              {auction.seller && (
                <Link
                  to={`/profile/${auction.seller.id}`}
                  className="flex items-center gap-t3 border-t border-steel pt-t4 no-underline"
                >
                  <UserAvatar user={auction.seller} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="legend block text-tick text-lume-faint">Seller</span>
                    <span className="block truncate text-body font-semibold text-lume">
                      {auction.seller.username || 'Unknown'}
                    </span>
                  </span>
                  {(auction.seller.rating?.count ?? 0) > 0 && (
                    <span className="flex shrink-0 items-center gap-t2">
                      <Stars score={auction.seller.rating.average} size="sm" />
                      <span className="numeral text-micro text-lume-faint">
                        {auction.seller.rating.average.toFixed(1)}
                      </span>
                    </span>
                  )}
                  <Icon name="chevron_right" className="shrink-0 text-[20px] text-lume-faint" />
                </Link>
              )}
            </div>

            {/* Sticky below the bezel on desktop; on mobile it sits in flow at
                the top of the reading order, above the description. */}
            <div className="lg:sticky lg:top-[4.5rem]">
              <ControlPanel auction={auction} extendedAt={extendedAt} />

              {outbidMessage && (
                <Alert tone="caution" title="Outbid" className="mt-t3">
                  Someone has taken the lead. Raise your bid before the clock runs out.
                </Alert>
              )}

              {isCompleted && isWinner && (
                <div className="mt-t3 space-y-t3">
                  <Alert tone="live" title="Won">
                    {auction.buyNowPrice != null && Number(auction.currentBid) === Number(auction.buyNowPrice)
                      ? 'You bought this lot.'
                      : 'You won this lot.'}
                  </Alert>
                  <RateSellerForm
                    auctionId={auction.id}
                    sellerId={auction.seller?.id}
                    sellerName={auction.seller?.username}
                    canRate={auction.viewerRating?.canRate}
                    existingRating={auction.viewerRating?.existing}
                  />
                </div>
              )}
            </div>
          </div>

          <section>
            <h2 className="legend mb-t3 border-b border-steel pb-t2 text-legend text-lume-dim">Bid tape</h2>
            <BidTape bids={auction.bids} winnerId={auction.currentWinnerId} />
          </section>
        </>
      )}
    </div>
  );
}
