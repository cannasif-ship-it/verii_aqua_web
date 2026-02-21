import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useWeatherTypeListBySeverityQuery(severityId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'weather-types', severityId] as const,
    queryFn: () => aquaQuickDailyApi.getWeatherTypes(severityId!),
    enabled: severityId != null && severityId > 0,
    staleTime: STALE_TIME_MS,
  });
}
