
/**
 * Rating as a five-segment gauge rather than five gold stars.
 *
 * A gold star is borrowed chrome from another world; a segmented bar is what
 * an instrument uses to show a value against a fixed range, and it stays
 * legible at 14px where a star outline does not.
 */
export default function Stars({ score = 0, size = 'md', interactive = false, value, onChange, className = '' }) {
  const displayScore = interactive ? value ?? 0 : score;
  const rounded = Math.max(0, Math.min(5, Math.round(displayScore)));
  const h = size === 'lg' ? 'h-2.5' : size === 'sm' ? 'h-1.5' : 'h-2';
  const w = size === 'lg' ? 'w-5' : size === 'sm' ? 'w-3' : 'w-4';

  if (interactive) {
    return (
      <div className={['flex items-center gap-1', className].join(' ')} role="group" aria-label="Rating">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const lit = starValue <= (value ?? 0);
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange?.(starValue)}
              aria-label={`${starValue} out of 5`}
              aria-pressed={lit}
              className="group p-1"
            >
              <span
                className={[
                  'block transition-colors duration-jump',
                  h,
                  w,
                  lit ? 'bg-radium' : 'bg-steel-bright group-hover:bg-edge',
                ].join(' ')}
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={['flex items-center gap-1', className].join(' ')}
      aria-label={`${Number(score).toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={[h, w, i < rounded ? 'bg-radium' : 'bg-steel-bright'].join(' ')} />
      ))}
    </div>
  );
}
