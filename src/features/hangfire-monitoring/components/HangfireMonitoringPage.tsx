import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/ui-store';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  PlayCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  HANGFIRE_QUERY_KEYS,
  useHangfireDeadLetterQuery,
  useHangfireFailedJobsQuery,
  useHangfireRecurringJobsQuery,
  useHangfireStatsQuery,
  useHangfireSuccessJobsQuery,
} from '../hooks/useHangfireMonitoring';
import { hangfireMonitoringApi } from '../api/hangfireMonitoring.api';
import type {
  HangfireFailedResponseDto,
  HangfireRecurringJobItemDto,
  HangfireSuccessJobItemDto,
} from '../types/hangfireMonitoring.types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '-';
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 0 : 1)} sn`;
}

export function HangfireMonitoringPage(): ReactElement {
  const { t } = useTranslation(['hangfire-monitoring', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();

  const [failedPage, setFailedPage] = useState(1);
  const [successPage, setSuccessPage] = useState(1);
  const [deadLetterPage, setDeadLetterPage] = useState(1);
  const [selectedRecurringJobId, setSelectedRecurringJobId] = useState<string>('');

  const failedFrom = (failedPage - 1) * PAGE_SIZE;
  const successFrom = (successPage - 1) * PAGE_SIZE;
  const deadLetterFrom = (deadLetterPage - 1) * PAGE_SIZE;

  const statsQuery = useHangfireStatsQuery();
  const failedQuery = useHangfireFailedJobsQuery(failedFrom, PAGE_SIZE);
  const successQuery = useHangfireSuccessJobsQuery(successFrom, PAGE_SIZE);
  const deadLetterQuery = useHangfireDeadLetterQuery(deadLetterFrom, PAGE_SIZE);
  const recurringJobsQuery = useHangfireRecurringJobsQuery();

  useEffect(() => {
    setPageTitle(t('title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    const firstJobId = recurringJobsQuery.data?.items?.[0]?.id;
    if (!selectedRecurringJobId && firstJobId) {
      setSelectedRecurringJobId(firstJobId);
    }
  }, [recurringJobsQuery.data?.items, selectedRecurringJobId]);

  const triggerRecurringJobMutation = useMutation({
    mutationFn: (jobId: string) => hangfireMonitoringApi.triggerRecurringJob(jobId),
    onSuccess: async (result) => {
      toast.success(t('recurring.triggerSuccess', { jobName: result.jobId }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: HANGFIRE_QUERY_KEYS.RECURRING }),
        queryClient.invalidateQueries({ queryKey: HANGFIRE_QUERY_KEYS.STATS }),
        queryClient.invalidateQueries({ queryKey: ['hangfire'] }),
      ]);
    },
    onError: () => {
      toast.error(t('recurring.triggerError'));
    },
  });

  const isRefreshing =
    statsQuery.isRefetching ||
    failedQuery.isRefetching ||
    successQuery.isRefetching ||
    deadLetterQuery.isRefetching ||
    recurringJobsQuery.isRefetching;

  const handleRefresh = async (): Promise<void> => {
    await Promise.all([
      statsQuery.refetch(),
      failedQuery.refetch(),
      successQuery.refetch(),
      deadLetterQuery.refetch(),
      recurringJobsQuery.refetch(),
    ]);
  };

  const recurringItems = recurringJobsQuery.data?.items ?? [];
  const selectedRecurringJob = useMemo(
    () => recurringItems.find((job) => job.id === selectedRecurringJobId) ?? recurringItems[0] ?? null,
    [recurringItems, selectedRecurringJobId],
  );

  const failedTotalPages = Math.max(1, Math.ceil((failedQuery.data?.total ?? 0) / PAGE_SIZE));
  const successTotalPages = Math.max(1, Math.ceil((successQuery.data?.total ?? 0) / PAGE_SIZE));
  const deadLetterTotalPages = Math.max(1, Math.ceil((deadLetterQuery.data?.total ?? deadLetterQuery.data?.enqueued ?? 0) / PAGE_SIZE));

  const headStyle = 'text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4';

  const renderFailedRows = (items: HangfireFailedResponseDto['items'], emptyText: string, emptyIcon: ReactElement, timeField: 'failedAt' | 'enqueuedAt') => {
    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-slate-500 py-20 font-medium bg-white/50 dark:bg-transparent">
            <div className="flex flex-col items-center justify-center gap-2">
              {emptyIcon}
              <span>{emptyText}</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return items.map((item) => (
      <TableRow key={`${timeField}-${item.jobId}-${item.reason ?? ''}`} className="border-b border-slate-100 dark:border-cyan-800/10 hover:bg-slate-50 dark:hover:bg-blue-900/20 group transition-colors">
        <TableCell className="font-mono text-[11px] text-slate-400 dark:text-slate-500 px-6">#{item.jobId}</TableCell>
        <TableCell className="font-bold text-sm text-slate-900 dark:text-slate-200 max-w-[280px] truncate" title={item.jobName}>
          {item.jobName}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 rounded-md text-[10px] font-bold px-2 py-0">
            {item.state || 'Failed'}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{formatDate(item[timeField])}</TableCell>
        <TableCell className="max-w-[400px] truncate text-xs text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors" title={item.reason}>
          {item.reason || '-'}
        </TableCell>
      </TableRow>
    ));
  };

  const renderSuccessRows = (items: HangfireSuccessJobItemDto[]) => {
    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center text-slate-500 py-20 font-medium bg-white/50 dark:bg-transparent">
            <div className="flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="size-10 text-emerald-500/20" />
              <span>{t('succeeded.empty')}</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return items.map((item) => (
      <TableRow key={`success-${item.jobId}-${item.finishedAt ?? ''}`} className="border-b border-slate-100 dark:border-cyan-800/10 hover:bg-slate-50 dark:hover:bg-blue-900/20 group transition-colors">
        <TableCell className="font-mono text-[11px] text-slate-400 dark:text-slate-500 px-6">#{item.jobId}</TableCell>
        <TableCell className="font-bold text-sm text-slate-900 dark:text-slate-200 max-w-[280px] truncate" title={item.jobName}>{item.jobName}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">{item.recurringJobId || '-'}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">{item.queue || '-'}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{formatDuration(item.durationMs)}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{item.retryCount}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{formatDate(item.finishedAt)}</TableCell>
      </TableRow>
    ));
  };

  const renderRecurringRows = (items: HangfireRecurringJobItemDto[]) => {
    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-slate-500 py-20 font-medium bg-white/50 dark:bg-transparent">
            <div className="flex flex-col items-center justify-center gap-2">
              <Clock className="size-10 text-slate-400/30" />
              <span>{t('recurring.empty')}</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return items.map((item) => (
      <TableRow
        key={item.id}
        className={cn(
          'border-b border-slate-100 dark:border-cyan-800/10 hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer',
          selectedRecurringJob?.id === item.id && 'bg-cyan-50/60 dark:bg-cyan-500/10',
        )}
        onClick={() => setSelectedRecurringJobId(item.id)}
      >
        <TableCell className="font-mono text-[11px] text-slate-500 dark:text-slate-400 px-6">{item.id}</TableCell>
        <TableCell className="text-sm text-slate-900 dark:text-slate-200">
          <div className="font-bold">{item.jobName}</div>
          {item.method ? <div className="text-xs text-slate-500 dark:text-slate-400">{item.method}</div> : null}
          {item.error ? <div className="text-xs text-rose-500 mt-1">{item.error}</div> : null}
        </TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">{item.cron || '-'}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{formatDate(item.nextExecution)}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{formatDate(item.lastExecution)}</TableCell>
        <TableCell className="text-xs text-slate-500 dark:text-slate-400">{item.queue || '-'}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="w-full space-y-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumb
        items={[
          { label: t('common:sidebar.accessControl') },
          { label: t('menu'), isActive: true },
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 relative overflow-hidden transition-colors">
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            <Activity className="size-6 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors leading-none">
              {t('title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium flex items-center gap-2 transition-colors">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('description')}
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="bg-white dark:bg-cyan-500/10 hover:bg-slate-50 dark:hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-slate-200 dark:border-cyan-500/20 h-11 px-6 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={18} className={cn('mr-2', isRefreshing && 'animate-spin')} />
          {t('refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {[
          { key: 'enqueued', icon: Clock, color: 'blue', val: statsQuery.data?.enqueued },
          { key: 'processing', icon: PlayCircle, color: 'amber', val: statsQuery.data?.processing },
          { key: 'succeeded', icon: CheckCircle2, color: 'emerald', val: statsQuery.data?.succeeded },
          { key: 'failed', icon: XCircle, color: 'rose', val: statsQuery.data?.failed },
        ].map((stat) => (
          <Card key={stat.key} className="backdrop-blur-xl border shadow-sm rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-blue-950/60 border-slate-200 dark:border-cyan-800/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest', stat.key === 'failed' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400')}>
                    {t(`stats.${stat.key}`)}
                  </p>
                  <h3 className={cn(
                    'text-3xl font-black mt-2 tabular-nums',
                    stat.color === 'rose' ? 'text-rose-600 dark:text-rose-500' :
                      stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                        stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-slate-900 dark:text-white',
                  )}>
                    {stat.val ?? 0}
                  </h3>
                </div>
                <div className={cn(
                  'p-2.5 rounded-xl border',
                  stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' :
                    stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                      stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                        'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
                )}>
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <Card className="bg-white dark:bg-blue-950/60 border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('recurring.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('recurring.description')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('recurring.selectLabel')}
              </label>
              <Select value={selectedRecurringJobId} onValueChange={setSelectedRecurringJobId}>
                <SelectTrigger className="bg-white dark:bg-blue-950/80 border-slate-200 dark:border-cyan-800/30">
                  <SelectValue placeholder={t('recurring.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {recurringItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.jobName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={() => selectedRecurringJobId && triggerRecurringJobMutation.mutate(selectedRecurringJobId)}
              disabled={!selectedRecurringJobId || triggerRecurringJobMutation.isPending}
            >
              {triggerRecurringJobMutation.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <PlayCircle className="size-4 mr-2" />}
              {t('recurring.triggerButton')}
            </Button>
            <div className="rounded-xl border border-slate-200 dark:border-cyan-800/30 p-4 bg-slate-50/60 dark:bg-blue-900/20">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {selectedRecurringJob?.id || '-'}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedRecurringJob?.jobName || '-'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{selectedRecurringJob?.cron || '-'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('recurring.table.nextExecution')}: {formatDate(selectedRecurringJob?.nextExecution)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('recurring.table.lastExecution')}: {formatDate(selectedRecurringJob?.lastExecution)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
          <div className="p-5 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/20 flex items-center gap-3">
            <Clock className="size-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('recurring.title')}</h2>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-blue-900/40">
                <TableRow className="border-b border-slate-200 dark:border-cyan-800/30 hover:bg-transparent">
                  <TableHead className={cn(headStyle, 'px-6')}>{t('recurring.table.id')}</TableHead>
                  <TableHead className={cn(headStyle, 'min-w-[240px]')}>{t('recurring.table.job')}</TableHead>
                  <TableHead className={headStyle}>{t('recurring.table.cron')}</TableHead>
                  <TableHead className={headStyle}>{t('recurring.table.nextExecution')}</TableHead>
                  <TableHead className={headStyle}>{t('recurring.table.lastExecution')}</TableHead>
                  <TableHead className={headStyle}>{t('recurring.table.queue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRecurringRows(recurringItems)}</TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
        <div className="p-5 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/20 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('succeeded.title')}</h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-blue-900/40">
              <TableRow className="border-b border-slate-200 dark:border-cyan-800/30 hover:bg-transparent">
                <TableHead className={cn(headStyle, 'w-[80px] px-6')}>ID</TableHead>
                <TableHead className={cn(headStyle, 'min-w-[220px]')}>{t('table.jobName')}</TableHead>
                <TableHead className={headStyle}>{t('table.recurringJobId')}</TableHead>
                <TableHead className={headStyle}>{t('table.queue')}</TableHead>
                <TableHead className={headStyle}>{t('table.duration')}</TableHead>
                <TableHead className={headStyle}>{t('table.retryCount')}</TableHead>
                <TableHead className={headStyle}>{t('table.time')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderSuccessRows(successQuery.data?.items ?? [])}</TableBody>
          </Table>
        </div>
        <div className="flex justify-end px-6 py-4 bg-slate-50/80 dark:bg-blue-950/40 border-t border-slate-200 dark:border-cyan-800/30 gap-2 transition-colors">
          <Button variant="outline" size="sm" disabled={successPage <= 1} onClick={() => setSuccessPage((p) => Math.max(1, p - 1))} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
            <ArrowLeft size={14} className="mr-2" /> {t('common:common.previous')}
          </Button>
          <Button variant="outline" size="sm" disabled={successPage >= successTotalPages} onClick={() => setSuccessPage((p) => Math.min(successTotalPages, p + 1))} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
            {t('common:common.next')} <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
        <div className="p-5 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/20 flex items-center gap-3">
          <XCircle className="size-5 text-rose-600 dark:text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('failed.title')}</h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-blue-900/40">
              <TableRow className="border-b border-slate-200 dark:border-cyan-800/30 hover:bg-transparent">
                <TableHead className={cn(headStyle, 'w-[80px] px-6')}>ID</TableHead>
                <TableHead className={cn(headStyle, 'min-w-[200px]')}>{t('table.jobName')}</TableHead>
                <TableHead className={cn(headStyle, 'w-[120px]')}>{t('table.state')}</TableHead>
                <TableHead className={cn(headStyle, 'w-[180px]')}>{t('table.time')}</TableHead>
                <TableHead className={headStyle}>{t('table.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderFailedRows(
                failedQuery.data?.items ?? [],
                t('failed.empty'),
                <CheckCircle2 className="size-10 text-emerald-500/20" />,
                'failedAt',
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-blue-950/40 border-t border-slate-200 dark:border-cyan-800/30 gap-4 transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
            {t('failed.total')}: <span className="text-rose-600 dark:text-rose-400 tabular-nums">{failedQuery.data?.total ?? 0}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={failedPage <= 1} onClick={() => setFailedPage((p) => Math.max(1, p - 1))} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
              <ArrowLeft size={14} className="mr-2" /> {t('common:common.previous')}
            </Button>
            <Button variant="outline" size="sm" disabled={failedPage >= failedTotalPages} onClick={() => setFailedPage((p) => Math.min(failedTotalPages, p + 1))} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
              {t('common:common.next')} <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
        <div className="p-5 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('deadLetter.title')}</h2>
          </div>
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20 font-black text-[10px]">
            {t('deadLetter.enqueued').toUpperCase()}: {deadLetterQuery.data?.enqueued ?? 0}
          </Badge>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-blue-900/40">
              <TableRow className="border-b border-slate-200 dark:border-cyan-800/30 hover:bg-transparent">
                <TableHead className={cn(headStyle, 'w-[80px] px-6')}>ID</TableHead>
                <TableHead className={cn(headStyle, 'min-w-[200px]')}>{t('table.jobName')}</TableHead>
                <TableHead className={cn(headStyle, 'w-[120px]')}>{t('table.state')}</TableHead>
                <TableHead className={cn(headStyle, 'w-[180px]')}>{t('table.time')}</TableHead>
                <TableHead className={headStyle}>{t('table.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderFailedRows(
                deadLetterQuery.data?.items ?? [],
                t('deadLetter.empty'),
                <CheckCircle2 className="size-10 text-emerald-500/20" />,
                'enqueuedAt',
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end px-6 py-4 bg-slate-50/80 dark:bg-blue-950/40 border-t border-slate-200 dark:border-cyan-800/30 gap-2 transition-colors">
          <Button variant="outline" size="sm" disabled={deadLetterPage <= 1} onClick={() => setDeadLetterPage((p) => Math.max(1, p - 1))} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
            <ArrowLeft size={14} className="mr-2" /> {t('common:common.previous')}
          </Button>
          <Button variant="outline" size="sm" disabled={deadLetterPage >= deadLetterTotalPages} onClick={() => setDeadLetterPage((p) => Math.min(deadLetterTotalPages, p + 1))} className="h-9 px-4 border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
            {t('common:common.next')} <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
