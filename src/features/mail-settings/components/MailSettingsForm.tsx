import { type ReactElement, useEffect } from 'react';
import { type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Server, 
  Hash, 
  ShieldCheck, 
  User, 
  Lock, 
  AtSign, 
  Clock, 
  Send, 
  Save, 
  Loader2 
} from 'lucide-react';
import {
  smtpSettingsFormSchema,
  type SmtpSettingsFormSchema,
  type SmtpSettingsDto,
} from '../types/smtpSettings';
import { useSendTestMailMutation } from '../hooks/useSendTestMailMutation';
import { isZodFieldRequired } from '@/lib/zod-required';
import { cn } from '@/lib/utils';

interface MailSettingsFormProps {
  data: SmtpSettingsDto | undefined;
  isLoading: boolean;
  onSubmit: (data: SmtpSettingsFormSchema) => void | Promise<void>;
  isSubmitting: boolean;
}

export function MailSettingsForm({
  data,
  isLoading,
  onSubmit,
  isSubmitting,
}: MailSettingsFormProps): ReactElement {
  const { t } = useTranslation();
  const testMailMutation = useSendTestMailMutation();

  const form = useForm<SmtpSettingsFormSchema>({
    resolver: zodResolver(smtpSettingsFormSchema) as unknown as Resolver<SmtpSettingsFormSchema>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      host: '',
      port: 587,
      enableSsl: true,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      timeout: 30,
    },
  });

  const isFormValid = form.formState.isValid;

  useEffect(() => {
    if (data) {
      form.reset({
        host: data.host,
        port: data.port,
        enableSsl: data.enableSsl,
        username: data.username,
        password: '',
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        timeout: data.timeout,
      });
    }
  }, [data, form]);

  const handleSubmit: SubmitHandler<SmtpSettingsFormSchema> = (values) => {
    onSubmit(values);
  };

  // AQUA KONSEPT STİLLERİ
  const labelStyle = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1 flex items-center gap-2";
  const inputStyle = "bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 h-11 rounded-xl transition-all duration-200";

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl p-6 md:p-8 space-y-6 transition-all duration-300">
        <Skeleton className="h-10 w-full bg-slate-100 dark:bg-blue-900/20 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-10 w-full bg-slate-100 dark:bg-blue-900/20 rounded-xl" />
          <Skeleton className="h-10 w-full bg-slate-100 dark:bg-blue-900/20 rounded-xl" />
        </div>
        <Skeleton className="h-32 w-full bg-slate-100 dark:bg-blue-900/20 rounded-xl" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm dark:shadow-2xl p-6 md:p-8 transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* SMTP Host */}
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem className="md:col-span-8">
                  <FormLabel className={labelStyle} required={isZodFieldRequired(smtpSettingsFormSchema, 'host')}>
                    <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-500" /> {t('mailSettings.Fields.Host')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="smtp.gmail.com" className={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            {/* Port */}
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem className="md:col-span-4">
                  <FormLabel className={labelStyle} required={isZodFieldRequired(smtpSettingsFormSchema, 'port')}>
                    <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" /> {t('mailSettings.Fields.Port')}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" className={inputStyle} {...field} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            {/* SSL Switch */}
            <FormField
              control={form.control}
              name="enableSsl"
              render={({ field }) => (
                <FormItem className="md:col-span-12 flex flex-row items-center justify-between rounded-xl border border-slate-100 dark:border-cyan-800/20 p-4 bg-slate-50/50 dark:bg-blue-900/20 transition-colors">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer">
                      <ShieldCheck className={cn("w-4 h-4 transition-colors", field.value ? "text-emerald-600 dark:text-emerald-500" : "text-slate-500")} />
                      {t('mailSettings.Fields.EnableSsl')}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-cyan-600" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="md:col-span-6">
                  <FormLabel className={labelStyle} required={isZodFieldRequired(smtpSettingsFormSchema, 'username')}>
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {t('mailSettings.Fields.Username')}
                  </FormLabel>
                  <FormControl>
                    <Input className={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="md:col-span-6">
                  <FormLabel className={labelStyle}>
                    <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> {t('mailSettings.Fields.Password')}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t('mailSettings.Fields.PasswordPlaceholder')} className={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            {/* From Email */}
            <FormField
              control={form.control}
              name="fromEmail"
              render={({ field }) => (
                <FormItem className="md:col-span-6">
                  <FormLabel className={labelStyle} required={isZodFieldRequired(smtpSettingsFormSchema, 'fromEmail')}>
                    <AtSign className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-500" /> {t('mailSettings.Fields.FromEmail')}
                  </FormLabel>
                  <FormControl>
                    <Input type="email" className={inputStyle} {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />

            {/* Timeout */}
            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem className="md:col-span-6">
                  <FormLabel className={labelStyle} required={isZodFieldRequired(smtpSettingsFormSchema, 'timeout')}>
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" /> {t('mailSettings.Fields.Timeout')}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" className={inputStyle} {...field} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage className="text-[10px] text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end px-1">
          <Button
            type="button"
            variant="ghost"
            className="h-11 px-6 text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl transition-all font-bold"
            onClick={() => testMailMutation.mutate({})}
            disabled={isSubmitting || testMailMutation.isPending}
          >
            {testMailMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {testMailMutation.isPending
              ? t('mailSettings.TestMail.Sending')
              : t('mailSettings.TestMail.Send')}
          </Button>

          <Button 
            type="submit" 
            disabled={isSubmitting || !isFormValid}
            className="h-11 px-10 bg-linear-to-r from-cyan-600 to-blue-600 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all border-0 flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? t('common.saving') : t('mailSettings.Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}