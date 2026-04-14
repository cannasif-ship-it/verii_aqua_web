import { type ReactElement, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { GitMerge, Layers3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatLabelWithKey } from '@/shared/utils/dropdown-label';
import type { ProjectDto } from '../../quick-daily-entry/types/quick-daily-entry-types';
import { projectMergeFormSchema, type ProjectMergeFormSchema } from '../types/projectMerge';

interface ProjectMergeFormProps {
  projects: ProjectDto[];
  canSubmit: boolean;
  isSubmitting: boolean;
  mergeEnabled: boolean;
  onSubmit: (data: ProjectMergeFormSchema) => void | Promise<void>;
}

export function ProjectMergeForm({
  projects,
  canSubmit,
  isSubmitting,
  mergeEnabled,
  onSubmit,
}: ProjectMergeFormProps): ReactElement {
  const { t } = useTranslation('common');

  const form = useForm<ProjectMergeFormSchema>({
    resolver: zodResolver(projectMergeFormSchema) as Resolver<ProjectMergeFormSchema>,
    mode: 'onChange',
    defaultValues: {
      targetProjectId: 0,
      mergeDate: new Date().toISOString().slice(0, 10),
      description: '',
      sourceProjectStateAfterMerge: 1,
      sourceProjectIds: [],
    },
  });

  const targetProjectId = form.watch('targetProjectId');
  const sourceProjectIds = form.watch('sourceProjectIds');

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
      targetProjectId: 0,
      mergeDate: new Date().toISOString().slice(0, 10),
      description: '',
      sourceProjectStateAfterMerge: 1,
      sourceProjectIds: [],
    });
  };

  const availableSourceProjects = projects.filter((project) => Number(project.id) !== Number(targetProjectId || 0));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
        <Card className="bg-white dark:bg-blue-950/60 border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-blue-950/30 border-b border-slate-200 dark:border-cyan-800/30">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitMerge className="size-5 text-cyan-600 dark:text-cyan-400" />
              {t('projectMerge.form.title')}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {mergeEnabled ? t('projectMerge.form.description') : t('projectMerge.form.disabledDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="targetProjectId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('projectMerge.fields.targetProject')}</FormLabel>
                    <Select value={field.value > 0 ? String(field.value) : ''} onValueChange={(value) => field.onChange(Number(value))} disabled={!mergeEnabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>
                            {formatLabelWithKey(`${project.projectCode} - ${project.projectName}`, project.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mergeDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('projectMerge.fields.mergeDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!mergeEnabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceProjectStateAfterMerge"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('projectMerge.fields.sourceStateAfterMerge')}</FormLabel>
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))} disabled={!mergeEnabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{t('projectMerge.options.sourceStateAfterMerge.0')}</SelectItem>
                        <SelectItem value="1">{t('projectMerge.options.sourceStateAfterMerge.1')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t('projectMerge.fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={!mergeEnabled} placeholder={t('projectMerge.fields.descriptionPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceProjectIds"
              render={() => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <Layers3 className="size-4 text-cyan-500" />
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
                              form.setValue('sourceProjectIds', nextIds, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {project.projectCode}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {project.projectName}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
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
                {t('projectMerge.form.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
