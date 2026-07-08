import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 outline-none transition-colors focus:border-neutral-900';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatReviewDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function Stars({ score, size = 'md' }) {
  const rounded = Math.max(0, Math.min(5, Math.round(score)));
  const iconClass = size === 'lg' ? 'text-[22px]' : 'text-[18px]';
  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${score.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name={i < rounded ? 'star' : 'star_border'} className={iconClass} />
      ))}
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-neutral-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-neutral-200/80" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((k) => (
          <div key={k} className="h-28 animate-pulse rounded-2xl bg-neutral-200/80" />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/profile/${review.fromUser?.id}`}
            className="font-semibold text-neutral-900 no-underline hover:underline"
          >
            @{review.fromUser?.username || 'user'}
          </Link>
          <p className="mt-1 text-xs text-neutral-500">{formatReviewDate(review.createdAt)}</p>
        </div>
        <Stars score={review.score} />
      </div>
      {review.auction?.title && (
        <p className="mt-3 text-sm text-neutral-600">
          For{' '}
          <Link to={`/auctions/${review.auction.id}`} className="font-semibold text-neutral-900 no-underline hover:underline">
            {review.auction.title}
          </Link>
        </p>
      )}
      {review.comment && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{review.comment}</p>}
    </article>
  );
}

function EditProfileForm({ me, onSaved }) {
  const queryClient = useQueryClient();
  const { refreshAppUser } = useAuth();
  const [displayName, setDisplayName] = useState(me.displayName || '');
  const [username, setUsername] = useState(me.username || '');
  const [phone, setPhone] = useState(me.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setDisplayName(me.displayName || '');
    setUsername(me.username || '');
    setPhone(me.phone || '');
    setAvatarUrl(me.avatarUrl || '');
  }, [me]);

  const saveProfile = useMutation({
    mutationFn: (body) => api.patch('/users/me', body),
    onSuccess: async () => {
      setError('');
      await refreshAppUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      onSaved?.();
    },
    onError: (err) => {
      setError(err?.message || 'Could not save profile.');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    saveProfile.mutate({
      displayName: displayName.trim(),
      username: username.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="font-headline text-xl font-extrabold text-neutral-900">Edit profile</h2>
      <p className="mt-1 text-sm text-neutral-600">Update how you appear on FlashNow.</p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="profile-display-name" className="block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Display name
          </label>
          <input
            id="profile-display-name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-username" className="block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Username
          </label>
          <input
            id="profile-username"
            type="text"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-phone" className="block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Phone
          </label>
          <input
            id="profile-phone"
            type="tel"
            required
            minLength={7}
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Email
          </label>
          <input id="profile-email" type="email" value={me.email || ''} disabled className={`${inputClass} bg-neutral-100 text-neutral-500`} />
          <p className="mt-1 text-xs text-neutral-500">Email is managed through your login account.</p>
        </div>
        <div>
          <label htmlFor="profile-avatar" className="block text-xs font-bold uppercase tracking-wide text-neutral-500">
            Avatar URL
          </label>
          <input
            id="profile-avatar"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      {saveProfile.isSuccess && <p className="mt-4 text-sm font-semibold text-emerald-600">Profile saved.</p>}

      <button
        type="submit"
        disabled={saveProfile.isPending}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {saveProfile.isPending ? 'Saving…' : 'Save changes'}
        {!saveProfile.isPending && <Icon name="save" className="text-[18px]" />}
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const { id: routeId } = useParams();
  const { userId, isAuthenticated, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);

  const profileId = routeId === 'me' ? userId : routeId;
  const isOwnProfile = Boolean(userId && profileId === userId);

  const profileQuery = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => api.get(`/users/${profileId}`),
    enabled: Boolean(profileId),
  });

  const meQuery = useQuery({
    queryKey: ['profile-me', userId],
    queryFn: () => api.get('/users/me'),
    enabled: isOwnProfile,
  });

  const ratingsQuery = useQuery({
    queryKey: ['profile-ratings', profileId],
    queryFn: () => api.get(`/ratings/user/${profileId}`),
    enabled: Boolean(profileId),
  });

  const profile = profileQuery.data?.user;
  const me = meQuery.data?.user;
  const reviews = ratingsQuery.data?.ratings ?? [];
  const ratingSummary = profile?.stats?.rating ?? ratingsQuery.data?.summary ?? { average: 0, count: 0 };

  const headline = useMemo(() => {
    if (!profile) return '';
    return profile.displayName || `@${profile.username}`;
  }, [profile]);

  if (routeId === 'me' && !authLoading && !isAuthenticated) {
    return <Navigate to="/login?redirect=%2Fprofile%2Fme" replace />;
  }

  if (routeId === 'me' && userId) {
    return <Navigate to={`/profile/${userId}`} replace />;
  }

  if (profileQuery.isPending || authLoading) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-700">{profileQuery.error?.message || 'User not found.'}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-semibold text-neutral-900 no-underline hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const avatarSrc = profile.avatarUrl || `https://i.pravatar.cc/160?u=${profile.id}`;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700" />
        <div className="relative px-6 pb-6">
          <img
            src={avatarSrc}
            alt=""
            className="-mt-12 h-24 w-24 rounded-full border-4 border-white bg-neutral-100 object-cover shadow-sm"
          />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-extrabold text-neutral-900">{headline}</h1>
              <p className="mt-1 text-sm font-semibold text-neutral-500">@{profile.username}</p>
              <p className="mt-2 text-sm text-neutral-600">Member since {formatDate(profile.createdAt)}</p>
            </div>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                <Icon name={editing ? 'close' : 'edit'} className="text-[18px]" />
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Stars score={ratingSummary.average || 0} size="lg" />
            <span className="text-sm font-semibold text-neutral-700">
              {(ratingSummary.average || 0).toFixed(1)} · {ratingSummary.count || 0} review
              {ratingSummary.count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Auctions listed" value={profile.stats?.auctions ?? 0} hint="Items this seller has listed" />
        <StatCard label="Bids placed" value={profile.stats?.bids ?? 0} hint="Participation as a buyer" />
        <StatCard
          label="Seller rating"
          value={(ratingSummary.average || 0).toFixed(1)}
          hint={`${ratingSummary.count || 0} verified review${ratingSummary.count === 1 ? '' : 's'}`}
        />
      </div>

      {isOwnProfile && editing && me && (
        <EditProfileForm me={me} onSaved={() => setEditing(false)} />
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-2xl font-extrabold text-neutral-900">Reviews</h2>
          {isOwnProfile && (
            <Link to="/my-auctions" className="text-sm font-semibold text-neutral-700 no-underline hover:underline">
              View my auctions
            </Link>
          )}
        </div>

        {ratingsQuery.isPending && (
          <div className="space-y-3">
            {[1, 2].map((k) => (
              <div key={k} className="h-28 animate-pulse rounded-2xl bg-neutral-200/80" />
            ))}
          </div>
        )}

        {!ratingsQuery.isPending && reviews.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <Icon name="rate_review" className="mx-auto text-[32px] text-neutral-400" />
            <p className="mt-3 font-semibold text-neutral-700">No reviews yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              {isOwnProfile
                ? 'Complete sales as a seller to start building your reputation.'
                : 'This user has not received any reviews yet.'}
            </p>
          </div>
        )}

        {!ratingsQuery.isPending && reviews.length > 0 && (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
