import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';

function centerNavClass({ isActive }) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors',
    isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-white/60',
  ].join(' ');
}

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
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent">
            <Icon name="bolt" className="text-[22px] text-[#eab308]" />
          </span>
          <span className="font-headline text-lg font-extrabold tracking-tight text-neutral-900">FlashNow.</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <form onSubmit={handleSearch} className="relative mr-1 hidden lg:block">
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
              className="w-48 rounded-full border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900"
            />
          </form>
          <NavLink to="/" end className={centerNavClass}>
            Browse
          </NavLink>
          <NavLink to="/sell" className={centerNavClass}>
            Create
          </NavLink>
          <NavLink to="/my-auctions" className={centerNavClass}>
            My Auctions
          </NavLink>
          <NavLink to="/my-bids" className={centerNavClass}>
            My Bids
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/wallet"
            className="hidden items-center gap-2 rounded-full border border-neutral-900 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm no-underline sm:inline-flex"
          >
            <Icon name="account_balance_wallet" className="text-[20px] text-neutral-600" />
            $2,842
          </Link>
          <Link
            to="/profile/demo-user"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-900 bg-neutral-100 text-sm font-bold text-neutral-600 no-underline"
            aria-label="Profile"
          >
            <Icon name="person" className="text-[22px]" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
