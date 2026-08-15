import { Link } from 'react-router-dom';
import Stars from './Stars.jsx';

function formatReviewDate(iso) {
  if (!iso) return 'date unknown';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReviewCard({ review }) {
  return (
    <article className="register p-t4">
      <div className="flex flex-wrap items-start justify-between gap-t3">
        <div>
          <Link
            to={`/profile/${review.fromUser?.id}`}
            className="text-body font-semibold text-lume no-underline hover:underline"
          >
            {review.fromUser?.username || 'user'}
          </Link>
          <p className="legend numeral mt-1 text-tick text-lume-faint">{formatReviewDate(review.createdAt)}</p>
        </div>
        <Stars score={review.score} size="sm" />
      </div>

      {review.auction?.title && (
        <p className="mt-t3 text-micro text-lume-faint">
          On{' '}
          <Link to={`/auctions/${review.auction.id}`} className="text-lume-dim no-underline hover:underline">
            {review.auction.title}
          </Link>
        </p>
      )}
      {review.comment && <p className="mt-t3 text-body leading-relaxed text-lume-dim">{review.comment}</p>}
    </article>
  );
}
