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
      <div className={`register ${compact ? 'p-t3' : 'p-t4'}`}>
        <p className="legend flex items-center gap-1.5 text-tick text-radium">
          <Icon name="check_circle" className="icon-filled text-[14px]" />
          Rated
        </p>
        <div className="mt-t2 flex items-center gap-t3">
          <Stars score={displayRating.score} size="sm" />
          <span className="numeral text-body text-lume-dim">{displayRating.score} of 5</span>
        </div>
        {displayRating.comment && (
          <p className="mt-t2 text-body text-lume-faint">&ldquo;{displayRating.comment}&rdquo;</p>
        )}
      </div>
    );
  }

  if (!canRate) return null;

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
    <form onSubmit={handleSubmit} className={`register ${compact ? 'p-t3' : 'p-t4'}`}>
      <h3 className="legend text-legend text-lume-dim">Rate {sellerName || 'the seller'}</h3>

      <div className="mt-t3">
        <Stars interactive value={score} onChange={setScore} size="lg" />
      </div>

      <label className="mt-t4 block">
        <span className="field-label">Comment (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={compact ? 2 : 3}
          placeholder="How did this go?"
          className="field resize-y py-2"
        />
      </label>

      {submitRating.isError && (
        <p role="alert" className="mt-t2 text-micro text-hand">
          {submitRating.error?.message || 'Could not submit the rating.'}
        </p>
      )}

      <button type="submit" disabled={score < 1 || submitRating.isPending} className="ctl-primary mt-t3">
        {submitRating.isPending ? 'Submitting' : 'Submit rating'}
      </button>
    </form>
  );
}
