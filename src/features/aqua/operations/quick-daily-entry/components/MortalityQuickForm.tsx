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
import { mortalityQuickFormSchema, type MortalityQuickFormSchema } from '../schema/quick-daily-entry-schema';

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

  const handleSubmit: SubmitHandler<MortalityQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ deadCount: 0 });
  };

  const disabled = projectId == null || projectCageId == null;

  // AKILLI STİLLER
  const labelStyle = "text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider ml-1";
  const inputStyle = "bg-background dark:bg-[#0b0713] border-border dark:border-white/10 text-foreground dark:text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-11 rounded-xl transition-all";

  return (
    <Card className="bg-card dark:bg-[#1a1025]/60 backdrop-blur-xl border border-border dark:border-white/5 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-white/5 px-6 py-5 bg-muted/30 dark:bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground dark:text-white">
          {t('aqua.quickDailyEntry.mortality.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="max-w-md">
              <FormField
                control={form.control}
                name="deadCount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className={labelStyle}>{t('aqua.quickDailyEntry.mortality.count')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} className={inputStyle} {...field} />
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
                  {t('aqua.quickDailyEntry.mortality.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}