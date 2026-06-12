import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const MARKETPLACE_LINKS = [
  { to: '/', label: 'Browse' },
  { to: '/sell', label: 'Sell an item' },
  { to: '/my-auctions', label: 'My auctions' },
  { to: '/my-bids', label: 'My bids' },
  { to: '/wallet', label: 'Wallet' },
];

// Placeholder links — pages don't exist yet, so these are non-navigating for now.
const COMPANY_LINKS = ['How it works', 'Help center', 'Contact'];
const LEGAL_LINKS = ['Terms of Service', 'Privacy Policy', 'Cookie Policy'];

const TRUST = [
  { icon: 'lock', label: 'Secure payments' },
  { icon: 'verified', label: 'Verified sellers' },
  { icon: 'shield', label: 'Buyer protection' },
];

function PlaceholderLink({ children }) {
  return (
    <span className="cursor-default text-sm text-neutral-500" title="Coming soon">
      {children}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent">
                <Icon name="bolt" className="text-[22px] text-[#eab308]" />
              </span>
              <span className="font-headline text-lg font-extrabold tracking-tight text-neutral-900">FlashNow.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">
              Live auctions for authentic goods. Verified sellers, real-time bidding, and fast payouts.
            </p>
          </div>

          <nav aria-label="Marketplace">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Marketplace</h2>
            <ul className="mt-4 space-y-3">
              {MARKETPLACE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-neutral-700 no-underline transition-colors hover:text-neutral-900">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Company</h2>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l}>
                  <PlaceholderLink>{l}</PlaceholderLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Legal</h2>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((l) => (
                <li key={l}>
                  <PlaceholderLink>{l}</PlaceholderLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-neutral-200 pt-6">
          {TRUST.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
              <Icon name={t.icon} className="text-[18px] text-neutral-500" />
              {t.label}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">© {new Date().getFullYear()} FlashNow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <PlaceholderLink>Instagram</PlaceholderLink>
            <PlaceholderLink>X</PlaceholderLink>
            <PlaceholderLink>TikTok</PlaceholderLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
