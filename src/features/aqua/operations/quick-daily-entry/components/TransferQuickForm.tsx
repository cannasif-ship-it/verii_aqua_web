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
import { Combobox } from '@/components/ui/combobox';
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
  }, [projectId, projectCageId, form]);

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
          return aHasBatch ? 1 : -1;
        }),
    [projectCages, projectCageId, activeBatchByCageId]
  );

  const targetCageOptions = useMemo(
    () =>
      targetCages.map((pc) => ({
        value: String(pc.id),
        label:
          (pc.cageCode ?? pc.cageName ?? String(pc.id)) +
          (activeBatchByCageId[pc.id]
            ? ` (${t('aqua.quickDailyEntry.transfer.occupied', { defaultValue: 'Dolu' })})`
            : ` (${t('aqua.quickDailyEntry.transfer.empty', { defaultValue: 'Boş' })})`),
      })),
    [targetCages, activeBatchByCageId, t]
  );

  const handleSubmit: SubmitHandler<TransferQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ toProjectCageId: 0, fishCount: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null || sourceBatch == null;

  const labelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide ml-1";
  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl disabled:opacity-50";

  return (
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">
          {t('aqua.quickDailyEntry.transfer.title', { defaultValue: 'Kafes Değişimi' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-400 backdrop-blur-md">
              {sourceBatch
                ? t('aqua.quickDailyEntry.transfer.sourceInfo', {
                    fishBatchId: sourceBatch.fishBatchId,
                    liveCount: sourceBatch.liveCount,
                    defaultValue: `Kaynak batch #${sourceBatch.fishBatchId} - Canlı: ${sourceBatch.liveCount}`,
                  })
                : t('aqua.quickDailyEntry.transfer.noSourceBatch', {
                    defaultValue: 'Seçili kafeste aktif batch bulunamadı.',
                  })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="toProjectCageId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>
                        {t('aqua.quickDailyEntry.transfer.targetCage', { defaultValue: 'Hedef Kafes' })}
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={targetCageOptions}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                          placeholder={t('aqua.quickDailyEntry.selectCage')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noResults')}
                          className={inputStyle}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fishCount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>
                        {t('aqua.quickDailyEntry.transfer.fishCount', { defaultValue: 'Adet' })}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} className={inputStyle} {...field} readOnly disabled />
                      </FormControl>
                      <p className="text-xs text-slate-500 ml-1">
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
                    <FormItem className="space-y-2 md:col-span-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.transfer.description', { defaultValue: 'Açıklama' })}</FormLabel>
                      <FormControl>
                        <Input className={inputStyle} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="pt-2 flex justify-end border-t border-white/5">
                <Button type="submit" disabled={disabled || isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20 mt-4">
                  {t('aqua.quickDailyEntry.transfer.save', { defaultValue: 'Kaydet' })}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}