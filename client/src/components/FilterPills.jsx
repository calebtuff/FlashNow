/**
 * Bezel selector. Segmented, hairline-joined, the way a mode ring clicks
 * between positions rather than floating as separate rounded pills.
 */
export default function FilterPills({ options, value, onChange, label = 'Filter' }) {
  return (
    <div
      className="inline-flex flex-wrap border border-steel bg-sunken"
      role="group"
      aria-label={label}
    >
      {options.map((o, i) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={[
              'legend px-3 py-2 text-tick transition-colors duration-jump ease-jump',
              i > 0 ? 'border-l border-steel' : '',
              active ? 'bg-lume text-dial' : 'text-lume-faint hover:bg-high hover:text-lume',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
