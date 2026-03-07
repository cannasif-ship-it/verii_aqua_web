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
import { ChevronRight, Save } from 'lucide-react'; // Aqua konseptine uygun ikonlar eklendi

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

  // AQUA KONSEPT STİLLERİ
  const labelStyle = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-1.5";
  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200";

  return (
    <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-slate-200 dark:border-cyan-800/30 px-6 py-5 bg-slate-50/50 dark:bg-blue-950/30">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
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
                    <FormLabel className={labelStyle}>
                      <ChevronRight size={14} className="text-cyan-500" />
                      {t('aqua.quickDailyEntry.mortality.count')}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={0} className={inputStyle} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-cyan-800/30">
                <Button 
                  type="submit" 
                  disabled={disabled || isSubmitting} 
                  className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold hover:opacity-95 border-0 h-11 px-10 w-full sm:w-auto rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center gap-2"
                >
                  <Save size={18} />
                  {t('aqua.quickDailyEntry.mortality.save')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}