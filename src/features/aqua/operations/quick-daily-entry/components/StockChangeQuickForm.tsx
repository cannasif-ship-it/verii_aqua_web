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
import { calculateIncrementedAverageGram } from '@/features/aqua/shared/batch-math';
import {
  stockChangeQuickFormSchema,
  type StockChangeQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { ActiveCageBatchSnapshot, FishBatchDto } from '../types/quick-daily-entry-types';

interface StockChangeQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  fishBatches: FishBatchDto[] | undefined;
  sourceBatch: ActiveCageBatchSnapshot | null;
  onSubmit: (data: StockChangeQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function StockChangeQuickForm({
  projectId,
  projectCageId,
  fishBatches,
  sourceBatch,
  onSubmit,
  isSubmitting,
}: StockChangeQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<StockChangeQuickFormSchema>({
    resolver: zodResolver(stockChangeQuickFormSchema) as Resolver<StockChangeQuickFormSchema>,
    defaultValues: { toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' },
  });

  useEffect(() => {
    form.reset({ toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' });
  }, [projectId, projectCageId, form]);

  const targetBatches = useMemo(
    () => (Array.isArray(fishBatches) ? fishBatches : []).filter((x) => x.id !== sourceBatch?.fishBatchId),
    [fishBatches, sourceBatch]
  );

  const targetBatchOptions = useMemo(
    () => targetBatches.map((b) => ({ value: String(b.id), label: `Batch #${b.id}` })),
    [targetBatches]
  );
  const newAverageGramValue = Number(form.watch('newAverageGram') || 0);

  const handleSubmit: SubmitHandler<StockChangeQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null || sourceBatch == null;

  const labelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide ml-1";
  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">
          {t('aqua.quickDailyEntry.stockChange.title', { defaultValue: 'Stok Değişimi' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400 backdrop-blur-md">
              {sourceBatch
                ? t('aqua.quickDailyEntry.stockChange.sourceInfo', {
                    fishBatchId: sourceBatch.fishBatchId,
                    liveCount: sourceBatch.liveCount,
                    defaultValue: `Kaynak batch #${sourceBatch.fishBatchId} - Canlı: ${sourceBatch.liveCount}`,
                  })
                : t('aqua.quickDailyEntry.stockChange.noSourceBatch', {
                    defaultValue: 'Seçili kafeste aktif batch bulunamadı.',
                  })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="toFishBatchId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>
                        {t('aqua.quickDailyEntry.stockChange.targetBatch', { defaultValue: 'Hedef Batch' })}
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={targetBatchOptions}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                          placeholder={t('aqua.quickDailyEntry.netOperation.selectBatch')}
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
                        {t('aqua.quickDailyEntry.stockChange.fishCount', { defaultValue: 'Adet' })}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} className={inputStyle} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newAverageGram"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>
                        {t('aqua.quickDailyEntry.stockChange.newAverageGram', { defaultValue: 'Eklenecek Gram' })}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={0.001} step={0.001} className={inputStyle} {...field} />
                      </FormControl>
                      <p className="text-xs text-slate-500 ml-1">
                        {t('aqua.quickDailyEntry.stockChange.gramInfo', {
                          defaultValue: 'Mevcut gram: {{oldGram}} | Eklenecek: {{increase}} | Yeni toplam: {{newGram}}',
                          oldGram: sourceBatch?.averageGram ?? 0,
                          increase: newAverageGramValue,
                          newGram: calculateIncrementedAverageGram(sourceBatch?.averageGram ?? 0, newAverageGramValue),
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
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.stockChange.description', { defaultValue: 'Açıklama' })}</FormLabel>
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
                  {t('aqua.quickDailyEntry.stockChange.save', { defaultValue: 'Kaydet' })}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}