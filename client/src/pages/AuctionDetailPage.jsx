import { useParams } from 'react-router-dom';

export default function AuctionDetailPage() {
  const { id } = useParams();

  return (
    <section>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Auction Detail</h1>
      <p className="text-slate-600">
        Placeholder page for auction <code className="rounded bg-slate-200 px-1">{id}</code>.
      </p>
    </section>
  );
}
