import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
  });
}

export function useCategoryList() {
  const query = useCategories();
  return {
    ...query,
    categories: query.data?.categories ?? [],
  };
}
