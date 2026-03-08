import { type MouseEvent, type ReactElement, useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, Fish, Layers, Skull, UtensilsCrossed, Waves, Search, BarChart3, Droplets, Info, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/shared/PageLoader';
import { aquaDashboardApi } from '../api/aqua-dashboard-api';
import { projectDetailReportApi } from '../api/project-detail-report-api';
import type { CageProjectReport } from '../types/project-detail-report-types';
import { cn } from '@/lib/utils';

const DASHBOARD_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'summaries'] as const;
const PROJECT_DETAIL_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'project-detail'] as const;
const PROJECTS_PER_PAGE = 3;
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

function CageSkeleton(): ReactElement {
  return (
    <div className="border-2 border-slate-100 dark:border-cyan-800/20 rounded-3xl min-h-[190px] animate-pulse bg-slate-50/50 dark:bg-blue-900/10 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center"><div className="h-8 w-8 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" /><div className="h-4 w-20 bg-slate-200 dark:bg-cyan-800/30 rounded-md" /></div>
        <div className="h-6 w-16 bg-slate-200 dark:bg-cyan-800/30 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="h-14 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
        <div className="h-14 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
        <div className="col-span-2 h-14 bg-slate-200 dark:bg-cyan-800/30 rounded-xl" />
      </div>
    </div>
  );
}

