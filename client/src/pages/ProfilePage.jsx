import { useParams } from 'react-router-dom';

export default function ProfilePage() {
  const { id } = useParams();

  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Profile</h1>
      <p className="text-slate-600">
        Placeholder profile page for user <code className="rounded bg-slate-200 px-1">{id}</code>.
      </p>
    </section>
  );
}
