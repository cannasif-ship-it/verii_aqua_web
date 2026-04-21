import { useQuery } from '@tanstack/react-query';
import { userDetailApi } from '../api/user-detail-api';
import { queryKeys } from '../utils/query-keys';
import type { UserDetailDto } from '../types/user-detail-types';

export const useUserDetailByUserId = (
  userId: number,
  enabled = true,
): ReturnType<typeof useQuery<UserDetailDto | null>> => {
  return useQuery({
    queryKey: queryKeys.byUserId(userId),
    queryFn: () => userDetailApi.getByUserId(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
