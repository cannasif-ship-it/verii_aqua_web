import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 5 * 60 * 1000;
const QUERY_KEY = ['aqua', 'quick-daily-entry', 'weather-severities'] as const;

export function useWeatherSeverityListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => aquaQuickDailyApi.getWeatherSeverities(),
    staleTime: STALE_TIME_MS,
  });
}
