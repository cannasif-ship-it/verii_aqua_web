import { type ReactElement, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Coins, Loader2, Target, TrendingUp, Wallet } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatLabelWithKey } from '@/shared/utils/dropdown-label';
import { aquaKpiApi, type BusinessKpiReport } from '../api/aqua-kpi-api';

const PROJECTS_QUERY_KEY = ['aqua', 'kpi', 'projects'] as const;
const BUSINESS_KPI_QUERY_KEY = ['aqua', 'kpi', 'business'] as const;

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
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300">
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
  report: BusinessKpiReport;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  return (
    <Card className="border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/30 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle className="text-base text-emerald-700 dark:text-emerald-300">{t('aqua.businessKpiReport.dictionaryTitle')}</CardTitle>
        <CardDescription>{t('aqua.businessKpiReport.dictionaryDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {report.metricDefinitions.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-emerald-100 bg-white/80 p-4 dark:border-emerald-800/30 dark:bg-blue-950/40">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t(metric.labelKey)}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{t(metric.descriptionKey)}</p>
            <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              {t(metric.formulaKey, report.assumptions)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BusinessKpiReportPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const [projectId, setProjectId] = useState<number | null>(null);

  const projectsQuery = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: aquaKpiApi.getProjects,
  });

  const reportQuery = useQuery({
    queryKey: [...BUSINESS_KPI_QUERY_KEY, projectId],
    queryFn: () => aquaKpiApi.getBusinessKpiReport(projectId as number),
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
          { label: t('sidebar.aquaBusinessKpiReport'), isActive: true },
        ]}
      />

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
              <Wallet className="size-5 text-emerald-500" />
              {t('aqua.businessKpiReport.pageTitle')}
            </CardTitle>
            <CardDescription className="mt-1">{t('aqua.businessKpiReport.description')}</CardDescription>
          </div>
          <div className="w-full max-w-md">
            <Combobox
              options={projectOptions}
              value={projectId != null ? String(projectId) : ''}
              onValueChange={(value) => setProjectId(value ? Number(value) : null)}
              placeholder={t('aqua.businessKpiReport.selectProject')}
              searchPlaceholder={t('aqua.businessKpiReport.selectProject')}
              emptyText={t('aqua.businessKpiReport.noProject')}
            />
          </div>
        </CardHeader>
      </Card>

      {reportQuery.isLoading ? (
        <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-slate-600 dark:text-slate-300">
            <Loader2 className="size-5 animate-spin" />
            {t('aqua.businessKpiReport.loading')}
          </CardContent>
        </Card>
      ) : reportQuery.isError ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="py-10 text-sm text-red-700 dark:text-red-300">
            {reportQuery.error instanceof Error ? reportQuery.error.message : t('aqua.businessKpiReport.loadFailed')}
          </CardContent>
        </Card>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title={t('aqua.businessKpiReport.metrics.harvestReadinessPct')}
              value={formatPercent(report.harvestReadinessPct, i18n.language)}
              description={t('aqua.businessKpiReport.descriptions.harvestReadinessPct')}
              icon={<Target className="size-5" />}
            />
            <SummaryCard
              title={t('aqua.businessKpiReport.metrics.projectedRevenue')}
              value={`${formatNumber(report.projectedRevenue, i18n.language)} u`}
              description={t('aqua.businessKpiReport.descriptions.projectedRevenue')}
              icon={<Coins className="size-5" />}
            />
            <SummaryCard
              title={t('aqua.businessKpiReport.metrics.projectedGrossMargin')}
              value={`${formatNumber(report.projectedGrossMargin, i18n.language)} u`}
              description={t('aqua.businessKpiReport.descriptions.projectedGrossMargin')}
              icon={<TrendingUp className="size-5" />}
            />
            <SummaryCard
              title={t('aqua.businessKpiReport.metrics.daysToTarget')}
              value={report.daysToTarget != null ? formatNumber(report.daysToTarget, i18n.language, 0) : '-'}
              description={t('aqua.businessKpiReport.descriptions.daysToTarget')}
              icon={<CalendarClock className="size-5" />}
            />
          </div>

          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">{t('aqua.businessKpiReport.snapshotTitle')}</CardTitle>
              <CardDescription>{report.projectCode} - {report.projectName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.metrics.estimatedFeedCost')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.estimatedFeedCost, i18n.language)} u</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.metrics.projectedHarvestBiomassKg')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(report.projectedHarvestBiomassKg, i18n.language)} kg</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.metrics.forecastConfidencePct')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatPercent(report.forecastConfidencePct, i18n.language)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-cyan-800/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.metrics.estimatedHarvestDate')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{report.estimatedHarvestDate ?? '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-800/30 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base text-amber-700 dark:text-amber-300">{t('aqua.businessKpiReport.assumptionTitle')}</CardTitle>
              <CardDescription>{t('aqua.businessKpiReport.assumptionDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
              <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 dark:border-amber-800/30 dark:bg-blue-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.assumptions.targetHarvestGram')}</p>
                <p className="mt-1 font-semibold">{formatNumber(report.assumptions.targetHarvestGram, i18n.language)} g</p>
              </div>
              <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 dark:border-amber-800/30 dark:bg-blue-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.assumptions.forecastDays')}</p>
                <p className="mt-1 font-semibold">{formatNumber(report.assumptions.forecastDays, i18n.language, 0)}</p>
              </div>
              <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 dark:border-amber-800/30 dark:bg-blue-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.assumptions.feedCostPerKg')}</p>
                <p className="mt-1 font-semibold">{formatNumber(report.assumptions.feedCostPerKg, i18n.language)} u/kg</p>
              </div>
              <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4 dark:border-amber-800/30 dark:bg-blue-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('aqua.businessKpiReport.assumptions.salePricePerKg')}</p>
                <p className="mt-1 font-semibold">{formatNumber(report.assumptions.salePricePerKg, i18n.language)} u/kg</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">{t('aqua.businessKpiReport.tableTitle')}</CardTitle>
              <CardDescription>{t('aqua.businessKpiReport.tableDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('aqua.businessKpiReport.columns.cage')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.targetWeightProgressPct')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.daysToTarget')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.harvestReadinessPct')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.forecastConfidencePct')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.estimatedFeedCost')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.projectedRevenue')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.projectedGrossMargin')}</TableHead>
                    <TableHead className="text-right">{t('aqua.businessKpiReport.columns.estimatedHarvestDate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row) => (
                    <TableRow key={row.projectCageId}>
                      <TableCell className="font-medium">{row.cageLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(row.targetWeightProgressPct, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.daysToTarget != null ? formatNumber(row.daysToTarget, i18n.language, 0) : '-'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Badge variant="secondary" className="tabular-nums">
                          {formatPercent(row.harvestReadinessPct, i18n.language)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(row.forecastConfidencePct, i18n.language)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.estimatedFeedCost, i18n.language)} u</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.projectedRevenue, i18n.language)} u</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(row.projectedGrossMargin, i18n.language)} u</TableCell>
                      <TableCell className="text-right tabular-nums">{row.estimatedHarvestDate ?? '-'}</TableCell>
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
