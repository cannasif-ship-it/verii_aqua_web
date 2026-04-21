import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { authAccessApi } from '../api/authAccessApi';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';
import { getUserFromToken } from '@/utils/jwt';
import type { MyPermissionsDto } from '../types/access-control.types';

const STALE_TIME_MS = 5 * 60 * 1000;
const ADMIN_ROLE_TOKENS = ['admin', 'administrator', 'system admin', 'yonetici', 'yönetici', 'roles.admin'];

function normalizeRoleValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function isAdminLikeUser(user: { role?: string; roles?: string[] } | null): boolean {
  if (!user) return false;

  const candidateRoles = [user.role, ...(Array.isArray(user.roles) ? user.roles : [])]
    .map(normalizeRoleValue)
    .filter(Boolean);

  return candidateRoles.some((role) => ADMIN_ROLE_TOKENS.some((token) => role.includes(token)));
}

function mergeUserWithTokenRoles(
  user: { id?: number; role?: string; roles?: string[] } | null,
  tokenUser: { id: number; role?: string; roles?: string[] } | null
) {
  if (!user) return tokenUser;
  if (!tokenUser) return user;

  return {
    ...user,
    role: user.role ?? tokenUser.role,
    roles:
      Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : tokenUser.roles,
  };
}

export const useMyPermissionsQuery = () => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const token = useAuthStore((s) => s.token);
  const authReady = useAuthStore((s) => s.authReady);
  const storedToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      : null;
  const effectiveToken = token || storedToken;
  const tokenUser = getUserFromToken(effectiveToken ?? '');
  const effectiveUserId = userId ?? tokenUser?.id ?? null;
  const effectiveUser = mergeUserWithTokenRoles(useAuthStore.getState().user, tokenUser);
  const isAdminUser = isAdminLikeUser(effectiveUser);

  const query = useQuery({
    queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS(effectiveUserId),
    queryFn: async (): Promise<MyPermissionsDto> => {
      return authAccessApi.getMyPermissions();
    },
    enabled: authReady && !!effectiveToken && !!effectiveUserId && !isAdminUser,
    staleTime: STALE_TIME_MS,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  if (isAdminUser) {
    const adminPermissions: MyPermissionsDto = {
      userId: effectiveUserId ?? 0,
      roleTitle: effectiveUser?.role ?? 'ROLES.ADMIN',
      isSystemAdmin: true,
      permissionGroups: ['System Admin'],
      permissionCodes: ['*'],
    };

    return {
      ...query,
      data: adminPermissions,
      isLoading: false,
      isFetching: false,
      isPending: false,
      isError: false,
      error: null,
      status: 'success' as const,
      fetchStatus: 'idle' as const,
    };
  }

  return query;
};
