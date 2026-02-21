import { useQuery } from '@tanstack/react-query';
import { aquaQuickApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 60 * 1000;
const QUERY_KEY = ['aqua', 'quick-setup', 'projects'] as const;

export function useProjectListQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => aquaQuickApi.getProjects(),
    staleTime: STALE_TIME_MS,
  });
}
