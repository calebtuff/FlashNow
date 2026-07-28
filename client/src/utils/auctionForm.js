export const DURATION_OPTIONS = [5, 10, 15, 30];

export const EMPTY_AUCTION_FORM = {
  title: '',
  description: '',
  categoryId: '',
  startingBid: '',
  buyNowPrice: '',
  durationMinutes: 10,
  images: [''],
  startsAt: '',
};

export function isoToDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function auctionToFormValues(auction) {
  if (!auction) return { ...EMPTY_AUCTION_FORM, images: [''] };
  return {
    title: auction.title || '',
    description: auction.description || '',
    categoryId: auction.categoryId || '',
    startingBid: auction.startingBid != null ? String(auction.startingBid) : '',
    buyNowPrice: auction.buyNowPrice != null ? String(auction.buyNowPrice) : '',
    durationMinutes: auction.durationMinutes ?? 10,
    images: Array.isArray(auction.images) && auction.images.length > 0 ? [...auction.images] : [''],
    startsAt: isoToDatetimeLocal(auction.startsAt),
  };
}

export function auctionFormFieldErrors(form) {
  const errors = {};
  if (form.title.trim() === '') errors.title = 'Title is required.';
  if (form.description.trim() === '') errors.description = 'Description is required.';

  const cleanImages = form.images.filter((u) => u.trim() !== '');
  if (cleanImages.length === 0) errors.images = 'Add at least one image URL.';

  const bid = Number(form.startingBid);
  if (form.startingBid === '' || Number.isNaN(bid) || bid <= 0) {
    errors.startingBid = 'Starting bid must be greater than 0.';
  }

  if (form.buyNowPrice !== '') {
    const buy = Number(form.buyNowPrice);
    if (Number.isNaN(buy) || buy <= 0) {
      errors.buyNowPrice = 'Buy now price must be a positive number.';
    } else if (!Number.isNaN(bid) && buy <= bid) {
      errors.buyNowPrice = 'Buy now price should be higher than the starting bid.';
    }
  }

  const duration = Number(form.durationMinutes);
  if (Number.isNaN(duration) || duration < 5 || duration > 30) {
    errors.durationMinutes = 'Duration must be between 5 and 30 minutes.';
  }

  return errors;
}

export function toCreatePayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    images: form.images.filter((u) => u.trim() !== ''),
    categoryId: form.categoryId || null,
    startingBid: Number(form.startingBid),
    buyNowPrice: form.buyNowPrice ? Number(form.buyNowPrice) : null,
    durationMinutes: Number(form.durationMinutes),
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
  };
}

export function toUpdatePayload(form, { lockPricingFields = false } = {}) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    images: form.images.filter((u) => u.trim() !== ''),
    categoryId: form.categoryId || null,
  };

  if (lockPricingFields) return payload;

  return {
    ...payload,
    startingBid: Number(form.startingBid),
    buyNowPrice: form.buyNowPrice ? Number(form.buyNowPrice) : null,
    durationMinutes: Number(form.durationMinutes),
    ...(form.startsAt ? { startsAt: new Date(form.startsAt).toISOString() } : {}),
  };
}

export const EDITABLE_AUCTION_STATUSES = ['draft', 'scheduled'];

export function canEditAuction(auction) {
  return EDITABLE_AUCTION_STATUSES.includes(auction?.status);
}
