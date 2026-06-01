import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { getCurrentUserId } from '../services/currentUser.js';

const DURATION_OPTIONS = [5, 10, 15, 30];

const EMPTY_FORM = {
  title: '',
  description: '',
  categoryId: '',
  startingBid: '',
  buyNowPrice: '',
  durationMinutes: 10,
  images: [''],
  startsAt: '',
};

function fieldErrors(form) {
  const errors = {};
  if (form.title.trim() === '') errors.title = 'Title is required.';
  if (form.description.trim() === '') errors.description = 'Description is required.';

  const cleanImages = form.images.filter((u) => u.trim() !== '');
  if (cleanImages.length === 0) errors.images = 'Add at least one image URL.';

  const bid = Number(form.startingBid);
  if (form.startingBid === '' || Number.isNaN(bid) || bid <= 0) {
    errors.startingBid = 'Starting bid must be greater than 0.';
  }

  if (form.buyNowPrice !== '') {
    const buy = Number(form.buyNowPrice);
    if (Number.isNaN(buy) || buy <= 0) {
      errors.buyNowPrice = 'Buy now price must be a positive number.';
    } else if (!Number.isNaN(bid) && buy <= bid) {
      errors.buyNowPrice = 'Buy now price should be higher than the starting bid.';
    }
  }

  const duration = Number(form.durationMinutes);
  if (Number.isNaN(duration) || duration < 5 || duration > 30) {
    errors.durationMinutes = 'Duration must be between 5 and 30 minutes.';
  }

  return errors;
}

const labelClass = 'block text-xs font-bold uppercase tracking-wide text-neutral-500';
const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900';
const errorClass = 'mt-1 text-xs font-semibold text-red-600';

export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sellerId = getCurrentUserId();

  const [form, setForm] = useState(EMPTY_FORM);
  const [showErrors, setShowErrors] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });
  const categories = categoriesQuery.data?.categories ?? [];

  const errors = fieldErrors(form);
  const isValid = Object.keys(errors).length === 0;

  const createAuction = useMutation({
    mutationFn: (payload) => api.post('/auctions', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      if (res?.auction?.id) {
        navigate(`/auctions/${res.auction.id}`);
      } else {
        navigate('/');
      }
    },
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateImage(index, value) {
    setForm((f) => ({
      ...f,
      images: f.images.map((u, i) => (i === index ? value : u)),
    }));
  }

  function addImage() {
    setForm((f) => ({ ...f, images: [...f.images, ''] }));
  }

  function removeImage(index) {
    setForm((f) => ({
      ...f,
      images: f.images.length === 1 ? [''] : f.images.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setShowErrors(true);
    if (!isValid || !sellerId) return;

    createAuction.mutate({
      sellerId,
      title: form.title.trim(),
      description: form.description.trim(),
      images: form.images.filter((u) => u.trim() !== ''),
      categoryId: form.categoryId || null,
      startingBid: Number(form.startingBid),
      buyNowPrice: form.buyNowPrice ? Number(form.buyNowPrice) : null,
      durationMinutes: Number(form.durationMinutes),
      startsAt: form.startsAt || undefined,
    });
  }

  const showError = (key) => showErrors && errors[key];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 no-underline hover:text-neutral-900"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to auctions
        </Link>
        <h1 className="mt-3 font-headline text-3xl font-extrabold text-neutral-900">List an item</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create a scheduled auction. It goes live at the start time and runs for the duration you pick.
        </p>
      </div>

      {!sellerId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          No dev user is set, so creating will be blocked. Add <code className="font-mono">VITE_DEV_USER_ID</code> (a real
          users.id) to <code className="font-mono">client/.env</code> and restart the dev server.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <label className={labelClass} htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Omega Speedmaster Moonwatch"
            className={inputClass}
          />
          {showError('title') && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Condition, authenticity, what's included…"
            className={`${inputClass} resize-y`}
          />
          {showError('description') && <p className={errorClass}>{errors.description}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="category">Category</label>
          <select
            id="category"
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
            className={inputClass}
            disabled={categoriesQuery.isPending}
          >
            <option value="">{categoriesQuery.isPending ? 'Loading…' : 'No category'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="https://…"
                  className={`${inputClass} mt-0`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 px-3 text-neutral-500 transition-colors hover:bg-neutral-100"
                  aria-label="Remove image"
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addImage}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
          >
            <Icon name="add" className="text-[18px]" />
            Add another image
          </button>
          {showError('images') && <p className={errorClass}>{errors.images}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="startingBid">Starting bid ($)</label>
            <input
              id="startingBid"
              type="number"
              min="1"
              step="1"
              value={form.startingBid}
              onChange={(e) => update('startingBid', e.target.value)}
              placeholder="100"
              className={inputClass}
            />
            {showError('startingBid') && <p className={errorClass}>{errors.startingBid}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="buyNowPrice">Buy now price ($) — optional</label>
            <input
              id="buyNowPrice"
              type="number"
              min="1"
              step="1"
              value={form.buyNowPrice}
              onChange={(e) => update('buyNowPrice', e.target.value)}
              placeholder="—"
              className={inputClass}
            />
            {showError('buyNowPrice') && <p className={errorClass}>{errors.buyNowPrice}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="duration">Duration</label>
            <select
              id="duration"
              value={form.durationMinutes}
              onChange={(e) => update('durationMinutes', Number(e.target.value))}
              className={inputClass}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
            {showError('durationMinutes') && <p className={errorClass}>{errors.durationMinutes}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="startsAt">Start time — optional</label>
            <input
              id="startsAt"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => update('startsAt', e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-500">Leave empty to start now.</p>
          </div>
        </div>

        {createAuction.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {createAuction.error?.message || 'Could not create auction. Please try again.'}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-5">
          <Link
            to="/"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-600 no-underline hover:text-neutral-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createAuction.isPending || !sellerId}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createAuction.isPending ? 'Creating…' : 'Create auction'}
            {!createAuction.isPending && <Icon name="gavel" className="text-[18px]" />}
          </button>
        </div>
      </form>
    </div>
  );
}
