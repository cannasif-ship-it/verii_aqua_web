import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Droplets,
  FileText,
  Fish,
  History,
  LayoutGrid,
  Loader2,
  Scale,
  UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { formatLabelWithKey } from '@/shared/utils/dropdown-label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageDailyRow, CageProjectReport } from '../types/project-detail-report-types';

const REPORT_QUERY_KEY = ['aqua', 'reports', 'project-detail'] as const;
type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function ReportGuideCard({ t }: { t: (key: string, options?: Record<string, unknown>) => string }): ReactElement {
  return (
    <Card className="border-cyan-200 bg-cyan-50 dark:border-cyan-800/30 dark:bg-cyan-950/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-cyan-700 dark:text-cyan-400">
          {t('aqua.projectDetailReport.readGuideTitle')}
        </CardTitle>
        <CardDescription className="text-cyan-600/80 dark:text-cyan-400/70">
          {t('aqua.projectDetailReport.readGuideDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-cyan-200/50 bg-white/60 dark:border-cyan-800/20 dark:bg-blue-950/40 p-3 shadow-sm">
          {t('aqua.projectDetailReport.readGuideCurrentFish')}
        </div>
        <div className="rounded-xl border border-cyan-200/50 bg-white/60 dark:border-cyan-800/20 dark:bg-blue-950/40 p-3 shadow-sm">
          {t('aqua.projectDetailReport.readGuideShipment')}
        </div>
        <div className="rounded-xl border border-cyan-200/50 bg-white/60 dark:border-cyan-800/20 dark:bg-blue-950/40 p-3 shadow-sm">
          {t('aqua.projectDetailReport.readGuideDelta')}
        </div>
        <div className="rounded-xl border border-cyan-200/50 bg-white/60 dark:border-cyan-800/20 dark:bg-blue-950/40 p-3 shadow-sm">
          {t('aqua.projectDetailReport.readGuideButtons')}
        </div>
      </CardContent>
    </Card>
  );
}

function CageSummaryCards({ cage, t }: { cage: CageProjectReport; t: (key: string) => string }): ReactElement {
  const stockRatio = cage.initialFishCount > 0 ? clampPercent((cage.currentFishCount / cage.initialFishCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-400 dark:border-emerald-500/50 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Fish className="size-3.5 text-emerald-500" />
          {t('aqua.projectDetailReport.initialFish')} / {t('aqua.projectDetailReport.currentFish')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">{t('aqua.projectDetailReport.initialFish')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.initialFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">{t('aqua.projectDetailReport.currentFish')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.currentFishCount)}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${stockRatio}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 truncate">{t('aqua.projectDetailReport.totalDead')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.totalDeadCount)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 truncate">{t('aqua.projectDetailReport.totalCountDelta')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.totalCountDelta)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-l-2 border-indigo-400 dark:border-indigo-500/50 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Scale className="size-3.5 text-indigo-500" />
          {t('aqua.projectDetailReport.initialAverageGram')} / {t('aqua.projectDetailReport.currentAverageGram')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">{t('aqua.projectDetailReport.initialAverageGram')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.initialAverageGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400 truncate">{t('aqua.projectDetailReport.currentAverageGram')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.currentAverageGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 truncate">{t('aqua.projectDetailReport.initialBiomassGram')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.initialBiomassGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">{t('aqua.projectDetailReport.currentBiomassGram')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.currentBiomassGram)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-l-2 border-amber-400 dark:border-amber-500/50 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <UtensilsCrossed className="size-3.5 text-amber-500" />
          {t('aqua.projectDetailReport.totalFeedGram')} / {t('aqua.projectDetailReport.totalBiomassDelta')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">{t('aqua.projectDetailReport.totalFeedGram')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.totalFeedGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 truncate">{t('aqua.projectDetailReport.totalBiomassDelta')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(cage.totalBiomassDelta)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProjectSummaryCards({
  activeCageCount,
  inactiveCageCount,
  totalInitialFish,
  totalCurrentFish,
  totalDead,
  totalFeedGram,
  totalCurrentBiomass,
  avgCurrentGram,
  totalShipmentFish,
  totalShipmentBiomass,
  lastShipmentDate,
  t,
}: any): ReactElement {
  const stockRatio = totalInitialFish > 0 ? clampPercent((totalCurrentFish / totalInitialFish) * 100) : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 truncate">{t('aqua.projectDetailReport.activeCages')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(activeCageCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{t('aqua.projectDetailReport.inactiveCages')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(inactiveCageCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">{t('aqua.projectDetailReport.initialFishTotal')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalInitialFish)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">{t('aqua.projectDetailReport.currentFishTotal')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalCurrentFish)}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-500 transition-[width]" style={{ width: `${stockRatio}%` }} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 truncate">{t('aqua.projectDetailReport.totalDead')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalDead)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">{t('aqua.projectDetailReport.totalFeedGram')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalFeedGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">{t('aqua.projectDetailReport.currentBiomassTotal')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalCurrentBiomass)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">{t('aqua.projectDetailReport.currentAvgGramTotal')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(avgCurrentGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-teal-600 dark:text-teal-400 truncate">{t('aqua.projectDetailReport.totalShipmentFish')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalShipmentFish)}</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
        <CardContent className="pt-4 min-w-0">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400 truncate">{t('aqua.projectDetailReport.totalShipmentBiomass')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalShipmentBiomass)}</p>
          <p className="mt-1 text-xs text-slate-500 truncate">{t('aqua.projectDetailReport.lastShipmentDate')}: {lastShipmentDate}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectCurrentSnapshotCards({ projectCode, projectName, snapshotDate, liveRatePercent, aliveFishCount, deadFishCount, missingFeedCageCountToday, activeCageCount, totalShipmentFish, totalShipmentBiomass, lastShipmentDate, consistency, t }: any): ReactElement {
  const safeRate = clampPercent(liveRatePercent);
  const hasSnapshotDate = snapshotDate !== '-';
  const activeWithFeedCount = hasSnapshotDate ? Math.max(0, activeCageCount - missingFeedCageCountToday) : 0;

  return (
    <Card className="border-slate-200 bg-slate-50 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/40 dark:backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-slate-200 dark:border-cyan-800/30 bg-white/50 dark:bg-transparent">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {t('aqua.projectDetailReport.currentSnapshotTitle')}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400 truncate">
              {projectCode} — {projectName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-cyan-200 text-cyan-700 bg-cyan-50 dark:border-cyan-500/30 dark:text-cyan-400 dark:bg-cyan-500/10 shrink-0">
            {t('aqua.projectDetailReport.snapshotDate')}: {snapshotDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">{t('aqua.projectDetailReport.liveRate')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(safeRate)}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">{t('aqua.projectDetailReport.aliveFishNow')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(aliveFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 truncate">{t('aqua.projectDetailReport.totalDead')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(deadFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">{t('aqua.projectDetailReport.cagesFedToday')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(activeWithFeedCount)} / {formatNumber(activeCageCount)}</p>
            </CardContent>
          </Card>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${safeRate}%` }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 truncate">{t('aqua.projectDetailReport.totalShipmentFish')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalShipmentFish)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/50 shadow-sm">
            <CardContent className="pt-4 min-w-0">
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 truncate">{t('aqua.projectDetailReport.totalShipmentBiomass')}</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 dark:text-white truncate">{formatNumber(totalShipmentBiomass)}</p>
              <p className="mt-1 text-xs text-slate-500 truncate">{t('aqua.projectDetailReport.lastShipmentDate')}: {lastShipmentDate}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-[#0b0713]">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {t('aqua.projectDetailReport.consistencyFormula')}
              </p>
              <Badge className={consistency.isConsistent ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'}>
                {consistency.isConsistent ? t('aqua.projectDetailReport.consistent') : t('aqua.projectDetailReport.inconsistent')}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold tabular-nums text-slate-900 dark:text-white truncate">
              {formatNumber(aliveFishCount)} = {formatNumber(consistency.expectedCurrentFish)}
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export function ProjectDetailReportPage(): ReactElement {
  const { t } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string>('');
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({ open: false, title: '', description: '', items: [] });

  const requestedProjectId = useMemo(() => parsePositiveInt(searchParams.get('projectId')), [searchParams]);
  const requestedCageId = useMemo(() => parsePositiveInt(searchParams.get('cageId')), [searchParams]);

  useEffect(() => {
    if (requestedProjectId == null) return;
    if (projectId === requestedProjectId) return;
    setProjectId(requestedProjectId);
  }, [projectId, requestedProjectId]);

  const openDetailDialog = (cage: CageProjectReport, row: CageDailyRow, type: DetailType): void => {
    const titleMap: Record<DetailType, string> = {
      feeding: t('aqua.projectDetailReport.feedingDetails'),
      netOperation: t('aqua.projectDetailReport.netOps'),
      transfer: t('aqua.projectDetailReport.transfers'),
      stockConvert: t('aqua.projectDetailReport.stockConverts'),
      shipment: t('aqua.projectDetailReport.shipments'),
    };
    const detailMap: Record<DetailType, string[]> = {
      feeding: row.feedDetails,
      netOperation: row.netOperationDetails,
      transfer: row.transferDetails,
      stockConvert: row.stockConvertDetails,
      shipment: row.shipmentDetails,
    };
    const items = detailMap[type];
    if (items.length === 0) return;

    setDetailDialog({ open: true, title: `${titleMap[type]} - ${cage.cageLabel}`, description: `${t('aqua.projectDetailReport.date')}: ${row.date}`, items });
  };

  const projectsQuery = useQuery({
    queryKey: [...REPORT_QUERY_KEY, 'projects'] as const,
    queryFn: () => projectDetailReportApi.getProjects(),
    staleTime: 5 * 60 * 1000,
  });

  const reportQuery = useQuery({
    queryKey: [...REPORT_QUERY_KEY, projectId] as const,
    queryFn: () => projectDetailReportApi.getProjectDetailReport(projectId!),
    enabled: projectId != null,
    staleTime: 30 * 1000,
  });

  const sortedProjects = useMemo(() => {
    const list = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
    return [...list].sort((a, b) => String(a.projectCode ?? '').localeCompare(String(b.projectCode ?? '')));
  }, [projectsQuery.data]);

  const projectOptions = useMemo(
    () =>
      sortedProjects.map((project) => ({
        value: String(project.id),
        label: formatLabelWithKey(`${project.projectCode ?? ''} - ${project.projectName ?? ''}`.trim().replace(/^-\s*|\s*-\s*$/g, ''), project.id),
      })),
    [sortedProjects]
  );

  const projectSummary = useMemo(() => {
    if (!reportQuery.data) return null;
    const cages = reportQuery.data.cages;
    const totalInitialFish = cages.reduce((acc, x) => acc + Number(x.initialFishCount ?? 0), 0);
    const totalCurrentFish = cages.reduce((acc, x) => acc + Number(x.currentFishCount ?? 0), 0);
    const totalDead = cages.reduce((acc, x) => acc + Number(x.totalDeadCount ?? 0), 0);
    const totalFeedGram = cages.reduce((acc, x) => acc + Number(x.totalFeedGram ?? 0), 0);
    const totalCurrentBiomass = cages.reduce((acc, x) => acc + Number(x.currentBiomassGram ?? 0), 0);
    const totalShipmentFish = cages.reduce((acc, x) => acc + x.dailyRows.reduce((sum, row) => sum + Number(row.shipmentFishCount ?? 0), 0), 0);
    const totalShipmentBiomass = cages.reduce((acc, x) => acc + x.dailyRows.reduce((sum, row) => sum + Number(row.shipmentBiomassGram ?? 0), 0), 0);
    const shipmentDates = cages.flatMap((x) => x.dailyRows).filter((row) => row.shipmentCount > 0 || row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0).map((row) => row.date).sort((a, b) => b.localeCompare(a));
    const avgCurrentGram = totalCurrentFish > 0 ? totalCurrentBiomass / totalCurrentFish : 0;
    const expectedCurrentFish = Math.max(0, totalInitialFish - totalDead - totalShipmentFish);
    const isConsistent = expectedCurrentFish === totalCurrentFish;

    return { activeCageCount: cages.length, inactiveCageCount: reportQuery.data.cageHistory.length, totalInitialFish, totalCurrentFish, totalDead, totalFeedGram, totalCurrentBiomass, avgCurrentGram, totalShipmentFish, totalShipmentBiomass, lastShipmentDate: shipmentDates[0] ?? '-', expectedCurrentFish, isConsistent };
  }, [reportQuery.data]);

  const projectCurrentSnapshot = useMemo(() => {
    if (!reportQuery.data || !projectSummary) return null;
    const cages = reportQuery.data.cages;
    const latestDate = cages.flatMap((x) => x.dailyRows.map((r) => r.date)).sort((a, b) => b.localeCompare(a))[0];
    const snapshotDate = latestDate || '-';
    const liveRatePercent = projectSummary.totalInitialFish > 0 ? (projectSummary.totalCurrentFish / projectSummary.totalInitialFish) * 100 : 0;

    return { projectCode: reportQuery.data.project.projectCode ?? '', projectName: reportQuery.data.project.projectName ?? '', snapshotDate, liveRatePercent, aliveFishCount: projectSummary.totalCurrentFish, deadFishCount: projectSummary.totalDead, missingFeedCageCountToday: latestDate != null ? cages.filter((cage) => cage.missingFeedingDays.includes(latestDate)).length : 0, activeCageCount: projectSummary.activeCageCount, totalShipmentFish: projectSummary.totalShipmentFish, totalShipmentBiomass: projectSummary.totalShipmentBiomass, lastShipmentDate: projectSummary.lastShipmentDate, consistency: { expectedCurrentFish: projectSummary.expectedCurrentFish, isConsistent: projectSummary.isConsistent } };
  }, [projectSummary, reportQuery.data]);

  useEffect(() => {
    if (!reportQuery.data || requestedCageId == null) return;
    const hasCage = reportQuery.data.cages.some((cage) => cage.projectCageId === requestedCageId);
    if (hasCage) setOpenAccordionItem(`cage-${requestedCageId}`);
  }, [reportQuery.data, requestedCageId]);

  const handleProjectChange = (nextProjectId: number | null): void => {
    setProjectId(nextProjectId);
    setOpenAccordionItem('');
    const nextParams = new URLSearchParams(searchParams);
    if (nextProjectId == null) { nextParams.delete('projectId'); nextParams.delete('cageId'); } 
    else { nextParams.set('projectId', String(nextProjectId)); nextParams.delete('cageId'); }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="min-h-[60vh] space-y-6 pb-8">
      <Card className="relative overflow-hidden border-slate-200 bg-white shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/60 dark:backdrop-blur-xl rounded-2xl">
        <CardHeader className="relative p-4 sm:p-6 bg-slate-50/50 dark:bg-transparent border-b border-slate-100 dark:border-cyan-800/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 to-blue-500 p-0.5 shadow-md shadow-cyan-500/20">
                  <div className="h-full w-full bg-white dark:bg-blue-950 rounded-[14px] flex items-center justify-center">
                    <FileText className="size-6 text-cyan-600 dark:text-cyan-500" />
                  </div>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {t('aqua.projectDetailReport.pageTitle')}
                </CardTitle>
                <CardDescription className="mt-1 text-slate-500 dark:text-slate-400 truncate">
                  {t('aqua.projectDetailReport.description')}
                </CardDescription>
              </div>
            </div>
            <div className="w-full lg:max-w-xs shrink-0">
              <Combobox
                options={projectOptions}
                value={projectId != null ? String(projectId) : ''}
                onValueChange={(v) => handleProjectChange(v ? Number(v) : null)}
                placeholder={t('aqua.projectDetailReport.selectProject')}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.noResults')}
                disabled={projectsQuery.isLoading}
                className="w-full bg-slate-50 dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white h-11 rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {projectId == null && (
        <Card className="border-slate-200 bg-white/50 dark:border-cyan-800/30 dark:bg-blue-950/40 rounded-2xl backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-500">
              <LayoutGrid className="size-8" />
            </div>
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('aqua.projectDetailReport.pickProjectFirst')}
            </p>
          </CardContent>
        </Card>
      )}

      {reportQuery.isLoading && projectId != null && (
        <Card className="border-slate-200 bg-white/50 dark:border-cyan-800/30 dark:bg-blue-950/40 rounded-2xl backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
          </CardContent>
        </Card>
      )}

      {reportQuery.isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-950/40 rounded-2xl backdrop-blur-sm">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-red-600 dark:text-red-400">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 font-bold">!</span>
            {(reportQuery.error as Error).message}
          </CardContent>
        </Card>
      )}

      {reportQuery.data && (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/60 dark:backdrop-blur-xl rounded-2xl">
          <CardHeader className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-transparent p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-500">
                    <Droplets className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {reportQuery.data.project.projectCode} — {reportQuery.data.project.projectName}
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400 truncate">
                      {t('aqua.projectDetailReport.totalCages')}: {reportQuery.data.cages.length}
                    </CardDescription>
                  </div>
              </div>
              <Badge className="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20 border-0 px-4 py-1.5 text-sm rounded-lg shrink-0">
                {reportQuery.data.cages.length} Kafes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-slate-100 dark:border-cyan-800/30 px-4 sm:px-6 pb-6 pt-6 bg-transparent">
              <ReportGuideCard t={t} />
            </div>
            
            {projectCurrentSnapshot && (
              <div className="border-b border-slate-100 dark:border-cyan-800/30 bg-transparent px-4 sm:px-6 pb-6 pt-6">
                <ProjectCurrentSnapshotCards {...projectCurrentSnapshot} t={t} />
              </div>
            )}

            {projectSummary && (
              <div className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-950/20 px-4 sm:px-6 pb-6 pt-6">
                <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/40 dark:backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-cyan-800/30">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white truncate">
                      {t('aqua.projectDetailReport.mainSummaryTitle')}
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 truncate">
                      {t('aqua.projectDetailReport.mainSummaryDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ProjectSummaryCards {...projectSummary} t={t} />
                  </CardContent>
                </Card>
              </div>
            )}

            {reportQuery.data.cages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-blue-900/30 text-slate-400 dark:text-slate-500">
                  <LayoutGrid className="size-7" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('aqua.projectDetailReport.noActiveCages')}
                </p>
              </div>
            ) : (
              <div className="px-4 sm:px-6 pt-6 pb-6 bg-transparent">
              <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordionItem} onValueChange={setOpenAccordionItem}>
                {reportQuery.data.cages.map((cage, idx) => (
                  <AccordionItem key={cage.projectCageId} value={`cage-${cage.projectCageId}`} className="border border-slate-200 dark:border-cyan-800/30 rounded-xl px-2 sm:px-4 bg-white shadow-sm dark:bg-blue-950/40 data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-blue-900/20 transition-colors">
                    <AccordionTrigger className="rounded-xl py-4 sm:py-5 hover:no-underline text-slate-900 dark:text-white">
                      <div className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 pr-4">
                        <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-base text-slate-900 dark:text-white truncate">{cage.cageLabel}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {t('aqua.projectDetailReport.currentVsInitial')}:{' '}
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{formatNumber(cage.currentFishCount)}</span> / {formatNumber(cage.initialFishCount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-blue-900/50 dark:text-slate-300 dark:hover:bg-blue-900/70 border-0">
                            {t('aqua.projectDetailReport.dead')}: {formatNumber(cage.totalDeadCount)}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pb-6 pt-2">
                      <CageSummaryCards cage={cage} t={t} />

                      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-sm">
                        <CardHeader className="pb-3 border-b border-amber-200/50 dark:border-amber-900/50">
                          <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400 truncate">
                            <UtensilsCrossed className="size-4 shrink-0" />
                            {t('aqua.projectDetailReport.missingFeedingDates')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {cage.missingFeedingDays.length === 0 ? (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {t('aqua.projectDetailReport.noMissingFeedDay')}
                            </p>
                          ) : (
                            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto custom-scrollbar pr-1">
                              {cage.missingFeedingDays.slice(0, 90).map((day) => (
                                <Badge key={day} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 font-medium">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/40 shadow-sm">
                        <CardHeader className="border-b border-slate-100 dark:border-cyan-800/30 pb-4">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white truncate">
                            <Calendar className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
                            {t('aqua.projectDetailReport.dailyDetails')}
                          </CardTitle>
                          <CardDescription className="text-slate-500 dark:text-slate-400 truncate">{t('aqua.projectDetailReport.dailyDetailsHint')}</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0 custom-scrollbar">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-cyan-800/30 dark:bg-blue-900/20 dark:hover:bg-blue-900/20">
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.date')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.feedGram')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.feedStocks')}</TableHead>
                                <TableHead className="font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">{t('aqua.projectDetailReport.deadCount')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.countDelta')}</TableHead>
                                <TableHead className="font-semibold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">{t('aqua.projectDetailReport.biomassDelta')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.weather')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.netOps')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.transfers')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.shipments')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.shipmentQty')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.stockConverts')}</TableHead>
                                <TableHead className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('aqua.projectDetailReport.feedStatus')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                            {cage.dailyRows.length === 0 && (
                              <TableRow className="border-slate-100 hover:bg-transparent dark:border-cyan-800/30">
                                <TableCell colSpan={13} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                  {t('common.noData')}
                                </TableCell>
                              </TableRow>
                            )}
                            {cage.dailyRows.slice(0, 45).map((row, rowIdx) => (
                              <TableRow key={`${cage.projectCageId}-${row.date}`} className={`border-slate-100 dark:border-cyan-800/30 transition-colors ${rowIdx % 2 === 1 ? 'bg-slate-50/50 dark:bg-blue-900/10' : 'bg-transparent'} hover:bg-slate-100/50 dark:hover:bg-blue-900/20`}>
                                <TableCell className="font-medium tabular-nums text-slate-800 dark:text-slate-300">{row.date}</TableCell>
                                <TableCell className="tabular-nums text-amber-600 dark:text-amber-400 font-medium">{formatNumber(row.feedGram)}</TableCell>
                                <TableCell>
                                  {row.feedDetails.length > 0 ? (
                                    <Button type="button" variant="outline" size="sm" className="h-7 px-3 text-[11px] font-bold bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:border-cyan-700/50 dark:text-cyan-400 dark:hover:bg-cyan-800/50" onClick={() => openDetailDialog(cage, row, 'feeding')}>
                                      {t('aqua.projectDetailReport.stockCountShort', { count: row.feedStockCount })}
                                    </Button>
                                  ) : (<span className="text-slate-400 dark:text-slate-500 text-xs">-</span>)}
                                </TableCell>
                                <TableCell className="tabular-nums text-red-600 dark:text-red-400 font-bold">{formatNumber(row.deadCount)}</TableCell>
                                <TableCell className="tabular-nums text-slate-600 dark:text-slate-300">{formatNumber(row.countDelta)}</TableCell>
                                <TableCell className="tabular-nums text-cyan-600 dark:text-cyan-400 font-bold">{formatNumber(row.biomassDelta)}</TableCell>
                                <TableCell className="max-w-[150px] truncate text-slate-500 dark:text-slate-400 text-xs" title={row.weather}>{row.weather}</TableCell>
                                <TableCell>
                                  {row.netOperationCount > 0 ? (
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-blue-600 dark:text-blue-400 underline decoration-blue-300 dark:decoration-blue-400/30" onClick={() => openDetailDialog(cage, row, 'netOperation')}>
                                      {formatNumber(row.netOperationCount)}
                                    </Button>
                                  ) : (<span className="text-slate-400 dark:text-slate-500">-</span>)}
                                </TableCell>
                                <TableCell>
                                  {row.transferCount > 0 ? (
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 dark:decoration-indigo-400/30" onClick={() => openDetailDialog(cage, row, 'transfer')}>
                                      {formatNumber(row.transferCount)}
                                    </Button>
                                  ) : (<span className="text-slate-400 dark:text-slate-500">-</span>)}
                                </TableCell>
                                <TableCell>
                                  {row.shipmentCount > 0 ? (
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-orange-600 dark:text-orange-400 underline decoration-orange-300 dark:decoration-orange-400/30" onClick={() => openDetailDialog(cage, row, 'shipment')}>
                                      {formatNumber(row.shipmentCount)}
                                    </Button>
                                  ) : (<span className="text-slate-400 dark:text-slate-500">-</span>)}
                                </TableCell>
                                <TableCell className="tabular-nums text-slate-500 dark:text-slate-400 text-xs">
                                  {row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0 ? `${formatNumber(row.shipmentFishCount)} / ${formatNumber(row.shipmentBiomassGram)}g` : '-'}
                                </TableCell>
                                <TableCell>
                                  {row.stockConvertCount > 0 ? (
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-violet-600 dark:text-violet-400 underline decoration-violet-300 dark:decoration-violet-400/30" onClick={() => openDetailDialog(cage, row, 'stockConvert')}>
                                      {formatNumber(row.stockConvertCount)}
                                    </Button>
                                  ) : (<span className="text-slate-400 dark:text-slate-500">-</span>)}
                                </TableCell>
                                <TableCell>
                                  {row.fed ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{t('aqua.projectDetailReport.fed')}</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">{t('aqua.projectDetailReport.notFed')}</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              </div>
            )}

            {reportQuery.data.cageHistory.length > 0 && (
              <div className="border-t border-slate-100 dark:border-cyan-800/30 px-4 sm:px-6 pb-6 pt-6">
                <Card className="border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/40 shadow-sm">
                  <CardHeader className="pb-4 border-b border-slate-100 dark:border-cyan-800/30">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white truncate">
                      <History className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
                      {t('aqua.projectDetailReport.cageHistoryTitle')}
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 truncate">
                      {t('aqua.projectDetailReport.cageHistoryDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto p-0 custom-scrollbar">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50 dark:border-cyan-800/30 dark:bg-blue-900/20 dark:hover:bg-blue-900/20">
                          <TableHead className="font-semibold text-slate-500 dark:text-slate-400">{t('aqua.projectDetailReport.cage')}</TableHead>
                          <TableHead className="font-semibold text-slate-500 dark:text-slate-400">{t('aqua.projectDetailReport.assignedDate')}</TableHead>
                          <TableHead className="font-semibold text-slate-500 dark:text-slate-400">{t('aqua.projectDetailReport.releasedDate')}</TableHead>
                          <TableHead className="font-semibold text-slate-500 dark:text-slate-400">{t('aqua.projectDetailReport.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportQuery.data.cageHistory.map((item) => (
                          <TableRow key={`history-${item.projectCageId}`} className="border-slate-100 dark:border-cyan-800/30 hover:bg-slate-50 dark:hover:bg-blue-900/20">
                            <TableCell className="font-medium text-slate-800 dark:text-slate-300">{item.cageLabel}</TableCell>
                            <TableCell className="tabular-nums text-slate-600 dark:text-slate-400">{item.assignedDate ? item.assignedDate.slice(0, 10) : '-'}</TableCell>
                            <TableCell className="tabular-nums text-slate-600 dark:text-slate-400">{item.releasedDate ? item.releasedDate.slice(0, 10) : '-'}</TableCell>
                            <TableCell>
                              <Badge className="bg-slate-100 text-slate-600 dark:bg-blue-900/40 dark:text-slate-400 border-0">{t('aqua.projectDetailReport.inactive')}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DETAY DİALOG PENCERESİ */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden bg-white dark:bg-blue-950/98 dark:backdrop-blur-2xl border-slate-200 dark:border-cyan-800/30 p-0 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/50 dark:bg-blue-900/10 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <Activity className="size-4 text-cyan-500 shrink-0" />
                <span className="truncate">{detailDialog.title}</span>
              </DialogTitle>
              <span className="text-[11px] font-black text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/40 px-3 py-1 rounded-full tabular-nums shrink-0 border border-cyan-200 dark:border-cyan-800/50">
                {detailDialog.description}
              </span>
            </div>
          </DialogHeader>
          {detailDialog.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('aqua.projectDetailReport.noOperationDetail')}
            </p>
          ) : (
            <div className="bg-transparent flex flex-col min-h-0">
              <div className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-950/50 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {t('aqua.projectDetailReport.detailRecords', { count: detailDialog.items.length })}
              </div>
              <div className="max-h-[50vh] overflow-y-auto px-4 py-4 custom-scrollbar">
                {detailDialog.items.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-4 border-b border-slate-100 dark:border-cyan-800/30 px-4 py-3.5 last:border-b-0 hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors rounded-xl mt-1">
                    <span className="shrink-0 text-xs font-black text-cyan-600 dark:text-cyan-400 pt-0.5">{index + 1}.</span>
                    <span className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 break-all">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
