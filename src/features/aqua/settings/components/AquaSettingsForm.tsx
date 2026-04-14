import { type ReactElement, useEffect } from 'react';
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Waves, Save, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  aquaSettingsFormSchema,
  type AquaSettingsDto,
  type AquaSettingsFormSchema,
} from '../types/aquaSettings';

interface AquaSettingsFormProps {
  data: AquaSettingsDto | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (data: AquaSettingsFormSchema) => void | Promise<void>;
}

export function AquaSettingsForm({
  data,
  isLoading,
  isSubmitting,
  onSubmit,
}: AquaSettingsFormProps): ReactElement {
  const { t } = useTranslation('common');

  const form = useForm<AquaSettingsFormSchema>({
    resolver: zodResolver(aquaSettingsFormSchema) as Resolver<AquaSettingsFormSchema>,
    mode: 'onChange',
    defaultValues: {
      partialTransferOccupiedCageMode: 0,
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      partialTransferOccupiedCageMode: data.partialTransferOccupiedCageMode,
    });
  }, [data, form]);

  const handleSubmit: SubmitHandler<AquaSettingsFormSchema> = (values) => {
    onSubmit(values);
  };

  const labelStyle = 'text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-2';
  const inputStyle = 'bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white h-11 rounded-xl';

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-blue-950/60 border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm">
        <CardHeader>
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-5 w-full rounded-xl" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
        <Card className="bg-white dark:bg-blue-950/60 border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-blue-950/30 border-b border-slate-200 dark:border-cyan-800/30">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="size-5 text-cyan-600 dark:text-cyan-400" />
              {t('aquaSettings.form.title')}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {t('aquaSettings.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FormField
              control={form.control}
              name="partialTransferOccupiedCageMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelStyle}>
                    <Waves className="size-4 text-cyan-500" />
                    {t('aquaSettings.fields.partialTransferOccupiedCageMode')}
                  </FormLabel>
                  <FormControl>
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger className={inputStyle}>
                        <SelectValue placeholder={t('aquaSettings.fields.selectMode')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30">
                        <SelectItem value="0">{t('aquaSettings.options.partialTransferOccupiedCageMode.0')}</SelectItem>
                        <SelectItem value="1">{t('aquaSettings.options.partialTransferOccupiedCageMode.1')}</SelectItem>
                        <SelectItem value="2">{t('aquaSettings.options.partialTransferOccupiedCageMode.2')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(`aquaSettings.optionDescriptions.partialTransferOccupiedCageMode.${field.value}`)}
                  </p>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-cyan-800/30">
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold h-11 px-10 rounded-xl shadow-lg shadow-cyan-500/25 border-0 flex items-center gap-2"
              >
                <Save size={18} />
                {t('aquaSettings.form.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
