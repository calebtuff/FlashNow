import { Link } from 'react-router-dom';
import Wordmark from './Wordmark.jsx';

const MARKETPLACE_LINKS = [
  { to: '/', label: 'Board' },
  { to: '/search', label: 'Search' },
  { to: '/sell', label: 'Sell a lot' },
  { to: '/my-auctions', label: 'My lots' },
  { to: '/wallet', label: 'Wallet' },
];

// These pages do not exist yet, so they render as plain text rather than as
// links that go nowhere.
const PLACEHOLDER_LINKS = ['How it works', 'Help', 'Terms', 'Privacy'];

export default function Footer() {
  return (
    <footer className="mt-t16 border-t border-steel bg-dial">
      <div className="mx-auto max-w-[1600px] px-t4 py-t8">
        <div className="flex flex-col gap-t6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Wordmark />
            <p className="mt-t3 max-w-[42ch] text-body text-lume-faint">
              Auctions that open, run and close in minutes. Funds are held while you lead and released the
              moment you are outbid.
            </p>
          </div>

          <nav aria-label="Marketplace" className="flex flex-wrap gap-x-t6 gap-y-t2">
            {MARKETPLACE_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="legend text-tick text-lume-faint no-underline transition-colors duration-jump hover:text-lume"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-t6 flex flex-col gap-t3 border-t border-steel pt-t4 sm:flex-row sm:items-center sm:justify-between">
          <p className="legend text-tick text-lume-faint">
            <span className="numeral">{new Date().getFullYear()}</span> FlashNow
          </p>
          <div className="flex flex-wrap gap-x-t4 gap-y-1">
            {PLACEHOLDER_LINKS.map((l) => (
              <span key={l} className="legend cursor-default text-tick text-steel-bright" title="Coming soon">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
