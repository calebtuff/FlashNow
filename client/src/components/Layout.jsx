import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
