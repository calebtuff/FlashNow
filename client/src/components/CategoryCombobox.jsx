import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const MAX_VISIBLE = 8;

/**
 * Category picker for the listing sheet.
 *
 * One control rather than two dependent dropdowns: the seller types a few
 * letters, sees "Parent › Leaf", and picks a leaf. The parent is derived from
 * the selection and never chosen separately, which keeps the listing form at
 * the same field count. Listing speed is a supply constraint on a marketplace
 * whose lots last minutes, so this may not become a two-step flow.
 *
 * Only leaves are offered. A category with children is not a place a lot can
 * live, because it would be invisible to anyone browsing a specific one.
 */
export default function CategoryCombobox({
  leaves,
  value,
  onChange,
  disabled = false,
  error,
  loading = false,
  id: idProp,
}) {
  const reactId = useId();
  const id = idProp ?? `category-${reactId}`;
  const listId = `${id}-listbox`;
  const statusId = `${id}-status`;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => leaves.find((l) => l.id === value) ?? null, [leaves, value]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term === '') return leaves;

    // Rank prefix matches on the leaf name first, then other leaf-name hits,
    // then parent-name hits, so typing "jer" surfaces Jerseys before Jewelry.
    const scored = [];
    for (const leaf of leaves) {
      const name = leaf.name.toLowerCase();
      const parent = leaf.parent?.name.toLowerCase() ?? '';
      if (name.startsWith(term)) scored.push([0, leaf]);
      else if (name.includes(term)) scored.push([1, leaf]);
      else if (parent.includes(term)) scored.push([2, leaf]);
    }
    return scored.sort((a, b) => a[0] - b[0]).map(([, leaf]) => leaf);
  }, [leaves, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  // Escape and outside-click both dismiss. Listening on mousedown means a drag
  // that starts inside the list and ends outside is not read as a dismissal.
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Keep the active option in view when arrowing past the visible window.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function commit(leaf) {
    if (!leaf) return;
    onChange(leaf.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function clear() {
    onChange('');
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (disabled) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (matches.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + matches.length) % matches.length);
      return;
    }

    if (e.key === 'Home' && open) {
      e.preventDefault();
      setActive(0);
      return;
    }

    if (e.key === 'End' && open) {
      e.preventDefault();
      setActive(Math.max(0, matches.length - 1));
      return;
    }

    if (e.key === 'Enter' && open) {
      e.preventDefault();
      commit(matches[active]);
      return;
    }

    if (e.key === 'Escape') {
      // First Escape closes the list; a second clears the selection.
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else if (selected) {
        e.preventDefault();
        clear();
      }
      return;
    }

    // Tab commits whatever is highlighted and then moves on, rather than
    // abandoning a choice the user has already arrowed to.
    if (e.key === 'Tab' && open && matches.length > 0) {
      onChange(matches[active].id);
      setQuery('');
      setOpen(false);
    }
  }

  const displayValue = open ? query : selected?.path ?? '';
  const showClear = Boolean(selected) && !disabled;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches.length > 0 ? `${id}-opt-${active}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : statusId}
          disabled={disabled || loading}
          value={displayValue}
          placeholder={loading ? 'Loading categories' : 'Search categories'}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`field pr-16 ${error ? 'border-hand' : ''}`}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {showClear && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear category"
              className="flex h-7 w-7 items-center justify-center rounded-sm text-lume-faint transition-colors duration-jump hover:text-hand"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
          <Icon
            name="expand_more"
            aria-hidden
            className={`pointer-events-none text-[18px] text-lume-faint transition-transform duration-jump ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Announced politely so a screen-reader user knows the list narrowed. */}
      <span id={statusId} className="sr-only" aria-live="polite">
        {open ? `${matches.length} ${matches.length === 1 ? 'category' : 'categories'} available` : ''}
      </span>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Categories"
          className="register absolute z-30 mt-1 max-h-72 w-full overflow-y-auto py-1"
          style={{ maxHeight: `${MAX_VISIBLE * 2.75}rem` }}
        >
          {matches.length === 0 ? (
            <li className="px-t3 py-t3">
              <p className="text-body text-lume-dim">No category matches that.</p>
              <p className="mt-1 text-micro text-lume-faint">
                Try a broader word, or email{' '}
                <a href="mailto:support@flashnow.app" className="text-lume underline">
                  support@flashnow.app
                </a>{' '}
                to have one added.
              </p>
            </li>
          ) : (
            matches.map((leaf, i) => {
              const isActive = i === active;
              const isSelected = leaf.id === value;
              return (
                <li
                  key={leaf.id}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    // mousedown, not click: the input's blur would close the
                    // list before a click ever landed.
                    e.preventDefault();
                    commit(leaf);
                  }}
                  className={[
                    'flex min-h-[2.75rem] cursor-pointer items-center gap-2 px-t3 text-body',
                    isActive ? 'bg-high text-lume' : 'text-lume-dim',
                  ].join(' ')}
                >
                  {leaf.parent && (
                    <>
                      <span className="legend shrink-0 text-tick text-lume-faint">
                        {leaf.parent.name}
                      </span>
                      <span aria-hidden className="text-lume-faint">
                        ›
                      </span>
                    </>
                  )}
                  <span className="min-w-0 truncate font-semibold text-lume">{leaf.name}</span>
                  {isSelected && (
                    <Icon name="check" className="ml-auto shrink-0 text-[16px] text-radium" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
