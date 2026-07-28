import Icon from './Icon.jsx';

export default function Stars({
  score = 0,
  size = 'md',
  interactive = false,
  value,
  onChange,
  className = '',
}) {
  const displayScore = interactive ? value ?? 0 : score;
  const rounded = Math.max(0, Math.min(5, Math.round(displayScore)));
  const iconClass = size === 'lg' ? 'text-[22px]' : size === 'sm' ? 'text-[16px]' : 'text-[18px]';

  if (interactive) {
    return (
      <div className={['flex items-center gap-0.5', className].join(' ')} role="group" aria-label="Rating">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const filled = starValue <= (value ?? 0);
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange?.(starValue)}
              className="text-amber-400 transition-transform hover:scale-110"
              aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
            >
              <Icon name={filled ? 'star' : 'star_border'} className={iconClass} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={['flex items-center gap-0.5 text-amber-400', className].join(' ')}
      aria-label={`${Number(score).toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name={i < rounded ? 'star' : 'star_border'} className={iconClass} />
      ))}
    </div>
  );
}
