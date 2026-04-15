import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2 } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { AquaSettingsForm } from '../components/AquaSettingsForm';
import { useAquaSettingsQuery } from '../hooks/useAquaSettingsQuery';
import { useUpdateAquaSettingsMutation } from '../hooks/useUpdateAquaSettingsMutation';
import type { AquaSettingsFormSchema } from '../types/aquaSettings';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { hasPermission } from '@/features/access-control/utils/hasPermission';
import { AQUA_SPECIAL_PERMISSION_CODES } from '@/features/access-control/utils/permission-config';

export function AquaSettingsPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const { data, isLoading } = useAquaSettingsQuery();
  const updateMutation = useUpdateAquaSettingsMutation();
  const { data: permissions } = useMyPermissionsQuery();
  const canUpdateSettings =
    !AQUA_SPECIAL_PERMISSION_CODES.settings.update ||
    hasPermission(permissions, AQUA_SPECIAL_PERMISSION_CODES.settings.update);

  useEffect(() => {
    setPageTitle(t('aquaSettings.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const handleSubmit = async (values: AquaSettingsFormSchema): Promise<void> => {
    if (!canUpdateSettings) return;
    await updateMutation.mutateAsync({
      requireFullTransfer: values.requireFullTransfer,
      allowProjectMerge: values.allowProjectMerge,
      partialTransferOccupiedCageMode: values.partialTransferOccupiedCageMode,
      feedCostFallbackStrategy: values.feedCostFallbackStrategy,
    });
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-10 overflow-hidden w-full">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5">
              <Settings2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('aquaSettings.pageTitle')}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 ml-1">
            {t('aquaSettings.pageDescription')}
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <AquaSettingsForm
          data={data}
          isLoading={isLoading}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmit}
          canSubmit={canUpdateSettings}
        />
      </div>
    </div>
  );
}
