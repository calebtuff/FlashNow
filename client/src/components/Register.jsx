import { Link } from 'react-router-dom';
import Countdown from './Countdown.jsx';
import TimeArc from './TimeArc.jsx';
import Lamp from './Lamp.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import NoImagePlate from './NoImagePlate.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useCountdown from '../hooks/useCountdown.js';
import { auctionTimeMeta, bidCountOf, currentPrice, imageOf, money } from '../utils/auction.js';

/**
 * A lot, as a register on the board.
 *
 * This replaces the square photo tile. A tile devotes most of its area to an
 * image and prints the clock as a caption, which is backwards for a product
 * where the lot exists for five to thirty minutes: the two figures a bidder
 * reads under pressure are time remaining and current bid, so those are the
 * two large numerals and the photograph is identification at thumbnail size.
 *
 * Rows also let roughly three times as many lots fit a screen as tiles did,
 * which matters when the board is the thing you scan.
 */
export default function Register({ auction, row = 0 }) {
  const { userId } = useAuth();
  const img = imageOf(auction);
  const bids = bidCountOf(auction);
  const time = auctionTimeMeta(auction);
  const { urgency, ended } = useCountdown(time.countdownIso);

  const leading = Boolean(userId && auction.currentWinnerId === userId);
  const participated = bids > 0;
  const isLive = time.kind === 'live' && !ended;
  const isCritical = isLive && urgency === 'critical';

  // One lamp, chosen by what matters most to this viewer right now: their own
  // position first, then the lot's urgency, then its lifecycle.
  let lamp = null;
  if (time.kind === 'ended' || ended) {
    lamp = { tone: 'off', text: 'Closed' };
  } else if (time.kind === 'scheduled') {
    lamp = { tone: 'off', text: 'Scheduled' };
  } else if (leading) {
    lamp = { tone: 'lead', text: 'You lead' };
  } else if (isCritical) {
    lamp = { tone: 'critical', text: 'Final call', pulse: true };
  } else if (userId && participated && auction.currentWinnerId && !leading) {
    lamp = { tone: 'caution', text: 'Outbid' };
  } else {
    lamp = { tone: 'live', text: 'Live' };
  }

  return (
    <article
      className="register flyback group"
      style={{ '--row': row }}
      data-urgency={isLive ? urgency : 'idle'}
    >
      <TimeArc auction={auction} />

      {/* Tightened deliberately: the board is scanned, so a shorter row means
          more lots per screen. The thumbnail is identification, not display. */}
      <div className="flex items-start gap-t3 p-t3">
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden border border-steel bg-sunken sm:h-20 sm:w-20">
            {img ? (
              <img
                src={img}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <NoImagePlate compact />
            )}
          </div>
          <FavoriteButton auctionId={auction.id} variant="register" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-t2">
          {/* The two registers: time left, and money. Both tabular, both large,
              sharing one baseline so the eye reads across them in one movement. */}
          <div className="flex items-start gap-t4">
            <div className="min-w-0">
              <p className="legend text-tick text-lume-faint">{time.heading}</p>
              <div className="mt-1">
                {time.kind === 'ended' || ended ? (
                  <span className="numeral text-title text-lume-faint">{time.dateTime}</span>
                ) : (
                  <Countdown
                    endsAt={time.countdownIso}
                    size="lg"
                    urgent={time.kind === 'live'}
                  />
                )}
              </div>
            </div>

            <div className="ml-auto min-w-0 text-right">
              <p className="legend text-tick text-lume-faint">Current</p>
              <p className="numeral mt-1 text-register font-bold text-lume">
                {money(currentPrice(auction))}
              </p>
            </div>
          </div>

          {/* The title gets its own line so it is never squeezed to three
              characters by the lamp beside it, which is what happened at
              390px when all three shared a row. */}
          <div>
            <h3 className="line-clamp-2 text-body font-semibold leading-snug text-lume">
              <Link
                to={`/auctions/${auction.id}`}
                className="no-underline outline-none after:absolute after:inset-0"
              >
                {auction.title}
              </Link>
            </h3>

            <div className="mt-t2 flex items-center gap-t3">
              <span className="legend shrink-0 text-tick text-lume-faint">
                <span className="numeral">{bids}</span> {bids === 1 ? 'bid' : 'bids'}
              </span>
              {lamp && (
                <Lamp tone={lamp.tone} pulse={lamp.pulse} className="ml-auto shrink-0">
                  {lamp.text}
                </Lamp>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
