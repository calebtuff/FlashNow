import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import CategoryBar from './CategoryBar.jsx';

function centerNavClass({ isActive }) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors',
    isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-white/60',
  ].join(' ');
}

const ACCOUNT_LINKS = [
  { to: '/profile/demo-user', label: 'Profile', icon: 'person' },
  { to: '/my-auctions', label: 'My auctions', icon: 'gavel' },
  { to: '/my-bids', label: 'My bids', icon: 'local_offer' },
  { to: '/wallet', label: 'Wallet', icon: 'account_balance_wallet' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    const q = term.trim();
    if (q === '') return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent">
            <Icon name="bolt" className="text-[22px] text-[#eab308]" />
          </span>
          <span className="font-headline text-lg font-extrabold tracking-tight text-neutral-900">FlashNow.</span>
        </Link>

        <form onSubmit={handleSearch} className="relative hidden flex-1 lg:block lg:max-w-xl">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-neutral-400"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search auctions…"
            aria-label="Search auctions"
            className="w-full rounded-full border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900"
          />
        </form>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={centerNavClass}>
              Home
            </NavLink>
            <NavLink to="/sell" className={centerNavClass}>
              Sell
            </NavLink>
          </div>

          <Link
            to="/wallet"
            className="hidden items-center gap-2 rounded-full border border-neutral-900 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm no-underline sm:inline-flex"
          >
            <Icon name="account_balance_wallet" className="text-[20px] text-neutral-600" />
            $2,842
          </Link>

          <div className="group relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-900 bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
              aria-label="Account menu"
              aria-haspopup="true"
            >
              <Icon name="person" className="text-[22px]" />
            </button>

            <div className="invisible absolute right-0 top-full pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="w-52 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-400">My account</p>
                {ACCOUNT_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 no-underline transition-colors hover:bg-neutral-100"
                  >
                    <Icon name={l.icon} className="text-[20px] text-neutral-500" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <CategoryBar />
    </header>
  );
}
