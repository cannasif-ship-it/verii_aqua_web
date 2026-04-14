import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GitMerge, Archive, PauseCircle } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useAquaSettingsQuery } from '@/features/aqua/settings/hooks/useAquaSettingsQuery';
import { useProjectListQuery } from '../../quick-daily-entry/hooks/useProjectListQuery';
import { useProjectMergeListQuery } from '../hooks/useProjectMergeListQuery';
import { useCreateProjectMergeMutation } from '../hooks/useCreateProjectMergeMutation';
import { ProjectMergeForm } from '../components/ProjectMergeForm';
import type { ProjectMergeFormSchema } from '../types/projectMerge';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { hasPermission } from '@/features/access-control/utils/hasPermission';
import { AQUA_SPECIAL_PERMISSION_CODES } from '@/features/access-control/utils/permission-config';

export function ProjectMergesPage(): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const { data: aquaSettings } = useAquaSettingsQuery();
  const { data: projects } = useProjectListQuery();
  const { data: merges, isLoading } = useProjectMergeListQuery();
  const createMutation = useCreateProjectMergeMutation();
  const { data: permissions } = useMyPermissionsQuery();

  const canCreateProjectMerge =
    !AQUA_SPECIAL_PERMISSION_CODES.projectMerges.create ||
    hasPermission(permissions, AQUA_SPECIAL_PERMISSION_CODES.projectMerges.create);

  useEffect(() => {
    setPageTitle(t('projectMerge.pageTitle'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const handleSubmit = async (values: ProjectMergeFormSchema): Promise<void> => {
    if (!canCreateProjectMerge) return;
    await createMutation.mutateAsync(values);
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-10 overflow-hidden w-full">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5">
              <GitMerge className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('projectMerge.pageTitle')}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 ml-1">
            {t('projectMerge.pageDescription')}
          </p>
        </div>
      </div>

      <ProjectMergeForm
        projects={Array.isArray(projects) ? projects : []}
        canSubmit={canCreateProjectMerge}
        isSubmitting={createMutation.isPending}
        mergeEnabled={aquaSettings?.allowProjectMerge ?? false}
        onSubmit={handleSubmit}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Array.isArray(merges) ? merges : []).map((merge) => (
          <div
            key={merge.id}
            className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/60 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                  {merge.targetProjectCode}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {merge.targetProjectName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {new Date(merge.mergeDate).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-cyan-800/30 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {merge.sourceProjectStateAfterMerge === 0 ? <PauseCircle className="size-3.5" /> : <Archive className="size-3.5" />}
                {t(`projectMerge.options.sourceStateAfterMerge.${merge.sourceProjectStateAfterMerge}`)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {t('projectMerge.history.sourceProjects')}
              </div>
              <div className="flex flex-wrap gap-2">
                {merge.sourceProjects.map((sourceProject) => (
                  <span
                    key={sourceProject.id}
                    className="rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300"
                  >
                    {sourceProject.sourceProjectCode} - {sourceProject.sourceProjectName}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50/70 dark:bg-blue-950/30">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {t('projectMerge.history.cageCount')}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {merge.cages.length}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50/70 dark:bg-blue-950/30">
                <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {t('projectMerge.history.mergeCount')}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {merge.sourceProjects.length}
                </div>
              </div>
            </div>

            {merge.description && (
              <div className="rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-blue-950/30">
                {merge.description}
              </div>
            )}
          </div>
        ))}

        {!isLoading && (Array.isArray(merges) ? merges : []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-cyan-800/30 bg-white/70 dark:bg-blue-950/30 p-8 text-center text-slate-500 dark:text-slate-400 lg:col-span-2">
            {t('projectMerge.history.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
