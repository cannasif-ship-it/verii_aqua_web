import { type ReactElement, useEffect } from 'react';
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
import {
  mortalityQuickFormSchema,
  type MortalityQuickFormSchema,
} from '../schema/quick-daily-entry-schema';

interface MortalityQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  onSubmit: (data: MortalityQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function MortalityQuickForm({
  projectId,
  projectCageId,
  onSubmit,
  isSubmitting,
}: MortalityQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<MortalityQuickFormSchema>({
    resolver: zodResolver(mortalityQuickFormSchema) as Resolver<MortalityQuickFormSchema>,
    defaultValues: { deadCount: 0 },
  });

  useEffect(() => {
    form.reset({ deadCount: 0 });
  }, [projectId, projectCageId, form]);

  const handleSubmit: SubmitHandler<MortalityQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ deadCount: 0 });
  };

  const disabled = projectId == null || projectCageId == null;

  const labelStyle = "text-xs font-semibold text-slate-400 uppercase tracking-wide ml-1";
  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl";

  return (
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickDailyEntry.mortality.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 backdrop-blur-md">
              {t('aqua.quickDailyEntry.mortality.autoBatchInfo', {
                defaultValue: 'Batch kafes eşleşmesine göre otomatik seçilecektir.',
              })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="deadCount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.mortality.deadCount')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} className={inputStyle} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="pt-2 flex justify-end border-t border-white/5">
                <Button type="submit" disabled={disabled || isSubmitting} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20 mt-4">
                  {t('aqua.quickDailyEntry.mortality.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}