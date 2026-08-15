import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import RegisterStack, { RegisterStackSkeleton } from '../components/RegisterStack.jsx';
import Icon from '../components/Icon.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import Stars from '../components/Stars.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FilterPills from '../components/FilterPills.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const LISTING_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active', statuses: ['live', 'scheduled'] },
  { key: 'sold', label: 'Sold', statuses: ['completed', 'ended'] },
];

function formatDate(iso) {
  if (!iso) return 'an unknown date';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** One engraved figure on the plate. */
function Stat({ label, value, hint }) {
  return (
    <div className="flex-1 border-l border-steel px-t4 first:border-0 first:pl-0">
      <p className="legend text-tick text-lume-faint">{label}</p>
      <p className="numeral mt-1 text-register font-bold text-lume">{value}</p>
      {hint && <p className="mt-1 text-micro text-lume-faint">{hint}</p>}
    </div>
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
    onError: (err) => setError(err?.message || 'Could not save.'),
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
    <form onSubmit={handleSubmit} className="register p-t5">
      <h2 className="legend text-legend text-lume-dim">Edit profile</h2>

      <div className="mt-t4 grid gap-t4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-display-name" className="field-label">
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
            className="field"
          />
        </div>

        <div>
          <label htmlFor="profile-username" className="field-label">
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
            className="field"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="field-label">
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
            className="field"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="field-label">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={me.email || ''}
            disabled
            className="field opacity-60"
            aria-describedby="profile-email-help"
          />
          <p id="profile-email-help" className="mt-t2 text-micro text-lume-faint">
            Managed by your login account.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="profile-avatar" className="field-label">
            Avatar URL
          </label>
          <input
            id="profile-avatar"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://"
            className="field"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-t3 text-micro text-hand">
          {error}
        </p>
      )}
      {saveProfile.isSuccess && !error && (
        <p className="legend mt-t3 flex items-center gap-1.5 text-tick text-radium">
          <Icon name="check_circle" className="icon-filled text-[14px]" />
          Saved
        </p>
      )}

      <button type="submit" disabled={saveProfile.isPending} className="ctl-primary mt-t4">
        {saveProfile.isPending ? 'Saving' : 'Save changes'}
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const { id: routeId } = useParams();
  const { userId, isAuthenticated, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [listingFilter, setListingFilter] = useState('all');

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

  const listingsQuery = useQuery({
    queryKey: ['profile-listings', profileId],
    queryFn: () => api.get(`/users/${profileId}/auctions`),
    enabled: Boolean(profileId),
  });

  const ratingsQuery = useQuery({
    queryKey: ['profile-ratings', profileId],
    queryFn: () => api.get(`/ratings/user/${profileId}`),
    enabled: Boolean(profileId),
  });

  const profile = profileQuery.data?.user;
  const me = meQuery.data?.user;
  const listings = listingsQuery.data?.auctions ?? [];
  const reviews = ratingsQuery.data?.ratings ?? [];
  const ratingSummary = profile?.stats?.rating ?? ratingsQuery.data?.summary ?? { average: 0, count: 0 };

  const filteredListings = useMemo(() => {
    const filter = LISTING_FILTERS.find((f) => f.key === listingFilter);
    if (!filter?.statuses) return listings;
    return listings.filter((a) => filter.statuses.includes(a.status));
  }, [listings, listingFilter]);

  if (routeId === 'me' && !authLoading && !isAuthenticated) {
    return <Navigate to="/login?redirect=%2Fprofile%2Fme" replace />;
  }

  if (routeId === 'me' && userId) {
    return <Navigate to={`/profile/${userId}`} replace />;
  }

  if (profileQuery.isPending || authLoading) {
    return (
      <div className="space-y-t8" aria-busy="true" aria-label="Loading profile">
        {/* Mirrors the name plate: avatar, name, handle, gauge, stat row. */}
        <div className="register p-t5">
          <div className="flex gap-t4">
            <div className="h-20 w-20 shrink-0 animate-pulse bg-high" />
            <div className="min-w-0 flex-1">
              <div className="h-7 w-48 max-w-full animate-pulse bg-high" />
              <div className="mt-t2 h-3 w-24 animate-pulse bg-high" />
              <div className="mt-t3 h-3 w-40 animate-pulse bg-high" />
            </div>
          </div>
          <div className="mt-t5 flex gap-t4 border-t border-steel pt-t4">
            {[0, 1, 2].map((k) => (
              <div key={k} className="flex-1">
                <div className="h-3 w-20 animate-pulse bg-high" />
                <div className="mt-1 h-8 w-16 animate-pulse bg-high" />
              </div>
            ))}
          </div>
        </div>
        <RegisterStackSkeleton count={2} />
      </div>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <EmptyState
        icon="person_off"
        title="No such account"
        body={profileQuery.error?.message || 'This profile may have been removed.'}
      >
        <Link to="/" className="ctl-primary">
          Back to the board
        </Link>
      </EmptyState>
    );
  }

  const reviewCount = ratingSummary.count || 0;

  return (
    <div className="space-y-t8">
      {/* The name plate: identity, reputation and record on one engraved panel
          rather than a gradient banner with an avatar punched through it. */}
      <section className="register p-t5">
        <div className="flex flex-wrap items-start gap-t4">
          <UserAvatar user={profile} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-title font-bold text-lume sm:text-register">
              {profile.displayName || profile.username}
            </h1>
            <p className="legend mt-1 text-tick text-lume-faint">{profile.username}</p>
            <div className="mt-t3 flex flex-wrap items-center gap-t3">
              <Stars score={ratingSummary.average || 0} size="md" />
              <span className="legend text-tick text-lume-faint">
                <span className="numeral text-lume-dim">{(ratingSummary.average || 0).toFixed(1)}</span> from{' '}
                <span className="numeral text-lume-dim">{reviewCount}</span>
              </span>
            </div>
          </div>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-expanded={editing}
              className="ctl-ghost shrink-0"
            >
              <Icon name={editing ? 'close' : 'edit'} className="text-[16px]" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        <div className="mt-t5 flex border-t border-steel pt-t4">
          <Stat label="Lots listed" value={profile.stats?.auctions ?? 0} />
          <Stat label="Bids placed" value={profile.stats?.bids ?? 0} />
          <Stat label="Member since" value={formatDate(profile.createdAt)} />
        </div>
      </section>

      {isOwnProfile && editing && me && <EditProfileForm me={me} onSaved={() => setEditing(false)} />}

      <section>
        <div className="mb-t3 flex flex-wrap items-end justify-between gap-t3 border-b border-steel pb-t2">
          <h2 className="legend text-legend text-lume-dim">
            Lots <span className="numeral text-body text-lume-faint">{String(listings.length).padStart(2, '0')}</span>
          </h2>
          {listings.length > 0 && (
            <FilterPills
              options={LISTING_FILTERS}
              value={listingFilter}
              onChange={setListingFilter}
              label="Filter lots"
            />
          )}
        </div>

        {listingsQuery.isError && <Alert title="Could not load lots">Listings are unavailable.</Alert>}
        {listingsQuery.isPending && <RegisterStackSkeleton count={2} />}

        {!listingsQuery.isPending && listings.length === 0 && (
          <EmptyState
            icon="inventory_2"
            title="Nothing listed"
            body={isOwnProfile ? 'List a lot to start selling.' : 'This seller has no lots.'}
          >
            {isOwnProfile && (
              <Link to="/sell" className="ctl-primary">
                List a lot
              </Link>
            )}
          </EmptyState>
        )}

        {!listingsQuery.isPending && listings.length > 0 && filteredListings.length === 0 && (
          <EmptyState icon="filter_alt_off" title="None in this state" body="Try another filter.">
            <button type="button" onClick={() => setListingFilter('all')} className="ctl-primary">
              Show all
            </button>
          </EmptyState>
        )}

        {!listingsQuery.isPending && filteredListings.length > 0 && (
          <RegisterStack auctions={filteredListings} />
        )}
      </section>

      <section>
        <h2 className="legend mb-t3 border-b border-steel pb-t2 text-legend text-lume-dim">
          Reviews <span className="numeral text-body text-lume-faint">{String(reviewCount).padStart(2, '0')}</span>
        </h2>

        {ratingsQuery.isPending && (
          <div className="space-y-px" aria-busy="true" aria-label="Loading reviews">
            {[1, 2].map((k) => (
              <div key={k} className="register h-24 animate-pulse" />
            ))}
          </div>
        )}

        {!ratingsQuery.isPending && reviews.length === 0 && (
          <EmptyState
            icon="rate_review"
            title="No reviews"
            body={
              isOwnProfile
                ? 'Complete a sale to start building a record.'
                : 'This account has not been reviewed yet.'
            }
          />
        )}

        {!ratingsQuery.isPending && reviews.length > 0 && (
          <div className="space-y-px bg-steel">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
