import { lazy, memo, Suspense, type MouseEvent, type ReactElement, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  Activity,
  Fish,
  Layers,
  UtensilsCrossed,
  Waves,
  BarChart3,
  Droplets,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  Package,
  ShieldAlert,
  Skull,
  Truck,
  X,
  Search,
  Filter,
  Maximize2,
  ArrowRight,
  LoaderCircle,
  Boxes,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageLoader } from '@/components/shared/PageLoader';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { aquaDashboardApi, type DashboardCageSummary, type DashboardProjectSummary, type DashboardProjectDetailResponse, type DashboardProjectDetailCage, type DashboardCageDailyRow } from '../api/aqua-dashboard-api';
import type { ProjectDto } from '../types/project-detail-report-types';
import { cn } from '@/lib/utils';

const AquaDashboardDailyDialogs = lazy(() => import('./AquaDashboardDailyDialogs'));

const DASHBOARD_PROJECTS_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'projects'] as const;
const PROJECT_DETAIL_QUERY_KEY = ['aqua', 'reports', 'dashboard', 'project-detail'] as const;
const DOCUMENT_STATUS_CANCELLED = 2;

const DASHBOARD_SELECTED_PROJECT_IDS_STORAGE_KEY = 'verii_aqua_dashboard_selected_project_ids';

function readStoredDashboardProjectIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DASHBOARD_SELECTED_PROJECT_IDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
  } catch {
    return [];
  }
}

function writeStoredDashboardProjectIds(ids: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DASHBOARD_SELECTED_PROJECT_IDS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Quota or private mode — ignore
  }
}

type DetailType = 'feeding' | 'netOperation' | 'transfer' | 'stockConvert' | 'shipment';
type ViewMode = 'card' | 'list';
type CageGroupingMode = 'byProject' | 'byCage';
type CageCardSize = 'default' | 'peek' | 'dialog';

const DASHBOARD_CAGE_GROUPING_MODE_STORAGE_KEY = 'verii_aqua_dashboard_cage_grouping_mode';

function readStoredCageGroupingMode(): CageGroupingMode {
  if (typeof window === 'undefined') return 'byProject';
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CAGE_GROUPING_MODE_STORAGE_KEY);
    if (!raw) return 'byProject';
    const parsed = JSON.parse(raw) as unknown;
    return parsed === 'byCage' ? 'byCage' : 'byProject';
  } catch {
    return 'byProject';
  }
}

function writeStoredCageGroupingMode(mode: CageGroupingMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DASHBOARD_CAGE_GROUPING_MODE_STORAGE_KEY, JSON.stringify(mode));
  } catch {
    // Quota or private mode — ignore
  }
}

interface CageSizeClasses {
  outer: string;
  content: string;
  contentPadTop: string;
  bottom: string;
  statLabel: string;
  statValue: string;
  fcrValue: string;
  cageLabel: string;
  survivalRow: string;
  quickEntryBtn: string;
  fcrLabel: string;
}

const CAGE_SIZE_CLASSES: Record<CageCardSize, CageSizeClasses> = {
  default: {
    outer: 'max-w-[350px] xl:max-w-[370px]',
    content: 'max-w-[272px] gap-1',
    contentPadTop: 'pt-[58px]',
    bottom: 'max-w-[264px]',
    statLabel: 'text-[9px]',
    statValue: 'text-[12px]',
    fcrValue: 'text-sm',
    cageLabel: 'text-[12px] max-w-[220px] min-w-[80px]',
    survivalRow: 'text-[11px] py-1.5',
    quickEntryBtn: 'h-9 text-xs',
    fcrLabel: 'text-[9px]',
  },
  /** Proje detay popup — aynı SVG kafes; ızgarada sığması için sıkı ölçek */
  dialog: {
    outer: 'w-[200px] max-w-[200px] shrink-0',
    content: 'max-w-[172px] gap-px',
    contentPadTop: 'pt-10',
    bottom: 'max-w-[164px]',
    statLabel: 'text-[6px] leading-none',
    statValue: 'text-[8px] leading-none',
    fcrValue: 'text-[9px] leading-tight',
    cageLabel: 'text-[6px] max-w-[148px] min-w-0',
    survivalRow: 'text-[7px] py-px leading-none',
    quickEntryBtn: 'h-5 text-[8px] leading-none',
    fcrLabel: 'text-[6px]',
  },
  peek: {
    outer: 'max-w-[min(92vw,640px)]',
    content: 'max-w-[500px] gap-3',
    contentPadTop: 'pt-20',
    bottom: 'max-w-[470px]',
    statLabel: 'text-[14px]',
    statValue: 'text-[22px]',
    fcrValue: 'text-4xl',
    cageLabel: 'text-[18px] max-w-[320px]',
    survivalRow: 'text-[16px] py-2',
    quickEntryBtn: 'h-12 text-base',
    fcrLabel: 'text-[13px]',
  },
};

interface DetailDialogState {
  open: boolean;
  title: string;
  description: string;
  items: string[];
  type: DetailType;
}

interface DashboardProjectOption {
  projectId: number;
  projectCode: string;
  projectName: string;
}

interface GlobalCageRow {
  cage: DashboardCageSummary;
  projectId: number;
  projectCode: string;
  projectName: string;
}

function cageOrderingKey(cage: DashboardCageSummary): string {
  const code = cage.cageCode?.trim();
  if (code) return code;
  const label = cage.cageLabel?.trim() ?? '';
  const dash = label.indexOf(' - ');
  if (dash > 0) return label.slice(0, dash).trim();
  return label;
}

function compareGlobalCageRows(a: GlobalCageRow, b: GlobalCageRow): number {
  const ka = cageOrderingKey(a.cage);
  const kb = cageOrderingKey(b.cage);
  const primary = ka.localeCompare(kb, 'tr', { numeric: true, sensitivity: 'base' });
  if (primary !== 0) return primary;
  const secondary = a.projectCode.localeCompare(b.projectCode, 'tr', { numeric: true, sensitivity: 'base' });
  if (secondary !== 0) return secondary;
  return a.cage.projectCageId - b.cage.projectCageId;
}

function buildGlobalCageRows(projects: DashboardProjectSummary[]): GlobalCageRow[] {
  const rows: GlobalCageRow[] = [];
  for (const project of projects) {
    for (const cage of project.cages) {
      rows.push({
        cage,
        projectId: project.projectId,
        projectCode: project.projectCode,
        projectName: project.projectName,
      });
    }
  }
  rows.sort(compareGlobalCageRows);
  return rows;
}

interface CageCardProps {
  cage: DashboardCageSummary;
  projectBadge?: { projectCode: string; projectName: string } | null;
  onClick?: () => void;
  onQuickEntryClick?: () => void;
  onExpandClick?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  isSelected?: boolean;
  clickable?: boolean;
  showExpand?: boolean;
  showExpandProgress?: boolean;
  size?: CageCardSize;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value);
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function toKg(gram: number): number {
  return gram / 1000;
}

function computeProducedBiomassKg(input: {
  currentBiomassGram: number;
  initialBiomassGram: number;
  totalDeadBiomassGram: number;
  totalShipmentBiomassGram: number;
}): number {
  return Math.max(
    0,
    toKg(input.currentBiomassGram + input.totalDeadBiomassGram + input.totalShipmentBiomassGram - input.initialBiomassGram)
  );
}

function computeFcr(input: {
  totalFeedGram: number;
  currentBiomassGram: number;
  initialBiomassGram: number;
  totalDeadBiomassGram: number;
  totalShipmentBiomassGram: number;
}): number | null {
  const producedBiomassKg = computeProducedBiomassKg(input);
  if (producedBiomassKg <= 0) return null;
  return round(toKg(input.totalFeedGram) / producedBiomassKg);
}

function sortDailyRows(rows: DashboardCageDailyRow[]): DashboardCageDailyRow[] {
  return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function isProjectEndDateInThePast(endDate?: string | null): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return endDay < today;
}

function isActiveProject(project: ProjectDto): boolean {
  if (project.status === DOCUMENT_STATUS_CANCELLED) return false;
  if (isProjectEndDateInThePast(project.endDate)) return false;
  return true;
}

function toDashboardCageSummary(cage: DashboardProjectDetailCage): DashboardCageSummary {
  const totalShipmentCount = cage.dailyRows.reduce((sum, row) => sum + row.shipmentFishCount, 0);
  const totalShipmentBiomassGram = cage.dailyRows.reduce((sum, row) => sum + row.shipmentBiomassGram, 0);
  const totalDeadBiomassGram = cage.dailyRows.reduce((sum, row) => sum + row.deadBiomassGram, 0);

  return {
    projectCageId: cage.projectCageId,
    cageLabel: cage.cageLabel,
    cageCode: cage.cageCode,
    measurementAverageGram: cage.currentAverageGram,
    initialFishCount: cage.initialFishCount,
    initialBiomassGram: cage.initialBiomassGram,
    currentFishCount: cage.currentFishCount,
    totalShipmentCount,
    totalShipmentBiomassGram,
    totalDeadCount: cage.totalDeadCount,
    totalDeadBiomassGram,
    totalFeedGram: cage.totalFeedGram,
    currentBiomassGram: cage.currentBiomassGram,
    fcr: computeFcr({
      totalFeedGram: cage.totalFeedGram,
      currentBiomassGram: cage.currentBiomassGram,
      initialBiomassGram: cage.initialBiomassGram,
      totalDeadBiomassGram,
      totalShipmentBiomassGram,
    }),
  };
}

function formatAlertDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

const CAGE_SVG_BRACKETS = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 360) / 24;
  return (
    <rect
      key={i}
      x="156"
      y="6"
      width="8"
      height="32"
      rx="3"
      fill="#0f172a"
      stroke="#1e293b"
      strokeWidth="1.5"
      transform={`rotate(${angle} 160 160)`}
    />
  );
});

const CAGE_CAUSTIC_SPOTS = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * 360) / 6;
  const rad = (angle * Math.PI) / 180;
  const radius = 70;
  const cx = 160 + Math.cos(rad) * radius;
  const cy = 160 + Math.sin(rad) * radius;
  return <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 18 : 12} fill="#ffffff" opacity="0.08" />;
});

const CAGE_CAUSTIC_RING = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * 360) / 8;
  const rad = (angle * Math.PI) / 180;
  const radius = 44;
  const cx = 160 + Math.cos(rad) * radius;
  const cy = 160 + Math.sin(rad) * radius;
  return <circle key={i} cx={cx} cy={cy} r={6} fill="#a5f3fc" opacity="0.18" />;
});

