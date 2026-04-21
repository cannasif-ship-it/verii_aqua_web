import { type ReactElement, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { getUserFromToken, isTokenValid } from '@/utils/jwt';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { canAccessPath } from '@/features/access-control/utils/hasPermission';
import { Button } from '@/components/ui/button';

const ADMIN_ROLE_TOKENS = ['admin', 'administrator', 'system admin', 'yonetici', 'yönetici', 'roles.admin'];

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

function normalizeRoleValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function isAdminLikeUser(user: { role?: string; roles?: string[] } | null): boolean {
  if (!user) return false;

  const candidateRoles = [
    user.role,
    ...(Array.isArray(user.roles) ? user.roles : []),
  ]
    .map(normalizeRoleValue)
    .filter(Boolean);

  return candidateRoles.some((role) =>
    ADMIN_ROLE_TOKENS.some((token) => role.includes(token)));
}

function resolveAdminLikeUser(
  user: { role?: string; roles?: string[] } | null,
  token: string | null
): boolean {
  if (isAdminLikeUser(user)) {
    return true;
  }

  const tokenUser = token ? getUserFromToken(token) : null;
  return isAdminLikeUser(tokenUser);
}

const MAX_AUTO_RETRY = 3;
const AUTO_RETRY_DELAY_MS = 5000;

interface ProtectedRouteProps {
  children: ReactElement;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const { t } = useTranslation(['common']);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const authReady = useAuthStore((state) => state.authReady);
  const storedToken = getStoredToken();
  const hasValidToken = !!(storedToken && isTokenValid(storedToken));
  const isAuthenticated = !!(user || hasValidToken || token);
  const isAdminUser = resolveAdminLikeUser(user, storedToken || token || null);
  const location = useLocation();
  const myPermissionsQuery = useMyPermissionsQuery();
  const autoRetryCount = useRef(0);

  useEffect(() => {
    if (!myPermissionsQuery.isError) {
      autoRetryCount.current = 0;
      return;
    }

    const statusCode = (myPermissionsQuery.error as AxiosError | null)?.response?.status;
    if (statusCode === 401 || statusCode === 403) return;

    if (autoRetryCount.current >= MAX_AUTO_RETRY) return;

    const timer = setTimeout(() => {
      autoRetryCount.current += 1;
      void myPermissionsQuery.refetch();
    }, AUTO_RETRY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [myPermissionsQuery]);

  if (!authReady) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (location.pathname === '/forbidden' && isAdminUser) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === '/forbidden') {
    return children;
  }

  if (isAdminUser) {
    return children;
  }

  if (myPermissionsQuery.isLoading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (myPermissionsQuery.isError) {
    const statusCode = (myPermissionsQuery.error as AxiosError | null)?.response?.status;
    if (statusCode === 401) {
      return <Navigate to="/auth/login" replace />;
    }

    if (statusCode === 403) {
      if (isAdminUser) {
        return children;
      }
      return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
    }

    if (isAdminUser) {
      return children;
    }

    const isAutoRetrying = autoRetryCount.current < MAX_AUTO_RETRY;

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-200/50 dark:border-red-500/20 bg-white dark:bg-[#0b0713] p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('common.serverErrorTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {isAutoRetrying
              ? t('common.serverErrorRetrying')
              : t('common.serverErrorDescription')}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                autoRetryCount.current = 0;
                void myPermissionsQuery.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
            <Button onClick={() => window.location.reload()}>
              {t('common.refreshPage')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const permissions = myPermissionsQuery.data ?? null;
  const allowed = isAdminUser || canAccessPath(permissions, location.pathname);
  if (!allowed) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  }

  return children;
}
