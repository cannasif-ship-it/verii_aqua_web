import { type ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, FileText, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useStockDetailQuery } from '../hooks/useStockDetailQuery';
import { useStockDetailCreate } from '../hooks/useStockDetailCreate';
import { useStockDetailUpdate } from '../hooks/useStockDetailUpdate';
import { stockDetailSchema, type StockDetailFormSchema } from '../types/schemas';

interface StockDetailFormProps {
  stockId: number;
}

export function StockDetailForm({ stockId }: StockDetailFormProps): ReactElement {
  const { t } = useTranslation();
  const { data: stockDetail, isLoading } = useStockDetailQuery(stockId);
  const createDetail = useStockDetailCreate();
  const updateDetail = useStockDetailUpdate();

  const isSaving = createDetail.isPending || updateDetail.isPending;

  const form = useForm<StockDetailFormSchema>({
    resolver: zodResolver(stockDetailSchema),
    mode: 'onChange',
    defaultValues: { stockId, htmlDescription: '' },
  });

  useEffect(() => {
    if (stockDetail) {
      form.reset({ stockId, htmlDescription: stockDetail.htmlDescription || '' });
    }
  }, [stockDetail, stockId, form]);

  const handleSubmit = async (data: StockDetailFormSchema) => {
    if (stockDetail) {
      await updateDetail.mutateAsync({ id: stockDetail.id, data });
    } else {
      await createDetail.mutateAsync(data);
    }
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full rounded-xl" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="htmlDescription"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div>
                  <FormLabel className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pink-500" />
                    {t('stock.detail.htmlDescription')}
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 mt-1">
                    {t('stock.detail.htmlDescriptionDesc')}
                  </FormDescription>
              </div>

              <FormControl>
                <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0b0713]/50 overflow-hidden min-h-[350px]">
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('stock.detail.htmlDescriptionPlaceholder')}
                      className="border-0 bg-transparent"
                    />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-white/5">
          <Button
            type="submit"
            disabled={isSaving || !form.formState.isValid}
            className="w-full md:w-auto px-10 h-12 bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? t('stock.detail.saving') : t('stock.detail.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}