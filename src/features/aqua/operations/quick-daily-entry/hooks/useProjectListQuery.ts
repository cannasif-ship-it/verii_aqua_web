import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 60 * 1000;
const QUERY_KEY = ['aqua', 'quick-daily-entry', 'projects'] as const;

export function useProjectListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => aquaQuickDailyApi.getProjects(),
    staleTime: STALE_TIME_MS,
  });
}
