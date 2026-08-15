import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Icon from './Icon.jsx';
import Wordmark from './Wordmark.jsx';
import NotificationBell from './NotificationBell.jsx';
import UserAvatar from './UserAvatar.jsx';
import useDismissable from '../hooks/useDismissable.js';
import { useCategoryList } from '../hooks/useCategories.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { auctionTimeMeta, money } from '../utils/auction.js';

/** Reads the board query already in cache; it never fires a request of its own. */
function useLiveCount() {
  const { data } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => api.get('/auctions'),
    staleTime: 15_000,
  });

  // The board returns a capped list, so counting rows undercounts once there
  // are more running lots than it lists. Below the cap the rows are preferred:
  // they are patched by the live socket, so the count falls the moment a lot
  // closes rather than waiting for the next fetch.
  if (data?.counts?.liveTruncated) return data.counts.live;

  // Counted off the clock, the same way the board files a lot into "Running
  // now", so the two can never print different numbers. Counting `status`
  // instead missed a lot in the gap between it opening and the server's
  // minutely cron promoting it.
  return (data?.auctions ?? []).filter((a) => auctionTimeMeta(a).kind === 'live').length;
}

function navClass({ isActive }) {
  return [
    'legend px-3 py-2 text-legend no-underline transition-colors duration-jump ease-jump',
    isActive ? 'text-lume' : 'text-lume-faint hover:text-lume-dim',
  ].join(' ');
}

/**
 * The bezel: the fixed ring around the instrument. It carries identity, the
 * count of what is running, search, and account state, and it never scrolls
 * away, because the live count is a reason to look up at any moment.
 */
export default function Bezel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { byId } = useCategoryList();
  const { isAuthenticated, appUser, signOut, loading } = useAuth();
  const [term, setTerm] = useState('');
  const menu = useDismissable();
  const liveCount = useLiveCount();

  const profilePath = appUser?.id ? `/profile/${appUser.id}` : '/profile/me';

  const walletQuery = useQuery({
    queryKey: ['wallet', appUser?.id],
    queryFn: () => api.get('/wallet'),
    enabled: isAuthenticated,
  });
  const available = walletQuery.data?.wallet?.availableBalance;

  const accountLinks = [
    { to: profilePath, label: 'Profile', icon: 'person' },
    { to: '/my-auctions', label: 'My lots', icon: 'gavel' },
    { to: '/wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  ];

  // Searching from the bezel used to drop the active category while the
  // in-page form on mobile preserved it, so the same action gave different
  // results depending on viewport width. Context is kept either way now.
  const activeCategoryId = new URLSearchParams(location.search).get('categoryId') ?? '';
  const activeCategory = activeCategoryId ? byId.get(activeCategoryId) : null;

  function handleSearch(e) {
    e.preventDefault();
    const q = term.trim();
    if (q === '') return;

    const next = new URLSearchParams();
    next.set('q', q);
    if (activeCategoryId) next.set('categoryId', activeCategoryId);
    navigate(`/search?${next.toString()}`);
  }

  async function handleSignOut() {
    menu.close();
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-steel bg-dial/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-t3 px-t4 sm:gap-t4">
        <Wordmark />

        {/* The live count is the bezel's own readout: how many lots are running
            right now. It is the single most useful number in the product to
            have permanently on screen. */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-1.5 border-l border-steel pl-t3 no-underline sm:pl-t4"
        >
          <span
            className={[
              'h-1.5 w-1.5 rounded-full',
              liveCount > 0 ? 'bg-radium sweeping' : 'bg-steel-bright',
            ].join(' ')}
            aria-hidden
          />
          <span className="legend text-tick text-lume-faint">
            <span className="numeral text-lume">{String(liveCount).padStart(2, '0')}</span> live
          </span>
        </Link>

        <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-md flex-1 md:block">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-lume-faint"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={activeCategory ? `Search in ${activeCategory.name}` : 'Search lots'}
            aria-label={activeCategory ? `Search in ${activeCategory.name}` : 'Search lots'}
            className="field !min-h-0 h-9 pl-9 pr-9 text-body"
          />
          {/* Scoped search needs a visible way out of the scope. */}
          {activeCategory && (
            <button
              type="button"
              onClick={() => navigate(term.trim() ? `/search?q=${encodeURIComponent(term.trim())}` : '/search')}
              title="Search everything instead"
              aria-label="Search everything instead"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-lume-faint transition-colors duration-jump hover:text-lume"
            >
              <Icon name="public" className="text-[16px]" />
            </button>
          )}
        </form>

        <nav className="ml-auto hidden items-center md:ml-0 md:flex">
          <NavLink to="/" end className={navClass}>
            Board
          </NavLink>
          <NavLink to="/sell" className={navClass}>
            Sell
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-t2">
          {!loading && isAuthenticated && (
            <>
              {/* Available balance is a live constraint on bidding, not an
                  account-settings detail, so it lives in the bezel. */}
              <Link
                to="/wallet"
                className="hidden items-center gap-2 border border-steel px-3 py-1.5 no-underline transition-colors duration-jump hover:border-edge sm:flex"
              >
                <span className="legend text-tick text-lume-faint">Avail</span>
                <span className="numeral text-body font-semibold text-lume">
                  {typeof available === 'number' ? money(available) : '--'}
                </span>
              </Link>

              <NotificationBell />

              <div ref={menu.ref} className="relative">
                <button
                  type="button"
                  onClick={menu.toggle}
                  className="flex items-center rounded-sm transition-opacity hover:opacity-80"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={menu.open}
                >
                  <UserAvatar user={appUser} size="sm" />
                </button>

                <div
                  className={[
                    'absolute right-0 top-full z-40 origin-top-right pt-2 transition-[opacity,transform] duration-jump ease-jump',
                    menu.open ? 'visible scale-100 opacity-100' : 'invisible scale-95 opacity-0',
                  ].join(' ')}
                >
                  <div className="register w-52 p-1" role="menu">
                    <p className="legend truncate px-3 py-2 text-tick text-lume-faint">
                      {appUser?.displayName || (appUser?.username ? `@${appUser.username}` : 'Account')}
                    </p>
                    {accountLinks.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        role="menuitem"
                        tabIndex={menu.open ? 0 : -1}
                        onClick={menu.close}
                        className="flex items-center gap-3 px-3 py-2 text-body text-lume-dim no-underline transition-colors duration-jump hover:bg-high hover:text-lume"
                      >
                        <Icon name={l.icon} className="text-[18px] text-lume-faint" />
                        {l.label}
                      </Link>
                    ))}
                    <div className="my-1 h-px bg-steel" />
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={menu.open ? 0 : -1}
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-body text-lume-dim transition-colors duration-jump hover:bg-high hover:text-hand"
                    >
                      <Icon name="logout" className="text-[18px]" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !isAuthenticated && (
            <>
              <Link to="/login" className="ctl-ghost hidden !min-h-0 h-9 sm:inline-flex">
                Sign in
              </Link>
              <Link to="/register" className="ctl-primary !min-h-0 h-9">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
