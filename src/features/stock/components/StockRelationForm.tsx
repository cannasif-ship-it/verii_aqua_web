import { type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, Layers, ChevronRight } from 'lucide-react';
// HATA FIX: useStockListAll yerine useStockList kullanıldı (projenizdeki mevcut yapıya göre)
import { useStockList } from '../hooks/useStockList'; 
import { useStockRelationCreate } from '../hooks/useStockRelationCreate';
import { stockRelationSchema, type StockRelationFormSchema } from '../types/schemas';
import type { StockGetDto } from '../types';
import { formatCodeAndKeyLabel } from '@/shared/utils/dropdown-label';

interface StockRelationFormProps {
  stockId: number;
}

export function StockRelationForm({ stockId }: StockRelationFormProps): ReactElement {
  const { t } = useTranslation();
  
  // Tüm stokları getir (sayfalama olmadan veya geniş limitli)
  const { data: stocksData, isLoading: isLoadingStocks } = useStockList({
    pageNumber: 1,
    pageSize: 1000, // İlişki için listeyi geniş tutuyoruz
    sortBy: 'StockName',
    sortDirection: 'asc'
  });

  const createRelation = useStockRelationCreate();

  const form = useForm<StockRelationFormSchema>({
    resolver: zodResolver(stockRelationSchema),
    defaultValues: {
      stockId: stockId, // HATA FIX: mainStockId yerine stockId
      relatedStockId: 0,
      quantity: 1,
      isMandatory: false,
      description: '', // HATA FIX: note yerine description
    },
  });

  const onSubmit = async (data: StockRelationFormSchema) => {
    await createRelation.mutateAsync(data);
    form.reset({ stockId, relatedStockId: 0, quantity: 1, isMandatory: false, description: '' });
  };

  // HATA FIX: Parameter 's' tip tanımlaması yapıldı
  const stockOptions = (stocksData?.data || []).map((s: StockGetDto) => ({
    value: String(s.id),
    label: formatCodeAndKeyLabel(s.erpStockCode, s.id, s.stockName),
  }));

  const labelStyle = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 mb-2 flex items-center gap-1.5";
  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500 h-11 rounded-xl transition-all duration-200";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField
          control={form.control}
          name="relatedStockId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={labelStyle}>
                <ChevronRight size={14} className="text-cyan-500" />
                {t('stock.relations.relatedStock')}
              </FormLabel>
              <FormControl>
                <Combobox
                  options={stockOptions}
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                  placeholder={t('stock.relations.selectStock')}
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.noResults')}
                  disabled={isLoadingStocks}
                  className={inputStyle}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelStyle}>
                <ChevronRight size={14} className="text-cyan-500" />
                {t('stock.relations.quantity')}
              </FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.001" 
                  {...field} 
                  onChange={(e) => field.onChange(Number(e.target.value))} 
                  className={inputStyle} 
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelStyle}>
                <ChevronRight size={14} className="text-cyan-500" />
                {t('stock.relations.description')}
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value ?? ''} // HATA FIX: Undefined value kontrolü
                  className={inputStyle} 
                  placeholder={t('stock.relations.descriptionPlaceholder')} 
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isMandatory"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50/50 dark:bg-blue-950/20">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 border-slate-300 dark:border-cyan-800 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600 rounded"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer">
                  {t('stock.relations.isMandatory')}
                </FormLabel>
                <FormDescription className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                  {t('stock.relations.isMandatoryDescription')}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createRelation.isPending}
          className="w-full h-12 bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all border-0 flex items-center justify-center gap-2"
        >
          {createRelation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Layers className="h-5 w-5" />
          )}
          {createRelation.isPending ? t('stock.relations.saving') : t('stock.relations.add')}
        </Button>
      </form>
    </Form>
  );
}
