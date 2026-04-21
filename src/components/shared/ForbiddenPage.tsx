import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

export function ForbiddenPage(): ReactElement {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();
  const storedToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      : null;
  const user = useAuthStore((state) => state.user) ?? (storedToken ? getUserFromToken(storedToken) : null);
  const isAdminUser = isAdminLikeUser(user);
  const from = (location.state as { from?: string } | null)?.from;

  if (isAdminUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0713] backdrop-blur-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('common.forbiddenTitle')}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t('common.forbiddenDescription')}
        </p>
        {from ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t('common.forbiddenFrom')}: <span className="font-mono">{from}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t('common.goBack')}
          </Button>
          <Button onClick={() => navigate('/')}>
            {t('common.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
