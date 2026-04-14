import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { projectMergeApi } from '../api/projectMergeApi';
import type { CreateProjectMergeDto, ProjectMergeDto } from '../types/projectMerge';

export function useCreateProjectMergeMutation() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  return useMutation<ProjectMergeDto, Error, CreateProjectMergeDto>({
    mutationFn: (data) => projectMergeApi.create(data),
    onSuccess: async () => {
      toast.success(t('projectMerge.toast.saved'));
      await queryClient.invalidateQueries({ queryKey: ['aqua', 'project-merges'] });
      await queryClient.invalidateQueries({ queryKey: ['aqua', 'quick-daily-entry', 'projects'] });
    },
    onError: (error) => {
      toast.error(error.message || t('projectMerge.toast.saveFailed'));
    },
  });
}
