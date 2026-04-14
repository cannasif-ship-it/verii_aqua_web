import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { aquaSettingsApi } from '../api/aquaSettingsApi';
import type { AquaSettingsDto, UpdateAquaSettingsDto } from '../types/aquaSettings';

export function useUpdateAquaSettingsMutation() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  return useMutation<AquaSettingsDto, Error, UpdateAquaSettingsDto>({
    mutationFn: (data) => aquaSettingsApi.update(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['aqua-settings'], data);
      toast.success(t('aquaSettings.toast.saved'));
    },
    onError: (error) => {
      toast.error(error.message || t('aquaSettings.toast.saveFailed'));
    },
  });
}
