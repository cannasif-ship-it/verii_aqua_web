import type { ReactElement } from 'react';
import {
  Activity,
  ArrowRightLeft,
  CalendarDays,
  Fish,
  Info,
  Layers,
  Network,
  Package,
  Skull,
  TrendingDown,
  TrendingUp,
  Truck,
  UtensilsCrossed,
  Waves,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageLoader } from '@/components/shared/PageLoader';
import type { DashboardCageDailyRow, DashboardProjectDetailCage } from '../api/aqua-dashboard-api';

type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
  type: DetailType;
}

interface AquaDashboardDailyDialogsProps {
  t: (key: string, options?: Record<string, unknown>) => string;
  isDailyDialogOpen: boolean;
  onDailyDialogChange: (open: boolean) => void;
  detailQueryIsLoading: boolean;
  detailQueryIsError: boolean;
  selectedCage: DashboardProjectDetailCage | null;
  dailyRows: DashboardCageDailyRow[];
  maxDeadInCage: number;
  detailDialog: DetailDialogState;
  onDetailDialogChange: (open: boolean) => void;
  onOpenDetail: (type: DetailType, date: string, items: string[]) => void;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function getDateParts(date: string): { day: string; month: string; year: string } {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return { day: date, month: '', year: '' };
  }

  const day = new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(parsed);
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(parsed).toUpperCase();
  const year = new Intl.DateTimeFormat('tr-TR', { year: 'numeric' }).format(parsed);

  return { day, month, year };
}

function getDetailTypeIcon(type: DetailType): ReactElement {
  if (type === 'feeding') return <Package className="size-4" />;
  if (type === 'netOperation') return <Network className="size-4" />;
  if (type === 'transfer') return <ArrowRightLeft className="size-4" />;
  if (type === 'stockConvert') return <Layers className="size-4" />;
  return <Truck className="size-4" />;
}

