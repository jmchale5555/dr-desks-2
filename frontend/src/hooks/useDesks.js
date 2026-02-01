import { useApi } from './useApi';
import { deskService } from '../services/deskService';

export function useDesks(filters = {}) {
  const { data, loading, error, refetch } = useApi(
    () => deskService.getDesks(filters),
    true // Load immediately
  );

  return {
    desks: data || [],
    loading,
    error,
    refetch,
  };
}

export function useDesk(id) {
  const { data, loading, error } = useApi(
    () => deskService.getDesk(id),
    !!id // Only load if ID exists
  );

  return {
    desk: data,
    loading,
    error,
  };
}
