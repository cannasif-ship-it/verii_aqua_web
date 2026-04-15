import { type ReactElement, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarRange, Fish, Loader2, Scale, Search, TrendingUp } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { devirFcrApi } from '../api/devir-fcr-api';

const PROJECTS_QUERY_KEY = ['aqua', 'devir-fcr', 'projects'] as const;
const REPORT_QUERY_KEY = ['aqua', 'devir-fcr', 'report'] as const;

function formatNumber(value: number | null | undefined, locale: string, maximumFractionDigits = 0): string {
  if (value == null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

function formatDecimal(value: number | null | undefined, locale: string, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(value);
}

function formatPercent(value: number | null | undefined, locale: string): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${formatDecimal(value, locale, 2)}%`;
}

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
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

export function DevirFcrReportPage(): ReactElement {
  const { t, i18n } = useTranslation('common');
  const today = useMemo(() => new Date(), []);
  const initialFromDate = useMemo(() => {
    const from = new Date(today);
    from.setMonth(from.getMonth() - 1);
    return formatDateInput(from);
  }, [today]);
  const initialToDate = useMemo(() => formatDateInput(today), [today]);

  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<{
    fromDate: string;
    toDate: string;
    projectIds: number[];
  } | null>(null);

  const projectsQuery = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: devirFcrApi.getProjects,
  });

  const filteredProjects = useMemo(() => {
    const items = projectsQuery.data ?? [];
    if (!projectSearch.trim()) return items;
    const lower = projectSearch.toLowerCase();
    return items.filter((project) =>
      `${project.projectCode ?? ''} ${project.projectName ?? ''}`.toLowerCase().includes(lower)
    );
  }, [projectSearch, projectsQuery.data]);

  const sortedSelectedProjectIds = useMemo(() => [...selectedProjectIds].sort((a, b) => a - b), [selectedProjectIds]);
  const canApplyFilters = selectedProjectIds.length > 0 && fromDate <= toDate;

  const reportQuery = useQuery({
    queryKey: [
      ...REPORT_QUERY_KEY,
      appliedFilters?.fromDate ?? '',
      appliedFilters?.toDate ?? '',
      appliedFilters?.projectIds.join(',') ?? '',
    ],
    queryFn: () => devirFcrApi.getReport(appliedFilters?.projectIds ?? [], appliedFilters?.fromDate ?? '', appliedFilters?.toDate ?? ''),
    enabled: Boolean(appliedFilters && appliedFilters.projectIds.length > 0 && appliedFilters.fromDate <= appliedFilters.toDate),
  });

  const toggleProject = (projectId: number): void => {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]
    );
  };

  const toggleAllFiltered = (): void => {
    const filteredIds = filteredProjects.map((project) => project.id);
    const allSelected = filteredIds.every((id) => selectedProjectIds.includes(id));
    if (allSelected) {
      setSelectedProjectIds((current) => current.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedProjectIds((current) => Array.from(new Set([...current, ...filteredIds])));
  };

  const allFilteredSelected = filteredProjects.length > 0 && filteredProjects.every((project) => selectedProjectIds.includes(project.id));
  const selectedCount = selectedProjectIds.length;
  const report = reportQuery.data;

  const applyFilters = (): void => {
    if (!canApplyFilters) return;
    setAppliedFilters({
      fromDate,
      toDate,
      projectIds: sortedSelectedProjectIds,
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb
        items={[
          { label: t('sidebar.aquaReports') },
          { label: t('sidebar.aquaDevirFcrReport'), isActive: true },
        ]}
      />

      <Card className="border-slate-200 bg-white/90 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
              <CalendarRange className="size-5 text-cyan-500" />
              {t('aqua.devirFcrReport.pageTitle')}
            </CardTitle>
            <CardDescription className="mt-1">{t('aqua.devirFcrReport.description')}</CardDescription>
          </div>
          <div className="grid gap-4 xl:grid-cols-[300px_300px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t('aqua.devirFcrReport.filters.fromDate')}
              </label>
              <Input type="date" value={fromDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t('aqua.devirFcrReport.filters.toDate')}
              </label>
              <Input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t('aqua.devirFcrReport.filters.projects')}
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-cyan-800/30 dark:bg-blue-950/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder={t('aqua.devirFcrReport.filters.searchProject')}
                      className="pl-9"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={toggleAllFiltered}>
                    {allFilteredSelected ? t('aqua.devirFcrReport.filters.clearFiltered') : t('aqua.devirFcrReport.filters.selectFiltered')}
                  </Button>
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t('aqua.devirFcrReport.filters.selectionSummary', { count: selectedCount })}
                  </p>
                  <Button type="button" onClick={applyFilters} disabled={!canApplyFilters || reportQuery.isFetching}>
                    {t('aqua.devirFcrReport.filters.apply')}
                  </Button>
                </div>

                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {filteredProjects.map((project) => {
                    const checked = selectedProjectIds.includes(project.id);
                    return (
                      <label
                        key={project.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-cyan-800/30 dark:bg-blue-950/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {project.projectCode ? `${project.projectCode} - ` : ''}
                            {project.projectName ?? '-'}
                          </p>
                        </div>
                        <Checkbox checked={checked} onCheckedChange={() => toggleProject(project.id)} />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {report && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title={t('aqua.devirFcrReport.summary.openingFish')}
            value={formatNumber(report.totals.openingFishCount, i18n.language)}
            description={t('aqua.devirFcrReport.summary.openingFishDescription')}
            icon={<Fish className="size-5" />}
          />
          <SummaryCard
            title={t('aqua.devirFcrReport.summary.shipmentFish')}
            value={formatNumber(report.totals.shipmentFishCount, i18n.language)}
            description={t('aqua.devirFcrReport.summary.shipmentFishDescription')}
            icon={<TrendingUp className="size-5" />}
          />
          <SummaryCard
            title={t('aqua.devirFcrReport.summary.endingFish')}
            value={formatNumber(report.totals.endingFishCount, i18n.language)}
            description={t('aqua.devirFcrReport.summary.endingFishDescription')}
            icon={<Fish className="size-5" />}
          />
          <SummaryCard
            title={t('aqua.devirFcrReport.summary.fcr')}
            value={formatDecimal(report.totals.fcr, i18n.language)}
            description={t('aqua.devirFcrReport.summary.fcrDescription')}
            icon={<Scale className="size-5" />}
          />
        </div>
      )}

      {reportQuery.isLoading ? (
        <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50">
          <CardContent className="flex items-center justify-center gap-3 py-16 text-slate-600 dark:text-slate-300">
            <Loader2 className="size-5 animate-spin" />
            {t('aqua.devirFcrReport.loading')}
          </CardContent>
        </Card>
      ) : reportQuery.isError ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="py-10 text-sm text-red-700 dark:text-red-300">
            {reportQuery.error instanceof Error ? reportQuery.error.message : t('aqua.devirFcrReport.loadFailed')}
          </CardContent>
        </Card>
      ) : !appliedFilters || appliedFilters.projectIds.length === 0 ? (
        <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50">
          <CardContent className="py-10 text-sm text-slate-600 dark:text-slate-300">
            {t('aqua.devirFcrReport.pendingState')}
          </CardContent>
        </Card>
      ) : report ? (
        <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-white">{t('aqua.devirFcrReport.tableTitle')}</CardTitle>
            <CardDescription>{t('aqua.devirFcrReport.tableDescription', { fromDate: report.fromDate, toDate: report.toDate })}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('aqua.devirFcrReport.columns.projectName')}</TableHead>
                  <TableHead>{t('aqua.devirFcrReport.columns.projectCode')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.openingFishCount')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.shipmentFishCount')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.mortalityFishCount')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.mortalityPct')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.endingFishCount')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.endingAverageGram')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.endingBiomassKg')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.shippedBiomassKg')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.mortalityBiomassKg')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.totalFeedKg')}</TableHead>
                  <TableHead className="text-right">{t('aqua.devirFcrReport.columns.fcr')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row) => (
                  <TableRow key={row.projectId}>
                    <TableCell className="font-medium">{row.projectName}</TableCell>
                    <TableCell>{row.projectCode}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.openingFishCount, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.shipmentFishCount, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.mortalityFishCount, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(row.mortalityPct, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.endingFishCount, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDecimal(row.endingAverageGram, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDecimal(row.endingBiomassKg, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDecimal(row.shippedBiomassKg, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDecimal(row.mortalityBiomassKg, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatDecimal(row.totalFeedKg, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.fcr != null ? <Badge variant="secondary">{formatDecimal(row.fcr, i18n.language)}</Badge> : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-50 dark:bg-cyan-950/20">
                  <TableCell className="font-extrabold">{t('aqua.devirFcrReport.totals')}</TableCell>
                  <TableCell className="font-extrabold">{report.totals.projectCode}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatNumber(report.totals.openingFishCount, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatNumber(report.totals.shipmentFishCount, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatNumber(report.totals.mortalityFishCount, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatPercent(report.totals.mortalityPct, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatNumber(report.totals.endingFishCount, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatDecimal(report.totals.endingAverageGram, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatDecimal(report.totals.endingBiomassKg, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatDecimal(report.totals.shippedBiomassKg, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatDecimal(report.totals.mortalityBiomassKg, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatDecimal(report.totals.totalFeedKg, i18n.language)}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">{formatDecimal(report.totals.fcr, i18n.language)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
