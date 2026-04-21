import { type ReactElement, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, BarChart3, Fish, Layers, Loader2, Scale, TrendingUp } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatLabelWithKey } from '@/shared/utils/dropdown-label';
import { aquaKpiApi, type RawKpiReport } from '../api/aqua-kpi-api';

const PROJECTS_QUERY_KEY = ['aqua', 'kpi', 'projects'] as const;
const RAW_KPI_QUERY_KEY = ['aqua', 'kpi', 'raw'] as const;

function formatNumber(value: number | null | undefined, locale: string, maximumFractionDigits = 2): string {
  if (value == null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

function formatPercent(value: number | null | undefined, locale: string): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${formatNumber(value, locale)}%`;
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactElement;
}): ReactElement {
  return (
    <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-cyan-600 dark:border-cyan-800/40 dark:bg-cyan-950/20 dark:text-cyan-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricDictionary({
  report,
  t,
}: {
  report: RawKpiReport;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  return (
    <Card className="border-cyan-200 bg-cyan-50/80 dark:border-cyan-800/30 dark:bg-cyan-950/20">
      <CardHeader>
        <CardTitle className="text-base text-cyan-700 dark:text-cyan-300">{t('aqua.rawKpiReport.dictionaryTitle')}</CardTitle>
        <CardDescription>{t('aqua.rawKpiReport.dictionaryDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {report.metricDefinitions.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-cyan-100 bg-white/80 p-4 dark:border-cyan-800/30 dark:bg-blue-950/40">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t(metric.labelKey)}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{t(metric.descriptionKey)}</p>
            <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              {t(metric.formulaKey, { forecastDays: 30 })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RawKpiReportPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);

  const projectsQuery = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: aquaKpiApi.getProjects,
  });

  const reportQuery = useQuery({
    queryKey: [...RAW_KPI_QUERY_KEY, projectId],
    queryFn: () => aquaKpiApi.getRawKpiReport(projectId as number),
    enabled: projectId != null,
  });

  const projectOptions = (projectsQuery.data ?? []).map((project) => ({
    value: String(project.id),
    label: formatLabelWithKey(`${project.projectCode ?? ''} - ${project.projectName ?? ''}`.trim().replace(/^-\s*|\s*-\s*$/g, ''), project.id),
  }));

  const report = reportQuery.data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.aquaReports') },
          { label: t('sidebar.aquaRawKpiReport'), isActive: true },
        ]}
      />

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
              <BarChart3 className="size-5 text-cyan-500" />
              {t('aqua.rawKpiReport.pageTitle')}
            </CardTitle>
            <CardDescription className="mt-1">{t('aqua.rawKpiReport.description')}</CardDescription>
          </div>
          <div className="w-full max-w-md">
            <Combobox
              options={projectOptions}
              value={projectId != null ? String(projectId) : ''}
              onValueChange={(value) => setProjectId(value ? Number(value) : null)}
              placeholder={t('aqua.rawKpiReport.selectProject')}
              searchPlaceholder={t('aqua.rawKpiReport.selectProject')}
              emptyText={t('aqua.rawKpiReport.noProject')}
            />
          </div>
        </CardHeader>
      </Card>

      {reportQuery.isLoading ? (
        <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-slate-600 dark:text-slate-300">
            <Loader2 className="size-5 animate-spin" />
            {t('aqua.rawKpiReport.loading')}
          </CardContent>
        </Card>
      ) : reportQuery.isError ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="py-10 text-sm text-red-700 dark:text-red-300">
            {reportQuery.error instanceof Error ? reportQuery.error.message : t('aqua.rawKpiReport.loadFailed')}
          </CardContent>
        </Card>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title={t('aqua.rawKpiReport.metrics.survivalPct')}
              value={formatPercent(report.survivalPct, i18n.language)}
              description={t('aqua.rawKpiReport.descriptions.survivalPct')}
              icon={<Fish className="size-5" />}
            />
            <SummaryCard
              title={t('aqua.rawKpiReport.metrics.fcr')}
              value={formatNumber(report.fcr, i18n.language)}
              description={t('aqua.rawKpiReport.descriptions.fcr')}
              icon={<Scale className="size-5" />}
            />
            <SummaryCard
              title={t('aqua.rawKpiReport.metrics.adgGramPerDay')}
              value={formatNumber(report.adgGramPerDay, i18n.language)}
              description={t('aqua.rawKpiReport.descriptions.adgGramPerDay')}
              icon={<TrendingUp className="size-5" />}
            />
            <SummaryCard
              title={t('aqua.rawKpiReport.metrics.forecastBiomassKg30d')}
              value={`${formatNumber(report.forecastBiomassKg30d, i18n.language)} kg`}
              description={t('aqua.rawKpiReport.descriptions.forecastBiomassKg30d')}
              icon={<Layers className="size-5" />}
            />
          </div>

          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">{t('aqua.rawKpiReport.snapshotTitle')}</CardTitle>
              <CardDescription>{report.projectCode} - {report.projectName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.stockedFish')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.stockedFish, i18n.language, 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.cageFishStock')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.liveFish, i18n.language, 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.warehouseFishStock')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.warehouseFish, i18n.language, 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.totalSystemFishStock')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.totalSystemFish, i18n.language, 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.cageBiomassKg')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.currentBiomassKg, i18n.language)} kg</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.warehouseBiomassKg')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.warehouseBiomassKg, i18n.language)} kg</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.totalSystemBiomassKg')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.totalSystemBiomassKg, i18n.language)} kg</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.rawKpiReport.metrics.totalFeedKg')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.totalFeedKg, i18n.language)} kg</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-white">
                <Activity className="size-4 text-cyan-500" />
                {t('aqua.rawKpiReport.tableTitle')}
              </CardTitle>
              <CardDescription>{t('aqua.rawKpiReport.tableDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('aqua.rawKpiReport.columns.cage')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.daysInSea')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.liveFish')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.currentAverageGram')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.currentBiomassKg')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.totalFeedKg')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.survivalPct')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.fcr')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.adgGramPerDay')}</TableHead>
                    <TableHead className="text-right">{t('aqua.rawKpiReport.columns.densityPct')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.projectCageId}>
                      <TableCell className="font-medium">{row.cageLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.daysInSea, i18n.language, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.liveFish, i18n.language, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.currentAverageGram, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.currentBiomassKg, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.totalFeedKg, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(row.survivalPct, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.fcr, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.adgGramPerDay, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.densityPct != null ? (
                          <Badge variant="secondary" className="tabular-nums">
                            {formatPercent(row.densityPct, i18n.language)}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <MetricDictionary report={report} t={t} />
        </>
      ) : null}
    </div>
  );
}
