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

  // AKILLI STİLLER: Gündüz belirgin, gece premium görünüm
  const labelStyle = "text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider ml-1";
  const inputStyle = "bg-background dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl transition-all";

  return (
    <Card className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border border-border dark:border-white/5 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-white/5 px-6 py-5 bg-muted/30 dark:bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground dark:text-white">
          {t('aqua.quickDailyEntry.feeding.title')}
        </CardTitle>
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
                      <FormMessage className="text-xs text-rose-500" />
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
                      <FormMessage className="text-xs text-rose-500" />
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
                      <FormMessage className="text-xs text-rose-500" />
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
                      <FormMessage className="text-xs text-rose-500" />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="pt-4 flex justify-end border-t border-border dark:border-white/5">
                <Button 
                  type="submit" 
                  disabled={disabled || isSubmitting} 
                  className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold hover:opacity-95 border-0 h-11 px-10 w-full sm:w-auto rounded-xl shadow-lg shadow-pink-500/20 transition-all duration-200"
                >
                  {t('aqua.quickDailyEntry.feeding.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}