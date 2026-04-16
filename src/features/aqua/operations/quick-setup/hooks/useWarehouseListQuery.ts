import { useQuery } from '@tanstack/react-query';
import { aquaQuickApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 60 * 1000;
const QUERY_KEY = ['aqua', 'quick-setup', 'warehouses'] as const;

export function useWarehouseListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => aquaQuickApi.getWarehouses(),
    staleTime: STALE_TIME_MS,
  });
}
