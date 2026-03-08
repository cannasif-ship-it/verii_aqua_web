import { useQuery } from '@tanstack/react-query';
import i18n from '@/lib/i18n';
import { authApi } from '../api/auth-api';
import { queryKeys } from '../utils/query-keys';

export const useActiveUsers = () => {
  return useQuery({
    queryKey: queryKeys.activeUsers(),
    queryFn: async () => {
      const response = await authApi.getActiveUsers();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || i18n.t('activeUsersLoadFailed', { ns: 'auth' }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
