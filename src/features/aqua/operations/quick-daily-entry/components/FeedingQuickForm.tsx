import { type ReactElement } from 'react';
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
import { feedingQuickFormSchema, type FeedingQuickFormSchema } from '../schema/quick-daily-entry-schema';
import type { StockDto } from '../types/quick-daily-entry-types';

interface FeedingQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  stocks: StockDto[] | undefined;
  isLoadingStocks: boolean;
  onSubmit: (data: FeedingQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function FeedingQuickForm({
  projectId,
  projectCageId,
  stocks,
  isLoadingStocks,
  onSubmit,
  isSubmitting,
}: FeedingQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<FeedingQuickFormSchema>({
    resolver: zodResolver(feedingQuickFormSchema) as Resolver<FeedingQuickFormSchema>,
    defaultValues: {
      feedingSlot: 0,
      stockId: 0,
      qtyUnit: 0,
      gramPerUnit: 0,
    },
  });

  const handleSubmit: SubmitHandler<FeedingQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ feedingSlot: 0, stockId: 0, qtyUnit: 0, gramPerUnit: 0 });
  };

  const disabled = projectId == null || projectCageId == null;

  const feedingSlotOptions = [
    { value: '0', label: t('aqua.quickDailyEntry.feeding.morning') },
    { value: '1', label: t('aqua.quickDailyEntry.feeding.evening') },
  ];
  const stockOptions = (Array.isArray(stocks) ? stocks : []).map((s) => ({
    value: String(s.id),
    label: s.code ?? s.name ?? String(s.id),
  }));

  const labelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide ml-1";
  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickDailyEntry.feeding.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="feedingSlot"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.feeding.slot')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={feedingSlotOptions}
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                          placeholder={t('aqua.quickDailyEntry.feeding.slot')}
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
                  name="stockId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.feeding.feedStock')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={stockOptions}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                          placeholder={t('aqua.quickDailyEntry.feeding.selectStock')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noResults')}
                          disabled={isLoadingStocks}
                          className={inputStyle}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qtyUnit"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.feeding.qty')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} className={inputStyle} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gramPerUnit"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.feeding.gramPerUnit')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" className={inputStyle} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="pt-2 flex justify-end border-t border-white/5">
                <Button type="submit" disabled={disabled || isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20 mt-4">
                  {t('aqua.quickDailyEntry.feeding.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}