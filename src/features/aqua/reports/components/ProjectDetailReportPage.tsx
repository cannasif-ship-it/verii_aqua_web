import { type ReactElement, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Fish,
  Scale,
  UtensilsCrossed,
  FileText,
  LayoutGrid,
  History,
  Droplets,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface ReportConsistency {
  expectedCurrentFish: number;
  isConsistent: boolean;
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

function ReportGuideCard({ t }: { t: (key: string, options?: Record<string, unknown>) => string }): ReactElement {
  return (
    <Card className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-cyan-400">
          {t('aqua.projectDetailReport.readGuideTitle', { defaultValue: 'Raporu Nasıl Okurum?' })}
        </CardTitle>
        <CardDescription className="text-cyan-500/70">
          {t('aqua.projectDetailReport.readGuideDescription', {
            defaultValue:
              'Kartlar proje toplamını, alt açılır satırlar ise kafes bazlı günlük hareketleri gösterir.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-cyan-500/10 bg-[#0b0713]/50 p-3">
          {t('aqua.projectDetailReport.readGuideCurrentFish', {
            defaultValue: 'Mevcut Balık: Başlangıçtan ölüm ve sevkiyatlar düşülmüş canlı adettir.',
          })}
        </div>
        <div className="rounded-lg border border-cyan-500/10 bg-[#0b0713]/50 p-3">
          {t('aqua.projectDetailReport.readGuideShipment', {
            defaultValue: 'Sevk Miktarı: solda adet, sağda gram biyokütle toplamıdır.',
          })}
        </div>
        <div className="rounded-lg border border-cyan-500/10 bg-[#0b0713]/50 p-3">
          {t('aqua.projectDetailReport.readGuideDelta', {
            defaultValue: 'Delta kolonları gün içi net değişimi gösterir (+/-).',
          })}
        </div>
        <div className="rounded-lg border border-cyan-500/10 bg-[#0b0713]/50 p-3">
          {t('aqua.projectDetailReport.readGuideButtons', {
            defaultValue: 'Transfer/Sevkiyat/Dönüşüm butonuna tıklayınca o günün detay satırları açılır.',
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CageSummaryCards({ cage, t }: { cage: CageProjectReport; t: (key: string) => string }): ReactElement {
  const stockRatio =
    cage.initialFishCount > 0
      ? clampPercent((cage.currentFishCount / cage.initialFishCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-500/30 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Fish className="size-3.5 text-emerald-500" />
          {t('aqua.projectDetailReport.initialFish')} / {t('aqua.projectDetailReport.currentFish')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-emerald-500/80">{t('aqua.projectDetailReport.initialFish')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">{formatNumber(cage.initialFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-sky-500/80">{t('aqua.projectDetailReport.currentFish')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-400">{formatNumber(cage.currentFishCount)}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-500/20">
                <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${stockRatio}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-rose-500/80">{t('aqua.projectDetailReport.totalDead')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">{formatNumber(cage.totalDeadCount)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-teal-500/80">{t('aqua.projectDetailReport.totalCountDelta')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-teal-400">{formatNumber(cage.totalCountDelta)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-l-2 border-indigo-500/30 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Scale className="size-3.5 text-indigo-500" />
          {t('aqua.projectDetailReport.initialAverageGram')} / {t('aqua.projectDetailReport.currentAverageGram')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-indigo-500/80">{t('aqua.projectDetailReport.initialAverageGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-400">{formatNumber(cage.initialAverageGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-violet-500/80">{t('aqua.projectDetailReport.currentAverageGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-violet-400">{formatNumber(cage.currentAverageGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-cyan-500/80">{t('aqua.projectDetailReport.initialBiomassGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-400">{formatNumber(cage.initialBiomassGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-blue-500/80">{t('aqua.projectDetailReport.currentBiomassGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-blue-400">{formatNumber(cage.currentBiomassGram)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-l-2 border-amber-500/30 pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <UtensilsCrossed className="size-3.5 text-amber-500" />
          {t('aqua.projectDetailReport.totalFeedGram')} / {t('aqua.projectDetailReport.totalBiomassDelta')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-amber-500/80">{t('aqua.projectDetailReport.totalFeedGram')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-400">{formatNumber(cage.totalFeedGram)}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-white/5 bg-[#0b0713] shadow-sm">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-fuchsia-500/80">{t('aqua.projectDetailReport.totalBiomassDelta')}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-fuchsia-400">{formatNumber(cage.totalBiomassDelta)}</p>
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
}: {
  activeCageCount: number;
  inactiveCageCount: number;
  totalInitialFish: number;
  totalCurrentFish: number;
  totalDead: number;
  totalFeedGram: number;
  totalCurrentBiomass: number;
  avgCurrentGram: number;
  totalShipmentFish: number;
  totalShipmentBiomass: number;
  lastShipmentDate: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  const stockRatio =
    totalInitialFish > 0 ? clampPercent((totalCurrentFish / totalInitialFish) * 100) : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-white/5 bg-cyan-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-cyan-500/80">
            {t('aqua.projectDetailReport.activeCages', { defaultValue: 'Aktif Kafes' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-400">{formatNumber(activeCageCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-slate-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-slate-400">
            {t('aqua.projectDetailReport.inactiveCages', { defaultValue: 'Pasif Kafes' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">{formatNumber(inactiveCageCount)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-emerald-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-emerald-500/80">
            {t('aqua.projectDetailReport.initialFishTotal', { defaultValue: 'Başlangıç Toplam Balık' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">{formatNumber(totalInitialFish)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-sky-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-sky-500/80">
            {t('aqua.projectDetailReport.currentFishTotal', { defaultValue: 'Mevcut Toplam Balık' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sky-400">{formatNumber(totalCurrentFish)}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-500/20">
            <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${stockRatio}%` }} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-rose-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-rose-500/80">
            {t('aqua.projectDetailReport.totalDead', { defaultValue: 'Toplam Ölüm' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">{formatNumber(totalDead)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-amber-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-amber-500/80">
            {t('aqua.projectDetailReport.totalFeedGram', { defaultValue: 'Toplam Besleme (Gram)' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-400">{formatNumber(totalFeedGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-blue-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-blue-500/80">
            {t('aqua.projectDetailReport.currentBiomassTotal', { defaultValue: 'Mevcut Toplam Biyokütle (Gram)' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-blue-400">{formatNumber(totalCurrentBiomass)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-violet-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-violet-500/80">
            {t('aqua.projectDetailReport.currentAvgGramTotal', { defaultValue: 'Mevcut Ortalama Gram' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-violet-400">{formatNumber(avgCurrentGram)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-orange-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-orange-500/80">
            {t('aqua.projectDetailReport.totalShipmentFish', { defaultValue: 'Toplam Sevk Balık' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-orange-400">{formatNumber(totalShipmentFish)}</p>
        </CardContent>
      </Card>
      <Card className="border-white/5 bg-rose-500/5">
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-rose-500/80">
            {t('aqua.projectDetailReport.totalShipmentBiomass', { defaultValue: 'Toplam Sevk Biyokütle (Gram)' })}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">{formatNumber(totalShipmentBiomass)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t('aqua.projectDetailReport.lastShipmentDate', { defaultValue: 'Son Sevk Tarihi' })}: {lastShipmentDate}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectCurrentSnapshotCards({
  projectCode,
  projectName,
  snapshotDate,
  liveRatePercent,
  aliveFishCount,
  deadFishCount,
  missingFeedCageCountToday,
  activeCageCount,
  totalShipmentFish,
  totalShipmentBiomass,
  lastShipmentDate,
  consistency,
  t,
}: {
  projectCode: string;
  projectName: string;
  snapshotDate: string;
  liveRatePercent: number;
  aliveFishCount: number;
  deadFishCount: number;
  missingFeedCageCountToday: number;
  activeCageCount: number;
  totalShipmentFish: number;
  totalShipmentBiomass: number;
  lastShipmentDate: string;
  consistency: ReportConsistency;
  t: (key: string, options?: Record<string, unknown>) => string;
}): ReactElement {
  const safeRate = clampPercent(liveRatePercent);
  const hasSnapshotDate = snapshotDate !== '-';
  const activeWithFeedCount = hasSnapshotDate
    ? Math.max(0, activeCageCount - missingFeedCageCountToday)
    : 0;

  return (
    <Card className="border-white/5 bg-[#1a1025]/40 backdrop-blur-md shadow-sm">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-white">
              {t('aqua.projectDetailReport.currentSnapshotTitle', { defaultValue: 'Ana Detay (Şu Anki Anlık Durum)' })}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              {projectCode} — {projectName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
            {t('aqua.projectDetailReport.snapshotDate', { defaultValue: 'Anlık tarih' })}: {snapshotDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/5 bg-emerald-500/10">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-emerald-400">
                {t('aqua.projectDetailReport.liveRate', { defaultValue: 'Canlılık Oranı' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">
                {formatNumber(safeRate)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-sky-500/10">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-sky-400">
                {t('aqua.projectDetailReport.aliveFishNow', { defaultValue: 'Şu An Canlı Balık' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-300">{formatNumber(aliveFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-rose-500/10">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-rose-400">
                {t('aqua.projectDetailReport.totalDead', { defaultValue: 'Toplam Ölüm' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-300">{formatNumber(deadFishCount)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-amber-500/10">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-amber-400">
                {t('aqua.projectDetailReport.cagesFedToday', { defaultValue: 'Bugün Beslenen Aktif Kafes' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-300">
                {formatNumber(activeWithFeedCount)} / {formatNumber(activeCageCount)}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-500/20">
          <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${safeRate}%` }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-white/5 bg-orange-500/10">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-orange-400">
                {t('aqua.projectDetailReport.totalShipmentFish', { defaultValue: 'Toplam Sevk Balık' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-orange-300">{formatNumber(totalShipmentFish)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-rose-500/10">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-rose-400">
                {t('aqua.projectDetailReport.totalShipmentBiomass', { defaultValue: 'Toplam Sevk Biyokütle (Gram)' })}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-300">{formatNumber(totalShipmentBiomass)}</p>
              <p className="mt-1 text-xs text-slate-400">
                {t('aqua.projectDetailReport.lastShipmentDate', { defaultValue: 'Son Sevk Tarihi' })}: {lastShipmentDate}
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="border-white/5 bg-[#0b0713]">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-400">
                {t('aqua.projectDetailReport.consistencyFormula', {
                  defaultValue: 'Hesap kontrolü: Başlangıç - Ölüm - Sevk = Mevcut',
                })}
              </p>
              <Badge
                className={
                  consistency.isConsistent
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0'
                    : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-0'
                }
              >
                {consistency.isConsistent
                  ? t('aqua.projectDetailReport.consistent', { defaultValue: 'Tutarlı' })
                  : t('aqua.projectDetailReport.inconsistent', { defaultValue: 'Tutarsız' })}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold tabular-nums text-white">
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
  const [projectId, setProjectId] = useState<number | null>(null);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: '',
    description: '',
    items: [],
  });

  const openDetailDialog = (cage: CageProjectReport, row: CageDailyRow, type: DetailType): void => {
    const titleMap: Record<DetailType, string> = {
      feeding: t('aqua.projectDetailReport.feedingDetails', { defaultValue: 'Besleme Detayı' }),
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

    setDetailDialog({
      open: true,
      title: `${titleMap[type]} - ${cage.cageLabel}`,
      description: `${t('aqua.projectDetailReport.date')}: ${row.date}`,
      items,
    });
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
        label: `${project.projectCode ?? ''} - ${project.projectName ?? ''}`,
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
    const totalShipmentFish = cages.reduce(
      (acc, x) => acc + x.dailyRows.reduce((sum, row) => sum + Number(row.shipmentFishCount ?? 0), 0),
      0
    );
    const totalShipmentBiomass = cages.reduce(
      (acc, x) => acc + x.dailyRows.reduce((sum, row) => sum + Number(row.shipmentBiomassGram ?? 0), 0),
      0
    );
    const shipmentDates = cages
      .flatMap((x) => x.dailyRows)
      .filter((row) => row.shipmentCount > 0 || row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0)
      .map((row) => row.date)
      .sort((a, b) => b.localeCompare(a));
    const avgCurrentGram = totalCurrentFish > 0 ? totalCurrentBiomass / totalCurrentFish : 0;
    const expectedCurrentFish = Math.max(0, totalInitialFish - totalDead - totalShipmentFish);
    const isConsistent = expectedCurrentFish === totalCurrentFish;

    return {
      activeCageCount: cages.length,
      inactiveCageCount: reportQuery.data.cageHistory.length,
      totalInitialFish,
      totalCurrentFish,
      totalDead,
      totalFeedGram,
      totalCurrentBiomass,
      avgCurrentGram,
      totalShipmentFish,
      totalShipmentBiomass,
      lastShipmentDate: shipmentDates[0] ?? '-',
      expectedCurrentFish,
      isConsistent,
    };
  }, [reportQuery.data]);

  const projectCurrentSnapshot = useMemo(() => {
    if (!reportQuery.data || !projectSummary) return null;
    const cages = reportQuery.data.cages;
    const latestDate = cages
      .flatMap((x) => x.dailyRows.map((r) => r.date))
      .sort((a, b) => b.localeCompare(a))[0];
    const snapshotDate = latestDate || '-';
    const liveRatePercent =
      projectSummary.totalInitialFish > 0
        ? (projectSummary.totalCurrentFish / projectSummary.totalInitialFish) * 100
        : 0;

    return {
      projectCode: reportQuery.data.project.projectCode ?? '',
      projectName: reportQuery.data.project.projectName ?? '',
      snapshotDate,
      liveRatePercent,
      aliveFishCount: projectSummary.totalCurrentFish,
      deadFishCount: projectSummary.totalDead,
      missingFeedCageCountToday:
        latestDate != null
          ? cages.filter((cage) => cage.missingFeedingDays.includes(latestDate)).length
          : 0,
      activeCageCount: projectSummary.activeCageCount,
      totalShipmentFish: projectSummary.totalShipmentFish,
      totalShipmentBiomass: projectSummary.totalShipmentBiomass,
      lastShipmentDate: projectSummary.lastShipmentDate,
      consistency: {
        expectedCurrentFish: projectSummary.expectedCurrentFish,
        isConsistent: projectSummary.isConsistent,
      },
    };
  }, [projectSummary, reportQuery.data]);

  return (
    <div className="min-h-[60vh] space-y-6 pb-8">
      <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl shadow-sm rounded-2xl">
        <CardHeader className="relative p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-orange-500 p-0.5 shadow-lg shadow-pink-500/20">
                  <div className="h-full w-full bg-[#0b0713] rounded-[14px] flex items-center justify-center">
                    <FileText className="size-6 text-pink-500" />
                  </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  {t('aqua.projectDetailReport.pageTitle')}
                </CardTitle>
                <CardDescription className="mt-1 text-slate-400">
                  {t('aqua.projectDetailReport.description')}
                </CardDescription>
              </div>
            </div>
            <div className="min-w-[280px] max-w-sm w-full">
              <Combobox
                options={projectOptions}
                value={projectId != null ? String(projectId) : ''}
                onValueChange={(v) => setProjectId(v ? Number(v) : null)}
                placeholder={t('aqua.projectDetailReport.selectProject')}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.noResults')}
                disabled={projectsQuery.isLoading}
                className="w-full bg-[#0b0713] border-white/10 text-white"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {projectId == null && (
        <Card className="border border-white/5 bg-white/2 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-slate-500">
              <LayoutGrid className="size-8" />
            </div>
            <p className="text-center text-sm font-medium text-slate-400">
              {t('aqua.projectDetailReport.pickProjectFirst')}
            </p>
          </CardContent>
        </Card>
      )}

      {reportQuery.isLoading && projectId != null && (
        <Card className="border border-white/5 bg-transparent rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
            <p className="text-sm font-medium text-slate-400">{t('common.loading')}</p>
          </CardContent>
        </Card>
      )}

      {reportQuery.isError && (
        <Card className="border border-red-500/20 bg-red-500/10 rounded-2xl">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-red-400">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-500 font-bold">
              !
            </span>
            {(reportQuery.error as Error).message}
          </CardContent>
        </Card>
      )}

      {reportQuery.data && (
        <Card className="overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl shadow-sm rounded-2xl">
          <CardHeader className="border-b border-white/5 bg-transparent p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Droplets className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white">
                      {reportQuery.data.project.projectCode} — {reportQuery.data.project.projectName}
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-400">
                      {t('aqua.projectDetailReport.totalCages', { defaultValue: 'Toplam Aktif Kafes' })}: {reportQuery.data.cages.length}
                    </CardDescription>
                  </div>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-0 px-4 py-1.5 text-sm rounded-lg">
                {reportQuery.data.cages.length} Kafes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-white/5 px-6 pb-6 pt-6 bg-transparent">
              <ReportGuideCard t={t} />
            </div>
            
            {projectCurrentSnapshot && (
              <div className="border-b border-white/5 bg-transparent px-6 pb-6 pt-6">
                <ProjectCurrentSnapshotCards
                  projectCode={projectCurrentSnapshot.projectCode}
                  projectName={projectCurrentSnapshot.projectName}
                  snapshotDate={projectCurrentSnapshot.snapshotDate}
                  liveRatePercent={projectCurrentSnapshot.liveRatePercent}
                  aliveFishCount={projectCurrentSnapshot.aliveFishCount}
                  deadFishCount={projectCurrentSnapshot.deadFishCount}
                  missingFeedCageCountToday={projectCurrentSnapshot.missingFeedCageCountToday}
                  activeCageCount={projectCurrentSnapshot.activeCageCount}
                  totalShipmentFish={projectCurrentSnapshot.totalShipmentFish}
                  totalShipmentBiomass={projectCurrentSnapshot.totalShipmentBiomass}
                  lastShipmentDate={projectCurrentSnapshot.lastShipmentDate}
                  consistency={projectCurrentSnapshot.consistency}
                  t={t}
                />
              </div>
            )}

            {projectSummary && (
              <div className="border-b border-white/5 bg-white/2 px-6 pb-6 pt-6">
                <Card className="border border-white/5 bg-[#1a1025]/40 backdrop-blur-md">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-base font-semibold text-white">
                      {t('aqua.projectDetailReport.mainSummaryTitle', { defaultValue: 'Ana Detay (Anlık Durum)' })}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {t('aqua.projectDetailReport.mainSummaryDescription', {
                        defaultValue: 'Projedeki aktif kafeslerin toplam anlık durumu.',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ProjectSummaryCards
                      activeCageCount={projectSummary.activeCageCount}
                      inactiveCageCount={projectSummary.inactiveCageCount}
                      totalInitialFish={projectSummary.totalInitialFish}
                      totalCurrentFish={projectSummary.totalCurrentFish}
                      totalDead={projectSummary.totalDead}
                      totalFeedGram={projectSummary.totalFeedGram}
                      totalCurrentBiomass={projectSummary.totalCurrentBiomass}
                      avgCurrentGram={projectSummary.avgCurrentGram}
                      totalShipmentFish={projectSummary.totalShipmentFish}
                      totalShipmentBiomass={projectSummary.totalShipmentBiomass}
                      lastShipmentDate={projectSummary.lastShipmentDate}
                      t={t}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {reportQuery.data.cages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-slate-500">
                  <LayoutGrid className="size-7" />
                </div>
                <p className="text-sm text-slate-400">
                  {t('aqua.projectDetailReport.noActiveCages', { defaultValue: 'Aktif kafes bulunamadı.' })}
                </p>
              </div>
            ) : (
              <div className="px-6 pt-6 pb-6 bg-transparent">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {reportQuery.data.cages.map((cage, idx) => (
                  <AccordionItem
                    key={cage.projectCageId}
                    value={`cage-${cage.projectCageId}`}
                    className="border border-white/5 rounded-xl px-4 bg-[#0b0713] data-[state=open]:bg-white/2"
                  >
                    <AccordionTrigger className="rounded-xl py-5 hover:no-underline text-white">
                      <div className="flex w-full flex-wrap items-center justify-between gap-4 pr-4">
                        <div className="flex items-center gap-4 text-left">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-sm font-bold text-cyan-400">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-base text-white">{cage.cageLabel}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {t('aqua.projectDetailReport.currentVsInitial')}:{' '}
                              <span className="text-white font-medium">{formatNumber(cage.currentFishCount)}</span> / {formatNumber(cage.initialFishCount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="bg-white/5 text-slate-300 hover:bg-white/10 border-0">
                            {t('aqua.projectDetailReport.dead')}: {formatNumber(cage.totalDeadCount)}
                          </Badge>
                          <Badge className={`border-0 ${cage.missingFeedingDays.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-300'}`}>
                            {t('aqua.projectDetailReport.missingFeedDays')}: {cage.missingFeedingDays.length}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pb-6 pt-2">
                      <CageSummaryCards cage={cage} t={t} />

                      <Card className="border border-amber-500/20 bg-amber-500/5">
                        <CardHeader className="pb-3 border-b border-amber-500/10">
                          <CardTitle className="flex items-center gap-2 text-base text-amber-400">
                            <UtensilsCrossed className="size-4" />
                            {t('aqua.projectDetailReport.missingFeedingDates')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {cage.missingFeedingDays.length === 0 ? (
                            <p className="text-sm font-medium text-emerald-400">
                              {t('aqua.projectDetailReport.noMissingFeedDay')}
                            </p>
                          ) : (
                            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto custom-scrollbar pr-1">
                              {cage.missingFeedingDays.slice(0, 90).map((day) => (
                                <Badge key={day} className="bg-red-500/20 text-red-400 border-0 font-medium">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border border-white/5 bg-[#0b0713]">
                        <CardHeader className="border-b border-white/5 pb-4">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                            <Calendar className="size-4 text-slate-400" />
                            {t('aqua.projectDetailReport.dailyDetails')}
                          </CardTitle>
                          <CardDescription className="text-slate-400">{t('aqua.projectDetailReport.dailyDetailsHint')}</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0 custom-scrollbar">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-white/5 bg-white/2 hover:bg-white/2">
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.date')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.feedGram')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">
                                  {t('aqua.projectDetailReport.feedStocks', { defaultValue: 'Yem Stokları' })}
                                </TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.deadCount')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.countDelta')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.biomassDelta')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.weather')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.netOps')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.transfers')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.shipments')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.shipmentQty')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.stockConverts')}</TableHead>
                                <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.feedStatus')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                            {cage.dailyRows.length === 0 && (
                              <TableRow className="border-white/5 hover:bg-transparent">
                                <TableCell colSpan={13} className="py-8 text-center text-slate-500">
                                  {t('common.noData')}
                                </TableCell>
                              </TableRow>
                            )}
                            {cage.dailyRows.slice(0, 45).map((row, rowIdx) => (
                              <TableRow
                                key={`${cage.projectCageId}-${row.date}`}
                                className={`border-white/5 transition-colors ${rowIdx % 2 === 1 ? 'bg-white/1' : 'bg-transparent'} hover:bg-white/5`}
                              >
                                <TableCell className="font-medium tabular-nums text-slate-300">{row.date}</TableCell>
                                <TableCell className="tabular-nums text-slate-300">{formatNumber(row.feedGram)}</TableCell>
                                <TableCell>
                                  {row.feedDetails.length > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                      onClick={() => openDetailDialog(cage, row, 'feeding')}
                                    >
                                      {t('aqua.projectDetailReport.stockCountShort', {
                                        defaultValue: '{{count}} stok',
                                        count: row.feedStockCount,
                                      })}
                                    </Button>
                                  ) : (
                                    <span className="text-slate-600">
                                      {t('aqua.projectDetailReport.stockCountShort', {
                                        defaultValue: '{{count}} stok',
                                        count: row.feedStockCount,
                                      })}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums text-slate-300">{formatNumber(row.deadCount)}</TableCell>
                                <TableCell className="tabular-nums text-slate-300">{formatNumber(row.countDelta)}</TableCell>
                                <TableCell className="tabular-nums text-slate-300">{formatNumber(row.biomassDelta)}</TableCell>
                                <TableCell className="max-w-[260px] truncate text-slate-400">{row.weather}</TableCell>
                                <TableCell>
                                  {row.netOperationCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                      onClick={() => openDetailDialog(cage, row, 'netOperation')}
                                    >
                                      {formatNumber(row.netOperationCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-slate-600">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.transferCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                      onClick={() => openDetailDialog(cage, row, 'transfer')}
                                    >
                                      {formatNumber(row.transferCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-slate-600">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.shipmentCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                      onClick={() => openDetailDialog(cage, row, 'shipment')}
                                    >
                                      {formatNumber(row.shipmentCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-slate-600">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums text-slate-300">
                                  {row.shipmentFishCount > 0 || row.shipmentBiomassGram > 0
                                    ? `${formatNumber(row.shipmentFishCount)} / ${formatNumber(row.shipmentBiomassGram)}g`
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  {row.stockConvertCount > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 font-medium bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                      onClick={() => openDetailDialog(cage, row, 'stockConvert')}
                                    >
                                      {formatNumber(row.stockConvertCount)}
                                    </Button>
                                  ) : (
                                    <span className="text-slate-600">0</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.fed ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
                                      {t('aqua.projectDetailReport.fed')}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">
                                      {t('aqua.projectDetailReport.notFed')}
                                    </Badge>
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
              <div className="border-t border-white/5 px-6 pb-6 pt-6">
                <Card className="border border-white/5 bg-[#0b0713]">
                  <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                      <History className="size-4 text-slate-400" />
                      {t('aqua.projectDetailReport.cageHistoryTitle', { defaultValue: 'Kafes Geçmişi (Buydu/Bu Oldu)' })}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {t('aqua.projectDetailReport.cageHistoryDescription', {
                        defaultValue: 'Projede daha önce kullanılmış ancak şu an aktif olmayan kafesler.',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto p-0 custom-scrollbar">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 bg-white/2 hover:bg-white/2">
                          <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.cage', { defaultValue: 'Kafes' })}</TableHead>
                          <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.assignedDate', { defaultValue: 'Atanma Tarihi' })}</TableHead>
                          <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.releasedDate', { defaultValue: 'Ayrılma Tarihi' })}</TableHead>
                          <TableHead className="font-semibold text-slate-400">{t('aqua.projectDetailReport.status', { defaultValue: 'Durum' })}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportQuery.data.cageHistory.map((item) => (
                          <TableRow key={`history-${item.projectCageId}`} className="border-white/5 hover:bg-white/5">
                            <TableCell className="font-medium text-slate-300">{item.cageLabel}</TableCell>
                            <TableCell className="tabular-nums text-slate-400">{item.assignedDate ? item.assignedDate.slice(0, 10) : '-'}</TableCell>
                            <TableCell className="tabular-nums text-slate-400">{item.releasedDate ? item.releasedDate.slice(0, 10) : '-'}</TableCell>
                            <TableCell>
                              <Badge className="bg-white/5 text-slate-400 border-0 hover:bg-white/10">{t('aqua.projectDetailReport.inactive', { defaultValue: 'Pasif' })}</Badge>
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

      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden border border-white/10 bg-[#0b0713] p-0 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-white/5 bg-white/2 px-6 py-5">
            <div className="flex items-baseline justify-between gap-4">
              <DialogTitle className="text-lg font-semibold tracking-tight text-white">
                {detailDialog.title}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-400 tabular-nums">
                {detailDialog.description}
              </DialogDescription>
            </div>
          </DialogHeader>
          {detailDialog.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              {t('aqua.projectDetailReport.noOperationDetail')}
            </p>
          ) : (
            <div className="bg-transparent">
              <div className="border-b border-white/5 bg-white/1 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('aqua.projectDetailReport.detailRecords', { count: detailDialog.items.length })}
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-2 py-2 custom-scrollbar">
                {detailDialog.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex gap-4 border-b border-white/5 px-4 py-3 last:border-b-0 hover:bg-white/2 transition-colors rounded-lg"
                  >
                    <span className="shrink-0 text-sm font-bold tabular-nums text-pink-500/50 pt-0.5">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 flex-1 font-mono text-[13px] leading-relaxed text-slate-300 break-all">
                      {item}
                    </span>
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
