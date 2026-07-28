import { categorySearchPath, keywordSearchPath } from './searchParams.js';

export const NAV_ITEMS = [
  {
    label: 'Designers',
    categorySlug: 'fashion',
    keywordFallback: 'designer',
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
    categorySlug: 'fashion',
    keywordFallback: 'menswear',
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
    categorySlug: 'fashion',
    keywordFallback: 'womenswear',
    heading: 'Shop Womenswear',
    seeAll: 'See all womenswear',
    sub: [
      'Tops', 'Blouses', 'Dresses', 'Skirts', 'Knitwear', 'Jackets',
      'Coats', 'Jeans', 'Trousers', 'Bags', 'Heels', 'Boots',
      'Sneakers', 'Jewelry', 'Sunglasses', 'Accessories',
    ],
  },
  {
    label: 'Sneakers',
    categorySlug: 'fashion',
    keywordFallback: 'sneaker',
  },
  { label: 'Staff Picks', to: '/' },
  { label: 'Collections', to: '/search?status=live' },
];

export function categoryIdBySlug(categories, slug) {
  if (!slug || !Array.isArray(categories)) return null;
  return categories.find((c) => c.slug === slug)?.id ?? null;
}

export function resolveNavHref(item, categories) {
  if (item.to) return item.to;

  if (item.categorySlug) {
    const categoryId = categoryIdBySlug(categories, item.categorySlug);
    if (categoryId) {
      return categorySearchPath(categoryId);
    }
  }

  if (item.keywordFallback) {
    return keywordSearchPath(item.keywordFallback);
  }

  return '/search';
}

export function resolveSeeAllHref(item, categories) {
  if (item.categorySlug) {
    const categoryId = categoryIdBySlug(categories, item.categorySlug);
    if (categoryId) return categorySearchPath(categoryId);
  }
  if (item.keywordFallback) return keywordSearchPath(item.keywordFallback);
  return '/search';
}

export { categorySearchPath, keywordSearchPath };