export default function AquaDashboardDailyDialogs({
  t,
  isDailyDialogOpen,
  onDailyDialogChange,
  detailQueryIsLoading,
  detailQueryIsError,
  selectedCage,
  dailyRows,
  maxDeadInCage,
  detailDialog,
  onDetailDialogChange,
  onOpenDetail,
}: AquaDashboardDailyDialogsProps): ReactElement {
  return (
    <>
      <Dialog open={isDailyDialogOpen} onOpenChange={onDailyDialogChange}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] lg:w-[1200px]! max-w-[96vw]! xl:max-w-[1300px]! max-h-[90dvh] overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 shadow-2xl rounded-[24px] sm:rounded-[28px] flex flex-col outline-none">
          <DialogHeader className="border-b border-slate-200 dark:border-cyan-800/30 bg-linear-to-r from-slate-50 via-white to-cyan-50/40 dark:from-blue-950 dark:via-blue-950 dark:to-cyan-950/30 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 shrink-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="h-full w-full bg-white dark:bg-blue-950 rounded-[14px] flex items-center justify-center">
                    <Waves className="size-6 text-cyan-600 dark:text-cyan-500" />
                  </div>
                </div>

                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    {selectedCage?.cageLabel ?? '-'}
                  </DialogTitle>
                  <p className="text-cyan-600 dark:text-cyan-400 text-sm font-bold flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
                    <span className="truncate">{t('aquaDashboard.dailyFlow', { ns: 'dashboard' })}</span>
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
            {detailQueryIsLoading ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400 font-semibold">
                  <PageLoader />
                </div>
              </div>
            ) : !selectedCage ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
                  <Info className="size-10 mb-4 text-slate-300 dark:text-cyan-900/60" />
                  <span className="font-semibold">{t('aquaDashboard.selectProjectHint', { ns: 'dashboard' })}</span>
                </div>
              </div>
            ) : detailQueryIsError ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
                  <Activity className="size-10 mb-4 text-slate-300 dark:text-cyan-900/60" />
                  <span className="font-semibold">{t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}</span>
                </div>
              </div>
            ) : dailyRows.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/40 overflow-hidden shadow-xl p-8">
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
                  <Activity className="size-10 mb-4 text-slate-300 dark:text-cyan-900/60" />
                  <span className="font-semibold">{t('aquaDashboard.dailyFlowEmptyTitle', { ns: 'dashboard' })}</span>
                  <span className="mt-2 max-w-md text-sm">
                    {t('aquaDashboard.dailyFlowEmptyDescription', { ns: 'dashboard' })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative pl-0 sm:pl-4">
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-linear-to-b from-cyan-300 via-cyan-200 to-transparent dark:from-cyan-700 dark:via-cyan-900 hidden sm:block" />

                <div className="space-y-4">
                  {dailyRows.map((row, index) => {
                    const prevRow = dailyRows[index + 1];
                    const deadDiff = prevRow ? row.deadCount - prevRow.deadCount : 0;
                    const feedDiff = prevRow ? row.feedGram - prevRow.feedGram : 0;
                    const isHighDead = row.deadCount > 0 && maxDeadInCage > 5 && row.deadCount >= maxDeadInCage * 0.7;
                    const dateParts = getDateParts(row.date);
                    const hasFeedDetails = row.feedDetails.length > 0;
                    const hasNetDetails = row.netOperationCount > 0;
                    const hasTransferDetails = (row.transferCount ?? 0) > 0 && (row.transferDetails?.length ?? 0) > 0;
                    const hasShipmentDetails = (row.shipmentCount ?? 0) > 0 && (row.shipmentDetails?.length ?? 0) > 0;
                    const hasStockConvertDetails = (row.stockConvertCount ?? 0) > 0 && (row.stockConvertDetails?.length ?? 0) > 0;

                    return (
                      <div key={`${row.date}-${index}`} className="relative sm:pl-12">
                        <div
                          className={
                            isHighDead
                              ? 'hidden sm:flex absolute left-0 top-6 size-11 rounded-2xl border items-center justify-center shadow-sm z-10 bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                              : 'hidden sm:flex absolute left-0 top-6 size-11 rounded-2xl border items-center justify-center shadow-sm z-10 bg-white dark:bg-blue-950 text-cyan-600 dark:text-cyan-400 border-slate-200 dark:border-cyan-800/40'
                          }
                        >
                          <CalendarDays className="size-5" />
                        </div>

                        <div
                          className={
                            isHighDead
                              ? 'rounded-[24px] sm:rounded-[28px] border bg-white dark:bg-blue-950/45 shadow-sm overflow-hidden transition-all border-rose-300 dark:border-rose-500/40 shadow-[0_20px_40px_rgba(244,63,94,0.10)]'
                              : 'rounded-[24px] sm:rounded-[28px] border bg-white dark:bg-blue-950/45 shadow-sm overflow-hidden transition-all border-slate-200 dark:border-cyan-800/30 hover:shadow-md'
                          }
                        >
                          <div
                            className={
                              isHighDead
                                ? 'h-1.5 w-full bg-linear-to-r from-rose-500 via-orange-500 to-amber-400'
                                : row.fed
                                  ? 'h-1.5 w-full bg-linear-to-r from-emerald-400 via-cyan-400 to-blue-500'
                                  : 'h-1.5 w-full bg-linear-to-r from-slate-300 via-slate-200 to-slate-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900'
                            }
                          />

                          <div className="p-4 sm:p-5 lg:p-6">
                            <div className="flex flex-col gap-5">
                              <div className="flex items-start gap-4 min-w-0">
                                <div
                                  className={
                                    isHighDead
                                      ? 'sm:hidden flex shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 min-w-[68px] bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                                      : 'sm:hidden flex shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 min-w-[68px] bg-slate-50 border-slate-200 text-slate-700 dark:bg-blue-900/20 dark:border-cyan-800/30 dark:text-slate-200'
                                  }
                                >
                                  <span className="text-lg font-black leading-none">{dateParts.day}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{dateParts.month}</span>
                                </div>

                                <div className="hidden sm:flex shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 min-w-[78px] bg-slate-50 dark:bg-blue-900/20 border-slate-200 dark:border-cyan-800/30">
                                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{dateParts.day}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mt-1">{dateParts.month}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">{dateParts.year}</span>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white wrap-break-word min-w-0">
                                      {row.date}
                                    </h3>

                                    {isHighDead && (
                                      <Badge className="rounded-xl px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-500/15 font-black text-[10px]">
                                        {t('aquaDashboard.dailyTable.criticalDay', { ns: 'dashboard' })}
                                      </Badge>
                                    )}

                                    <Badge
                                      className={
                                        row.fed
                                          ? 'rounded-xl px-2.5 py-1 border font-black text-[10px] bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-500/15'
                                          : 'rounded-xl px-2.5 py-1 border font-black text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }
                                    >
                                      {row.fed
                                        ? t('aquaDashboard.dailyTable.fed', { ns: 'dashboard' })
                                        : t('aquaDashboard.dailyTable.notFed', { ns: 'dashboard' })}
                                    </Badge>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                                    <div className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-blue-900/20 border border-slate-200 dark:border-cyan-800/30">
                                      <CalendarDays className="size-3.5 shrink-0" />
                                      <span className="truncate">{row.weather || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 w-full min-w-0">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-3 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                                    <UtensilsCrossed className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.feed', { ns: 'dashboard' })}
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums truncate">
                                      {formatNumber(row.feedGram)}g
                                    </span>
                                    {feedDiff !== 0 &&
                                      (feedDiff > 0 ? (
                                        <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                                      ) : (
                                        <TrendingDown size={13} className="text-rose-500 shrink-0" />
                                      ))}
                                  </div>
                                </div>

                                <div
                                  className={
                                    isHighDead
                                      ? 'rounded-2xl border p-3 min-w-0 border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
                                      : 'rounded-2xl border p-3 min-w-0 border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5'
                                  }
                                >
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">
                                    <Skull className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.dead', { ns: 'dashboard' })}
                                  </div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-sm font-black text-rose-700 dark:text-rose-300 tabular-nums truncate">
                                      {formatNumber(row.deadCount)}
                                    </span>
                                    {deadDiff !== 0 &&
                                      (deadDiff > 0 ? (
                                        <TrendingUp size={13} className="text-rose-500 shrink-0" />
                                      ) : (
                                        <TrendingDown size={13} className="text-emerald-500 shrink-0" />
                                      ))}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-cyan-800/30 dark:bg-blue-900/10 p-3 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                                    <Fish className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.delta', { ns: 'dashboard' })}
                                  </div>
                                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums truncate block">
                                    {formatNumber(row.countDelta)}
                                  </span>
                                </div>

                                <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-3 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                                    <Layers className="size-3.5 shrink-0" />
                                    {t('aquaDashboard.dailyCards.biomass', { ns: 'dashboard' })}
                                  </div>
                                  <span className="text-sm font-black text-blue-700 dark:text-blue-300 tabular-nums truncate block">
                                    {formatNumber(row.biomassDelta)}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                      <Package className="size-4 text-cyan-500 shrink-0" />
                                      <span className="text-xs font-black uppercase tracking-widest truncate">
                                        {t('aquaDashboard.dailySections.feedStocks', { ns: 'dashboard' })}
                                      </span>
                                    </div>
                                    <Badge className="rounded-xl px-2 py-1 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-cyan-500/15 text-[10px] font-black shrink-0">
                                      {row.feedStockCount}
                                    </Badge>
                                  </div>

                                  <div className="mt-3">
                                    {hasFeedDetails ? (
                                      <button
                                        type="button"
                                        onClick={() => onOpenDetail('feeding', row.date, row.feedDetails)}
                                        className="w-full h-10 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                      >
                                        <span className="block truncate w-full">
                                          {t('aquaDashboard.dailyTable.stockCount', {
                                            ns: 'dashboard',
                                            count: row.feedStockCount,
                                          })}
                                        </span>
                                      </button>
                                    ) : (
                                      <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                        -
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                      <Network className="size-4 text-cyan-500 shrink-0" />
                                      <span className="text-xs font-black uppercase tracking-widest truncate">
                                        {t('aquaDashboard.dailySections.netOperation', { ns: 'dashboard' })}
                                      </span>
                                    </div>
                                    <Badge className="rounded-xl px-2 py-1 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-cyan-500/15 text-[10px] font-black shrink-0">
                                      {row.netOperationCount}
                                    </Badge>
                                  </div>

                                  <div className="mt-3">
                                    {hasNetDetails ? (
                                      <button
                                        type="button"
                                        onClick={() => onOpenDetail('netOperation', row.date, row.netOperationDetails)}
                                        className="w-full h-10 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                      >
                                        <span className="block truncate w-full">
                                          {t('aquaDashboard.dailyTable.netOperationCount', {
                                            ns: 'dashboard',
                                            count: row.netOperationCount,
                                          })}
                                        </span>
                                      </button>
                                    ) : (
                                      <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                        -
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                      <ArrowRightLeft className="size-4 text-pink-500 shrink-0" />
                                      <span className="text-xs font-black uppercase tracking-widest truncate">
                                        {t('aquaDashboard.dailySections.transferQty', { ns: 'dashboard' })}
                                      </span>
                                    </div>
                                    <Badge className="rounded-xl px-2 py-1 bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 border border-pink-500/15 text-[10px] font-black shrink-0">
                                      {row.transferCount || 0}
                                    </Badge>
                                  </div>

                                  <div className="mt-3">
                                    {hasTransferDetails ? (
                                      <button
                                        type="button"
                                        onClick={() => onOpenDetail('transfer', row.date, row.transferDetails ?? [])}
                                        className="w-full h-10 rounded-2xl bg-pink-500/10 hover:bg-pink-500/15 border border-pink-500/15 text-pink-700 dark:text-pink-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                      >
                                        <span className="block truncate w-full">
                                          {t('aquaDashboard.dailyTable.transferQty', {
                                            ns: 'dashboard',
                                            count: row.transferCount || 0,
                                          })}
                                        </span>
                                      </button>
                                    ) : (
                                      <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                        {row.transferCount || '-'}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/70 dark:bg-blue-900/10 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                                      <Truck className="size-4 text-amber-500 shrink-0" />
                                      <span className="text-xs font-black uppercase tracking-widest truncate">
                                        {t('aquaDashboard.dailySections.shipmentOperation', { ns: 'dashboard' })}
                                      </span>
                                    </div>
                                    <Badge className="rounded-xl px-2 py-1 bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-500/15 text-[10px] font-black shrink-0">
                                      {row.shipmentCount || 0}
                                    </Badge>
                                  </div>

                                  <div className="mt-3">
                                    {hasShipmentDetails ? (
                                      <button
                                        type="button"
                                        onClick={() => onOpenDetail('shipment', row.date, row.shipmentDetails ?? [])}
                                        className="w-full h-10 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black transition-colors px-3 overflow-hidden"
                                      >
                                        <span className="block truncate w-full">
                                          {t('aquaDashboard.dailyTable.shipmentCount', {
                                            ns: 'dashboard',
                                            count: row.shipmentCount || 0,
                                          })}
                                        </span>
                                      </button>
                                    ) : (
                                      <div className="h-10 rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">
                                        {row.shipmentCount || '-'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {hasStockConvertDetails && (
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={() => onOpenDetail('stockConvert', row.date, row.stockConvertDetails ?? [])}
                                    className="inline-flex max-w-full items-center gap-2 px-4 h-10 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-black transition-colors overflow-hidden"
                                  >
                                    <Layers className="size-4 shrink-0" />
                                    <span className="truncate">
                                      {t('aquaDashboard.dailyTable.stockConvertCount', {
                                        ns: 'dashboard',
                                        count: row.stockConvertCount || 0,
                                      })}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-8 py-4 sm:py-5 border-t border-slate-200 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-950 flex justify-end">
            <button
              type="button"
              onClick={() => onDailyDialogChange(false)}
              className="w-full sm:w-auto px-10 py-2.5 bg-linear-to-r from-pink-600 to-orange-600 text-white font-black rounded-2xl text-sm shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              {t('aqua.common.cancel', { ns: 'common' })}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={onDetailDialogChange}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[85dvh] max-w-2xl overflow-hidden bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 p-0 rounded-[24px] sm:rounded-[28px] shadow-2xl flex flex-col outline-none">
          <DialogHeader className="border-b border-slate-100 dark:border-cyan-800/20 bg-linear-to-r from-slate-50 via-white to-cyan-50/40 dark:from-blue-950 dark:via-blue-950 dark:to-cyan-950/30 px-4 sm:px-6 py-5 shrink-0">
            <div className="flex flex-col gap-4">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/15 shrink-0">
                  {getDetailTypeIcon(detailDialog.type)}
                </div>
                <span className="wrap-break-word">{detailDialog.title}</span>
              </DialogTitle>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-500/30">
                  {detailDialog.description}
                </span>
                <span className="text-[10px] font-black text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-500/20 px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-500/30">
                  {detailDialog.items.length}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 custom-scrollbar">
            {detailDialog.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailDialog.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-cyan-800/25 bg-slate-50/80 dark:bg-blue-900/10 px-4 py-4 hover:border-cyan-400/40 dark:hover:border-cyan-500/30 hover:bg-white dark:hover:bg-blue-900/20 transition-all"
                  >
                    <div className="shrink-0 mt-0.5 w-7 h-7 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-[11px] font-black">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-blue-950/50 border border-slate-200 dark:border-cyan-800/20 max-w-full">
                        <span className="text-cyan-600 dark:text-cyan-300 shrink-0">{getDetailTypeIcon(detailDialog.type)}</span>
                        <span className="font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300 break-all">
                          {item}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <Info className="size-10 mx-auto mb-4 text-slate-300 dark:text-cyan-900/60" />
                {t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
