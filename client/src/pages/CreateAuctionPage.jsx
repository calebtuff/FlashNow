import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuctionForm from '../components/AuctionForm.jsx';
import Icon from '../components/Icon.jsx';
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

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });
  const categories = categoriesQuery.data?.categories ?? [];

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 no-underline hover:text-neutral-900"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Back to auctions
        </Link>
        <h1 className="mt-3 font-headline text-3xl font-extrabold text-neutral-900">List an item</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create a scheduled auction. It goes live at the start time and runs for the duration you pick.
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
