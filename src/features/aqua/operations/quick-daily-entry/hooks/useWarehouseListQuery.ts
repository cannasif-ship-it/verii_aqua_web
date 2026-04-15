import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 60 * 1000;
const QUERY_KEY = ['aqua', 'quick-daily-entry', 'warehouses'] as const;

export function useWarehouseListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => aquaQuickDailyApi.getWarehouses(),
    staleTime: STALE_TIME_MS,
  });
}
