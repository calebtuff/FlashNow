import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function favoriteIdsQueryKey(userId) {
  return ['favorite-ids', userId];
}

export function useFavoriteIds() {
  const { userId, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: favoriteIdsQueryKey(userId),
    queryFn: () => api.get('/favorites/ids'),
    enabled: isAuthenticated,
  });

  const favoriteIds = useMemo(
    () => new Set(query.data?.auctionIds ?? []),
    [query.data?.auctionIds]
  );

  return {
    ...query,
    favoriteIds,
    isFavorited: (auctionId) => favoriteIds.has(auctionId),
  };
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const idsKey = favoriteIdsQueryKey(userId);

  return useMutation({
    mutationFn: async ({ auctionId, favorited }) => {
      if (favorited) {
        return api.delete(`/favorites/${auctionId}`);
      }
      return api.post(`/favorites/${auctionId}`);
    },
    onMutate: async ({ auctionId, favorited }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previous = queryClient.getQueryData(idsKey);

      queryClient.setQueryData(idsKey, (current) => {
        const ids = current?.auctionIds ?? [];
        const nextIds = favorited
          ? ids.filter((id) => id !== auctionId)
          : ids.includes(auctionId)
            ? ids
            : [...ids, auctionId];
        return { ...(current ?? {}), auctionIds: nextIds };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(idsKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: idsKey });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['auction'] });
    },
  });
}
