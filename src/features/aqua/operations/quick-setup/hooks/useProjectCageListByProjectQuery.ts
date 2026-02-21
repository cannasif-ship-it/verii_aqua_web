import { useQuery } from '@tanstack/react-query';
import { aquaQuickApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 30 * 1000;

export function useProjectCageListByProjectQuery(projectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-setup', 'project-cages', projectId] as const,
    queryFn: () => aquaQuickApi.getProjectCages(projectId!),
    enabled: projectId != null && projectId > 0,
    staleTime: STALE_TIME_MS,
  });
}
