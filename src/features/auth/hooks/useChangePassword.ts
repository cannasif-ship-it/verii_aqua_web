import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { ChangePasswordRequest } from '../types/auth';
import { useAuthStore } from '@/stores/auth-store';

export const useChangePassword = () => {
  const { t } = useTranslation();
  const replaceToken = useAuthStore((state) => state.replaceToken);

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest): Promise<void> => {
      const response = await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || response.exceptionMessage || t('auth.changePassword.error'));
      }

      const newToken = response.data;
      if (!newToken) {
        throw new Error(t('auth.changePassword.error'));
      }

      replaceToken(newToken);
    },
    onSuccess: () => {
      toast.success(t('auth.changePassword.success'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('auth.changePassword.error'));
    },
  });
};
