import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { projectMergeFormSchema, type ProjectMergeFormSchema } from '../../project-merges/types/projectMerge';
import type { ProjectDto } from '../types/quick-daily-entry-types';
import { formatLabelWithKey } from '@/shared/utils/dropdown-label';
import { ChevronRight, Save } from 'lucide-react';

interface ProjectMergeQuickFormProps {
  selectedProjectId: number | null;
  selectedDate: string;
  projects: ProjectDto[];
  onSubmit: (data: ProjectMergeFormSchema) => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
  mergeEnabled: boolean;
}

export function ProjectMergeQuickForm({
  selectedProjectId,
  selectedDate,
  projects,
  onSubmit,
  isSubmitting,
  canSubmit,
  mergeEnabled,
}: ProjectMergeQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<ProjectMergeFormSchema>({
    resolver: zodResolver(projectMergeFormSchema) as Resolver<ProjectMergeFormSchema>,
    mode: 'onChange',
    defaultValues: {
      targetProjectId: selectedProjectId ?? 0,
      mergeDate: selectedDate,
      description: '',
      sourceProjectStateAfterMerge: 1,
      sourceProjectIds: [],
    },
  });

  const targetProjectId = form.watch('targetProjectId');
  const sourceProjectIds = form.watch('sourceProjectIds');

  useEffect(() => {
    form.setValue('mergeDate', selectedDate, { shouldDirty: false, shouldValidate: true });
  }, [form, selectedDate]);

  useEffect(() => {
    if (selectedProjectId == null) return;
    form.setValue('targetProjectId', selectedProjectId, { shouldDirty: false, shouldValidate: true });
  }, [form, selectedProjectId]);

  useEffect(() => {
    if (!targetProjectId) return;
    if (!sourceProjectIds.includes(targetProjectId)) return;
    form.setValue(
      'sourceProjectIds',
      sourceProjectIds.filter((id) => id !== targetProjectId),
      { shouldDirty: true, shouldValidate: true }
    );
  }, [form, sourceProjectIds, targetProjectId]);

  const handleSubmit: SubmitHandler<ProjectMergeFormSchema> = async (values) => {
    await onSubmit(values);
    form.reset({
      targetProjectId: selectedProjectId ?? 0,
      mergeDate: selectedDate,
      description: '',
      sourceProjectStateAfterMerge: 1,
      sourceProjectIds: [],
    });
  };

  const availableSourceProjects = projects.filter((project) => Number(project.id) !== Number(targetProjectId || 0));
  const projectOptions = projects.map((project) => ({
    value: String(project.id),
    label: formatLabelWithKey(`${project.projectCode} - ${project.projectName}`, project.id),
  }));
  const sourceStateOptions = [
    { value: '0', label: t('projectMerge.options.sourceStateAfterMerge.0') },
    { value: '1', label: t('projectMerge.options.sourceStateAfterMerge.1') },
  ];
  const labelStyle = 'text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-1.5';
  const inputStyle = 'bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200';

  return (
    <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-slate-200 dark:border-cyan-800/30 px-6 py-5 bg-slate-50/50 dark:bg-blue-950/30">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('aqua.quickDailyEntry.projectMerge.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="targetProjectId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel required className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('projectMerge.fields.targetProject')}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={projectOptions}
                        value={field.value > 0 ? String(field.value) : ''}
                        onValueChange={(value) => field.onChange(Number(value))}
                        className={inputStyle}
                        placeholder={t('common.select')}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mergeDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel required className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('projectMerge.fields.mergeDate')}
                    </FormLabel>
                    <FormControl><Input type="date" className={inputStyle} {...field} /></FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sourceProjectStateAfterMerge"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('projectMerge.fields.sourceStateAfterMerge')}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={sourceStateOptions}
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        className={inputStyle}
                        placeholder={t('common.select')}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('projectMerge.fields.description')}
                  </FormLabel>
                  <FormControl><Input className={inputStyle} {...field} /></FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceProjectIds"
              render={() => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelStyle}>
                    <ChevronRight size={14} className="text-cyan-500" />
                    {t('projectMerge.fields.sourceProjects')}
                  </FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50/70 dark:bg-blue-950/20">
                    {availableSourceProjects.map((project) => {
                      const checked = sourceProjectIds.includes(project.id);
                      return (
                        <label
                          key={project.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/50 px-4 py-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={!mergeEnabled}
                            onCheckedChange={(nextChecked) => {
                              const nextIds = nextChecked
                                ? [...sourceProjectIds, project.id]
                                : sourceProjectIds.filter((id) => id !== project.id);
                              form.setValue('sourceProjectIds', nextIds, { shouldDirty: true, shouldValidate: true });
                            }}
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{project.projectCode}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{project.projectName}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-cyan-800/30">
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid || !canSubmit || !mergeEnabled}
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg shadow-cyan-500/25 border-0 flex items-center gap-2"
              >
                <Save size={18} />
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
