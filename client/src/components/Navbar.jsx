import { Link, NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';

function centerNavClass({ isActive }) {
  return [
    'rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors',
    isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-white/60',
  ].join(' ');
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="flex overflow-hidden rounded-sm shadow-sm">
            <span className="h-6 w-2 bg-neutral-900" />
            <span className="h-6 w-2 bg-[#eab308]" />
          </span>
          <span className="font-headline text-lg font-extrabold tracking-tight text-neutral-900">FlashNow.</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={centerNavClass}>
            Browse
          </NavLink>
          <span
            className="cursor-default rounded-full px-4 py-2 text-sm font-semibold text-neutral-400"
            title="Coming soon"
          >
            Create
          </span>
          <span
            className="cursor-default rounded-full px-4 py-2 text-sm font-semibold text-neutral-400"
            title="Coming soon"
          >
            My Auctions
          </span>
          <span
            className="cursor-default rounded-full px-4 py-2 text-sm font-semibold text-neutral-400"
            title="Coming soon"
          >
            My Bids
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/wallet"
            className="hidden items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm no-underline sm:inline-flex"
          >
            <Icon name="account_balance_wallet" className="text-[20px] text-neutral-600" />
            $2,842
          </Link>
          <Link
            to="/profile/demo-user"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-sm font-bold text-neutral-600 no-underline"
            aria-label="Profile"
          >
            <Icon name="person" className="text-[22px]" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
