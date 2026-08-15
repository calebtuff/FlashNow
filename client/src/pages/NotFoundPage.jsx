import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon="error"
      titleAs="h1"
      title="No reading"
      body="That page does not exist, or it has moved."
    >
      <Link to="/" className="ctl-primary">
        Back to the board
      </Link>
    </EmptyState>
  );
}
