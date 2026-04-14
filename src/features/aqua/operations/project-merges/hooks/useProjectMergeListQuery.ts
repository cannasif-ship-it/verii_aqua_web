import { useQuery } from '@tanstack/react-query';
import { projectMergeApi } from '../api/projectMergeApi';

export function useProjectMergeListQuery() {
  return useQuery({
    queryKey: ['aqua', 'project-merges'] as const,
    queryFn: () => projectMergeApi.getList(),
    staleTime: 30_000,
  });
}
