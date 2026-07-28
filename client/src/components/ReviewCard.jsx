import { Link } from 'react-router-dom';
import Stars from './Stars.jsx';

function formatReviewDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/profile/${review.fromUser?.id}`}
            className="font-semibold text-neutral-900 no-underline hover:underline"
          >
            @{review.fromUser?.username || 'user'}
          </Link>
          <p className="mt-1 text-xs text-neutral-500">{formatReviewDate(review.createdAt)}</p>
        </div>
        <Stars score={review.score} />
      </div>
      {review.auction?.title && (
        <p className="mt-3 text-sm text-neutral-600">
          For{' '}
          <Link
            to={`/auctions/${review.auction.id}`}
            className="font-semibold text-neutral-900 no-underline hover:underline"
          >
            {review.auction.title}
          </Link>
        </p>
      )}
      {review.comment && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{review.comment}</p>}
    </article>
  );
}
