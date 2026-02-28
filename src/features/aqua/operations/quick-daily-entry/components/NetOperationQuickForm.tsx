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
import {
  netOperationQuickFormSchema,
  type NetOperationQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { FishBatchDto, NetOperationTypeDto } from '../types/quick-daily-entry-types';

interface NetOperationQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  fishBatches: FishBatchDto[] | undefined;
  netOperationTypes: NetOperationTypeDto[] | undefined;
  onSubmit: (data: NetOperationQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function NetOperationQuickForm({
  projectId,
  projectCageId,
  fishBatches,
  netOperationTypes,
  onSubmit,
  isSubmitting,
}: NetOperationQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<NetOperationQuickFormSchema>({
    resolver: zodResolver(netOperationQuickFormSchema) as Resolver<NetOperationQuickFormSchema>,
    defaultValues: { netOperationTypeId: 0, fishBatchId: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<NetOperationQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ netOperationTypeId: 0, fishBatchId: 0, description: '' });
  };

  const disabled = projectId == null || projectCageId == null;

  const netOperationTypeOptions = (Array.isArray(netOperationTypes) ? netOperationTypes : []).map((typeItem) => ({
    value: String(typeItem.id),
    label: typeItem.code ?? typeItem.name ?? String(typeItem.id),
  }));
  const fishBatchOptions = [
    { value: '0', label: t('aqua.quickDailyEntry.netOperation.noBatch') },
    ...(Array.isArray(fishBatches) ? fishBatches : []).map((b) => ({ value: String(b.id), label: String(b.id) })),
  ];

  const labelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide ml-1";
  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickDailyEntry.netOperation.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="netOperationTypeId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.netOperation.operationType')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={netOperationTypeOptions}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                          placeholder={t('aqua.quickDailyEntry.netOperation.selectType')}
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
                  name="fishBatchId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.netOperation.batch')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={fishBatchOptions}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2 md:col-span-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.netOperation.description')}</FormLabel>
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
                  {t('aqua.quickDailyEntry.netOperation.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}