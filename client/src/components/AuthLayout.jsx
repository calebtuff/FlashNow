import { Outlet } from 'react-router-dom';
import BackLink from './BackLink.jsx';

/**
 * The shell for signing in and registering.
 *
 * These routes previously ran inside the full marketplace shell, so a 384px
 * form sat marooned in the middle of a tall dark field with a category rail
 * above it and a five-column footer below, none of which a signed-out visitor
 * can act on. Here the form is centred in the viewport and the chrome is
 * reduced to one way back to the board.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-dial">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-t4 focus:top-t4 focus:z-50 focus:bg-lume focus:px-4 focus:py-2 focus:text-body focus:font-bold focus:text-dial"
      >
        Skip to content
      </a>

      <header className="border-b border-steel px-t4 py-t3">
        <div className="mx-auto max-w-[1600px]">
          <BackLink to="/">Back to the board</BackLink>
        </div>
      </header>

      {/* Centred on tall viewports, top-aligned once the form is taller than
          the screen, so a long registration form never clips its own head. */}
      <main id="main" className="flex flex-1 items-center justify-center px-t4 py-t8">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
