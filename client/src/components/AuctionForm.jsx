import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Alert from './Alert.jsx';
import CategoryCombobox from './CategoryCombobox.jsx';
import { DURATION_OPTIONS, suggestCategory } from '../utils/auctionForm.js';

/** A grouped block of the listing sheet, ruled off like a form on a clipboard. */
function Group({ step, title, hint, children }) {
  return (
    <section className="border-t border-steel pt-t4 first:border-0 first:pt-0">
      <div className="mb-t3 flex items-baseline gap-t3">
        <span className="legend numeral text-tick text-lume-faint">{String(step).padStart(2, '0')}</span>
        <div>
          <h2 className="legend text-legend text-lume-dim">{title}</h2>
          {hint && <p className="mt-1 text-micro text-lume-faint">{hint}</p>}
        </div>
      </div>
      <div className="space-y-t4 pl-0 sm:pl-8">{children}</div>
    </section>
  );
}

/**
 * The listing sheet.
 *
 * The previous version was eight ungrouped fields in one scroll, which read as
 * a settings page rather than as the act of putting something up for sale.
 * Grouping into what it is, what it shows, and how it runs gives the seller
 * three short decisions instead of one long one. Numbering is the sequence a
 * clipboard form actually uses, not decoration.
 */
export default function AuctionForm({
  form,
  onFieldChange,
  onImageChange,
  onAddImage,
  onRemoveImage,
  showErrors,
  errors,
  leaves = [],
  categoriesLoading = false,
  lockPricingFields = false,
  submitError,
  isPending = false,
  submitLabel = 'Save',
  pendingLabel = 'Saving',
  cancelTo = '/',
  onSubmit,
  disabled = false,
}) {
  const showError = (key) => showErrors && errors[key];
  const describedBy = (key) => (showError(key) ? `${key}-error` : undefined);

  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [debouncedTitle, setDebouncedTitle] = useState(form.title);

  // Debounced so the suggestion settles after typing rather than flickering
  // through a new guess on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedTitle(form.title), 300);
    return () => window.clearTimeout(id);
  }, [form.title]);

  const suggestion = useMemo(
    () => suggestCategory(debouncedTitle, leaves),
    [debouncedTitle, leaves]
  );

  const FieldError = ({ name }) =>
    showError(name) ? (
      <p id={`${name}-error`} role="alert" className="mt-t2 text-micro text-hand">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="register space-y-t6 p-t5">
      {lockPricingFields && (
        <Alert tone="caution" title="Bids received">
          This lot already has bids, so its price and schedule are locked. Title, description, images and
          category can still change.
        </Alert>
      )}

      <Group
        step={1}
        title="What it is"
        hint="Pick the most specific category that fits. Missing one? Email support@flashnow.app."
      >
        <div>
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            placeholder="Omega Speedmaster Professional, 1969"
            className="field"
            disabled={disabled}
            aria-invalid={Boolean(showError('title'))}
            aria-describedby={describedBy('title')}
          />
          <FieldError name="title" />
        </div>

        <div>
          <label className="field-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Condition, provenance, what is included."
            className="field resize-y py-2"
            disabled={disabled}
            aria-invalid={Boolean(showError('description'))}
            aria-describedby={describedBy('description')}
          />
          <FieldError name="description" />
        </div>

        <div>
          <label className="field-label" htmlFor="category">
            Category
          </label>
          <CategoryCombobox
            id="category"
            leaves={leaves}
            value={form.categoryId}
            onChange={(id) => {
              onFieldChange('categoryId', id);
              setSuggestionDismissed(true);
            }}
            disabled={disabled}
            loading={categoriesLoading}
            error={showError('categoryId')}
          />
          <FieldError name="categoryId" />

          {/* The seller has already typed the title in this same group, so the
              form can offer a category rather than making them find it. It
              never applies itself: a silent wrong guess costs more than it
              saves, and one tap is already the fast path. */}
          {suggestion && !suggestionDismissed && suggestion.id !== form.categoryId && (
            <div className="mt-t2 flex flex-wrap items-center gap-t2">
              <span className="legend text-tick text-lume-faint">Suggested</span>
              <button
                type="button"
                onClick={() => {
                  onFieldChange('categoryId', suggestion.id);
                  setSuggestionDismissed(true);
                }}
                className="legend inline-flex items-center gap-1.5 border border-radium px-2 py-1 text-tick text-radium transition-colors duration-jump hover:bg-radium hover:text-dial"
              >
                {suggestion.path}
                <Icon name="add" className="text-[14px]" />
              </button>
              <button
                type="button"
                onClick={() => setSuggestionDismissed(true)}
                className="legend text-tick text-lume-faint transition-colors hover:text-lume"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </Group>

      <Group step={2} title="What it shows" hint="The first image is the one bidders see on the board.">
        <div className="space-y-t2">
          {form.images.map((url, i) => (
            <div key={i} className="flex gap-t2">
              <span className="legend numeral flex w-8 shrink-0 items-center justify-center text-tick text-lume-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => onImageChange(i, e.target.value)}
                placeholder="https://"
                className="field"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                disabled={disabled}
                className="ctl-ghost shrink-0 !px-3 hover:border-hand hover:text-hand"
                aria-label={`Remove image ${i + 1}`}
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddImage}
          disabled={disabled}
          className="legend inline-flex items-center gap-1.5 text-tick text-lume-dim transition-colors hover:text-lume disabled:opacity-40"
        >
          <Icon name="add" className="text-[16px]" />
          Add image
        </button>
        <FieldError name="images" />
      </Group>

      <Group step={3} title="How it runs" hint="Lots run for minutes. A bid in the final minute extends it by 60 seconds.">
        <div className="grid gap-t4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="startingBid">
              Opening bid ($)
            </label>
            <input
              id="startingBid"
              type="number"
              min="1"
              step="1"
              value={form.startingBid}
              onChange={(e) => onFieldChange('startingBid', e.target.value)}
              placeholder="100"
              className="field numeral"
              disabled={disabled || lockPricingFields}
              aria-invalid={Boolean(showError('startingBid') && !lockPricingFields)}
              aria-describedby={lockPricingFields ? undefined : describedBy('startingBid')}
            />
            {!lockPricingFields && <FieldError name="startingBid" />}
          </div>

          <div>
            <label className="field-label" htmlFor="buyNowPrice">
              Buy now ($)
            </label>
            <input
              id="buyNowPrice"
              type="number"
              min="1"
              step="1"
              value={form.buyNowPrice}
              onChange={(e) => onFieldChange('buyNowPrice', e.target.value)}
              placeholder="Optional"
              className="field numeral"
              disabled={disabled || lockPricingFields}
              aria-invalid={Boolean(showError('buyNowPrice') && !lockPricingFields)}
              aria-describedby={lockPricingFields ? undefined : describedBy('buyNowPrice')}
            />
            {!lockPricingFields && <FieldError name="buyNowPrice" />}
          </div>

          <div>
            <span className="field-label">Runs for</span>
            {/* Duration is a mode ring, not a dropdown: there are four
                positions and the choice defines the whole product. */}
            <div className="inline-flex border border-edge bg-sunken" role="group" aria-label="Duration">
              {DURATION_OPTIONS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  disabled={disabled || lockPricingFields}
                  onClick={() => onFieldChange('durationMinutes', d)}
                  aria-pressed={form.durationMinutes === d}
                  className={[
                    'legend numeral px-3 py-2 text-tick transition-colors duration-jump disabled:opacity-40',
                    i > 0 ? 'border-l border-steel' : '',
                    form.durationMinutes === d
                      ? 'bg-lume text-dial'
                      : 'text-lume-faint hover:bg-high hover:text-lume',
                  ].join(' ')}
                >
                  {d}m
                </button>
              ))}
            </div>
            {!lockPricingFields && <FieldError name="durationMinutes" />}
          </div>

          <div>
            <label className="field-label" htmlFor="startsAt">
              Opens at
            </label>
            <input
              id="startsAt"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => onFieldChange('startsAt', e.target.value)}
              className="field"
              disabled={disabled || lockPricingFields}
              aria-describedby="startsAt-help"
            />
            <p id="startsAt-help" className="mt-t2 text-micro text-lume-faint">
              {lockPricingFields ? 'Locked after bids.' : 'Leave empty to open immediately.'}
            </p>
          </div>
        </div>
      </Group>

      {submitError && <Alert title="Could not save">{submitError}</Alert>}

      <div className="flex items-center justify-end gap-t2 border-t border-steel pt-t4">
        <Link to={cancelTo} className="ctl-ghost">
          Cancel
        </Link>
        <button type="submit" disabled={disabled || isPending} className="ctl-primary px-t6">
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
