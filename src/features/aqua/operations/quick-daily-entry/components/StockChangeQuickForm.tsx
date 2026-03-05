import { type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { stockChangeQuickFormSchema, type StockChangeQuickFormSchema } from '../schema/quick-daily-entry-schema';

export function StockChangeQuickForm({ projectId, projectCageId, fishBatches, sourceBatch, onSubmit, isSubmitting }: any): ReactElement {
  const form = useForm<StockChangeQuickFormSchema>({
    resolver: zodResolver(stockChangeQuickFormSchema) as Resolver<StockChangeQuickFormSchema>,
    defaultValues: { toFishBatchId: 0, fishCount: 0, newAverageGram: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<StockChangeQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset();
  };

  const batchOptions = (fishBatches || []).filter((b: any) => b.id !== sourceBatch?.fishBatchId).map((b: any) => ({ value: String(b.id), label: b.batchCode }));

  const labelStyle = "text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider ml-1";
  const inputStyle = "bg-background dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border border-border dark:border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-white/5 px-6 py-5 bg-muted/30 dark:bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground dark:text-white">Stok Değişimi (Batch Convert)</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="toFishBatchId" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>Hedef Batch</FormLabel>
                  <FormControl><Combobox options={batchOptions} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} className={inputStyle} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fishCount" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>Adet</FormLabel>
                  <FormControl><Input type="number" className={inputStyle} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="newAverageGram" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>Yeni Ort. Gram</FormLabel>
                  <FormControl><Input type="number" step="0.01" className={inputStyle} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="pt-4 flex justify-end border-t border-border dark:border-white/5">
              <Button type="submit" disabled={!projectId || !projectCageId || isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg transition-all hover:opacity-95">Dönüştür</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
