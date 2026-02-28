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
  weatherQuickFormSchema,
  type WeatherQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { WeatherSeverityDto } from '../types/quick-daily-entry-types';
import { useWeatherTypeListBySeverityQuery } from '../hooks/useWeatherTypeListBySeverityQuery';

interface WeatherQuickFormProps {
  projectId: number | null;
  severities: WeatherSeverityDto[] | undefined;
  onSubmit: (data: WeatherQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function WeatherQuickForm({
  projectId,
  severities,
  onSubmit,
  isSubmitting,
}: WeatherQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<WeatherQuickFormSchema>({
    resolver: zodResolver(weatherQuickFormSchema) as Resolver<WeatherQuickFormSchema>,
    defaultValues: {
      weatherSeverityId: 0,
      weatherTypeId: 0,
      description: '',
    },
  });

  const { data: types, isLoading: isLoadingTypes } = useWeatherTypeListBySeverityQuery();

  const handleSubmit: SubmitHandler<WeatherQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ weatherSeverityId: 0, weatherTypeId: 0, description: '' });
  };

  const disabled = projectId == null;

  const severityOptions = (Array.isArray(severities) ? severities : []).map((s) => ({
    value: String(s.id),
    label: s.code ?? s.name ?? String(s.id),
  }));
  const typeOptions = (Array.isArray(types) ? types : []).map((typeItem) => ({
    value: String(typeItem.id),
    label: typeItem.code ?? typeItem.name ?? String(typeItem.id),
  }));

  const labelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide ml-1";
  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickDailyEntry.weather.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="weatherSeverityId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.weather.severity')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={severityOptions}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => {
                            field.onChange(v ? Number(v) : 0);
                            form.setValue('weatherTypeId', 0);
                          }}
                          placeholder={t('aqua.quickDailyEntry.weather.selectSeverity')}
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
                  name="weatherTypeId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.weather.type')}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={typeOptions}
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                          placeholder={t('aqua.quickDailyEntry.weather.selectType')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noResults')}
                          disabled={isLoadingTypes}
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
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.weather.description')}</FormLabel>
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
                  {t('aqua.quickDailyEntry.weather.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}