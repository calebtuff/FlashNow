import { Link, useLocation } from 'react-router-dom';
import { useCategoryList } from '../hooks/useCategories.js';
import { categorySearchPath } from '../utils/searchParams.js';

/**
 * Category wayfinding, driven by the categories the marketplace actually has.
 *
 * Two rows, not a dropdown. The top row is always the parents; a second row
 * appears beneath once you are inside one, listing its subcategories. That is
 * the drill-down a hover mega-menu used to imply and never delivered on touch,
 * and it keeps the parent lit so you can see where you are.
 */

const CHIP =
  'legend inline-flex whitespace-nowrap border px-3 py-1.5 text-tick no-underline transition-colors duration-jump ease-jump';

const RAIL =
  '-mx-t2 flex snap-x snap-mandatory gap-t2 overflow-x-auto px-t2 py-t2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export default function CategoryRail() {
  const { tree, byId, isPending } = useCategoryList();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeId = params.get('categoryId');
  const liveOnly = params.get('status') === 'live' && !activeId;

  if (!isPending && tree.length === 0) return null;

  // The open branch is the active category's parent when a leaf is selected,
  // or the active category itself when a parent is.
  const activeEntry = activeId ? byId.get(activeId) : null;
  const openParent = activeEntry?.parent ?? (activeEntry && !activeEntry.parent ? activeEntry : null);
  const children = openParent ? tree.find((p) => p.id === openParent.id)?.children ?? [] : [];

  return (
    <div className="border-b border-steel bg-dial">
      <div className="mx-auto max-w-[1600px] px-t4">
        <ul className={RAIL} aria-label="Categories">
          {isPending ? (
            [0, 1, 2, 3, 4].map((k) => (
              <li key={k} className="snap-start">
                <span className={`${CHIP} animate-pulse border-steel text-transparent`}>Loading</span>
              </li>
            ))
          ) : (
            <>
              <li className="snap-start">
                <Link
                  to="/search?status=live"
                  className={[
                    CHIP,
                    liveOnly
                      ? 'border-radium bg-radium text-dial'
                      : 'border-steel text-lume-faint hover:border-edge hover:text-lume',
                  ].join(' ')}
                >
                  Running now
                </Link>
              </li>

              {tree.map((parent) => {
                const isOpen = openParent?.id === parent.id;
                return (
                  <li key={parent.id} className="snap-start">
                    <Link
                      to={categorySearchPath(parent.id)}
                      aria-current={activeId === parent.id ? 'page' : undefined}
                      className={[
                        CHIP,
                        isOpen
                          ? 'border-lume bg-lume text-dial'
                          : 'border-steel text-lume-faint hover:border-edge hover:text-lume',
                      ].join(' ')}
                    >
                      {parent.name}
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>

        {/* Subcategory row. Quieter than the parents so the two do not compete,
            and only present when there is a branch open. */}
        {children.length > 0 && (
          <ul className={`${RAIL} border-t border-steel`} aria-label={`${openParent.name} subcategories`}>
            <li className="snap-start">
              <Link
                to={categorySearchPath(openParent.id)}
                aria-current={activeId === openParent.id ? 'page' : undefined}
                className={[
                  'legend whitespace-nowrap px-2 py-1 text-tick no-underline transition-colors duration-jump',
                  activeId === openParent.id ? 'text-lume' : 'text-lume-faint hover:text-lume',
                ].join(' ')}
              >
                All {openParent.name}
              </Link>
            </li>
            {children.map((child) => (
              <li key={child.id} className="snap-start">
                <Link
                  to={categorySearchPath(child.id)}
                  aria-current={activeId === child.id ? 'page' : undefined}
                  className={[
                    'legend whitespace-nowrap px-2 py-1 text-tick no-underline transition-colors duration-jump',
                    activeId === child.id
                      ? 'text-radium underline underline-offset-4'
                      : 'text-lume-faint hover:text-lume',
                  ].join(' ')}
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
