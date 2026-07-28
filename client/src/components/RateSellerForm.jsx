import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from './Icon.jsx';
import Stars from './Stars.jsx';
import { api } from '../services/api.js';

export default function RateSellerForm({
  auctionId,
  sellerId,
  sellerName,
  existingRating = null,
  canRate = false,
  compact = false,
}) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(existingRating?.score ?? 0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(Boolean(existingRating));

  const submitRating = useMutation({
    mutationFn: (body) => api.post('/ratings', body),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['profile-ratings', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['profile', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
    },
  });

  const displayRating = submitted ? existingRating ?? { score, comment: comment.trim() || null } : null;

  if (displayRating) {
    return (
      <div
        className={[
          'rounded-2xl border border-emerald-200 bg-emerald-50',
          compact ? 'px-4 py-3' : 'p-5',
        ].join(' ')}
      >
        <p className="text-sm font-semibold text-emerald-900">
          Thanks for rating {sellerName || 'the seller'}!
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Stars score={displayRating.score} size="sm" />
          <span className="text-sm font-medium text-emerald-800">{displayRating.score} out of 5</span>
        </div>
        {displayRating.comment && (
          <p className="mt-2 text-sm text-emerald-900/80">&ldquo;{displayRating.comment}&rdquo;</p>
        )}
      </div>
    );
  }

  if (!canRate) {
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (score < 1) return;
    submitRating.mutate({
      toUserId: sellerId,
      auctionId,
      score,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'rounded-2xl border border-violet-200 bg-violet-50',
        compact ? 'px-4 py-4' : 'p-5',
      ].join(' ')}
    >
      <h3 className="font-headline text-base font-extrabold text-violet-950">
        Rate {sellerName || 'the seller'}
      </h3>
      <p className="mt-1 text-sm text-violet-900/80">How was your experience with this seller?</p>

      <div className="mt-4">
        <Stars interactive value={score} onChange={setScore} size="lg" />
      </div>

      <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-violet-900/70">
        Comment (optional)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={compact ? 2 : 3}
          placeholder="Share a few words about the seller…"
          className="mt-1.5 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-violet-400"
        />
      </label>

      {submitRating.isError && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          {submitRating.error?.message || 'Could not submit rating.'}
        </p>
      )}

      <button
        type="submit"
        disabled={score < 1 || submitRating.isPending}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
      >
        {submitRating.isPending ? 'Submitting…' : 'Submit rating'}
        {!submitRating.isPending && <Icon name="star" className="text-[18px]" />}
      </button>
    </form>
  );
}
