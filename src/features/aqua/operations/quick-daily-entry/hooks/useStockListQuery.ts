import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 60 * 1000;
const QUERY_KEY = ['aqua', 'quick-daily-entry', 'stocks'] as const;

export function useStockListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => aquaQuickDailyApi.getStocks(),
    staleTime: STALE_TIME_MS,
  });
}