function CageCardComponent({
  cage,
  projectBadge = null,
  onClick,
  onQuickEntryClick,
  onExpandClick,
  onHoverEnter,
  onHoverLeave,
  isSelected = false,
  clickable = false,
  showExpand = false,
  showExpandProgress = false,
  size = 'default',
  t,
}: CageCardProps): ReactElement {
  const uid = useId().replace(/:/g, '');
  const waterDepthId = `${uid}-waterDepth`;
  const nettingId = `${uid}-netting`;
  const waterClipId = `${uid}-waterClip`;
  const expandProgressGradId = `${uid}-expandProgress`;
  const sz = CAGE_SIZE_CLASSES[size];
  const isPeek = size === 'peek';
  const isDialog = size === 'dialog';

  const totalInitial = cage.currentFishCount + cage.totalDeadCount;
  const survivalRate = totalInitial > 0 ? (cage.currentFishCount / totalInitial) * 100 : 100;
  const isCritical = survivalRate < 80;
  const isWarning = survivalRate >= 80 && survivalRate < 95;

  const ringStroke = isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#06b6d4';
  const radius = 142;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(survivalRate, 0), 100) / 100) * circumference;

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (!onClick) return;
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => {
        if (!clickable || !onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onClick();
        }
      }}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      className={cn(
        'relative mx-auto transition-transform duration-300 ease-out group',
        !isDialog && 'w-full aqua-contain',
        sz.outer,
        isSelected && 'scale-[1.02]',
        clickable && (isDialog ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-pointer hover:scale-[1.035]')
      )}
    >
      {projectBadge != null ? (
        <div className={cn('relative z-30 flex flex-col items-center', isPeek ? 'mb-1 pt-2' : isDialog ? 'pt-2' : 'pt-3')}>
          {/* Ribbon unit — whole group floats together */}
          <div className={cn('aqua-ribbon-unit flex flex-col items-center', isPeek && 'motion-safe:animation-none')}>
            {/* Badge body */}
            <div
              title={`${projectBadge.projectCode} — ${projectBadge.projectName}`}
              className={cn(
                'aqua-ribbon-inner inline-flex max-w-full flex-col items-center gap-1 rounded-sm border text-center',
                isPeek ? 'px-6 py-2.5' : isDialog ? 'max-w-[158px] px-2 py-1' : 'max-w-[min(220px,88vw)] px-4 py-2',
                'border-pink-400/50',
                'shadow-[0_6px_22px_rgba(236,72,153,0.22),0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.11)]',
              )}
              style={{
                background: 'linear-gradient(130deg, #0f172a 0%, #1e1040 30%, #1a0a2e 60%, #0f172a 100%)',
              }}
            >
              {/* Top edge highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/55 to-transparent" aria-hidden />
              {/* Left + right edge glows */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-pink-400/0 via-pink-400/50 to-pink-400/0" aria-hidden />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-cyan-400/0 via-cyan-400/40 to-cyan-400/0" aria-hidden />

              <span
                className={cn(
                  'relative z-10 font-black uppercase tracking-[0.22em] text-pink-300',
                  isPeek ? 'text-sm' : isDialog ? 'text-[9px]' : 'text-[10px]'
                )}
                style={{ textShadow: '0 0 10px rgba(236,72,153,0.65)' }}
              >
                {projectBadge.projectCode}
              </span>
              <span
                title={projectBadge.projectName}
                className={cn(
                  'relative z-10 min-w-0 max-w-full truncate font-semibold leading-snug text-cyan-50/90',
                  isPeek ? 'text-base' : isDialog ? 'text-[9px]' : 'text-xs'
                )}
              >
                {projectBadge.projectName}
              </span>
            </div>

            {/* Connector: thin vertical line + small triangle pointing down */}
            {!isPeek && (
              <>
                <div className="w-px h-2.5 bg-gradient-to-b from-pink-400/45 to-transparent" aria-hidden />
                <div
                  className="h-0 w-0"
                  style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '5px solid rgba(236,72,153,0.3)',
                  }}
                  aria-hidden
                />
              </>
            )}
          </div>
        </div>
      ) : null}
      <div className={cn('relative aspect-square w-full', isDialog ? 'overflow-visible' : 'pt-5')}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 320" aria-hidden>
          <defs>
            <radialGradient id={waterDepthId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop
                offset="0%"
                className="[stop-color:#67e8f9] [stop-opacity:0.55] dark:[stop-color:#38bdf8] dark:[stop-opacity:0.55]"
              />
              <stop
                offset="55%"
                className="[stop-color:#0891b2] [stop-opacity:0.7] dark:[stop-color:#0284c7] dark:[stop-opacity:0.7]"
              />
              <stop
                offset="100%"
                className="[stop-color:#0e4a72] [stop-opacity:0.95] dark:[stop-color:#0b3a6b] dark:[stop-opacity:0.95]"
              />
            </radialGradient>
            <pattern id={nettingId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.55" />
            </pattern>
            <clipPath id={waterClipId}>
              <circle cx="160" cy="160" r="130" />
            </clipPath>
          </defs>

          <circle cx="160" cy="160" r="130" className="fill-[#0e4a72] dark:fill-[#0b3a6b]" />
          <circle cx="160" cy="160" r="130" fill={`url(#${waterDepthId})`} className="aqua-breathe" />

          <g clipPath={`url(#${waterClipId})`} className="aqua-gpu">
            <g className="aqua-caustic">{CAGE_CAUSTIC_SPOTS}</g>
            <g className="aqua-caustic-slow">{CAGE_CAUSTIC_RING}</g>
          </g>

          <g clipPath={`url(#${waterClipId})`}>
            <circle cx="160" cy="160" r="40" fill="none" stroke="#a5f3fc" strokeWidth="1.2" opacity="0.35" className="aqua-ripple aqua-gpu" />
            <circle cx="160" cy="160" r="40" fill="none" stroke="#a5f3fc" strokeWidth="1.2" opacity="0.35" className="aqua-ripple aqua-ripple-d1 aqua-gpu" />
            <circle cx="160" cy="160" r="40" fill="none" stroke="#a5f3fc" strokeWidth="1.2" opacity="0.35" className="aqua-ripple aqua-ripple-d2 aqua-gpu" />
          </g>

          <circle cx="160" cy="160" r="130" fill={`url(#${nettingId})`} />
          <circle cx="160" cy="160" r="130" fill="none" stroke="#0b1628" strokeWidth="8" opacity="0.35" />

          <circle cx="160" cy="160" r="142" fill="none" stroke="#1e293b" strokeWidth="14" />
          <circle cx="160" cy="160" r="122" fill="none" stroke="#1e293b" strokeWidth="10" />

          {CAGE_SVG_BRACKETS}

          <circle cx="160" cy="160" r="142" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle
            cx="160"
            cy="160"
            r="142"
            fill="none"
            stroke={ringStroke}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
            transform="rotate(-90 160 160)"
          />
        </svg>

        {isCritical && <div className="pointer-events-none absolute inset-[10%] rounded-full bg-rose-500/15 aqua-pulse-alert" />}

        <div
          className={cn(
            'absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center',
            isDialog ? 'top-[-11px] max-w-[min(152px,94%)] px-0' : 'top-0 w-[min(100%,calc(100%-10px))] max-w-[min(100%,calc(100%-10px))] px-1'
          )}
        >
          <div
            title={cage.cageCode ? `${cage.cageLabel} (${cage.cageCode})` : cage.cageLabel}
            className={cn(
              'relative box-border cursor-default rounded-md border-2',
              isPeek
                ? 'inline-flex max-w-full flex-col items-center justify-center gap-1 px-6 py-3'
                : isDialog
                  ? 'inline-flex max-w-full min-w-0 flex-col items-center gap-0 px-1 py-0.5'
                  : 'inline-flex max-w-full flex-col items-center justify-center gap-0.5 px-5 py-2',
              'border-cyan-400/85 bg-[linear-gradient(135deg,#0a1628,#112240,#1e293b)] text-white',
              'shadow-[0_4px_22px_rgba(6,182,212,0.45),inset_0_1px_0_rgba(165,243,252,0.18),inset_0_-1px_0_rgba(6,182,212,0.12)]',
              'ring-1 ring-cyan-400/20',
              sz.cageLabel
            )}
          >
            {/* Kafes adı */}
            <div
              className={cn(
                'flex min-w-0 max-w-full items-center justify-center',
                isPeek ? 'gap-2.5' : isDialog ? 'gap-0.5' : 'gap-2'
              )}
            >
              <Waves className={cn('shrink-0 text-cyan-300', isPeek ? 'size-5' : isDialog ? 'size-2' : 'size-3')} />
              <span
                className={cn(
                  'min-w-0 max-w-full font-black uppercase leading-tight text-white',
                  isDialog ? 'truncate text-center text-[6px]' : 'truncate leading-none'
                )}
                style={isDialog ? { letterSpacing: '0.04em' } : { letterSpacing: '0.2em' }}
              >
                {cage.cageLabel}
              </span>
            </div>
            {/* Kafes kodu */}
            {cage.cageCode && (
              <span
                className={cn(
                  'block max-w-full truncate text-center font-mono font-semibold tracking-tight text-cyan-400/75',
                  isPeek ? 'text-[11px]' : isDialog ? 'text-[6px]' : 'text-[9px]'
                )}
              >
                ({cage.cageCode})
              </span>
            )}
          </div>
          <div className={cn('pointer-events-none rounded-b-sm shadow-sm', isPeek ? 'h-4 w-[4px] bg-cyan-600/60' : isDialog ? 'h-2.5 w-[2.5px] bg-cyan-500/50' : 'h-3 w-[3px] bg-cyan-500/50')} />
        </div>

        <div
          className={cn(
            'absolute z-20 flex items-center justify-center rounded-full border-2 shadow-md',
            isPeek ? 'top-4 right-4 size-12' : isDialog ? 'top-1.5 right-1.5 size-7' : 'top-2 right-2 size-8',
            isCritical
              ? 'border-rose-400/80 bg-rose-950 text-rose-200'
              : isWarning
                ? 'border-amber-400/80 bg-amber-950 text-amber-200'
                : 'border-emerald-400/70 bg-emerald-950 text-emerald-200'
          )}
        >
          {isCritical ? (
            <ShieldAlert size={isPeek ? 22 : isDialog ? 11 : 14} strokeWidth={3} />
          ) : isWarning ? (
            <AlertTriangle size={isPeek ? 22 : isDialog ? 11 : 14} strokeWidth={3} />
          ) : (
            <CheckCircle2 size={isPeek ? 22 : isDialog ? 11 : 14} strokeWidth={3} />
          )}
        </div>

        {showExpand && onExpandClick && (
          <div className={cn('absolute z-20', isDialog ? 'top-1 left-1' : 'top-2 left-2')}>
            <div className={cn('relative flex items-center justify-center', isDialog ? 'size-7' : 'size-9')}>
              <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(34,211,238,0.14)" strokeWidth="2.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={`url(#${expandProgressGradId})`}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray="100"
                  strokeDashoffset={showExpandProgress ? 0 : 100}
                  className="transition-[stroke-dashoffset,opacity] duration-[600ms] ease-linear"
                  opacity={showExpandProgress ? 1 : 0.35}
                />
                <defs>
                  <linearGradient id={expandProgressGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="55%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
              </svg>

              <button
                type="button"
                aria-label={t('aquaDashboard.cageCard.expandFullscreen', { ns: 'dashboard' })}
                title={t('aquaDashboard.cageCard.expandFullscreen', { ns: 'dashboard' })}
                onClick={(event) => {
                  event.stopPropagation();
                  onExpandClick();
                }}
                className={cn(
                  'aqua-expand-btn relative flex items-center justify-center rounded-full border-2 border-cyan-400/70 bg-slate-950/85 text-cyan-200 shadow-md',
                  isDialog ? 'size-6' : 'size-8',
                  'opacity-70 transition-[opacity,transform] duration-200 hover:scale-110 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none',
                  'group-hover:opacity-100 group-hover:text-white'
                )}
              >
                <Maximize2 size={isDialog ? 11 : 14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        <div
          className={cn(
            'absolute inset-0 z-10 flex flex-col items-center',
            isDialog
              ? cn('min-h-0 justify-start gap-px overflow-visible px-0.5 pb-1', sz.contentPadTop)
              : cn('justify-center px-3 pb-5', sz.contentPadTop)
          )}
        >
          <div className={cn('flex w-full shrink-0 flex-col px-0.5', isDialog ? 'mb-0' : 'mb-1', sz.content)}>
            {/* Satır 1: Ölü / Satış / Stok adet */}
            <div className={cn('grid grid-cols-3', isPeek ? 'gap-3' : isDialog ? 'gap-px' : 'gap-1')}>
              {/* Ölü Adet */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-rose-500/50 bg-[linear-gradient(160deg,rgba(76,5,25,0.82),rgba(15,23,42,0.97))]',
                'shadow-[0_2px_12px_rgba(244,63,94,0.22),inset_0_1px_0_rgba(252,165,165,0.12)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(252,165,165,0.7),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Skull className={cn('shrink-0 text-rose-400/90', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-rose-300/85', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.totalDeadCount', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-rose-300 drop-shadow-[0_0_5px_rgba(244,63,94,0.55)]', sz.statValue)}>
                  {formatNumber(cage.totalDeadCount)}
                </span>
              </div>

              {/* Satış Adet */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-amber-500/45 bg-[linear-gradient(160deg,rgba(69,26,3,0.82),rgba(15,23,42,0.97))]',
                'shadow-[0_2px_12px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(253,230,138,0.1)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(253,230,138,0.65),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Truck className={cn('shrink-0 text-amber-400/90', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-amber-300/85', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.shipmentCount', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-amber-200 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]', sz.statValue)}>
                  {formatNumber(cage.totalShipmentCount)}
                </span>
              </div>

              {/* Stok Adet */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-emerald-500/45 bg-[linear-gradient(160deg,rgba(2,44,34,0.82),rgba(15,23,42,0.97))]',
                'shadow-[0_2px_12px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(167,243,208,0.1)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(167,243,208,0.65),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Fish className={cn('shrink-0 text-emerald-400/90', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-emerald-300/85', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.stockCount', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-emerald-200 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]', sz.statValue)}>
                  {formatNumber(cage.currentFishCount)}
                </span>
              </div>
            </div>

            {/* Satır 2: Ölü / Satış / Stok kg */}
            <div className={cn('grid grid-cols-3', isPeek ? 'gap-3 mt-3' : isDialog ? 'mt-px gap-px' : 'gap-1 mt-0.5')}>
              {/* Ölü kg */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-rose-500/35 bg-[linear-gradient(160deg,rgba(60,5,20,0.72),rgba(15,23,42,0.95))]',
                'shadow-[0_2px_10px_rgba(244,63,94,0.16),inset_0_1px_0_rgba(252,165,165,0.08)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(252,165,165,0.5),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Skull className={cn('shrink-0 text-rose-400/75', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-rose-300/75', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.totalDeadKg', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-rose-300 drop-shadow-[0_0_4px_rgba(244,63,94,0.45)]', sz.statValue)}>
                  {formatNumber(toKg(cage.totalDeadBiomassGram))}
                </span>
              </div>

              {/* Satış kg */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-amber-500/35 bg-[linear-gradient(160deg,rgba(55,20,3,0.72),rgba(15,23,42,0.95))]',
                'shadow-[0_2px_10px_rgba(245,158,11,0.16),inset_0_1px_0_rgba(253,230,138,0.08)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(253,230,138,0.5),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Truck className={cn('shrink-0 text-amber-400/75', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-amber-300/75', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.shipmentKg', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-amber-200 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]', sz.statValue)}>
                  {formatNumber(toKg(cage.totalShipmentBiomassGram))}
                </span>
              </div>

              {/* Stok kg */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-sky-500/35 bg-[linear-gradient(160deg,rgba(3,20,55,0.72),rgba(15,23,42,0.95))]',
                'shadow-[0_2px_10px_rgba(56,189,248,0.16),inset_0_1px_0_rgba(186,230,253,0.08)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(186,230,253,0.5),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Layers className={cn('shrink-0 text-sky-400/75', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-sky-300/75', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.stockKg', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-sky-200 drop-shadow-[0_0_4px_rgba(56,189,248,0.4)]', sz.statValue)}>
                  {formatNumber(toKg(cage.currentBiomassGram))}
                </span>
              </div>
            </div>

            {/* Satır 3: Ölçüm / Yem */}
            <div className={cn('grid grid-cols-2', isPeek ? 'gap-3 mt-3' : isDialog ? 'mt-px gap-px' : 'gap-1 mt-0.5')}>
              {/* Ölçüm Gramajı */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-cyan-500/40 bg-[linear-gradient(160deg,rgba(3,25,55,0.72),rgba(15,23,42,0.95))]',
                'shadow-[0_2px_10px_rgba(34,211,238,0.16),inset_0_1px_0_rgba(165,243,252,0.08)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(165,243,252,0.6),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <Droplets className={cn('shrink-0 text-cyan-400/90', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-cyan-300/85', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.measurementGram', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-cyan-200 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]', sz.statValue)}>
                  {formatNumber(cage.measurementAverageGram)}
                </span>
              </div>

              {/* Yem kg */}
              <div className={cn(
                'relative flex flex-col items-center overflow-hidden rounded-md border',
                isPeek ? 'gap-1.5 p-3' : isDialog ? 'gap-px p-0.5' : 'gap-0.5 p-1.5',
                'border-orange-500/40 bg-[linear-gradient(160deg,rgba(55,20,3,0.72),rgba(15,23,42,0.95))]',
                'shadow-[0_2px_10px_rgba(249,115,22,0.16),inset_0_1px_0_rgba(253,186,116,0.08)]'
              )}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(253,186,116,0.6),transparent)]" />
                <div className={cn('flex items-center justify-center', isPeek ? 'gap-1.5' : isDialog ? 'gap-px' : 'gap-0.5')}>
                  <UtensilsCrossed className={cn('shrink-0 text-orange-400/90', isPeek ? 'size-3.5' : isDialog ? 'size-2' : 'size-2.5')} />
                  <span className={cn('truncate font-bold uppercase tracking-wider text-orange-300/85', sz.statLabel)}>
                    {t('aquaDashboard.cageCard.feedKg', { ns: 'dashboard' })}
                  </span>
                </div>
                <span className={cn('font-black tabular-nums text-amber-200 drop-shadow-[0_0_5px_rgba(249,115,22,0.45)]', sz.statValue)}>
                  {formatNumber(toKg(cage.totalFeedGram))}
                </span>
              </div>
            </div>
          </div>

          {/* FCR */}
          <div className={cn(
            'relative w-full shrink-0 overflow-hidden rounded-md border text-center',
            isDialog ? 'mb-0' : 'mb-1.5',
            sz.content,
            isPeek ? 'px-4 py-3 mt-3' : isDialog ? 'mt-px px-1 py-0.5' : 'px-2 py-1',
            'border-sky-500/45 bg-[linear-gradient(135deg,rgba(3,18,60,0.85),rgba(15,23,42,0.97))]',
            'shadow-[0_2px_14px_rgba(56,189,248,0.2),inset_0_1px_0_rgba(186,230,253,0.1)]'
          )}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(186,230,253,0.65),transparent)]" />
            <div className={cn('flex items-center justify-center gap-1', isPeek ? 'mb-1' : isDialog ? 'mb-px' : 'mb-0.5')}>
              <TrendingUp className={cn('shrink-0 text-sky-400', isPeek ? 'size-4' : isDialog ? 'size-2' : 'size-2.5')} />
              <span className={cn('font-bold uppercase tracking-wider text-sky-300/85', sz.fcrLabel)}>
                {t('aquaDashboard.cageCard.fcr', { ns: 'dashboard' })}
              </span>
            </div>
            <span className={cn('font-black tabular-nums text-sky-200 drop-shadow-[0_0_6px_rgba(56,189,248,0.55)]', sz.fcrValue)}>
              {cage.fcr != null ? formatNumber(cage.fcr) : '-'}
            </span>
          </div>

          {/* Alt alan: Günlük giriş + Yaşam oranı */}
          <div className={cn('mt-auto flex w-full shrink-0 flex-col items-center', isDialog ? 'gap-0.5' : 'gap-1', sz.bottom)}>
            {onQuickEntryClick && (
              <Button
                type="button"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onQuickEntryClick();
                }}
                className={cn(
                  'w-full rounded-full border border-white/20 bg-linear-to-r from-cyan-500 via-blue-500 to-orange-400 font-black uppercase tracking-wider text-white',
                  sz.quickEntryBtn,
                  'shadow-[0_6px_20px_rgba(6,182,212,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]',
                  'ring-1 ring-cyan-300/50 hover:from-cyan-400 hover:via-blue-500 hover:to-orange-500 hover:ring-cyan-200/70'
                )}
              >
                {t('aquaDashboard.cageCard.quickDailyEntry', { ns: 'dashboard' })}
              </Button>
            )}
            <div
              className={cn(
                'flex items-center justify-between rounded-full border font-bold uppercase',
                isPeek ? 'w-[80%] tracking-wider px-5' : isDialog ? 'w-[96%] px-1 tracking-tight' : 'w-[80%] tracking-wider px-2.5',
                sz.survivalRow,
                isCritical
                  ? 'border-rose-400/60 bg-rose-950/85 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : isWarning
                    ? 'border-amber-400/55 bg-amber-950/85 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'border-emerald-400/50 bg-emerald-950/85 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.18)]'
              )}
            >
              <span className="truncate">{t('aquaDashboard.cageCard.survivalRate', { ns: 'dashboard' })}</span>
              <span className={cn('ml-1 shrink-0 font-black', isCritical ? 'text-rose-300' : isWarning ? 'text-amber-200' : 'text-emerald-200')}>
                %{survivalRate.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CageCard = memo(CageCardComponent, (prev, next) => {
  return (
    prev.cage === next.cage &&
    prev.projectBadge?.projectCode === next.projectBadge?.projectCode &&
    prev.projectBadge?.projectName === next.projectBadge?.projectName &&
    prev.isSelected === next.isSelected &&
    prev.clickable === next.clickable &&
    prev.showExpand === next.showExpand &&
    prev.showExpandProgress === next.showExpandProgress &&
    prev.size === next.size &&
    prev.onClick === next.onClick &&
    prev.onQuickEntryClick === next.onQuickEntryClick &&
    prev.onExpandClick === next.onExpandClick &&
    prev.t === next.t
  );
});
CageCard.displayName = 'CageCard';

const PEEK_LAYOUT_ID_PREFIX = 'aqua-cage-peek-';

const peekLayoutId = (projectCageId: number): string => `${PEEK_LAYOUT_ID_PREFIX}${projectCageId}`;

const PEEK_SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 32,
  mass: 0.85,
};

