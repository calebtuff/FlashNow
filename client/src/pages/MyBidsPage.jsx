import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Register from '../components/Register.jsx';
import { RegisterStackSkeleton } from '../components/RegisterStack.jsx';
import PageHeader from '../components/PageHeader.jsx';
import FilterPills from '../components/FilterPills.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Alert from '../components/Alert.jsx';
import Lamp from '../components/Lamp.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { currentPrice, isTerminal, money } from '../utils/auction.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'winning', label: 'Leading', match: (s) => s === 'winning' },
  { key: 'live', label: 'Running', match: (_, a) => a.status === 'live' && !isTerminal(a) },
  { key: 'ended', label: 'Closed', match: (s) => s === 'won' || s === 'lost' },
];

const LAMPS = {
  winning: { tone: 'lead', text: 'Leading' },
  won: { tone: 'live', text: 'Won' },
  outbid: { tone: 'caution', text: 'Outbid' },
  scheduled: { tone: 'off', text: 'Scheduled' },
  lost: { tone: 'off', text: 'Lost' },
  unknown: { tone: 'off', text: 'Unknown' },
};

function dedupeBidsByAuction(bids) {
  const byAuction = new Map();
  for (const bid of bids) {
    if (!bid?.auction) continue;
    const existing = byAuction.get(bid.auction.id);
    if (!existing || new Date(bid.placedAt) > new Date(existing.placedAt)) {
      byAuction.set(bid.auction.id, bid);
    }
  }
  return [...byAuction.values()];
}

function bidStatus(auction, userId) {
  if (!auction || !userId) return 'unknown';
  const ended = isTerminal(auction);
  const winning = auction.currentWinnerId === userId;

  if (ended) return winning ? 'won' : 'lost';
  if (auction.status === 'scheduled' || auction.status === 'draft') return 'scheduled';
  if (winning) return 'winning';
  return 'outbid';
}

export default function MyBidsPage() {
  const { userId, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-bids', userId],
    queryFn: () => api.get('/auctions/my/bids'),
    enabled: isAuthenticated,
  });

  const entries = useMemo(() => {
    const bids = dedupeBidsByAuction(data?.bids ?? []);
    return bids.map((bid) => ({ bid, auction: bid.auction, status: bidStatus(bid.auction, userId) }));
  }, [data?.bids, userId]);

  const counts = useMemo(() => {
    const c = { winning: 0, outbid: 0, ended: 0 };
    for (const { status } of entries) {
      if (status === 'winning') c.winning += 1;
      else if (status === 'outbid' || status === 'scheduled') c.outbid += 1;
      else if (status === 'won' || status === 'lost') c.ended += 1;
    }
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    const matcher = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
    return entries.filter(({ status, auction }) => matcher(status, auction));
  }, [entries, filter]);

  return (
    <div>
      <PageHeader
        title="My bids"
        reading={String(counts.winning).padStart(2, '0')}
        subtitle={
          entries.length > 0
            ? `leading now. ${counts.outbid} active, ${counts.ended} closed.`
            : 'Lots you have bid on.'
        }
      >
        <Link to="/" className="ctl-ghost">
          <Icon name="stacked_bar_chart" className="text-[16px]" />
          Board
        </Link>
      </PageHeader>

      <div className="mb-t4">
        <FilterPills options={STATUS_FILTERS} value={filter} onChange={setFilter} label="Filter bids" />
      </div>

      {isError && <Alert title="Could not load">{error?.message || 'Your bids are unavailable.'}</Alert>}

      {isPending ? (
        <RegisterStackSkeleton count={3} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="gavel"
          title="No bids yet"
          body="Find a running lot and open it. Funds are held only while you lead."
        >
          <Link to="/" className="ctl-primary">
            Browse the board
          </Link>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState icon="filter_alt_off" title="None in this state" body="Your bids are all elsewhere.">
          <button type="button" onClick={() => setFilter('all')} className="ctl-primary">
            Show all
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-px bg-steel">
          {filtered.map(({ bid, auction, status }, i) => {
            const lamp = LAMPS[status] ?? LAMPS.unknown;
            const yours = Number(bid.amount);
            const now = currentPrice(auction);
            const behind = now > yours;

            return (
              <div key={auction.id}>
                <Register auction={auction} row={i} />
                {/* Your own position on this lot, stated beneath its register
                    rather than folded into it, so the register stays identical
                    everywhere it appears. */}
                <div className="flex flex-wrap items-center gap-x-t4 gap-y-t2 border-t border-steel bg-sunken px-t4 py-t2">
                  <Lamp tone={lamp.tone}>{lamp.text}</Lamp>
                  <span className="legend text-tick text-lume-faint">
                    Your bid <span className="numeral text-lume-dim">{money(yours)}</span>
                  </span>
                  {behind && (
                    <span className="legend text-tick text-caution">
                      Behind by <span className="numeral">{money(now - yours)}</span>
                    </span>
                  )}
                  {status === 'won' && auction.status === 'completed' && (
                    <Link
                      to={`/auctions/${auction.id}`}
                      className="legend ml-auto text-tick text-radium no-underline hover:underline"
                    >
                      Rate seller
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
