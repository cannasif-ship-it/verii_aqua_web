import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { projectFormSchema, type ProjectFormSchema } from '../schema/quick-setup-schema';
import type { ProjectDto } from '../types/quick-setup-types';

interface ProjectStepCardProps {
  projects: ProjectDto[] | undefined;
  isLoadingProjects: boolean;
  onCreateProject: (data: ProjectFormSchema) => Promise<void>;
  onSelectProject: (projectId: number) => void;
  isCreating: boolean;
}

export function ProjectStepCard({
  projects,
  isLoadingProjects,
  onCreateProject,
  onSelectProject,
  isCreating,
}: ProjectStepCardProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectFormSchema) as Resolver<ProjectFormSchema>,
    defaultValues: {
      projectCode: '',
      projectName: '',
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const handleSubmit: SubmitHandler<ProjectFormSchema> = async (data) => {
    await onCreateProject(data);
    form.reset();
  };

  const projectOptions = useMemo(
    () =>
      (Array.isArray(projects) ? projects : []).map((p) => ({
        value: String(p.id),
        label: `${p.projectCode ?? ''} - ${p.projectName ?? ''}`,
      })),
    [projects]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickSetup.step1Title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickSetup.code')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickSetup.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickSetup.startDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isCreating}>
              {t('aqua.quickSetup.createProject')}
            </Button>
          </form>
        </Form>
        <div className="text-sm text-muted-foreground">{t('aqua.quickSetup.orSelectExisting')}</div>
        <Combobox
          options={projectOptions}
          value=""
          onValueChange={(v) => { if (v) onSelectProject(Number(v)); }}
          placeholder={t('aqua.quickSetup.selectProject')}
          searchPlaceholder={t('common.search')}
          emptyText={t('common.noResults')}
          disabled={isLoadingProjects}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
