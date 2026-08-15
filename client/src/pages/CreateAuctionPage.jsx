import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuctionForm from '../components/AuctionForm.jsx';
import BackLink from '../components/BackLink.jsx';
import { useCategoryList } from '../hooks/useCategories.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  EMPTY_AUCTION_FORM,
  auctionFormFieldErrors,
  toCreatePayload,
} from '../utils/auctionForm.js';

export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [form, setForm] = useState(EMPTY_AUCTION_FORM);
  const [showErrors, setShowErrors] = useState(false);

  const { leaves, isPending: categoriesLoading } = useCategoryList();

  const errors = auctionFormFieldErrors(form);
  const isValid = Object.keys(errors).length === 0;

  const createAuction = useMutation({
    mutationFn: (payload) => api.post('/auctions', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-selling'] });
      if (res?.auction?.id) {
        navigate(`/auctions/${res.auction.id}`);
      } else {
        navigate('/');
      }
    },
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateImage(index, value) {
    setForm((f) => ({
      ...f,
      images: f.images.map((u, i) => (i === index ? value : u)),
    }));
  }

  function addImage() {
    setForm((f) => ({ ...f, images: [...f.images, ''] }));
  }

  function removeImage(index) {
    setForm((f) => ({
      ...f,
      images: f.images.length === 1 ? [''] : f.images.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setShowErrors(true);
    if (!isValid || !isAuthenticated) return;
    createAuction.mutate(toCreatePayload(form));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-t6">
      <div className="border-b border-steel pb-t4">
        <BackLink to="/">Back to the board</BackLink>
        <h1 className="legend mt-t3 text-legend text-lume-faint">List a lot</h1>
        <p className="mt-t2 max-w-[60ch] text-body text-lume-dim">
          It opens at the time you set and runs for the duration you pick. A bid in the final minute
          extends it by 60 seconds.
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
        submitError={createAuction.isError ? createAuction.error?.message : ''}
        isPending={createAuction.isPending}
        submitLabel="Create auction"
        pendingLabel="Creating…"
        cancelTo="/"
        onSubmit={handleSubmit}
        disabled={!isAuthenticated}
      />
    </div>
  );
}