interface ProjectCageCardProps {
  cage: DashboardCageSummary;
  projectId: number;
  projectCode: string;
  projectName: string;
  showProjectBadge: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  onOpenDaily: (projectId: number, projectCageId: number) => void;
  onQuickEntry: (projectId: number, projectCageId: number) => void;
  onPeekOpen: (cage: DashboardCageSummary) => void;
}

function ProjectCageCardComponent({
  cage,
  projectId,
  projectCode,
  projectName,
  showProjectBadge,
  t,
  onOpenDaily,
  onQuickEntry,
  onPeekOpen,
}: ProjectCageCardProps): ReactElement {
  const handleClick = useCallback((): void => {
    onOpenDaily(projectId, cage.projectCageId);
  }, [onOpenDaily, projectId, cage.projectCageId]);

  const handleQuickEntry = useCallback((): void => {
    onQuickEntry(projectId, cage.projectCageId);
  }, [onQuickEntry, projectId, cage.projectCageId]);

  const handleExpand = useCallback((): void => {
    onPeekOpen(cage);
  }, [onPeekOpen, cage]);

  const projectBadge = showProjectBadge ? { projectCode, projectName } : null;

  return (
    <motion.div
      layoutId={peekLayoutId(cage.projectCageId)}
      transition={PEEK_SPRING_TRANSITION}
      className="flex justify-center"
    >
      <CageCard
        cage={cage}
        projectBadge={projectBadge}
        clickable
        showExpand
        showExpandProgress={false}
        onClick={handleClick}
        onQuickEntryClick={handleQuickEntry}
        onExpandClick={handleExpand}
        t={t}
      />
    </motion.div>
  );
}

const ProjectCageCard = memo(ProjectCageCardComponent);
ProjectCageCard.displayName = 'ProjectCageCard';

interface GlobalCageSortSectionProps {
  rows: GlobalCageRow[];
  viewMode: ViewMode;
  showProjectBadge: boolean;
  projectCount: number;
  t: (key: string, options?: Record<string, unknown>) => string;
  onOpenDaily: (projectId: number, projectCageId: number) => void;
  onQuickEntry: (projectId: number, projectCageId: number) => void;
  onPeekOpen: (cage: DashboardCageSummary) => void;
}

