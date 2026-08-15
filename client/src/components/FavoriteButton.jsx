import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavoriteIds, useToggleFavorite } from '../hooks/useFavorites.js';

// z-10 keeps the control above the register's full-row click overlay, so
// saving a lot never navigates to it by accident.
const VARIANTS = {
  register:
    'absolute -right-1.5 -top-1.5 z-10 h-7 w-7 border border-steel bg-dial text-lume-faint hover:text-lume',
  dial: 'absolute right-t3 top-t3 z-10 h-10 w-10 border border-edge bg-dial/85 text-lume-dim backdrop-blur-sm hover:text-lume',
};

export default function FavoriteButton({ auctionId, variant = 'register', className = '' }) {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? 'Remove from saved' : 'Save lot'}
      aria-pressed={favorited}
      className={[
        'flex items-center justify-center rounded-sm transition-colors duration-jump ease-jump disabled:opacity-40',
        VARIANTS[variant] ?? VARIANTS.register,
        favorited ? 'text-caution' : '',
        className,
      ].join(' ')}
    >
      {/* Saving a lot is a watch instruction, not affection: a bookmark reads
          correctly where a heart would import the wrong vocabulary. */}
      <Icon
        name="bookmark"
        className={[variant === 'dial' ? 'text-[20px]' : 'text-[15px]', favorited ? 'icon-filled' : ''].join(' ')}
      />
    </button>
  );
}
