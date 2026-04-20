import { type ReactElement, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { PageLoader } from '@/components/shared/PageLoader';
import { useMyPermissionsQuery } from '../hooks/useMyPermissionsQuery';
import { canAccessPath } from '../utils/hasPermission';
import { UnauthorizedPage } from './UnauthorizedPage';

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
  const { data: permissions, isLoading, isError, error } = useMyPermissionsQuery();

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
      return <UnauthorizedPage />;
    }
    return <LazyRouteOutlet />;
  }

  if (!permissions) {
    return <UnauthorizedPage />;
  }

  if (canAccessPath(permissions, location.pathname)) {
    return <LazyRouteOutlet />;
  }

  return <UnauthorizedPage />;
}
