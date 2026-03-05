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
import { weatherQuickFormSchema, type WeatherQuickFormSchema } from '../schema/quick-daily-entry-schema';

export function WeatherQuickForm({ projectId, severities, onSubmit, isSubmitting }: any): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<WeatherQuickFormSchema>({
    resolver: zodResolver(weatherQuickFormSchema) as Resolver<WeatherQuickFormSchema>,
    defaultValues: { weatherSeverityId: 0, weatherTypeId: 0, description: '' },
  });

  const handleSubmit: SubmitHandler<WeatherQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset();
  };

  const severityOptions = (severities || []).map((s: any) => ({ value: String(s.id), label: s.name }));
  const typeOptions = [
    { value: '1', label: 'Güneşli' }, { value: '2', label: 'Bulutlu' }, { value: '3', label: 'Yağmurlu' }
  ];

  const labelStyle = "text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider ml-1";
  const inputStyle = "bg-background dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border border-border dark:border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-white/5 px-6 py-5 bg-muted/30 dark:bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground dark:text-white">{t('aqua.quickDailyEntry.weather.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="weatherTypeId" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>Hava Durumu</FormLabel>
                  <FormControl><Combobox options={typeOptions} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} className={inputStyle} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="weatherSeverityId" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>Şiddet</FormLabel>
                  <FormControl><Combobox options={severityOptions} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))} className={inputStyle} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelStyle}>Not</FormLabel>
                  <FormControl><Input className={inputStyle} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="pt-4 flex justify-end border-t border-border dark:border-white/5">
              <Button type="submit" disabled={!projectId || isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg">Kaydet</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}