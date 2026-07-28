import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuctionForm from '../components/AuctionForm.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  auctionFormFieldErrors,
  auctionToFormValues,
  canEditAuction,
  toUpdatePayload,
} from '../utils/auctionForm.js';

function EditBlocked({ title, message, backTo }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 no-underline hover:text-neutral-900"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Back to my auctions
      </Link>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="font-headline text-xl font-extrabold text-amber-950">{title}</h1>
        <p className="mt-2 text-sm text-amber-900/90">{message}</p>
        <Link
          to={backTo}
          className="mt-4 inline-flex rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white no-underline"
        >
          Go to my auctions
        </Link>
      </div>
    </div>
  );
}

export default function EditAuctionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId, isAuthenticated, loading: authLoading } = useAuth();

  const [form, setForm] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const auctionQuery = useQuery({
    queryKey: ['auction', id],
    queryFn: () => api.get(`/auctions/${id}`),
    enabled: Boolean(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });

  const auction = auctionQuery.data?.auction;
  const categories = categoriesQuery.data?.categories ?? [];
  const bidCount = auction?._count?.bids ?? 0;
  const lockPricingFields = bidCount > 0;

  useEffect(() => {
    if (auction) {
      setForm(auctionToFormValues(auction));
    }
  }, [auction]);

  const errors = useMemo(() => {
    if (!form) return {};
    if (lockPricingFields) {
      const all = auctionFormFieldErrors(form);
      const { startingBid, buyNowPrice, durationMinutes, ...rest } = all;
      return rest;
    }
    return auctionFormFieldErrors(form);
  }, [form, lockPricingFields]);

  const isValid = Object.keys(errors).length === 0;

  const updateAuction = useMutation({
    mutationFn: (payload) => api.put(`/auctions/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['my-selling'] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['profile-listings'] });
      navigate(`/auctions/${id}`);
    },
  });

  function update(field, value) {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  }

  function updateImage(index, value) {
    setForm((f) =>
      f
        ? {
            ...f,
            images: f.images.map((u, i) => (i === index ? value : u)),
          }
        : f
    );
  }

  function addImage() {
    setForm((f) => (f ? { ...f, images: [...f.images, ''] } : f));
  }

  function removeImage(index) {
    setForm((f) =>
      f
        ? {
            ...f,
            images: f.images.length === 1 ? [''] : f.images.filter((_, i) => i !== index),
          }
        : f
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setShowErrors(true);
    if (!form || !isValid || !isAuthenticated) return;
    updateAuction.mutate(toUpdatePayload(form, { lockPricingFields }));
  }

  if (!authLoading && !isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(`/sell/${id}/edit`)}`} replace />;
  }

  if (auctionQuery.isPending || authLoading || !form) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-96 animate-pulse rounded-2xl bg-neutral-200/80" />
      </div>
    );
  }

  if (auctionQuery.isError || !auction) {
    return (
      <EditBlocked
        title="Auction not found"
        message={auctionQuery.error?.message || 'This listing could not be loaded.'}
        backTo="/my-auctions"
      />
    );
  }

  if (auction.sellerId !== userId) {
    return (
      <EditBlocked
        title="Not your listing"
        message="You can only edit auctions you created."
        backTo="/my-auctions"
      />
    );
  }

  if (!canEditAuction(auction)) {
    return (
      <EditBlocked
        title="This auction can't be edited"
        message="Only draft or scheduled listings can be changed. Live and ended auctions are locked."
        backTo="/my-auctions"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/my-auctions"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 no-underline hover:text-neutral-900"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to my auctions
        </Link>
        <h1 className="mt-3 font-headline text-3xl font-extrabold text-neutral-900">Edit listing</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Update &ldquo;{auction.title}&rdquo; before it goes live or while it&apos;s still scheduled.
        </p>
      </div>

      <AuctionForm
        form={form}
        onFieldChange={update}
        onImageChange={updateImage}
        onAddImage={addImage}
        onRemoveImage={removeImage}
        showErrors={showErrors}
        errors={errors}
        categories={categories}
        categoriesLoading={categoriesQuery.isPending}
        lockPricingFields={lockPricingFields}
        submitError={updateAuction.isError ? updateAuction.error?.message : ''}
        isPending={updateAuction.isPending}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelTo="/my-auctions"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
