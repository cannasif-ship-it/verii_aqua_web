import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function WelcomePage(): ReactElement {
  const { t } = useTranslation('common');
  const user = useAuthStore((state) => state.user);
  const displayName = user?.name || user?.email || t('welcome.userFallback');

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/80 shadow-lg dark:border-white/10 dark:bg-white/5">
        <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Droplets className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              {t('welcome.title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t('welcome.greeting', { name: displayName })}
            </p>
          </div>
          <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
            {t('welcome.subtitle')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
