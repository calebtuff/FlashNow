import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavoriteIds, useToggleFavorite } from '../hooks/useFavorites.js';

const VARIANTS = {
  card: 'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm transition-colors hover:text-red-500 disabled:opacity-50',
  featured:
    'absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-50',
  detail:
    'absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md transition-colors hover:text-red-500 disabled:opacity-50',
};

export default function FavoriteButton({ auctionId, variant = 'card', className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isFavorited, isPending: idsLoading } = useFavoriteIds();
  const toggle = useToggleFavorite();

  const favorited = isFavorited(auctionId);
  const pending = toggle.isPending || idsLoading;

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const redirect = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    toggle.mutate({ auctionId, favorited });
  }

  const iconClass =
    variant === 'featured'
      ? ['text-[22px] drop-shadow-sm', favorited ? 'icon-filled text-red-300' : ''].join(' ')
      : ['text-[18px]', favorited ? 'icon-filled text-red-500' : ''].join(' ');

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? 'Remove from saved' : 'Save auction'}
      aria-pressed={favorited}
      className={[VARIANTS[variant] ?? VARIANTS.card, className].join(' ')}
    >
      <Icon name="favorite" className={iconClass} />
    </button>
  );
}
