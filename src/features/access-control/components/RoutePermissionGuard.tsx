import { type ReactElement, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { PageLoader } from '@/components/shared/PageLoader';
import { useMyPermissionsQuery } from '../hooks/useMyPermissionsQuery';
import { canAccessPath } from '../utils/hasPermission';
import { UnauthorizedPage } from './UnauthorizedPage';
import { markPerformanceEnd, markPerformanceStart } from '@/lib/performance';
import { useAuthStore } from '@/stores/auth-store';
import { getUserFromToken } from '@/utils/jwt';

const ADMIN_ROLE_TOKENS = ['admin', 'administrator', 'system admin', 'yonetici', 'yönetici', 'roles.admin'];

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

/** Lazy route geçişlerinde RR7 + Suspense birleşiminde Outlet’in takılmasını önlemek için doğrudan sarılı Outlet. */
function LazyRouteOutlet(): ReactElement {
  const location = useLocation();
  return (
    <Suspense key={location.key} fallback={<PageLoader />}>
      <Outlet key={location.key} />
    </Suspense>
  );
}

export function RoutePermissionGuard(): ReactElement {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token)
    || (typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      : null);
  const isAdminUser = resolveAdminLikeUser(user, token);
  const { data: permissions, isLoading, isError, error } = useMyPermissionsQuery();

  useEffect(() => {
    const measurementName = `route-render:${location.pathname}`;
    const startMark = markPerformanceStart(measurementName);

    const rafId = window.requestAnimationFrame(() => {
      markPerformanceEnd(measurementName, startMark);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [location.pathname, location.key]);

  if (isAdminUser) {
    return <LazyRouteOutlet />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (isError) {
    const statusCode = (error as AxiosError | null)?.response?.status;
    if (statusCode === 403) {
      if (isAdminUser) {
        return <LazyRouteOutlet />;
      }
      return <UnauthorizedPage />;
    }
    if (isAdminUser) {
      return <LazyRouteOutlet />;
    }
    return <LazyRouteOutlet />;
  }

  if (!permissions) {
    if (isAdminUser) {
      return <LazyRouteOutlet />;
    }
    return <UnauthorizedPage />;
  }

  if (isAdminUser || canAccessPath(permissions, location.pathname)) {
    return <LazyRouteOutlet />;
  }

  return <UnauthorizedPage />;
}
