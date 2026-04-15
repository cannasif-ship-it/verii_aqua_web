import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { shipmentQuickFormSchema, type ShipmentQuickFormSchema } from '../schema/quick-daily-entry-schema';
import { ChevronRight, Info, Save } from 'lucide-react';

interface ShipmentQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  warehouseOptions: Array<{ value: string; label: string }>;
  sourceBatch: { fishBatchId: number; liveCount: number; averageGram: number } | null;
  onSubmit: (data: ShipmentQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
}

const currencyOptions = [
  { value: 'TRY', label: 'TRY' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export function ShipmentQuickForm({
  projectId,
  projectCageId,
  warehouseOptions,
  sourceBatch,
  onSubmit,
  isSubmitting,
  canSubmit,
}: ShipmentQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<ShipmentQuickFormSchema>({
    resolver: zodResolver(shipmentQuickFormSchema) as Resolver<ShipmentQuickFormSchema>,
    mode: 'onChange',
    defaultValues: {
      fishCount: 0,
      unitPrice: 0,
      currencyCode: 'TRY',
      targetWarehouseId: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (!sourceBatch) return;
    form.setValue('fishCount', Number(sourceBatch.liveCount ?? 0), {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, sourceBatch]);

  const handleSubmit: SubmitHandler<ShipmentQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({
      fishCount: Number(sourceBatch?.liveCount ?? 0),
      unitPrice: 0,
      currencyCode: 'TRY',
      targetWarehouseId: 0,
      description: '',
    });
  };

  const disabled = projectId == null || projectCageId == null;
  const labelStyle = 'text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-1.5';
  const inputStyle = 'bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200';

  return (
    <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-slate-200 dark:border-cyan-800/30 px-6 py-5 bg-slate-50/50 dark:bg-blue-950/30">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('aqua.quickDailyEntry.shipment.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sourceBatch && (
          <div className="mb-6 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/50 flex items-center gap-2">
            <Info size={18} className="text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-bold text-cyan-800 dark:text-cyan-300">
              {t('aqua.quickDailyEntry.shipment.sourceInfo', {
                fishBatchId: sourceBatch.fishBatchId,
                liveCount: sourceBatch.liveCount,
              })}
            </span>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="fishCount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel required className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('aqua.quickDailyEntry.shipment.fishCount')}
                    </FormLabel>
                    <FormControl><Input type="number" className={inputStyle} {...field} /></FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('aqua.quickDailyEntry.shipment.currency')}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={currencyOptions}
                        value={field.value}
                        onValueChange={field.onChange}
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
                name="unitPrice"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('aqua.quickDailyEntry.shipment.unitPrice')}
                    </FormLabel>
                    <FormControl><Input type="number" step="0.01" className={inputStyle} {...field} /></FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetWarehouseId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('aqua.quickDailyEntry.shipment.targetWarehouse')}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={warehouseOptions}
                        value={field.value > 0 ? String(field.value) : ''}
                        onValueChange={(value) => field.onChange(value ? Number(value) : 0)}
                        className={inputStyle}
                        placeholder={t('common.select')}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-cyan-800/30">
              <Button
                type="submit"
                disabled={disabled || isSubmitting || !form.formState.isValid || !canSubmit}
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:opacity-95 border-0 flex items-center gap-2"
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
