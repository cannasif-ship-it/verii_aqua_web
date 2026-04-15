import { useQuery } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';

export function useTransferTargetProjectCagesQuery(targetProjectId: number | null) {
  return useQuery({
    queryKey: ['aqua', 'quick-daily-entry', 'transfer-target-project-cages', targetProjectId] as const,
    queryFn: () => aquaQuickDailyApi.getTransferTargetProjectCages(targetProjectId!),
    enabled: targetProjectId != null && targetProjectId > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
