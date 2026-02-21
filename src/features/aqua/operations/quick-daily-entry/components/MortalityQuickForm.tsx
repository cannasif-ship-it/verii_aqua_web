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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  mortalityQuickFormSchema,
  type MortalityQuickFormSchema,
} from '../schema/quick-daily-entry-schema';
import type { FishBatchDto } from '../types/quick-daily-entry-types';

interface MortalityQuickFormProps {
  projectId: number | null;
  projectCageId: number | null;
  fishBatches: FishBatchDto[] | undefined;
  isLoadingBatches: boolean;
  onSubmit: (data: MortalityQuickFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function MortalityQuickForm({
  projectId,
  projectCageId,
  fishBatches,
  isLoadingBatches,
  onSubmit,
  isSubmitting,
}: MortalityQuickFormProps): ReactElement {
  const { t } = useTranslation('common');
  const form = useForm<MortalityQuickFormSchema>({
    resolver: zodResolver(mortalityQuickFormSchema) as Resolver<MortalityQuickFormSchema>,
    defaultValues: { fishBatchId: 0, deadCount: 0 },
  });

  useEffect(() => {
    form.reset({ fishBatchId: 0, deadCount: 0 });
  }, [projectId, projectCageId]);

  const handleSubmit: SubmitHandler<MortalityQuickFormSchema> = async (data) => {
    await onSubmit(data);
    form.reset({ fishBatchId: 0, deadCount: 0 });
  };

  const disabled = projectId == null || projectCageId == null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickDailyEntry.mortality.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fishBatchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.mortality.batch')}</FormLabel>
                  <Select
                    disabled={isLoadingBatches}
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('aqua.quickDailyEntry.mortality.selectBatch')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(fishBatches) ? fishBatches : []).map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          Batch #{b.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('aqua.quickDailyEntry.mortality.deadCount')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled || isSubmitting}>
              {t('aqua.quickDailyEntry.mortality.save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
