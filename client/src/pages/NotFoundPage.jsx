import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mb-3 text-slate-600">The route you visited does not exist yet.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Back to home
      </Link>
    </section>
  );
}
