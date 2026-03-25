import { Link, NavLink } from 'react-router-dom';

function linkClass({ isActive }) {
  return [
    'text-sm font-medium no-underline transition-colors',
    isActive ? 'text-blue-600 font-semibold' : 'text-slate-800 hover:text-slate-600',
  ].join(' ');
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-slate-900 no-underline">
          Flash
        </Link>
        <div className="flex gap-6">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/wallet" className={linkClass}>
            Wallet
          </NavLink>
          <NavLink to="/profile/demo-user" className={linkClass}>
            Profile
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
