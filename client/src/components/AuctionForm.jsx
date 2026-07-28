import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { DURATION_OPTIONS } from '../utils/auctionForm.js';

const labelClass = 'block text-xs font-bold uppercase tracking-wide text-neutral-500';
const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500';
const errorClass = 'mt-1 text-xs font-semibold text-red-600';

export default function AuctionForm({
  form,
  onFieldChange,
  onImageChange,
  onAddImage,
  onRemoveImage,
  showErrors,
  errors,
  categories = [],
  categoriesLoading = false,
  lockPricingFields = false,
  submitError,
  isPending = false,
  submitLabel = 'Save',
  pendingLabel = 'Saving…',
  cancelTo = '/',
  onSubmit,
  disabled = false,
}) {
  const showError = (key) => showErrors && errors[key];

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      {lockPricingFields && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This listing has bids. You can update the title, description, images, and category only.
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="e.g. Omega Speedmaster Moonwatch"
          className={inputClass}
          disabled={disabled}
        />
        {showError('title') && <p className={errorClass}>{errors.title}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Condition, authenticity, what's included…"
          className={`${inputClass} resize-y`}
          disabled={disabled}
        />
        {showError('description') && <p className={errorClass}>{errors.description}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="category">
          Category
        </label>
        <select
          id="category"
          value={form.categoryId}
          onChange={(e) => onFieldChange('categoryId', e.target.value)}
          className={inputClass}
          disabled={disabled || categoriesLoading}
        >
          <option value="">{categoriesLoading ? 'Loading…' : 'No category'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Image URLs</span>
        <div className="mt-1.5 space-y-2">
          {form.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => onImageChange(i, e.target.value)}
                placeholder="https://…"
                className={`${inputClass} mt-0`}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                disabled={disabled}
                className="flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 px-3 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                aria-label="Remove image"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddImage}
          disabled={disabled}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900 disabled:opacity-50"
        >
          <Icon name="add" className="text-[18px]" />
          Add another image
        </button>
        {showError('images') && <p className={errorClass}>{errors.images}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="startingBid">
            Starting bid ($)
          </label>
          <input
            id="startingBid"
            type="number"
            min="1"
            step="1"
            value={form.startingBid}
            onChange={(e) => onFieldChange('startingBid', e.target.value)}
            placeholder="100"
            className={inputClass}
            disabled={disabled || lockPricingFields}
          />
          {showError('startingBid') && !lockPricingFields && <p className={errorClass}>{errors.startingBid}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="buyNowPrice">
            Buy now price ($) — optional
          </label>
          <input
            id="buyNowPrice"
            type="number"
            min="1"
            step="1"
            value={form.buyNowPrice}
            onChange={(e) => onFieldChange('buyNowPrice', e.target.value)}
            placeholder="—"
            className={inputClass}
            disabled={disabled || lockPricingFields}
          />
          {showError('buyNowPrice') && !lockPricingFields && <p className={errorClass}>{errors.buyNowPrice}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="duration">
            Duration
          </label>
          <select
            id="duration"
            value={form.durationMinutes}
            onChange={(e) => onFieldChange('durationMinutes', Number(e.target.value))}
            className={inputClass}
            disabled={disabled || lockPricingFields}
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
          {showError('durationMinutes') && !lockPricingFields && (
            <p className={errorClass}>{errors.durationMinutes}</p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="startsAt">
            Start time — optional
          </label>
          <input
            id="startsAt"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => onFieldChange('startsAt', e.target.value)}
            className={inputClass}
            disabled={disabled || lockPricingFields}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {lockPricingFields ? 'Schedule locked after bids.' : 'Leave empty to start now.'}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-5">
        <Link
          to={cancelTo}
          className="rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-600 no-underline hover:text-neutral-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={disabled || isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
          {!isPending && <Icon name="save" className="text-[18px]" />}
        </button>
      </div>
    </form>
  );
}