function GlobalCageSortSectionComponent({
  rows,
  viewMode,
  showProjectBadge,
  projectCount,
  t,
  onOpenDaily,
  onQuickEntry,
  onPeekOpen,
}: GlobalCageSortSectionProps): ReactElement {
  return (
    <Card className="border border-slate-200 bg-white dark:border-cyan-800/30 dark:bg-blue-950/40 dark:backdrop-blur-md rounded-3xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1.5 w-full bg-linear-to-r from-cyan-500 via-pink-500 to-blue-500" />
      <CardHeader className="border-b border-slate-100 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20 px-4 sm:px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/12 text-cyan-600 dark:text-cyan-300">
                <Boxes className="size-5" strokeWidth={2.25} />
              </div>
              <span className="min-w-0 leading-tight">{t('aquaDashboard.cageSortSection.title', { ns: 'dashboard' })}</span>
            </CardTitle>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              {t('aquaDashboard.cageSortSection.description', {
                ns: 'dashboard',
                cageCount: rows.length,
                projectCount,
              })}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-black text-cyan-800 dark:text-cyan-200">
              <Layers className="size-3.5" />
              {formatNumber(projectCount)}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-[11px] font-black text-pink-800 dark:text-pink-200">
              <Waves className="size-3.5" />
              {formatNumber(rows.length)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 lg:p-6 bg-transparent">
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {rows.map((row) => (
              <ProjectCageCard
                key={`${row.projectId}-${row.cage.projectCageId}`}
                cage={row.cage}
                projectId={row.projectId}
                projectCode={row.projectCode}
                projectName={row.projectName}
                showProjectBadge={showProjectBadge}
                t={t}
                onOpenDaily={onOpenDaily}
                onQuickEntry={onQuickEntry}
                onPeekOpen={onPeekOpen}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar border border-slate-100 dark:border-cyan-800/30 rounded-3xl bg-white dark:bg-blue-950/20">
            <table className="w-full min-w-[1220px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-cyan-800/30 dark:bg-blue-900/40 dark:text-cyan-400">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">{t('aquaDashboard.listTable.cage', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4">{t('aquaDashboard.listTable.project', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center">{t('aquaDashboard.listTable.fish', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center text-rose-500">{t('aquaDashboard.listTable.dead', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center text-amber-500">{t('aquaDashboard.listTable.shipment', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center text-blue-500">{t('aquaDashboard.listTable.stockKg', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center">{t('aquaDashboard.listTable.measurementGram', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center">{t('aquaDashboard.listTable.feedKg', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center">{t('aquaDashboard.listTable.fcr', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center">{t('aquaDashboard.listTable.survivalRate', { ns: 'dashboard' })}</th>
                  <th className="whitespace-nowrap px-5 py-4 text-right">{t('aquaDashboard.listTable.action', { ns: 'dashboard' })}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-cyan-800/20">
                {rows.map((row) => {
                  const { cage } = row;
                  const totalInitial = cage.currentFishCount + cage.totalDeadCount;
                  const survivalRate = totalInitial > 0 ? (cage.currentFishCount / totalInitial) * 100 : 100;
                  const isCritical = survivalRate < 80;

                  return (
                    <tr
                      key={`${row.projectId}-${cage.projectCageId}`}
                      className={cn(
                        'group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-blue-900/20',
                        isCritical && 'bg-rose-50/40 dark:bg-rose-500/4'
                      )}
                      onClick={() => onOpenDaily(row.projectId, cage.projectCageId)}
                    >
                      <td className="px-5 py-3 font-extrabold text-slate-900 dark:text-white" title={cage.cageLabel}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'rounded-xl p-1.5',
                              isCritical ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-cyan-100 dark:bg-cyan-900/50'
                            )}
                          >
                            <Waves size={14} className={cn(isCritical ? 'text-rose-500' : 'text-cyan-600 dark:text-cyan-400')} />
                          </div>
                          <span className="truncate">{cage.cageLabel}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex min-w-0 max-w-[200px] flex-col gap-0.5">
                          <span className="truncate text-[11px] font-black uppercase tracking-wide text-pink-600 dark:text-pink-300">
                            {row.projectCode}
                          </span>
                          <span className="truncate text-[11px] font-semibold text-slate-600 dark:text-slate-300">{row.projectName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatNumber(cage.currentFishCount)}
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-rose-600 dark:text-rose-400">
                        {formatNumber(cage.totalDeadCount)}
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {formatNumber(cage.totalShipmentCount)}
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-blue-600 dark:text-blue-400">
                        {formatNumber(toKg(cage.currentBiomassGram))}
                        <span className="ml-0.5 text-[10px]">kg</span>
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-cyan-600 dark:text-cyan-300">
                        {formatNumber(cage.measurementAverageGram)}
                        <span className="ml-0.5 text-[10px]">g</span>
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-amber-600 dark:text-amber-300">
                        {formatNumber(toKg(cage.totalFeedGram))}
                        <span className="ml-0.5 text-[10px]">kg</span>
                      </td>

                      <td className="px-5 py-3 text-center font-bold tabular-nums text-sky-600 dark:text-sky-300">
                        {cage.fcr != null ? formatNumber(cage.fcr) : '-'}
                      </td>

                      <td className="px-5 py-3 text-center">
                        <span
                          className={cn(
                            'rounded-xl border px-2.5 py-1.5 text-[11px] font-black',
                            survivalRate < 80
                              ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
                              : survivalRate < 95
                                ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                          )}
                        >
                          %{survivalRate.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-xl px-4 text-xs font-black text-cyan-600 opacity-0 transition-all hover:bg-cyan-50 group-hover:opacity-100 dark:text-cyan-400 dark:hover:bg-cyan-900/50"
                        >
                          {t('aquaDashboard.listTable.dailyFlowButton', { ns: 'dashboard' })}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const GlobalCageSortSection = memo(GlobalCageSortSectionComponent);
GlobalCageSortSection.displayName = 'GlobalCageSortSection';

interface DetailCageCardProps {
  cage: DashboardProjectDetailCage;
  projectId: number | null;
  isSelected: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  onOpenDaily: (projectCageId: number) => void;
  onQuickEntry: (projectId: number, projectCageId: number) => void;
  onPeekOpen: (cage: DashboardCageSummary) => void;
}

function DetailCageCardComponent({ cage, projectId, isSelected, t, onOpenDaily, onQuickEntry, onPeekOpen }: DetailCageCardProps): ReactElement {
  const summary = useMemo<DashboardCageSummary>(() => toDashboardCageSummary(cage), [cage]);

  const handleClick = useCallback((): void => {
    onOpenDaily(cage.projectCageId);
  }, [onOpenDaily, cage.projectCageId]);

  const handleQuickEntry = useCallback((): void => {
    if (projectId == null) return;
    onQuickEntry(projectId, cage.projectCageId);
  }, [onQuickEntry, projectId, cage.projectCageId]);

  const handleExpand = useCallback((): void => {
    onPeekOpen(summary);
  }, [onPeekOpen, summary]);

  return (
    <motion.div
      layoutId={peekLayoutId(cage.projectCageId)}
      transition={PEEK_SPRING_TRANSITION}
      className="flex w-full min-w-0 justify-center py-1"
    >
      <CageCard
        cage={summary}
        size="dialog"
        clickable
        showExpand
        showExpandProgress={false}
        isSelected={isSelected}
        onClick={handleClick}
        onQuickEntryClick={handleQuickEntry}
        onExpandClick={handleExpand}
        t={t}
      />
    </motion.div>
  );
}

const DetailCageCard = memo(DetailCageCardComponent);
DetailCageCard.displayName = 'DetailCageCard';

interface CagePeekOverlayProps {
  cage: DashboardCageSummary | null;
  onClose: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function CagePeekOverlayComponent({ cage, onClose, t }: CagePeekOverlayProps): ReactElement {
  useEffect(() => {
    if (!cage) return;
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [cage, onClose]);

  const peekTree = (
    <AnimatePresence>
      {cage ? (
        <motion.div
          key="aqua-peek-overlay"
          className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto p-3 pt-6 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={cage.cageLabel}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            layoutId={peekLayoutId(cage.projectCageId)}
            transition={PEEK_SPRING_TRANSITION}
            onClick={(event) => event.stopPropagation()}
            className="relative z-10 my-auto w-full max-w-6xl"
          >
            <div className="relative flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(9,19,45,0.96),rgba(7,14,33,0.985))] shadow-[0_48px_140px_rgba(6,182,212,0.22)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[36px]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(244,114,182,0.14),transparent_22%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.14),transparent_32%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

              <button
                type="button"
                onClick={onClose}
                aria-label={t('aquaDashboard.controls.close', { ns: 'dashboard' })}
                className="absolute right-3 top-3 z-50 flex size-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/90 text-slate-100 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-rose-300/45 hover:bg-rose-950/85 hover:text-rose-100 focus-visible:outline-none sm:right-4 sm:top-4 sm:size-11"
              >
                <X className="size-5" strokeWidth={2.5} />
              </button>

              <div className="relative grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 pt-11 sm:gap-6 sm:p-7 sm:pt-12 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8 xl:p-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[32px] bg-cyan-400/8 blur-3xl" />
                  <div className="relative rounded-[30px] border border-white/8 bg-slate-950/18 p-3 sm:p-4">
                    <CageCard cage={cage} size="peek" t={t} />
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-5 rounded-[28px] border border-white/8 bg-slate-950/28 p-5 backdrop-blur-xl">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                        <Sparkles className="size-3.5" />
                        {t('aquaDashboard.cageCard.expandFullscreen', { ns: 'dashboard' })}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-white">{cage.cageLabel}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {t('aquaDashboard.cageCard.closeHint', { ns: 'dashboard' })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          <Fish className="size-3.5 text-emerald-300" />
                          {t('aquaDashboard.cageCard.stockCount', { ns: 'dashboard' })}
                        </div>
                        <div className="mt-2 text-2xl font-black text-white">{formatNumber(cage.currentFishCount)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          <Layers className="size-3.5 text-sky-300" />
                          {t('aquaDashboard.cageCard.stockKg', { ns: 'dashboard' })}
                        </div>
                        <div className="mt-2 text-2xl font-black text-white">{formatNumber(toKg(cage.currentBiomassGram))}</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          <UtensilsCrossed className="size-3.5 text-amber-300" />
                          {t('aquaDashboard.cageCard.feedKg', { ns: 'dashboard' })}
                        </div>
                        <div className="mt-2 text-2xl font-black text-white">{formatNumber(toKg(cage.totalFeedGram))}</div>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          <TrendingUp className="size-3.5 text-cyan-300" />
                          {t('aquaDashboard.cageCard.fcr', { ns: 'dashboard' })}
                        </div>
                        <div className="mt-2 text-2xl font-black text-white">{cage.fcr != null ? formatNumber(cage.fcr) : '-'}</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-linear-to-r from-slate-950/70 via-slate-900/60 to-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                            {t('aquaDashboard.cageCard.survivalRate', { ns: 'dashboard' })}
                          </div>
                          <div className="mt-1 text-3xl font-black text-white">
                            %{(() => {
                              const totalInitial = cage.currentFishCount + cage.totalDeadCount;
                              const survivalRate = totalInitial > 0 ? (cage.currentFishCount / totalInitial) * 100 : 100;
                              return survivalRate.toFixed(1);
                            })()}
                          </div>
                        </div>
                        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                          {t('aquaDashboard.controls.detail', { ns: 'dashboard' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <div className="flex items-center gap-2">
                      <kbd className="rounded-lg border border-white/10 bg-slate-900/90 px-2.5 py-1 text-[10px] text-slate-200">ESC</kbd>
                      <span>{t('aquaDashboard.cageCard.closeHint', { ns: 'dashboard' })}</span>
                    </div>
                    <div className="hidden items-center gap-2 text-cyan-200 sm:flex">
                      <ArrowRight className="size-3.5" />
                      <span>{t('aquaDashboard.cageCard.quickDailyEntry', { ns: 'dashboard' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return peekTree;
  }

  return createPortal(peekTree, document.body);
}

const CagePeekOverlay = memo(CagePeekOverlayComponent);
CagePeekOverlay.displayName = 'CagePeekOverlay';

/**
 * Pauses decorative SVG work when the tab is hidden; tags save-data / ≤4GB RAM for lighter motion.
 */
function useAquaDashboardDocumentPerf(): { perfLiteClass: string } {
  const [perfLiteClass, setPerfLiteClass] = useState('');

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    const saveData = nav.connection?.saveData === true;
    if (lowMem || saveData) {
      setPerfLiteClass('aqua-dash-perf-lite');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = (): void => {
      if (document.visibilityState === 'hidden') {
        root.dataset.aquaDashHidden = '1';
      } else {
        delete root.dataset.aquaDashHidden;
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      delete root.dataset.aquaDashHidden;
    };
  }, []);

  return { perfLiteClass };
}

export function AquaDashboardPage(): ReactElement {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { perfLiteClass } = useAquaDashboardDocumentPerf();

  const [activeDashboardProjectIds, setActiveDashboardProjectIds] = useState<number[]>(() => readStoredDashboardProjectIds());
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [cageGroupingMode, setCageGroupingMode] = useState<CageGroupingMode>(() => readStoredCageGroupingMode());
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCageId, setSelectedCageId] = useState<number | null>(null);
  const [isDailyDialogOpen, setIsDailyDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<DetailDialogState>({
    open: false,
    title: '',
    description: '',
    items: [],
    type: 'feeding',
  });
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [draftProjectIds, setDraftProjectIds] = useState<number[]>([]);
  const [peekCage, setPeekCage] = useState<DashboardCageSummary | null>(null);
  const [isApplyingProjectSelection, setIsApplyingProjectSelection] = useState(false);

  const safeActiveDashboardProjectIds = Array.isArray(activeDashboardProjectIds) ? activeDashboardProjectIds : [];
  const safeDraftProjectIds = Array.isArray(draftProjectIds) ? draftProjectIds : [];

  const projectsQuery = useQuery<ProjectDto[]>({
    queryKey: DASHBOARD_PROJECTS_QUERY_KEY,
    queryFn: aquaDashboardApi.getProjects,
    staleTime: 60_000,
  });

  const projectOptions = useMemo<DashboardProjectOption[]>(
    () =>
      (projectsQuery.data ?? [])
        .filter(isActiveProject)
        .map((project) => ({
          projectId: project.id,
          projectCode: project.projectCode ?? '-',
          projectName: project.projectName ?? '-',
        }))
        .sort((a, b) => a.projectCode.localeCompare(b.projectCode)),
    [projectsQuery.data]
  );

  useEffect(() => {
    writeStoredDashboardProjectIds(safeActiveDashboardProjectIds);
  }, [safeActiveDashboardProjectIds]);

  useEffect(() => {
    writeStoredCageGroupingMode(cageGroupingMode);
  }, [cageGroupingMode]);

  useEffect(() => {
    if (!projectsQuery.isSuccess || projectsQuery.data == null) return;
    const valid = new Set(projectOptions.map((project) => project.projectId));
    setActiveDashboardProjectIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const filtered = safePrev.filter((id) => valid.has(id));
      return filtered.length === safePrev.length ? prev : filtered;
    });
  }, [projectsQuery.isSuccess, projectsQuery.data, projectOptions]);

  const selectedProjectSummaries = useMemo(() => {
    return projectOptions.filter((project) => safeActiveDashboardProjectIds.includes(project.projectId));
  }, [projectOptions, safeActiveDashboardProjectIds]);

  const selectedProjectLookup = useMemo(() => {
    return new Map(projectOptions.map((project) => [project.projectId, project]));
  }, [projectOptions]);

  const draftSelectedProjectSummaries = useMemo(() => {
    return projectOptions.filter((project) => safeDraftProjectIds.includes(project.projectId));
  }, [projectOptions, safeDraftProjectIds]);

  const filteredProjects = useMemo(() => {
    const search = projectSearch.trim().toLocaleLowerCase('tr-TR');
    if (!search) return projectOptions;

    return projectOptions.filter((project) => {
      const code = project.projectCode.toLocaleLowerCase('tr-TR');
      const name = project.projectName.toLocaleLowerCase('tr-TR');
      return code.includes(search) || name.includes(search);
    });
  }, [projectOptions, projectSearch]);

  const detailQuery = useQuery<DashboardProjectDetailResponse>({
    queryKey: [...PROJECT_DETAIL_QUERY_KEY, selectedProjectId],
    queryFn: () => aquaDashboardApi.getProjectDetail(selectedProjectId as number),
    enabled: selectedProjectId != null,
    staleTime: 60_000,
  });

  const selectedProjectsSummaryQuery = useQuery<{
    projects: DashboardProjectSummary[];
    yesterdayEntryMissing: boolean;
    yesterdayDate?: string | null;
  }>({
    queryKey: [...PROJECT_DETAIL_QUERY_KEY, 'selected-projects', ...safeActiveDashboardProjectIds.slice().sort((a, b) => a - b)],
    queryFn: () => aquaDashboardApi.getProjectSummaries(safeActiveDashboardProjectIds),
    enabled: safeActiveDashboardProjectIds.length > 0,
    staleTime: 60_000,
  });

  const cageCodeMapQuery = useQuery<Map<number, string>>({
    queryKey: ['aqua-dashboard-cage-code-map'],
    queryFn: aquaDashboardApi.getCageCodeMap,
    staleTime: 5 * 60_000,
  });

  const activeProjects = useMemo<DashboardProjectSummary[]>(() => {
    const projects = (selectedProjectsSummaryQuery.data?.projects ?? [])
      .slice()
      .sort((a, b) => a.projectCode.localeCompare(b.projectCode));

    const cageCodeMap = cageCodeMapQuery.data;
    if (!cageCodeMap) return projects;

    return projects.map((project) => ({
      ...project,
      cages: project.cages.map((cage) => ({
        ...cage,
        cageCode: cage.cageCode ?? cageCodeMap.get(cage.projectCageId),
      })),
    }));
  }, [selectedProjectsSummaryQuery.data, cageCodeMapQuery.data]);

  const globalCageRows = useMemo(() => buildGlobalCageRows(activeProjects), [activeProjects]);

  const showFloatingProjectOnCages = cageGroupingMode === 'byCage' && activeProjects.length > 1;

  useEffect(() => {
    if (!isApplyingProjectSelection) return;
    if (safeActiveDashboardProjectIds.length === 0 || !selectedProjectsSummaryQuery.isFetching) {
      setIsApplyingProjectSelection(false);
    }
  }, [isApplyingProjectSelection, safeActiveDashboardProjectIds.length, selectedProjectsSummaryQuery.isFetching]);

  const selectedProjectHeaderLabel = useMemo(() => {
    if (!selectedProjectId) return '-';
    const project = selectedProjectLookup.get(selectedProjectId);
    return project ? `${project.projectCode} - ${project.projectName}` : '-';
  }, [selectedProjectId, selectedProjectLookup]);

  const detailCages = useMemo<DashboardProjectDetailCage[]>(() => {
    const cages = detailQuery.data?.cages ?? [];
    const cageCodeMap = cageCodeMapQuery.data;
    if (!cageCodeMap) return cages;
    return cages.map((cage) => ({
      ...cage,
      cageCode: cage.cageCode ?? cageCodeMap.get(cage.projectCageId),
    }));
  }, [detailQuery.data?.cages, cageCodeMapQuery.data]);

  const selectedCageFromDetail = useMemo(() => {
    if (!selectedCageId) return null;
    return detailCages.find((cage) => cage.projectCageId === selectedCageId) ?? null;
  }, [detailCages, selectedCageId]);

  const selectedCageDailyRows = useMemo<DashboardCageDailyRow[]>(() => {
    if (!selectedCageFromDetail?.dailyRows) return [];
    return sortDailyRows(selectedCageFromDetail.dailyRows);
  }, [selectedCageFromDetail]);

  const yesterdayMissingAlert = useMemo(() => {
    if (selectedProjectSummaries.length === 0 || selectedProjectsSummaryQuery.isLoading || selectedProjectsSummaryQuery.isError) {
      return null;
    }

    if (!selectedProjectsSummaryQuery.data?.yesterdayEntryMissing) {
      return null;
    }

    const yesterday = selectedProjectsSummaryQuery.data?.yesterdayDate
      ? new Date(selectedProjectsSummaryQuery.data.yesterdayDate)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() - 1);
          return date;
        })();

    return {
      title: t('aquaDashboard.yesterdayAlert.title', { ns: 'dashboard' }),
      description: t('aquaDashboard.yesterdayAlert.description', {
        ns: 'dashboard',
        date: formatAlertDate(yesterday, i18n.language || 'tr-TR'),
      }),
    };
  }, [i18n.language, selectedProjectSummaries.length, selectedProjectsSummaryQuery.data, selectedProjectsSummaryQuery.isError, selectedProjectsSummaryQuery.isLoading, t]);

  const maxDeadInCage = useMemo(() => {
    if (selectedCageDailyRows.length === 0) return 0;
    return Math.max(...selectedCageDailyRows.map((row) => row.deadCount));
  }, [selectedCageDailyRows]);

  const openProjectDetail = useCallback((projectId: number, cageId?: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(cageId ?? null);
    setIsProjectDialogOpen(true);
  }, []);

  const openCageDailyDialog = useCallback((projectCageId: number): void => {
    setSelectedCageId(projectCageId);
    setIsDailyDialogOpen(true);
  }, []);

  const openDailyFromProjectList = useCallback((projectId: number, projectCageId: number): void => {
    setSelectedProjectId(projectId);
    setSelectedCageId(projectCageId);
    setIsProjectDialogOpen(false);
    setIsDailyDialogOpen(true);
  }, []);

  const navigateToQuickEntry = useCallback((projectId: number, projectCageId: number): void => {
    navigate(`/aqua/operations/quick-daily-entry?projectId=${projectId}&projectCageId=${projectCageId}`);
  }, [navigate]);

  const openCagePeek = useCallback((cage: DashboardCageSummary): void => {
    setPeekCage(cage);
  }, []);

  const closeCagePeek = useCallback((): void => {
    setPeekCage(null);
  }, []);

  const closeProjectDialog = useCallback((open: boolean): void => {
    setIsProjectDialogOpen(open);
    if (!open) {
      setSelectedCageId(null);
    }
  }, []);

  const closeDailyDialog = useCallback((open: boolean): void => {
    setIsDailyDialogOpen(open);
    if (!open) {
      setDetailDialog((prev) => ({ ...prev, open: false }));
    }
  }, []);

  const openProjectSelector = useCallback((): void => {
    setDraftProjectIds(safeActiveDashboardProjectIds);
    setProjectSearch('');
    setIsProjectSelectorOpen(true);
  }, [safeActiveDashboardProjectIds]);

  const closeProjectSelector = useCallback((open: boolean): void => {
    setIsProjectSelectorOpen(open);
    if (!open) {
      setDraftProjectIds(safeActiveDashboardProjectIds);
      setProjectSearch('');
    }
  }, [safeActiveDashboardProjectIds]);

  const toggleDraftProjectSelection = useCallback((projectId: number): void => {
    setDraftProjectIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(projectId) ? safePrev.filter((id) => id !== projectId) : [...safePrev, projectId];
    });
  }, []);

  const applyProjectSelection = useCallback((): void => {
    setIsApplyingProjectSelection(true);
    setActiveDashboardProjectIds(safeDraftProjectIds);
    setIsProjectSelectorOpen(false);
    setProjectSearch('');
  }, [safeDraftProjectIds]);

  const removeSelectedProject = useCallback((projectId: number): void => {
    setActiveDashboardProjectIds((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter((id) => id !== projectId);
    });
  }, []);

  const toggleCageGroupingMode = useCallback((): void => {
    if (cageGroupingMode === 'byProject') {
      setActiveDashboardProjectIds(projectOptions.map((p) => p.projectId));
      setCageGroupingMode('byCage');
    } else {
      setCageGroupingMode('byProject');
    }
  }, [cageGroupingMode, projectOptions]);

  const openDetailDialog = useCallback(
    (cage: { cageLabel: string }, type: DetailType): ((date: string, items: string[]) => void) => {
      const titleMap: Record<DetailType, string> = {
        feeding: t('aquaDashboard.detailTypes.feeding', { ns: 'dashboard' }),
        netOperation: t('aquaDashboard.detailTypes.netOperation', { ns: 'dashboard' }),
        transfer: t('aquaDashboard.detailTypes.transfer', { ns: 'dashboard' }),
        stockConvert: t('aquaDashboard.detailTypes.stockConvert', { ns: 'dashboard' }),
        shipment: t('aquaDashboard.detailTypes.shipment', { ns: 'dashboard' }),
      };

      return (date: string, items: string[]) => {
        if (items.length === 0) return;
        setDetailDialog({
          open: true,
          title: `${titleMap[type]} - ${cage.cageLabel}`,
          description: t('aquaDashboard.detailDialog.date', { ns: 'dashboard', date }),
          items,
          type,
        });
      };
    },
    [t]
  );

  if (projectsQuery.isLoading) {
    return <PageLoader />;
  }

  return (
    <LayoutGroup>
      <div className={cn('relative space-y-6 sm:space-y-8 pb-10 animate-in fade-in duration-500', perfLiteClass)}>
      {isApplyingProjectSelection && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/25 bg-slate-950/90 px-4 py-2 text-sm font-bold text-cyan-100 shadow-[0_12px_40px_rgba(6,182,212,0.22)] backdrop-blur-sm">
            <LoaderCircle className="size-4 animate-spin text-cyan-300" />
            <span>{t('aquaDashboard.projectSelector.loadingApply', { ns: 'dashboard' })}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:gap-5 px-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-500/20 shrink-0">
                <Droplets className="size-6" />
              </div>
              <span className="truncate">{t('aquaDashboard.title', { ns: 'dashboard' })}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium ml-1">
              {t('aquaDashboard.description', { ns: 'dashboard' })}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 w-full lg:w-auto lg:self-auto">
            <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:gap-2 w-full sm:w-auto">
              <div className="relative flex bg-slate-200/60 dark:bg-blue-950 p-1 rounded-2xl border border-slate-200 dark:border-cyan-800/50 h-11 items-center overflow-hidden w-full min-[480px]:min-w-[220px] min-[480px]:w-auto shrink-0">
                <div
                  className={cn(
                    'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white dark:bg-cyan-500 shadow-sm transition-[left,box-shadow] duration-300',
                    viewMode === 'card' ? 'left-1' : 'left-[calc(50%+3px)]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={cn(
                    'relative z-10 flex-1 h-full rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors duration-200 min-w-0',
                    viewMode === 'card'
                      ? 'text-cyan-600 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-cyan-300'
                  )}
                >
                  <LayoutGrid size={14} />
                  <span className="truncate">{t('aquaDashboard.controls.cardView', { ns: 'dashboard' })}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'relative z-10 flex-1 h-full rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors duration-200 min-w-0',
                    viewMode === 'list'
                      ? 'text-cyan-600 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-cyan-300'
                  )}
                >
                  <List size={14} />
                  <span className="truncate">{t('aquaDashboard.controls.listView', { ns: 'dashboard' })}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={toggleCageGroupingMode}
                title={t('aquaDashboard.controls.cageSortToggleHint', { ns: 'dashboard' })}
                className={cn(
                  'flex h-11 w-full min-[480px]:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-black transition-colors duration-200',
                  'shadow-sm backdrop-blur-sm',
                  cageGroupingMode === 'byCage'
                    ? 'border-cyan-400/60 bg-linear-to-r from-cyan-500/20 via-pink-500/15 to-blue-500/20 text-cyan-800 ring-2 ring-cyan-400/35 dark:border-cyan-400/45 dark:from-cyan-500/25 dark:via-pink-500/20 dark:to-blue-500/25 dark:text-white dark:ring-cyan-400/25'
                    : 'border-slate-200 bg-white/85 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/80 hover:text-cyan-800 dark:border-cyan-800/45 dark:bg-blue-950/55 dark:text-slate-300 dark:hover:border-cyan-600/50 dark:hover:bg-cyan-950/40 dark:hover:text-white'
                )}
              >
                <Boxes className="size-4 shrink-0" strokeWidth={2.25} />
                <span className="truncate">{t('aquaDashboard.controls.cageSortToggle', { ns: 'dashboard' })}</span>
                {cageGroupingMode === 'byCage' ? (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md dark:bg-cyan-400 dark:text-slate-950">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={openProjectSelector}
              className="h-11 rounded-2xl px-4 sm:px-5 bg-white/90 dark:bg-blue-950/70 backdrop-blur-sm border-slate-200 dark:border-cyan-800/50 shadow-sm transition-shadow hover:shadow-lg dark:hover:border-cyan-600 w-full sm:w-auto justify-center"
            >
              <Filter className="size-4 mr-2 shrink-0" />
              <span className="truncate">{t('aquaDashboard.projectSelector.openButton', { ns: 'dashboard' })}</span>
              <span className="ml-2 inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 text-[11px] font-black px-1.5 shrink-0">
                {safeActiveDashboardProjectIds.length}
              </span>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm dark:border-cyan-800/45 dark:bg-blue-950/55 dark:shadow-[0_8px_30px_rgba(0,0,0,0.28)] dark:ring-cyan-500/[0.06] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <div className="shrink-0 rounded-xl border border-pink-400/40 bg-pink-500/12 p-2 text-pink-600 dark:border-pink-400/35 dark:bg-pink-500/15 dark:text-pink-300">
                  <Sparkles className="size-4" />
                </div>
                <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  {t('aquaDashboard.activeProjectFilters.title', { ns: 'dashboard' })}
                </p>
              </div>
              <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                {t('aquaDashboard.activeProjectFilters.description', { ns: 'dashboard' })}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDashboardProjectIds(projectOptions.map((summary) => summary.projectId))}
                className="h-9 rounded-xl border-cyan-200 bg-cyan-50/90 px-3 text-[11px] font-black text-cyan-700 shadow-sm hover:bg-cyan-100 dark:border-cyan-700/50 dark:bg-cyan-950/50 dark:text-cyan-200 dark:hover:bg-cyan-900/40"
              >
                {t('aquaDashboard.controls.selectAll', { ns: 'dashboard' })}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDashboardProjectIds([])}
                className="h-9 rounded-xl border-rose-200 bg-rose-50/90 px-3 text-[11px] font-black text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/35"
              >
                {t('aquaDashboard.controls.clear', { ns: 'dashboard' })}
              </Button>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-2.5 sm:p-3 dark:border-cyan-900/35 dark:bg-black/20">
            {selectedProjectSummaries.length > 0 ? (
              <ul
                className={cn(
                  'grid w-full gap-2',
                  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 min-[1600px]:grid-cols-10'
                )}
              >
                {selectedProjectSummaries.map((project) => (
                  <li key={project.projectId} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => removeSelectedProject(project.projectId)}
                      title={`${project.projectCode} — ${project.projectName}`}
                      className={cn(
                        'flex h-9 w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-full border px-2 text-left shadow-sm transition-all',
                        'border-cyan-200/70 bg-linear-to-r from-sky-100/70 via-cyan-50/85 to-blue-100/65 text-slate-800',
                        'dark:border-cyan-700/45 dark:bg-linear-to-r dark:from-cyan-950/55 dark:via-slate-900 dark:to-blue-950/50 dark:text-slate-100',
                        'hover:border-cyan-400 hover:from-sky-100 hover:via-cyan-100/90 hover:to-sky-100/80 hover:shadow-md hover:ring-2 hover:ring-cyan-400/30',
                        'dark:hover:border-cyan-500/55 dark:hover:from-cyan-900/40 dark:hover:via-cyan-950/50 dark:hover:to-blue-950/60 dark:hover:ring-cyan-400/25'
                      )}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_0_2px_rgba(6,182,212,0.2)] dark:bg-cyan-400 dark:shadow-[0_0_0_2px_rgba(34,211,238,0.15)]" aria-hidden />
                      <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-pink-600 dark:text-pink-300">
                        {project.projectCode}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-none text-slate-700 dark:text-slate-200">
                        {project.projectName}
                      </span>
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-rose-500/15 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-300">
                        <X className="size-3" strokeWidth={2.5} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:border-cyan-800/40 dark:bg-slate-900/30 dark:text-slate-400">
                <Info className="size-4 shrink-0 text-slate-400 dark:text-cyan-500/70" />
                {t('aquaDashboard.selectProjectHint', { ns: 'dashboard' })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeProjects.length > 0 && yesterdayMissingAlert ? (
          <Card className="border-amber-200 bg-linear-to-r from-amber-50 via-white to-rose-50 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-blue-950/50 dark:to-rose-950/20 shadow-sm">
            <CardContent className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-300">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-amber-800 dark:text-amber-200">
                    {yesterdayMissingAlert.title}
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    {yesterdayMissingAlert.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        
      </div>

      <div className="space-y-6 pt-2 sm:pt-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-1 flex items-center gap-2">
          <Layers className="size-5 text-pink-500 shrink-0" />
          {t('aquaDashboard.selectedProjects', { ns: 'dashboard' })}
        </h2>

        {projectsQuery.isError || selectedProjectsSummaryQuery.isError ? (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 rounded-3xl">
            <CardContent className="py-12 text-sm font-bold text-rose-600 dark:text-rose-400 text-center flex items-center justify-center gap-2">
              <Info className="size-5" /> {t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}
            </CardContent>
          </Card>
        ) : selectedProjectsSummaryQuery.isLoading && safeActiveDashboardProjectIds.length > 0 ? (
          <PageLoader />
        ) : activeProjects.length > 0 ? (
          cageGroupingMode === 'byCage' ? (
            <GlobalCageSortSection
              rows={globalCageRows}
              viewMode={viewMode}
              showProjectBadge={showFloatingProjectOnCages}
              projectCount={activeProjects.length}
              t={t}
              onOpenDaily={openDailyFromProjectList}
              onQuickEntry={navigateToQuickEntry}
              onPeekOpen={openCagePeek}
            />
          ) : (
            activeProjects.map((project) => (
            <Card
              key={project.projectId}
              className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_36px_rgba(0,0,0,0.1)] dark:border-cyan-800/25 dark:bg-[#080f1e] dark:shadow-[0_4px_32px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]"
            >
              {/* Gradient accent bar */}
              <div className="h-1 w-full bg-[linear-gradient(90deg,#ec4899_0%,#a855f7_30%,#06b6d4_65%,#3b82f6_100%)] opacity-90" />

              <CardHeader className="border-b border-slate-100/80 bg-white px-5 py-5 sm:px-7 dark:border-cyan-900/30 dark:bg-[#0b1527]">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                  {/* LEFT — project identity + quick stats */}
                  <div className="min-w-0 flex-1">

                    {/* Project title */}
                    <div
                      className="group flex cursor-pointer items-center gap-3"
                      onClick={() => openProjectDetail(project.projectId)}
                    >
                      {/* Simple icon — no ping, no glow */}
                      <div className="shrink-0 flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-cyan-800/40 dark:bg-cyan-950/40">
                        <Waves className="size-4.5 text-pink-500 dark:text-pink-400" />
                      </div>

                      {/* Code badge + name */}
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <span className="inline-block w-fit rounded border border-pink-400/25 bg-pink-500/8 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 dark:border-pink-400/20 dark:text-pink-400">
                          {project.projectCode}
                        </span>
                        <h3 className="truncate text-xl font-black leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300 sm:text-2xl">
                          {project.projectName}
                        </h3>
                      </div>
                    </div>

                    {/* Quick count pills */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {[
                        { icon: <Waves className="size-3" />, value: formatNumber(project.activeCageCount), label: t('aquaDashboard.projectSummary.activeCage', { ns: 'dashboard' }), color: 'bg-cyan-500/10 text-cyan-700 border-cyan-400/20 dark:text-cyan-300 dark:border-cyan-500/20 dark:bg-cyan-500/10' },
                        { icon: <Fish className="size-3" />, value: formatNumber(project.cageFish), label: t('aquaDashboard.projectSummary.cageFish', { ns: 'dashboard' }), color: 'bg-emerald-500/10 text-emerald-700 border-emerald-400/20 dark:text-emerald-300 dark:border-emerald-500/20 dark:bg-emerald-500/10' },
                        { icon: <Package className="size-3" />, value: formatNumber(project.warehouseFish), label: t('aquaDashboard.projectSummary.warehouseFish', { ns: 'dashboard' }), color: 'bg-violet-500/10 text-violet-700 border-violet-400/20 dark:text-violet-300 dark:border-violet-500/20 dark:bg-violet-500/10' },
                        { icon: <Layers className="size-3" />, value: formatNumber(project.totalSystemFish), label: t('aquaDashboard.projectSummary.totalFish', { ns: 'dashboard' }), color: 'bg-blue-500/10 text-blue-700 border-blue-400/20 dark:text-blue-300 dark:border-blue-500/20 dark:bg-blue-500/10' },
                      ].map((item) => (
                        <div key={item.label} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold', item.color)}>
                          {item.icon}
                          <span className="tabular-nums">{item.value}</span>
                          <span className="font-medium opacity-70">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* KPI stat cards grid */}
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                      {[
                        {
                          label: t('aquaDashboard.projectSummary.totalDeadCount', { ns: 'dashboard' }),
                          value: formatNumber(project.totalDeadCount),
                          unit: '',
                          icon: <Skull className="size-3.5" />,
                          palette: { border: 'border-rose-500/20', bg: 'bg-[linear-gradient(145deg,rgba(190,18,60,0.12),rgba(15,23,42,0.0))]', label: 'text-rose-400', value: 'text-rose-600 dark:text-rose-300', shimmer: 'from-rose-500/0 via-rose-400/35 to-rose-500/0', dot: 'bg-rose-500' },
                        },
                        {
                          label: t('aquaDashboard.projectSummary.totalDeadKg', { ns: 'dashboard' }),
                          value: `${formatNumber(toKg(project.totalDeadBiomassGram))} kg`,
                          unit: '',
                          icon: <Skull className="size-3.5" />,
                          palette: { border: 'border-rose-500/20', bg: 'bg-[linear-gradient(145deg,rgba(190,18,60,0.10),rgba(15,23,42,0.0))]', label: 'text-rose-400', value: 'text-rose-600 dark:text-rose-300', shimmer: 'from-rose-500/0 via-rose-400/30 to-rose-500/0', dot: 'bg-rose-500' },
                        },
                        {
                          label: t('aquaDashboard.projectSummary.totalShipmentCount', { ns: 'dashboard' }),
                          value: formatNumber(project.totalShipmentCount),
                          unit: '',
                          icon: <Truck className="size-3.5" />,
                          palette: { border: 'border-amber-500/20', bg: 'bg-[linear-gradient(145deg,rgba(180,83,9,0.12),rgba(15,23,42,0.0))]', label: 'text-amber-400', value: 'text-amber-600 dark:text-amber-300', shimmer: 'from-amber-500/0 via-amber-400/35 to-amber-500/0', dot: 'bg-amber-400' },
                        },
                        {
                          label: t('aquaDashboard.projectSummary.totalShipmentKg', { ns: 'dashboard' }),
                          value: `${formatNumber(toKg(project.totalShipmentBiomassGram))} kg`,
                          unit: '',
                          icon: <Truck className="size-3.5" />,
                          palette: { border: 'border-amber-500/20', bg: 'bg-[linear-gradient(145deg,rgba(180,83,9,0.10),rgba(15,23,42,0.0))]', label: 'text-amber-400', value: 'text-amber-600 dark:text-amber-300', shimmer: 'from-amber-500/0 via-amber-400/30 to-amber-500/0', dot: 'bg-amber-400' },
                        },
                        {
                          label: t('aquaDashboard.projectSummary.measurementGram', { ns: 'dashboard' }),
                          value: `${formatNumber(project.measurementAverageGram)} g`,
                          unit: '',
                          icon: <Droplets className="size-3.5" />,
                          palette: { border: 'border-cyan-500/20', bg: 'bg-[linear-gradient(145deg,rgba(6,182,212,0.12),rgba(15,23,42,0.0))]', label: 'text-cyan-400', value: 'text-cyan-600 dark:text-cyan-300', shimmer: 'from-cyan-500/0 via-cyan-400/35 to-cyan-500/0', dot: 'bg-cyan-400' },
                        },
                        {
                          label: t('aquaDashboard.projectSummary.fcr', { ns: 'dashboard' }),
                          value: project.fcr != null ? formatNumber(project.fcr) : '—',
                          unit: '',
                          icon: <TrendingUp className="size-3.5" />,
                          palette: { border: 'border-blue-500/20', bg: 'bg-[linear-gradient(145deg,rgba(59,130,246,0.12),rgba(15,23,42,0.0))]', label: 'text-blue-400', value: 'text-blue-600 dark:text-blue-300', shimmer: 'from-blue-500/0 via-blue-400/35 to-blue-500/0', dot: 'bg-blue-400' },
                        },
                      ].map((stat) => (
                        <button
                          key={stat.label}
                          type="button"
                          onClick={() => openProjectDetail(project.projectId)}
                          className={cn(
                            'group/stat relative overflow-hidden rounded-2xl border px-3 py-2.5 text-left transition-all',
                            'hover:scale-[1.025] hover:shadow-md active:scale-[0.98]',
                            stat.palette.border,
                            stat.palette.bg,
                            'dark:hover:brightness-125'
                          )}
                        >
                          {/* shimmer line top */}
                          <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r', stat.palette.shimmer)} />
                          <div className={cn('mb-1.5 flex items-center gap-1.5', stat.palette.label)}>
                            {stat.icon}
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                              {stat.label}
                            </span>
                          </div>
                          <p className={cn('text-[15px] font-black tabular-nums leading-none', stat.palette.value)}>
                            {stat.value}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT — CTA button */}
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      className="aqua-cta h-10 rounded-xl border-0 px-5 text-sm font-black text-white transition-transform hover:scale-[1.04] active:scale-[0.98] sm:px-6 gap-2 justify-center w-full sm:w-auto"
                      onClick={() => openProjectDetail(project.projectId)}
                    >
                      <BarChart3 className="aqua-cta-icon size-4 shrink-0" />
                      <span className="truncate">{t('aquaDashboard.detailReportButton', { ns: 'dashboard' })}</span>
                      <ArrowRight className="aqua-cta-arrow size-4 shrink-0" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 lg:p-6 bg-transparent">
                {viewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {project.cages.map((cage) => (
                      <ProjectCageCard
                        key={cage.projectCageId}
                        cage={cage}
                        projectId={project.projectId}
                        projectCode={project.projectCode}
                        projectName={project.projectName}
                        showProjectBadge={false}
                        t={t}
                        onOpenDaily={openDailyFromProjectList}
                        onQuickEntry={navigateToQuickEntry}
                        onPeekOpen={openCagePeek}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar border border-slate-100 dark:border-cyan-800/30 rounded-3xl bg-white dark:bg-blue-950/20">
                    <table className="w-full min-w-[1100px] text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-blue-900/40 text-slate-500 dark:text-cyan-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-cyan-800/30">
                        <tr>
                          <th className="px-5 py-4 whitespace-nowrap">{t('aquaDashboard.listTable.cage', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.fish', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center text-rose-500 whitespace-nowrap">{t('aquaDashboard.listTable.dead', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center text-amber-500 whitespace-nowrap">{t('aquaDashboard.listTable.shipment', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center text-blue-500 whitespace-nowrap">{t('aquaDashboard.listTable.stockKg', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.measurementGram', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.feedKg', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.fcr', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-center whitespace-nowrap">{t('aquaDashboard.listTable.survivalRate', { ns: 'dashboard' })}</th>
                          <th className="px-5 py-4 text-right whitespace-nowrap">{t('aquaDashboard.listTable.action', { ns: 'dashboard' })}</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-cyan-800/20">
                        {project.cages.map((cage) => {
                          const totalInitial = cage.currentFishCount + cage.totalDeadCount;
                          const survivalRate = totalInitial > 0 ? (cage.currentFishCount / totalInitial) * 100 : 100;
                          const isCritical = survivalRate < 80;

                          return (
                            <tr
                              key={cage.projectCageId}
                              className={cn(
                                'hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer',
                                isCritical && 'bg-rose-50/40 dark:bg-rose-500/4'
                              )}
                              onClick={() => openDailyFromProjectList(project.projectId, cage.projectCageId)}
                            >
                              <td className="px-5 py-3 font-extrabold text-slate-900 dark:text-white" title={cage.cageLabel}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      'p-1.5 rounded-xl',
                                      isCritical ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-cyan-100 dark:bg-cyan-900/50'
                                    )}
                                  >
                                    <Waves size={14} className={cn(isCritical ? 'text-rose-500' : 'text-cyan-600 dark:text-cyan-400')} />
                                  </div>
                                  <span className="truncate">{cage.cageLabel}</span>
                                </div>
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatNumber(cage.currentFishCount)}
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                {formatNumber(cage.totalDeadCount)}
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                {formatNumber(cage.totalShipmentCount)}
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                {formatNumber(toKg(cage.currentBiomassGram))}
                                <span className="text-[10px] ml-0.5">kg</span>
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
                                {formatNumber(cage.measurementAverageGram)}
                                <span className="text-[10px] ml-0.5">g</span>
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-amber-600 dark:text-amber-300 tabular-nums">
                                {formatNumber(toKg(cage.totalFeedGram))}
                                <span className="text-[10px] ml-0.5">kg</span>
                              </td>

                              <td className="px-5 py-3 text-center font-bold text-sky-600 dark:text-sky-300 tabular-nums">
                                {cage.fcr != null ? formatNumber(cage.fcr) : '-'}
                              </td>

                              <td className="px-5 py-3 text-center">
                                <span
                                  className={cn(
                                    'font-black text-[11px] px-2.5 py-1.5 rounded-xl border',
                                    survivalRate < 80
                                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                                      : survivalRate < 95
                                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                                  )}
                                >
                                  %{survivalRate.toFixed(1)}
                                </span>
                              </td>

                              <td className="px-5 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-4 text-xs font-black text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  {t('aquaDashboard.listTable.dailyFlowButton', { ns: 'dashboard' })}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            ))
          )
        ) : (
          <Card className="bg-white border-slate-200 dark:border-cyan-800/20 dark:bg-blue-950/50 dark:backdrop-blur-sm rounded-3xl">
            <CardContent className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
              <Activity className="size-16 mx-auto mb-4 text-slate-300 dark:text-cyan-900/50" />
              {t('aquaDashboard.selectProjectHint', { ns: 'dashboard' })}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={isProjectSelectorOpen} onOpenChange={closeProjectSelector}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[520px] border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950 p-0"
        >
          <SheetHeader className="px-4 sm:px-6 py-5 sm:py-6 border-b border-slate-100 dark:border-cyan-800/20 bg-linear-to-br from-slate-50 via-white to-cyan-50/40 dark:from-blue-950 dark:via-blue-950 dark:to-cyan-950/30 text-left">
            <div className="flex items-start gap-3 pr-8">
              <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/15 shrink-0">
                <Sparkles className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white wrap-break-word leading-tight">
                  {t('aquaDashboard.projectSelector.title', { ns: 'dashboard' })}
                </SheetTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 wrap-break-word">
                  {t('aquaDashboard.projectSelector.description', { ns: 'dashboard' })}
                </p>
              </div>
            </div>

            <div className="mt-4 relative">
              <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder={t('aquaDashboard.projectSelector.searchPlaceholder', { ns: 'dashboard' })}
                className="h-11 rounded-2xl pl-11 pr-4 bg-white dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDraftProjectIds(projectOptions.map((summary) => summary.projectId))}
                className="h-9 rounded-xl px-3 text-[11px] font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30"
              >
                {t('aquaDashboard.controls.selectAll', { ns: 'dashboard' })}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setDraftProjectIds([])}
                className="h-9 rounded-xl px-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              >
                {t('aquaDashboard.controls.clear', { ns: 'dashboard' })}
              </Button>

              <div className="w-full sm:w-auto sm:ml-auto inline-flex items-center gap-2 px-3 h-9 rounded-xl bg-slate-100 dark:bg-blue-900/30 border border-slate-200 dark:border-cyan-800/30 text-[11px] font-black text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Check className="size-3" />
                  {t('aquaDashboard.projectSelector.selectedCount', {
                    ns: 'dashboard',
                    count: draftProjectIds.length,
                  })}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {draftSelectedProjectSummaries.length > 0 ? (
                <>
                  {draftSelectedProjectSummaries.slice(0, 3).map((project) => (
                    <button
                      key={project.projectId}
                      type="button"
                      onClick={() => toggleDraftProjectSelection(project.projectId)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/10 dark:bg-pink-500/15 border border-pink-500/15 text-pink-700 dark:text-pink-300 text-[11px] font-black max-w-[110px]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                      <span className="truncate">{project.projectCode}</span>
                      <X className="size-3.5 shrink-0" />
                    </button>
                  ))}

                  {draftSelectedProjectSummaries.length > 3 && (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[11px] font-black">
                      +{draftSelectedProjectSummaries.length - 3}
                    </div>
                  )}
                </>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-blue-900/30 border border-slate-200 dark:border-cyan-800/40 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                  <Info className="size-3.5 shrink-0" />
                  {t('aquaDashboard.projectSelector.emptySelection', { ns: 'dashboard' })}
                </div>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[calc(100dvh-240px)]">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const isActive = safeDraftProjectIds.includes(project.projectId);

                return (
                  <button
                    key={project.projectId}
                    type="button"
                    onClick={() => toggleDraftProjectSelection(project.projectId)}
                    className={cn(
                      'w-full text-left rounded-3xl border p-4 transition-all group',
                      isActive
                        ? 'border-pink-400/60 bg-linear-to-r from-pink-500/10 via-white to-cyan-500/5 dark:from-pink-500/15 dark:via-blue-950 dark:to-cyan-500/10 shadow-[0_10px_30px_rgba(236,72,153,0.10)]'
                        : 'border-slate-200 dark:border-cyan-800/30 bg-slate-50/60 dark:bg-blue-950/30 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-white dark:hover:bg-blue-900/30'
                    )}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={cn(
                          'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border transition-all',
                          isActive
                            ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20'
                            : 'bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400'
                        )}
                      >
                        {isActive ? <Check className="size-4" strokeWidth={3} /> : <Layers className="size-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-cyan-600 mb-1">
                              {project.projectCode}
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 wrap-break-word">
                              {project.projectName}
                            </p>
                          </div>

                          {isActive && (
                            <Badge className="shrink-0 rounded-xl px-2 py-1 bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 border border-pink-500/15 font-black text-[10px]">
                              {t('aquaDashboard.projectSelector.activeBadge', { ns: 'dashboard' })}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50/60 dark:bg-blue-950/30 p-8 text-center">
                <Info className="size-10 mx-auto mb-4 text-slate-300 dark:text-cyan-900/60" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  {t('aquaDashboard.projectSelector.noResults', { ns: 'dashboard' })}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-cyan-800/20 bg-white dark:bg-blue-950 px-4 sm:px-6 py-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraftProjectIds(safeActiveDashboardProjectIds);
                setIsProjectSelectorOpen(false);
                setProjectSearch('');
              }}
              className="h-11 rounded-2xl px-5 w-full sm:w-auto"
            >
             {t('aqua.common.cancel', { ns: 'common' })}
            </Button>

            <Button
              type="button"
              onClick={applyProjectSelection}
              disabled={safeDraftProjectIds.length === 0 || isApplyingProjectSelection}
              className="h-11 rounded-2xl px-6 bg-linear-to-r from-pink-600 to-orange-600 text-white font-black shadow-lg shadow-pink-500/20 w-full sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                {isApplyingProjectSelection && <LoaderCircle className="size-4 animate-spin" />}
                {t('aquaDashboard.projectSelector.apply', { ns: 'dashboard' })}
              </span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isProjectDialogOpen} onOpenChange={closeProjectDialog} modal={peekCage == null}>
        <DialogContent className="!flex max-h-[92dvh] min-h-0 min-w-0 w-[calc(100vw-1rem)] !max-w-none flex-col overflow-hidden rounded-[24px] border-slate-200 bg-white p-0 shadow-2xl outline-none dark:border-cyan-800/30 dark:bg-[#07101e] sm:!w-[min(1320px,calc(100vw-2rem))] sm:!max-w-[min(1320px,calc(100vw-2rem))] md:!w-[min(1400px,calc(100vw-2.5rem))] md:!max-w-[min(1400px,calc(100vw-2.5rem))] lg:!w-[min(1480px,calc(100vw-3rem))] lg:!max-w-[min(1480px,calc(100vw-3rem))] sm:rounded-[28px]">

          {/* ── Dialog header ──────────────────────────────────────── */}
          <DialogHeader className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 text-center dark:border-cyan-900/30 dark:bg-[#0b1527] sm:px-7 sm:py-5">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-pink-400/25 dark:bg-pink-500/10">
                <BarChart3 className="size-[1.15rem] text-pink-500 dark:text-pink-400" />
              </div>
              <DialogTitle className="max-w-full wrap-break-word hyphens-auto break-words px-2 text-center text-lg font-black leading-snug tracking-tight text-slate-900 [overflow-wrap:anywhere] line-clamp-4 dark:text-white sm:text-2xl">
                {selectedProjectHeaderLabel}
              </DialogTitle>
              <p className="text-center text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400">
                {t('aquaDashboard.projectDialog.subtitle', { ns: 'dashboard' })}
              </p>
            </div>
          </DialogHeader>

          {/* ── Scrollable body ────────────────────────────────────── */}
          <div className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar sm:space-y-6 sm:p-6">

            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {[
                {
                  label: t('aquaDashboard.projectDialog.fish', { ns: 'dashboard' }),
                  value: formatNumber(detailCages.reduce((acc, c) => acc + c.currentFishCount, 0)),
                  icon: <Fish className="size-4" />,
                  palette: {
                    card: 'border-emerald-400/18 bg-[linear-gradient(145deg,rgba(16,185,129,0.08),rgba(5,150,105,0.03))] dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.07),transparent)]',
                    label: 'text-emerald-600 dark:text-emerald-400',
                    value: 'text-emerald-700 dark:text-emerald-300',
                    glow: 'shadow-[0_0_28px_rgba(16,185,129,0.07)] dark:shadow-[0_0_32px_rgba(52,211,153,0.06)]',
                    shimmer: 'bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent',
                  },
                },
                {
                  label: t('aquaDashboard.projectDialog.dead', { ns: 'dashboard' }),
                  value: formatNumber(detailCages.reduce((acc, c) => acc + c.totalDeadCount, 0)),
                  icon: <Skull className="size-4" />,
                  palette: {
                    card: 'border-rose-400/18 bg-[linear-gradient(145deg,rgba(244,63,94,0.08),rgba(190,18,60,0.03))] dark:bg-[linear-gradient(145deg,rgba(244,63,94,0.07),transparent)]',
                    label: 'text-rose-600 dark:text-rose-400',
                    value: 'text-rose-700 dark:text-rose-300',
                    glow: 'shadow-[0_0_28px_rgba(244,63,94,0.07)] dark:shadow-[0_0_32px_rgba(251,113,133,0.06)]',
                    shimmer: 'bg-gradient-to-r from-transparent via-rose-400/35 to-transparent',
                  },
                },
                {
                  label: t('aquaDashboard.projectDialog.feedGram', { ns: 'dashboard' }),
                  value: `${formatNumber(toKg(detailCages.reduce((acc, c) => acc + c.totalFeedGram, 0)))} kg`,
                  icon: <UtensilsCrossed className="size-4" />,
                  palette: {
                    card: 'border-amber-400/18 bg-[linear-gradient(145deg,rgba(245,158,11,0.08),rgba(180,83,9,0.03))] dark:bg-[linear-gradient(145deg,rgba(245,158,11,0.07),transparent)]',
                    label: 'text-amber-600 dark:text-amber-400',
                    value: 'text-amber-700 dark:text-amber-300',
                    glow: 'shadow-[0_0_28px_rgba(245,158,11,0.07)] dark:shadow-[0_0_32px_rgba(251,191,36,0.06)]',
                    shimmer: 'bg-gradient-to-r from-transparent via-amber-400/35 to-transparent',
                  },
                },
                {
                  label: t('aquaDashboard.projectDialog.cages', { ns: 'dashboard' }),
                  value: formatNumber(detailCages.length),
                  icon: <Waves className="size-4" />,
                  palette: {
                    card: 'border-cyan-400/18 bg-[linear-gradient(145deg,rgba(6,182,212,0.08),rgba(8,145,178,0.03))] dark:bg-[linear-gradient(145deg,rgba(6,182,212,0.07),transparent)]',
                    label: 'text-cyan-600 dark:text-cyan-400',
                    value: 'text-cyan-700 dark:text-cyan-300',
                    glow: 'shadow-[0_0_28px_rgba(6,182,212,0.07)] dark:shadow-[0_0_32px_rgba(34,211,238,0.06)]',
                    shimmer: 'bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent',
                  },
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border p-3.5 sm:p-4',
                    stat.palette.card,
                    stat.palette.glow
                  )}
                >
                  <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-px', stat.palette.shimmer)} />
                  <div className={cn('mb-2 flex items-center justify-center gap-1.5 sm:justify-start', stat.palette.label)}>
                    {stat.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <p className={cn('text-center text-2xl font-black tabular-nums leading-none sm:text-left', stat.palette.value)}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Cage pools section */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10">
                  <Layers className="size-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  {t('aquaDashboard.projectDialog.cagePools', { ns: 'dashboard' })}
                </h3>
                <span className="rounded-lg border border-slate-200/80 bg-slate-100/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:border-cyan-800/30 dark:bg-cyan-900/20 dark:text-slate-400">
                  {t('aquaDashboard.projectDialog.clickForDailyDetail', { ns: 'dashboard' })}
                </span>
              </div>

              {detailQuery.isLoading ? (
                <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="mx-auto aspect-square w-[200px] max-w-full animate-pulse rounded-full border border-cyan-900/25 bg-slate-200/70 dark:bg-slate-800/50"
                    />
                  ))}
                </div>
              ) : detailCages.length > 0 ? (
                <div className="w-full min-w-0">
                  <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {detailCages.map((cage) => (
                      <DetailCageCard
                        key={cage.projectCageId}
                        cage={cage}
                        projectId={selectedProjectId}
                        isSelected={selectedCageId === cage.projectCageId}
                        onOpenDaily={openCageDailyDialog}
                        onQuickEntry={navigateToQuickEntry}
                        onPeekOpen={openCagePeek}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/60 py-16 dark:border-cyan-800/20 dark:bg-blue-950/30">
                  <Activity className="size-12 mb-3 text-slate-300 dark:text-cyan-900/50" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('aquaDashboard.dataLoadFailed', { ns: 'dashboard' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {(isDailyDialogOpen || detailDialog.open) && (
        <Suspense fallback={null}>
          <AquaDashboardDailyDialogs
            t={t}
            isDailyDialogOpen={isDailyDialogOpen}
            onDailyDialogChange={closeDailyDialog}
            detailQueryIsLoading={detailQuery.isLoading}
            detailQueryIsError={detailQuery.isError}
            selectedCage={selectedCageFromDetail}
            dailyRows={selectedCageDailyRows}
            maxDeadInCage={maxDeadInCage}
            detailDialog={detailDialog}
            onDetailDialogChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}
            onOpenDetail={(type, date, items) => {
              if (!selectedCageFromDetail) return;
              openDetailDialog(selectedCageFromDetail, type)(date, items);
            }}
          />
        </Suspense>
      )}

      <CagePeekOverlay cage={peekCage} onClose={closeCagePeek} t={t} />
      </div>
    </LayoutGroup>
  );
}
