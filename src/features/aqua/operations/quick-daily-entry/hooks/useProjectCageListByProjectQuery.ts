import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 30 * 1000;

export function useProjectCageListByProjectQuery(projectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'project-cages', projectId] as const,
    queryFn: () => aquaQuickDailyApi.getProjectCages(projectId!),
    enabled: projectId != null && projectId > 0,
    staleTime: STALE_TIME_MS,
  });
}
