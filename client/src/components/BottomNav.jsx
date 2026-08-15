import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { to: '/', label: 'Board', icon: 'stacked_bar_chart', end: true },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/favorites', label: 'Saved', icon: 'bookmark', auth: true },
  { to: '/my-bids', label: 'Bids', icon: 'gavel', auth: true },
  { to: '/wallet', label: 'Wallet', icon: 'account_balance_wallet', auth: true },
];

const SIGNED_OUT_TABS = [
  { to: '/', label: 'Board', icon: 'stacked_bar_chart', end: true },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/login', label: 'Sign in', icon: 'person' },
];

/**
 * Thumb-reachable navigation for small screens.
 *
 * The previous build hid search, categories and every nav link behind `md:`
 * and `lg:` breakpoints, so a phone user could not search the marketplace or
 * reach a category at all. This bar is the fix: the five destinations a bidder
 * actually moves between, always within thumb reach, at the 44px touch floor.
 */
export default function BottomNav() {
  const { isAuthenticated } = useAuth();
  const tabs = isAuthenticated ? TABS : SIGNED_OUT_TABS;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-steel bg-dial/95 backdrop-blur-md md:hidden"
      // Clears the iOS home indicator without hardcoding a magic number.
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                [
                  'flex min-h-[52px] flex-col items-center justify-center gap-0.5 no-underline transition-colors duration-jump',
                  isActive ? 'text-lume' : 'text-lume-faint',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* The lit tick above an active tab is the same language the
                      board uses for a running lot. */}
                  <span
                    className={`h-px w-6 ${isActive ? 'bg-radium' : 'bg-transparent'}`}
                    aria-hidden
                  />
                  <Icon name={t.icon} className={`text-[20px] ${isActive ? 'icon-filled' : ''}`} />
                  <span className="legend text-[0.5625rem]">{t.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