function CageCard({
  cage,
  t,
  onClick,
  isSelected = false,
  clickable = false,
}: {
  cage: { projectCageId: number; cageLabel: string; currentFishCount: number; totalDeadCount: number; totalFeedGram: number; currentBiomassGram: number; };
  t: (key: string, opts?: { defaultValue?: string }) => string;
  onClick?: () => void;
  isSelected?: boolean;
  clickable?: boolean;
}): ReactElement {
  
  const totalInitial = cage.currentFishCount + cage.totalDeadCount;
  const survivalRate = totalInitial > 0 ? ((cage.currentFishCount / totalInitial) * 100) : 100;
  
  const isCritical = survivalRate < 80;
  const isWarning = survivalRate >= 80 && survivalRate < 95;

  return (
    <Card
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (!onClick) return;
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 min-h-[190px] flex flex-col bg-white shadow-sm dark:bg-blue-950/40 dark:backdrop-blur-xl group",
        isSelected ? "border-cyan-500 shadow-lg shadow-cyan-500/10 dark:border-cyan-500/60 scale-[1.02]" : "border-slate-200 dark:border-cyan-800/30 hover:border-cyan-400 dark:hover:border-cyan-500/50",
        clickable && "cursor-pointer hover:shadow-lg dark:hover:shadow-cyan-900/20 hover:-translate-y-1"
      )}
    >
      <div className="flex flex-col h-full z-10 relative">
        <div className={cn("absolute top-3 right-3 flex items-center justify-center p-1.5 rounded-full border shadow-sm z-20 backdrop-blur-md", isCritical ? "bg-rose-100/80 border-rose-300 text-rose-600 dark:bg-rose-500/20 dark:border-rose-500/50 dark:text-rose-400" : isWarning ? "bg-amber-100/80 border-amber-300 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/50 dark:text-amber-400" : "bg-emerald-100/80 border-emerald-300 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/50 dark:text-emerald-400")}>
          {isCritical ? <AlertTriangle size={14} strokeWidth={3} /> : isWarning ? <Info size={14} strokeWidth={3} /> : <CheckCircle2 size={14} strokeWidth={3} />}
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20 px-4 py-3 pr-12">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-colors", isSelected ? "bg-cyan-500 border-cyan-400 text-white" : "bg-white dark:bg-blue-900 border-slate-200 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-400")}>
            <Waves className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-[13px] text-slate-900 dark:text-white tracking-tight truncate">{cage.cageLabel}</span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Fish size={10} /> {formatNumber(cage.currentFishCount)} balık
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 p-3 flex-1">
          <div className="flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-2.5">
            <div className="flex items-center gap-1.5">
              <Skull className="size-3 text-rose-500 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">{t('aqua.dashboard.totalDead', { defaultValue: 'Ölüm' })}</p>
            </div>
            <p className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums truncate">{formatNumber(cage.totalDeadCount)}</p>
          </div>

          <div className="flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-2.5">
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="size-3 text-amber-500 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">{t('aqua.dashboard.totalFeed', { defaultValue: 'Yem' })}</p>
            </div>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums truncate">{formatNumber(cage.totalFeedGram)}<span className="text-[9px] ml-0.5 font-bold">g</span></p>
          </div>

          <div className="col-span-2 flex flex-col justify-center gap-1 rounded-xl bg-slate-50 dark:bg-blue-900/10 border border-slate-100 dark:border-cyan-800/20 p-2.5">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 text-blue-500 shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">{t('aqua.dashboard.currentBiomass', { defaultValue: 'Mevcut Biyokütle' })}</p>
            </div>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums truncate">{formatNumber(cage.currentBiomassGram)}<span className="text-[10px] ml-1 font-bold">g</span></p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Yaşam Oranı</span>
            <span className={cn("text-[10px] font-black", isCritical ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500")}>
              %{survivalRate.toFixed(1)}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-cyan-950/50 rounded-full overflow-hidden">
            <div className={cn("h-full transition-all duration-1000 ease-out rounded-full", isCritical ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : isWarning ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-emerald-500")} style={{ width: `${survivalRate}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AquaDashboardPage(): ReactElement {
  const { t } = useTranslation('common');
  const [visibleCount, setVisibleCount] = useState(PROJECTS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);
  const [isDailyDialogOpen, setIsDailyDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({ open: false, title: '', description: '', items: [] });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const summariesQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: aquaDashboardApi.getActiveProjectSummaries,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const summaries = summariesQuery.data ?? [];

  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return summaries;
    const lower = searchTerm.toLowerCase();
    return summaries.filter(p => 
      p.projectName.toLowerCase().includes(lower) || 
      p.projectCode.toLowerCase().includes(lower)
    );
  }, [summaries, searchTerm]);

  const globalStats = useMemo(() => {
    return summaries.reduce((acc, curr) => {
      acc.totalFish += curr.currentFish;
      acc.totalCages += curr.activeCageCount;
      curr.cages.forEach(c => {
        acc.totalBio += c.currentBiomassGram;
        acc.totalFeed += c.totalFeedGram;
        acc.totalDead += c.totalDeadCount;
      });
      return acc;
    }, { totalFish: 0, totalCages: 0, totalBio: 0, totalFeed: 0, totalDead: 0 });
  }, [summaries]);

  const visibleSummaries = filteredSummaries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSummaries.length;
  const selectedProjectSummary = summaries.find((project) => project.projectId === selectedProjectId) ?? null;

  const detailQuery = useQuery({
    queryKey: [...PROJECT_DETAIL_QUERY_KEY, selectedProjectId],
    queryFn: async () => projectDetailReportApi.getProjectDetailReport(selectedProjectId as number),
    enabled: selectedProjectId != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => { setVisibleCount(PROJECTS_PER_PAGE); }, [filteredSummaries.length]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PROJECTS_PER_PAGE, filteredSummaries.length));
        }
      }, { rootMargin: '200px', threshold: 0.1 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, filteredSummaries.length]);

  useEffect(() => {
    if (!selectedProjectId) { setSelectedCageId(null); return; }
    const fromSummary = selectedProjectSummary?.cages[0]?.projectCageId ?? null;
    if (fromSummary != null) setSelectedCageId((prev) => prev ?? fromSummary);
  }, [selectedProjectId, selectedProjectSummary]);

  const openProjectDetail = (projectId: number, cageId?: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(cageId ?? null);
    setIsProjectDialogOpen(true);
  };

  const openDetailDialog = (cage: CageProjectReport, type: DetailType): ((date: string, items: string[]) => void) => {
    const titleMap: Record<DetailType, string> = {
      feeding: 'Besleme Detayı',
      netOperation: 'Ağ İşlemi',
      transfer: 'Transfer',
      stockConvert: 'Stok Dönüşüm',
      shipment: 'Sevkiyat',
    };
    return (date: string, items: string[]) => {
      if (items.length === 0) return;
      setDetailDialog({ open: true, title: `${titleMap[type]} - ${cage.cageLabel}`, description: `Tarih: ${date}`, items });
    };
  };

  const selectedCageFromDetail: CageProjectReport | null = detailQuery.data?.cages.find((cage) => cage.projectCageId === selectedCageId) ?? detailQuery.data?.cages[0] ?? null;

  const exportToCSV = () => {
    if (!selectedCageFromDetail?.dailyRows) return;
    const headers = ['Tarih', 'Yem (g)', 'Stok', 'Ölü', 'Delta', 'Biyo Delta', 'Hava', 'Ağ Islemi', 'Transfer', 'Sevk', 'Sevk Mik.', 'Donusum', 'Beslenme'];
    const csvContent = [
      headers.join(','),
      ...selectedCageFromDetail.dailyRows.map(row => [
        row.date, row.feedGram, row.feedStockCount, row.deadCount, row.countDelta, row.biomassDelta, row.weather,
        row.netOperationCount, row.transferCount, row.shipmentCount, row.shipmentFishCount, row.stockConvertCount,
        row.fed ? 'Beslendi' : 'Beslenmedi'
      ].join(','))
    ].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Kafes_Raporu_${selectedCageFromDetail.cageLabel}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCageDailyDialog = (projectCageId: number): void => {
    setSelectedCageId(projectCageId);
    setIsDailyDialogOpen(true);
  };

  const openDailyFromProjectList = (projectId: number, projectCageId: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(projectCageId);
    setIsProjectDialogOpen(false);
    setIsDailyDialogOpen(true);
  };

  const maxDeadInCage = useMemo(() => selectedCageFromDetail ? Math.max(...selectedCageFromDetail.dailyRows.map(r=>r.deadCount)) : 0, [selectedCageFromDetail]);

  if (summariesQuery.isLoading) return <PageLoader />;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-500/20">
              <Droplets className="size-6" />
            </div>
            Aqua Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium ml-1">Tesisinizin genel üretim ve proje durumları.</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          <Input
            placeholder="Proje ara (Kod veya İsim)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-blue-950/40 border-slate-200 dark:border-cyan-800/30 rounded-xl focus-visible:ring-cyan-500/20"
          />
        </div>
      </div>

      {!summariesQuery.isError && summaries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Aktif Kafes', val: globalStats.totalCages, icon: Waves, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20' },
            { label: 'Toplam Canlı Balık', val: globalStats.totalFish, icon: Fish, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
            { label: 'Toplam Biyokütle', val: `${formatNumber(globalStats.totalBio)}g`, icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
            { label: 'Tüketilen Yem', val: `${formatNumber(globalStats.totalFeed)}g`, icon: UtensilsCrossed, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
          ].map((stat, i) => (
            <Card key={i} className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform flex flex-col justify-center">
              <CardContent className="p-5 sm:p-6">
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">{stat.label}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums truncate">{typeof stat.val === 'number' ? formatNumber(stat.val) : stat.val}</h3>
                  </div>
                  <div className={cn("p-3 rounded-2xl border shrink-0", stat.bg, stat.color)}>
                    <stat.icon className="size-5 sm:size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summariesQuery.isError ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 rounded-2xl">
          <CardContent className="py-8 text-sm font-medium text-rose-600 dark:text-rose-400 text-center flex items-center justify-center gap-2">
            <Info className="size-5" />
            Dashboard verileri alınamadı.
          </CardContent>
        </Card>
      ) : filteredSummaries.length === 0 ? (
        <Card className="bg-white border-slate-200 dark:border-cyan-800/20 dark:bg-blue-950/40 dark:backdrop-blur-xl rounded-2xl">
          <CardContent className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
            <Fish className="size-16 mx-auto mb-4 text-slate-300 dark:text-cyan-900/50" />
            {searchTerm ? "Aramanızla eşleşen proje bulunamadı." : "Aktif proje bulunamadı."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {visibleSummaries.map((project) => (
            <Card
              key={project.projectId}
              className="border border-slate-200 bg-white shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/40 dark:backdrop-blur-xl rounded-3xl overflow-hidden cursor-pointer group transition-all hover:shadow-lg dark:hover:border-cyan-700/50"
              onClick={() => openProjectDetail(project.projectId)}
            >
              <CardHeader className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/10 px-6 py-5 group-hover:bg-slate-100/50 dark:group-hover:bg-cyan-900/10 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="h-3 w-3 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse" />
                      <span className="truncate">{project.projectCode} - {project.projectName}</span>
                    </CardTitle>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 dark:bg-blue-950/50 dark:border-cyan-800/50 dark:text-slate-300 text-[11px] font-bold px-3 py-1 rounded-lg shadow-sm">
                        Kafes: {formatNumber(project.activeCageCount)}
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-lg shadow-sm">
                        Mevcut Balık: {formatNumber(project.currentFish)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 bg-linear-to-r from-cyan-600 to-blue-600 text-white hover:opacity-95 text-xs sm:text-sm h-10 px-6 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all border-0"
                    onClick={(event) => {
                      event.stopPropagation();
                      openProjectDetail(project.projectId);
                    }}
                  >
                    <BarChart3 className="size-4 mr-2" />
                    Detay Raporu
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 bg-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {project.cages.map((cage) => (
                    <CageCard key={cage.projectCageId} cage={cage} t={t} clickable onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {hasMore && (
            <div ref={loadMoreRef} className="h-16 flex items-center justify-center text-cyan-600 dark:text-cyan-500 text-sm font-bold animate-pulse" aria-hidden>
              <Droplets className="size-4 mr-2 animate-bounce" /> Daha fazlası için aşağı kaydırın...
            </div>
          )}
        </div>
      )}

      {/* PROJECT DETAY DIALOG - TAM İSTENEN KÜÇÜK VE DÜZENLİ TASARIM */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90dvh] overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-4xl shadow-2xl flex flex-col">
          <DialogHeader className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <BarChart3 className="size-5" />
              </div>
              {selectedProjectSummary ? `${selectedProjectSummary.projectCode} - ${selectedProjectSummary.projectName}` : '-'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar">
              
              {/* ÜST STAT KARTLARI (Ezilmemesi için 2 veya 4 sütun) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 min-w-0 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400/80 mb-1">Toplam Balık</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.currentFishCount, 0) || 0)}</p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-4 min-w-0 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400/80 mb-1">Toplam Ölüm</p>
                  <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.totalDeadCount, 0) || 0)}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 min-w-0 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400/80 mb-1">Toplam Yem (g)</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.reduce((acc, cage) => acc + cage.totalFeedGram, 0) || 0)}</p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 min-w-0 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400/80 mb-1">Kafes Sayısı</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 truncate tabular-nums">{formatNumber(detailQuery.data?.cages.length || 0)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg"><Layers className="size-4 text-cyan-600 dark:text-cyan-400 shrink-0" /></div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Kafes Havuzları</h3>
                  <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-blue-900/30 dark:text-slate-400 border-0 ml-2 px-3 py-1">
                    Günlük detay için tıklayın
                  </Badge>
                </div>
                
                {detailQuery.isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <CageSkeleton /><CageSkeleton /><CageSkeleton /><CageSkeleton />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detailQuery.data?.cages.map((cage) => (
                        <CageCard key={cage.projectCageId} cage={cage} t={t} clickable isSelected={selectedCageId === cage.projectCageId} onClick={() => openCageDailyDialog(cage.projectCageId)} />
                    ))}
                    </div>
                )}
              </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DİĞER DETAY DİALOGLARI */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="w-[95vw] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-3xl shadow-2xl flex flex-col">
          <DialogHeader className="border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/10 px-6 py-5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="size-5 text-cyan-500" />
                {detailDialog.title}
              </DialogTitle>
              <span className="text-[10px] font-black text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/20 px-3 py-1.5 rounded-xl tabular-nums border border-cyan-200 dark:border-cyan-500/30">
                {detailDialog.description}
              </span>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
            {detailDialog.items.map((item, index) => (
              <div key={index} className="flex gap-4 border-b border-slate-100 dark:border-cyan-800/20 px-4 py-4 last:border-b-0 hover:bg-white dark:hover:bg-blue-900/10 transition-colors rounded-xl mt-1">
                <span className="shrink-0 text-xs font-black text-cyan-600 dark:text-cyan-400 pt-0.5">{index + 1}.</span>
                <span className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 break-all">{item}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* GÜNLÜK DETAY TABLOSU */}
      <Dialog open={isDailyDialogOpen} onOpenChange={setIsDailyDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-[calc(100vw-2rem)] max-h-[90dvh] max-w-7xl overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 shadow-2xl rounded-3xl flex flex-col">
          <DialogHeader className="border-b border-slate-200 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-900/20 px-6 py-5 sm:px-8 sm:py-6 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DialogTitle className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-3 text-slate-900 dark:text-white">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-cyan-100 border border-cyan-200 dark:bg-cyan-500/20 flex items-center justify-center shadow-sm">
                  <Waves className="size-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="truncate">{selectedCageFromDetail?.cageLabel ?? '-'}</span> 
                <span className="text-slate-300 dark:text-slate-600 font-light mx-1">|</span> 
                <span className="text-cyan-600 dark:text-cyan-400 font-black">Günlük Veri Akışı</span>
              </DialogTitle>
              <Button variant="outline" onClick={exportToCSV} className="h-9 text-xs font-bold border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800/50 dark:text-cyan-400 dark:hover:bg-cyan-900/30 rounded-xl">
                <Download className="w-4 h-4 mr-2" /> Excel (CSV) İndir
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
            <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-sm">
              <table className="w-full min-w-[1240px] text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-cyan-800/30 text-left bg-slate-50 dark:bg-blue-900/20">
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Tarih</th>
                    <th className="px-5 py-4 font-black text-amber-600 dark:text-amber-500/70 uppercase tracking-widest text-[10px]">Yem (g)</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Stok</th>
                    <th className="px-5 py-4 font-black text-rose-600 dark:text-rose-500/70 uppercase tracking-widest text-[10px]">Ölü</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Delta</th>
                    <th className="px-5 py-4 font-black text-blue-600 dark:text-blue-500/70 uppercase tracking-widest text-[10px]">Biyo Delta</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Hava</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Ağ</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Trans.</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Sevk</th>
                    <th className="px-5 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-cyan-800/20">
                  {selectedCageFromDetail?.dailyRows.map((row, index) => {
                    const prevRow = selectedCageFromDetail.dailyRows[index + 1];
                    const deadDiff = prevRow ? row.deadCount - prevRow.deadCount : 0;
                    const feedDiff = prevRow ? row.feedGram - prevRow.feedGram : 0;
                    const isHighDead = row.deadCount > 0 && maxDeadInCage > 5 && row.deadCount >= (maxDeadInCage * 0.7);

                    return (
                    <tr key={row.date} className={cn("hover:bg-slate-50/80 dark:hover:bg-blue-900/10 transition-colors", isHighDead && "bg-rose-50/50 dark:bg-rose-500/5")}>
                      <td className="px-5 py-3.5 font-mono text-slate-800 dark:text-slate-200">{row.date}</td>
                      <td className="px-5 py-3.5 font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        <div className="flex items-center gap-2">
                           {formatNumber(row.feedGram)}
                           {feedDiff > 0 ? <TrendingUp size={12} className="text-emerald-500"/> : feedDiff < 0 ? <TrendingDown size={12} className="text-rose-500"/> : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.feedDetails.length > 0 ? (
                          <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:border-cyan-800/50 dark:text-cyan-400 rounded-lg" onClick={() => openDetailDialog(selectedCageFromDetail, 'feeding')(row.date, row.feedDetails)}>
                            {row.feedStockCount} stok
                          </Button>
                        ) : <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>}
                      </td>
                      <td className="px-5 py-3.5 font-bold tabular-nums text-rose-600 dark:text-rose-400">
                        <div className="flex items-center gap-2">
                           {formatNumber(row.deadCount)}
                           {deadDiff > 0 ? <TrendingUp size={12} className="text-rose-500"/> : deadDiff < 0 ? <TrendingDown size={12} className="text-emerald-500"/> : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 tabular-nums">{formatNumber(row.countDelta)}</td>
                      <td className="px-5 py-3.5 text-blue-600 dark:text-blue-400 font-bold tabular-nums">{formatNumber(row.biomassDelta)}</td>
                      <td className="px-5 py-3.5 max-w-[150px] truncate text-slate-500 dark:text-slate-400 text-[11px]">{row.weather}</td>
                      <td className="px-5 py-3.5">
                        {row.netOperationCount > 0 ? (
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-cyan-600 dark:text-cyan-400 underline font-bold" onClick={() => openDetailDialog(selectedCageFromDetail, 'netOperation')(row.date, row.netOperationDetails)}>
                            {row.netOperationCount} İşlem
                          </Button>
                        ) : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{row.transferCount || "-"}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{row.shipmentCount || "-"}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={row.fed ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold rounded-md" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 font-bold rounded-md"}>
                          {row.fed ? "Beslendi" : "Beslenmedi"}
                        </Badge>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}