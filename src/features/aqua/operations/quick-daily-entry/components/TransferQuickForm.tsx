import { type ReactElement, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  transferQuickFormSchema,
  type TransferQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { ActiveCageBatchSnapshot, ProjectCageDto } from '../types/quick-daily-entry-types';

interface TransferQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  projectCages: ProjectCageDto[] | undefined;
  sourceBatch: ActiveCageBatchSnapshot | null;
  activeBatchByCageId: Record<number, ActiveCageBatchSnapshot | null>;
  onSubmit: (data: TransferQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function TransferQuickForm({
  projectId,
  projectCageId,
  projectCages,
  sourceBatch,
  activeBatchByCageId,
  onSubmit,
  isSubmitting,
}: TransferQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<TransferQuickFormSchema>({
    resolver: zodResolver(transferQuickFormSchema) as Resolver<TransferQuickFormSchema>,
    defaultValues: { toProjectCageId: 0, fishCount: 0, description: '' },
  });

  useEffect(() => {
    form.reset({ toProjectCageId: 0, fishCount: 0, description: '' });
  }, [projectId, projectCageId]);

  useEffect(() => {
    form.setValue('fishCount', Number(sourceBatch?.liveCount ?? 0), {
      shouldValidate: true,
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [sourceBatch, form]);

  const targetCages = useMemo(
    () =>
      (Array.isArray(projectCages) ? projectCages : [])
        .filter((x) => x.id !== projectCageId)
        .sort((a, b) => {
          const aHasBatch = activeBatchByCageId[a.id] != null;
          const bHasBatch = activeBatchByCageId[b.id] != null;
          if (aHasBatch === bHasBatch) return 0;
          return aHasBatch ? 1 : -1; // Empty cages first
        }),
    [projectCages, projectCageId, activeBatchByCageId]
  );

  const handleSubmit: SubmitHandler<TransferQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ toProjectCageId: 0, fishCount: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null || sourceBatch == null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('aqua.quickDailyEntry.transfer.title', { defaultValue: 'Kafes Değişimi' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="rounded-md border border-dashed border-cyan-400/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              {sourceBatch
                ? t('aqua.quickDailyEntry.transfer.sourceInfo', {
                    defaultValue: `Kaynak batch #${sourceBatch.fishBatchId} - Canlı: ${sourceBatch.liveCount}`,
                  })
                : t('aqua.quickDailyEntry.transfer.noSourceBatch', {
                    defaultValue: 'Seçili kafeste aktif batch bulunamadı.',
                  })}
            </div>
            <FormField
              control={form.control}
              name="toProjectCageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aqua.quickDailyEntry.transfer.targetCage', { defaultValue: 'Hedef Kafes' })}
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.selectCage')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {targetCages.map((pc) => (
                        <SelectItem key={pc.id} value={String(pc.id)}>
                          {(pc.cageCode ?? pc.cageName ?? String(pc.id)) +
                            (activeBatchByCageId[pc.id]
                              ? ` (${t('aqua.quickDailyEntry.transfer.occupied', { defaultValue: 'Dolu' })})`
                              : ` (${t('aqua.quickDailyEntry.transfer.empty', { defaultValue: 'Boş' })})`)}
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
              name="fishCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('aqua.quickDailyEntry.transfer.fishCount', { defaultValue: 'Adet' })}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} readOnly disabled />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t('aqua.quickDailyEntry.transfer.fishCountAutoInfo', {
                      defaultValue: 'Adet otomatik olarak kaynak kafesteki canlı sayısından alınır.',
                    })}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.transfer.description', { defaultValue: 'Açıklama' })}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.transfer.save', { defaultValue: 'Kaydet' })}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
