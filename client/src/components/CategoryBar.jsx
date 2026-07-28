import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useCategoryList } from '../hooks/useCategories.js';
import {
  NAV_ITEMS,
  keywordSearchPath,
  resolveNavHref,
  resolveSeeAllHref,
} from '../utils/categoryNav.js';

export default function CategoryBar() {
  const [open, setOpen] = useState(null);
  const { categories } = useCategoryList();
  const close = () => setOpen(null);
  const openCat = NAV_ITEMS.find((c) => c.label === open && c.sub);

  return (
    <div className="relative hidden border-t border-neutral-200/80 bg-white/90 backdrop-blur-md md:block">
      <div className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {NAV_ITEMS.map((cat) => {
          if (!cat.sub) {
            return (
              <Link
                key={cat.label}
                to={resolveNavHref(cat, categories)}
                onClick={close}
                className="px-2 py-2.5 text-sm font-semibold text-neutral-700 no-underline transition-colors hover:text-neutral-900"
              >
                {cat.label}
              </Link>
            );
          }

          const isOpen = open === cat.label;
          return (
            <button
              key={cat.label}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : cat.label)}
              className={`flex items-center gap-0.5 px-2 py-2.5 text-sm font-semibold transition-colors ${
                isOpen ? 'text-neutral-900' : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              {cat.label}
              <Icon
                name="expand_more"
                className={`text-[18px] text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {openCat && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute inset-x-0 top-full z-20 border-b border-neutral-200 bg-white shadow-lg">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <h3 className="font-display text-base font-bold tracking-tight text-neutral-900">{openCat.heading}</h3>
              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                {openCat.sub.map((label) => (
                  <Link
                    key={label}
                    to={keywordSearchPath(label)}
                    onClick={close}
                    className="text-sm text-neutral-700 no-underline transition-colors hover:text-neutral-900"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <Link
                to={resolveSeeAllHref(openCat, categories)}
                onClick={close}
                className="mt-6 inline-block text-xs font-bold uppercase tracking-wide text-neutral-900 no-underline hover:text-neutral-600"
              >
                {openCat.seeAll}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
