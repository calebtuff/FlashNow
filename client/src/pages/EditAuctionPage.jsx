import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuctionForm from '../components/AuctionForm.jsx';
import BackLink from '../components/BackLink.jsx';
import { useCategoryList } from '../hooks/useCategories.js';
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
      <BackLink to={backTo}>Back to my lots</BackLink>
      <div className="register p-t5">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-caution" aria-hidden />
        <h1 className="legend text-legend text-caution">{title}</h1>
        <p className="mt-t3 max-w-[60ch] text-body text-lume-dim">{message}</p>
        <Link to={backTo} className="ctl-primary mt-t4">
          Go to my lots
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

  const { leaves, isPending: categoriesLoading } = useCategoryList();

  const auction = auctionQuery.data?.auction;
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
      <div className="mx-auto max-w-2xl" aria-busy="true" aria-label="Loading listing">
        <div className="h-96 animate-pulse rounded-xl bg-sunken" />
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
      <div className="border-b border-steel pb-t4">
        <BackLink to="/my-auctions">Back to my lots</BackLink>
        <h1 className="legend mt-t3 text-legend text-lume-faint">Edit lot</h1>
        <p className="mt-t2 max-w-[60ch] text-body text-lume-dim">
          Updating &ldquo;{auction.title}&rdquo; before it opens.
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
        leaves={leaves}
        categoriesLoading={categoriesLoading}
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
