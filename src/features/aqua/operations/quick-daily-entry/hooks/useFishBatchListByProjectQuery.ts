import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

const STALE_TIME_MS = 30 * 1000;

export function useFishBatchListByProjectQuery(projectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'fish-batches', projectId] as const,
    queryFn: () => aquaQuickDailyApi.getFishBatches(projectId!),
    enabled: projectId != null && projectId > 0,
    staleTime: STALE_TIME_MS,
  });
}
