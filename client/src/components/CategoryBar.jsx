import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const CATEGORIES = [
  {
    label: 'Designers',
    q: 'designer',
    heading: 'Shop Popular Designers',
    seeAll: 'See all designers',
    sub: [
      'Acne Studios', 'Amiri', 'Arc\u2019teryx', 'Balenciaga', 'Bape', 'Bottega Veneta',
      'Carhartt', 'Celine', 'Chanel', 'Chrome Hearts', 'Comme des Gar\u00e7ons', 'Dior',
      'Gucci', 'Kapital', 'Louis Vuitton', 'Maison Margiela', 'Moncler', 'Nike',
      'Polo Ralph Lauren', 'Prada', 'Raf Simons', 'Rick Owens', 'Saint Laurent', 'Stone Island',
      'Stussy', 'Supreme', 'Undercover', 'Vetements', 'Vivienne Westwood', 'Yohji Yamamoto',
    ],
  },
  {
    label: 'Menswear',
    q: 'menswear',
    heading: 'Shop Menswear',
    seeAll: 'See all menswear',
    sub: [
      'T-Shirts', 'Shirts', 'Sweaters', 'Hoodies', 'Jackets', 'Coats',
      'Jeans', 'Trousers', 'Shorts', 'Sweatpants', 'Suits', 'Blazers',
      'Boots', 'Sneakers', 'Loafers', 'Hats', 'Belts', 'Sunglasses',
    ],
  },
  {
    label: 'Womenswear',
    q: 'womenswear',
    heading: 'Shop Womenswear',
    seeAll: 'See all womenswear',
    sub: [
      'Tops', 'Blouses', 'Dresses', 'Skirts', 'Knitwear', 'Jackets',
      'Coats', 'Jeans', 'Trousers', 'Bags', 'Heels', 'Boots',
      'Sneakers', 'Jewelry', 'Sunglasses', 'Accessories',
    ],
  },
  { label: 'Sneakers', q: 'sneaker' },
  { label: 'Staff Picks', to: '/' },
  { label: 'Collections', to: '/' },
];

function toSearch(q) {
  return `/search?q=${encodeURIComponent(q)}`;
}

export default function CategoryBar() {
  const [open, setOpen] = useState(null);
  const close = () => setOpen(null);
  const openCat = CATEGORIES.find((c) => c.label === open && c.sub);

  return (
    <div className="relative hidden border-t border-neutral-200/80 bg-white/90 backdrop-blur-md md:block">
      <div className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {CATEGORIES.map((cat) => {
          if (!cat.sub) {
            return (
              <Link
                key={cat.label}
                to={cat.to ?? toSearch(cat.q)}
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
                {openCat.sub.map((s) => (
                  <Link
                    key={s}
                    to={toSearch(s.toLowerCase())}
                    onClick={close}
                    className="text-sm text-neutral-700 no-underline transition-colors hover:text-neutral-900"
                  >
                    {s}
                  </Link>
                ))}
              </div>
              <Link
                to={toSearch(openCat.q)}
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
