import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse } from '@/types/api';
import { projectDetailReportApi } from './project-detail-report-api';
import type { ProjectDetailReport, ProjectDto } from '../types/project-detail-report-types';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
  totalCount?: number;
  TotalCount?: number;
}

interface ProjectCageRawDto {
  id: number;
  projectId: number;
  cageId: number;
  cageCode?: string;
  cageName?: string;
  assignedDate?: string | null;
}

interface CageDto {
  id: number;
  cageCode?: string;
  cageName?: string;
  capacityCount?: number | null;
  capacityGram?: number | null;
}

export interface KpiMetricDefinition {
  key: string;
  labelKey: string;
  descriptionKey: string;
  formulaKey: string;
}

export interface RawKpiRow {
  projectCageId: number;
  cageLabel: string;
  daysInSea: number;
  stockedFish: number;
  liveFish: number;
  deadFish: number;
  initialAverageGram: number;
  currentAverageGram: number;
  currentBiomassKg: number;
  totalFeedKg: number;
  biomassGainKg: number;
  survivalPct: number | null;
  mortalityPct: number | null;
  adgGramPerDay: number | null;
  sgrPctPerDay: number | null;
  fcr: number | null;
  densityPct: number | null;
  forecastBiomassKg30d: number;
}

export interface RawKpiReport {
  projectId: number;
  projectCode: string;
  projectName: string;
  daysInSea: number;
  stockedFish: number;
  liveFish: number;
  deadFish: number;
  initialAverageGram: number;
  currentAverageGram: number;
  currentBiomassKg: number;
  totalFeedKg: number;
  biomassGainKg: number;
  survivalPct: number | null;
  mortalityPct: number | null;
  adgGramPerDay: number | null;
  sgrPctPerDay: number | null;
  fcr: number | null;
  densityPct: number | null;
  forecastBiomassKg30d: number;
  rows: RawKpiRow[];
  metricDefinitions: KpiMetricDefinition[];
}

export interface BusinessKpiRow {
  projectCageId: number;
  cageLabel: string;
  targetWeightProgressPct: number;
  daysToTarget: number | null;
  estimatedHarvestDate: string | null;
  forecastConfidencePct: number;
  harvestReadinessPct: number;
  estimatedFeedCost: number;
  feedCostPerCurrentKg: number | null;
  projectedHarvestBiomassKg: number;
  projectedRevenue: number;
  projectedGrossMargin: number;
  projectedMarginPct: number | null;
}

export interface BusinessKpiReport {
  projectId: number;
  projectCode: string;
  projectName: string;
  estimatedFeedCost: number;
  feedCostPerCurrentKg: number | null;
  projectedHarvestBiomassKg: number;
  projectedRevenue: number;
  projectedGrossMargin: number;
  projectedMarginPct: number | null;
  targetWeightProgressPct: number;
  daysToTarget: number | null;
  estimatedHarvestDate: string | null;
  forecastConfidencePct: number;
  harvestReadinessPct: number;
  assumptions: {
    forecastDays: number;
    targetHarvestGram: number;
    feedCostPerKg: number;
    salePricePerKg: number;
  };
  rows: BusinessKpiRow[];
  metricDefinitions: KpiMetricDefinition[];
}

const PAGE_SIZE = 500;
const MAX_PAGE_GUARD = 100;
const FORECAST_DAYS = 30;
const DEFAULT_TARGET_HARVEST_GRAM = 400;
const DEFAULT_FEED_COST_PER_KG = 0;
const DEFAULT_SALE_PRICE_PER_KG = 0;

function ensureSuccess<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) {
    throw new Error(response.message || fallback);
  }
  return response.data;
}

function extractPagedItems<T>(raw: PagedResultRaw<T>): T[] {
  return raw.items ?? raw.Items ?? raw.data ?? raw.Data ?? [];
}

function extractTotalCount<T>(raw: PagedResultRaw<T>, fallbackCount: number): number {
  return raw.totalCount ?? raw.TotalCount ?? fallbackCount;
}

function buildPagedQuery(pageNumber: number, filters?: Array<{ column: string; operator: string; value: string }>): string {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(PAGE_SIZE),
    sortBy: 'Id',
    sortDirection: 'asc',
  });

  if (filters && filters.length > 0) {
    query.append('filters', JSON.stringify(filters));
    query.append('filterLogic', 'and');
  }

  return query.toString();
}

async function getAllPagedItems<T>(endpoint: string, filters?: Array<{ column: string; operator: string; value: string }>): Promise<T[]> {
  const result: T[] = [];
  let pageNumber = 1;

  while (pageNumber <= MAX_PAGE_GUARD) {
    const response = await api.get<ApiResponse<PagedResultRaw<T>>>(`/api/aqua/${endpoint}?${buildPagedQuery(pageNumber, filters)}`);
    const raw = ensureSuccess(response, i18n.t('errors.listLoadFailed', { ns: 'dashboard' }));
    const items = extractPagedItems(raw);
    const totalCount = extractTotalCount(raw, result.length + items.length);
    result.push(...items);

    if (items.length === 0 || result.length >= totalCount || items.length < PAGE_SIZE) {
      break;
    }

    pageNumber += 1;
  }

  return result;
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function safePercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return round((numerator / denominator) * 100);
}

function daysBetween(startDate?: string | null, endDate?: Date): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const finish = endDate ?? new Date();
  const diff = finish.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function toIsoDate(input: Date): string {
  return input.toISOString().slice(0, 10);
}

function weightedAverage(totalBiomassKg: number, fishCount: number, fallback: number): number {
  if (fishCount <= 0) return fallback;
  return round((totalBiomassKg * 1000) / fishCount);
}

function toRawRow(
  row: ProjectDetailReport['cages'][number],
  projectCage: ProjectCageRawDto | undefined,
  cage: CageDto | undefined,
  projectStartDate?: string
): RawKpiRow {
  const daysInSea = daysBetween(projectCage?.assignedDate ?? projectStartDate);
  const stockedFish = row.initialFishCount;
  const liveFish = row.currentFishCount;
  const deadFish = row.totalDeadCount;
  const currentBiomassKg = row.currentBiomassGram / 1000;
  const totalFeedKg = row.totalFeedGram / 1000;
  const biomassGainKg = Math.max(0, (row.currentBiomassGram - row.initialBiomassGram) / 1000);
  const survivalPct = safePercent(liveFish, stockedFish);
  const mortalityPct = safePercent(deadFish, stockedFish);
  const adgGramPerDay =
    daysInSea > 0 && row.initialAverageGram > 0
      ? round((row.currentAverageGram - row.initialAverageGram) / daysInSea)
      : null;
  const sgrPctPerDay =
    daysInSea > 0 && row.initialAverageGram > 0 && row.currentAverageGram > 0
      ? round((100 * (Math.log(row.currentAverageGram) - Math.log(row.initialAverageGram))) / daysInSea)
      : null;
  const fcr = biomassGainKg > 0 ? round(totalFeedKg / biomassGainKg) : null;
  const densityPct =
    cage?.capacityGram && cage.capacityGram > 0
      ? round((row.currentBiomassGram / cage.capacityGram) * 100)
      : null;
  const dailyBiomassGainKg = Math.max(0, (adgGramPerDay ?? 0) * liveFish / 1000);
  const forecastBiomassKg30d = round(currentBiomassKg + dailyBiomassGainKg * FORECAST_DAYS);

  return {
    projectCageId: row.projectCageId,
    cageLabel: row.cageLabel,
    daysInSea,
    stockedFish,
    liveFish,
    deadFish,
    initialAverageGram: row.initialAverageGram,
    currentAverageGram: row.currentAverageGram,
    currentBiomassKg: round(currentBiomassKg),
    totalFeedKg: round(totalFeedKg),
    biomassGainKg: round(biomassGainKg),
    survivalPct,
    mortalityPct,
    adgGramPerDay,
    sgrPctPerDay,
    fcr,
    densityPct,
    forecastBiomassKg30d,
  };
}

function getRawMetricDefinitions(): KpiMetricDefinition[] {
  return [
    { key: 'survivalPct', labelKey: 'aqua.rawKpiReport.metrics.survivalPct', descriptionKey: 'aqua.rawKpiReport.descriptions.survivalPct', formulaKey: 'aqua.rawKpiReport.formulas.survivalPct' },
    { key: 'mortalityPct', labelKey: 'aqua.rawKpiReport.metrics.mortalityPct', descriptionKey: 'aqua.rawKpiReport.descriptions.mortalityPct', formulaKey: 'aqua.rawKpiReport.formulas.mortalityPct' },
    { key: 'fcr', labelKey: 'aqua.rawKpiReport.metrics.fcr', descriptionKey: 'aqua.rawKpiReport.descriptions.fcr', formulaKey: 'aqua.rawKpiReport.formulas.fcr' },
    { key: 'adgGramPerDay', labelKey: 'aqua.rawKpiReport.metrics.adgGramPerDay', descriptionKey: 'aqua.rawKpiReport.descriptions.adgGramPerDay', formulaKey: 'aqua.rawKpiReport.formulas.adgGramPerDay' },
    { key: 'sgrPctPerDay', labelKey: 'aqua.rawKpiReport.metrics.sgrPctPerDay', descriptionKey: 'aqua.rawKpiReport.descriptions.sgrPctPerDay', formulaKey: 'aqua.rawKpiReport.formulas.sgrPctPerDay' },
    { key: 'densityPct', labelKey: 'aqua.rawKpiReport.metrics.densityPct', descriptionKey: 'aqua.rawKpiReport.descriptions.densityPct', formulaKey: 'aqua.rawKpiReport.formulas.densityPct' },
    { key: 'forecastBiomassKg30d', labelKey: 'aqua.rawKpiReport.metrics.forecastBiomassKg30d', descriptionKey: 'aqua.rawKpiReport.descriptions.forecastBiomassKg30d', formulaKey: 'aqua.rawKpiReport.formulas.forecastBiomassKg30d' },
  ];
}

function getBusinessMetricDefinitions(): KpiMetricDefinition[] {
  return [
    { key: 'estimatedFeedCost', labelKey: 'aqua.businessKpiReport.metrics.estimatedFeedCost', descriptionKey: 'aqua.businessKpiReport.descriptions.estimatedFeedCost', formulaKey: 'aqua.businessKpiReport.formulas.estimatedFeedCost' },
    { key: 'feedCostPerCurrentKg', labelKey: 'aqua.businessKpiReport.metrics.feedCostPerCurrentKg', descriptionKey: 'aqua.businessKpiReport.descriptions.feedCostPerCurrentKg', formulaKey: 'aqua.businessKpiReport.formulas.feedCostPerCurrentKg' },
    { key: 'projectedHarvestBiomassKg', labelKey: 'aqua.businessKpiReport.metrics.projectedHarvestBiomassKg', descriptionKey: 'aqua.businessKpiReport.descriptions.projectedHarvestBiomassKg', formulaKey: 'aqua.businessKpiReport.formulas.projectedHarvestBiomassKg' },
    { key: 'projectedRevenue', labelKey: 'aqua.businessKpiReport.metrics.projectedRevenue', descriptionKey: 'aqua.businessKpiReport.descriptions.projectedRevenue', formulaKey: 'aqua.businessKpiReport.formulas.projectedRevenue' },
    { key: 'projectedGrossMargin', labelKey: 'aqua.businessKpiReport.metrics.projectedGrossMargin', descriptionKey: 'aqua.businessKpiReport.descriptions.projectedGrossMargin', formulaKey: 'aqua.businessKpiReport.formulas.projectedGrossMargin' },
    { key: 'daysToTarget', labelKey: 'aqua.businessKpiReport.metrics.daysToTarget', descriptionKey: 'aqua.businessKpiReport.descriptions.daysToTarget', formulaKey: 'aqua.businessKpiReport.formulas.daysToTarget' },
    { key: 'harvestReadinessPct', labelKey: 'aqua.businessKpiReport.metrics.harvestReadinessPct', descriptionKey: 'aqua.businessKpiReport.descriptions.harvestReadinessPct', formulaKey: 'aqua.businessKpiReport.formulas.harvestReadinessPct' },
    { key: 'forecastConfidencePct', labelKey: 'aqua.businessKpiReport.metrics.forecastConfidencePct', descriptionKey: 'aqua.businessKpiReport.descriptions.forecastConfidencePct', formulaKey: 'aqua.businessKpiReport.formulas.forecastConfidencePct' },
  ];
}

function getRecentWeighingDays(row: ProjectDetailReport['cages'][number]): number | null {
  const dates = row.dailyRows
    .filter((item) => item.weighingCount > 0)
    .map((item) => item.date)
    .sort((a, b) => b.localeCompare(a));
  if (dates.length === 0) return null;
  return daysBetween(dates[0]);
}

function toBusinessRow(raw: RawKpiRow, source: ProjectDetailReport['cages'][number]): BusinessKpiRow {
  const targetWeightProgressPct = Math.max(0, Math.min(999, round((raw.currentAverageGram / DEFAULT_TARGET_HARVEST_GRAM) * 100)));
  const daysToTarget =
    raw.adgGramPerDay != null && raw.adgGramPerDay > 0 && raw.currentAverageGram < DEFAULT_TARGET_HARVEST_GRAM
      ? Math.ceil((DEFAULT_TARGET_HARVEST_GRAM - raw.currentAverageGram) / raw.adgGramPerDay)
      : raw.currentAverageGram >= DEFAULT_TARGET_HARVEST_GRAM
        ? 0
        : null;
  const estimatedHarvestDate =
    daysToTarget != null
      ? toIsoDate(new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000))
      : null;
  const recentWeighingDays = getRecentWeighingDays(source);
  const feedDaysInLastWeek = source.dailyRows.filter((item) => item.fed).slice(-7).length;
  const forecastConfidencePct = Math.max(
    25,
    Math.min(
      100,
      35 +
        (recentWeighingDays != null && recentWeighingDays <= 14 ? 30 : 0) +
        (raw.daysInSea >= 14 ? 15 : 0) +
        (feedDaysInLastWeek >= 4 ? 20 : 0)
    )
  );
  const fcrScore =
    raw.fcr == null
      ? 50
      : Math.max(0, Math.min(100, round(((2.2 - raw.fcr) / 1.2) * 100)));
  const harvestReadinessPct = Math.max(
    0,
    Math.min(
      100,
      round(targetWeightProgressPct * 0.55 + (raw.survivalPct ?? 0) * 0.25 + fcrScore * 0.2)
    )
  );
  const estimatedFeedCost = round(raw.totalFeedKg * DEFAULT_FEED_COST_PER_KG);
  const feedCostPerCurrentKg = raw.currentBiomassKg > 0 ? round(estimatedFeedCost / raw.currentBiomassKg) : null;
  const projectedHarvestBiomassKg = raw.forecastBiomassKg30d;
  const projectedRevenue = round(projectedHarvestBiomassKg * DEFAULT_SALE_PRICE_PER_KG);
  const projectedGrossMargin = round(projectedRevenue - estimatedFeedCost);
  const projectedMarginPct = projectedRevenue > 0 ? round((projectedGrossMargin / projectedRevenue) * 100) : null;

  return {
    projectCageId: raw.projectCageId,
    cageLabel: raw.cageLabel,
    targetWeightProgressPct,
    daysToTarget,
    estimatedHarvestDate,
    forecastConfidencePct,
    harvestReadinessPct,
    estimatedFeedCost,
    feedCostPerCurrentKg,
    projectedHarvestBiomassKg,
    projectedRevenue,
    projectedGrossMargin,
    projectedMarginPct,
  };
}

function buildFallbackCage(projectCageId: number, cageLabel: string): ProjectDetailReport['cages'][number] {
  return {
    projectCageId,
    cageLabel,
    initialFishCount: 0,
    initialAverageGram: 0,
    initialBiomassGram: 0,
    currentFishCount: 0,
    currentAverageGram: 0,
    currentBiomassGram: 0,
    totalDeadCount: 0,
    totalFeedGram: 0,
    totalCountDelta: 0,
    totalBiomassDelta: 0,
    missingFeedingDays: [],
    dailyRows: [],
  };
}

async function getProjectCages(projectId: number): Promise<ProjectCageRawDto[]> {
  return getAllPagedItems<ProjectCageRawDto>('ProjectCage', [
    { column: 'ProjectId', operator: 'eq', value: String(projectId) },
  ]);
}

async function getCages(): Promise<CageDto[]> {
  return getAllPagedItems<CageDto>('Cage');
}

export const aquaKpiApi = {
  getProjects: async (): Promise<ProjectDto[]> => projectDetailReportApi.getProjects(),

  getRawKpiReport: async (projectId: number): Promise<RawKpiReport> => {
    const [detail, projectCages, cages] = await Promise.all([
      projectDetailReportApi.getProjectDetailReport(projectId),
      getProjectCages(projectId),
      getCages(),
    ]);

    const projectCageById = new Map(projectCages.map((item) => [item.id, item]));
    const cageById = new Map(cages.map((item) => [item.id, item]));
    const rows = detail.cages
      .map((row) => {
        const projectCage = projectCageById.get(row.projectCageId);
        const cage = projectCage ? cageById.get(projectCage.cageId) : undefined;
        return toRawRow(row, projectCage, cage, detail.project.startDate);
      })
      .sort((a, b) => a.cageLabel.localeCompare(b.cageLabel));

    const stockedFish = rows.reduce((sum, row) => sum + row.stockedFish, 0);
    const liveFish = rows.reduce((sum, row) => sum + row.liveFish, 0);
    const deadFish = rows.reduce((sum, row) => sum + row.deadFish, 0);
    const currentBiomassKg = round(rows.reduce((sum, row) => sum + row.currentBiomassKg, 0));
    const totalFeedKg = round(rows.reduce((sum, row) => sum + row.totalFeedKg, 0));
    const biomassGainKg = round(rows.reduce((sum, row) => sum + row.biomassGainKg, 0));
    const totalCapacityGram = rows.reduce((sum, row) => {
      const projectCage = projectCageById.get(row.projectCageId);
      const cage = projectCage ? cageById.get(projectCage.cageId) : undefined;
      return sum + Number(cage?.capacityGram ?? 0);
    }, 0);
    const daysInSea = Math.max(1, daysBetween(detail.project.startDate));
    const initialBiomassKg = round(detail.cages.reduce((sum, row) => sum + row.initialBiomassGram, 0) / 1000);
    const initialAverageGram = weightedAverage(initialBiomassKg, stockedFish, 0);
    const currentAverageGram = weightedAverage(currentBiomassKg, liveFish, 0);
    const dailyBiomassGainKg = Math.max(0, liveFish * ((currentAverageGram - initialAverageGram) / Math.max(daysInSea, 1)) / 1000);
    const forecastBiomassKg30d = round(currentBiomassKg + dailyBiomassGainKg * FORECAST_DAYS);

    return {
      projectId: detail.project.id,
      projectCode: detail.project.projectCode ?? '-',
      projectName: detail.project.projectName ?? '-',
      daysInSea,
      stockedFish,
      liveFish,
      deadFish,
      initialAverageGram,
      currentAverageGram,
      currentBiomassKg,
      totalFeedKg,
      biomassGainKg,
      survivalPct: safePercent(liveFish, stockedFish),
      mortalityPct: safePercent(deadFish, stockedFish),
      adgGramPerDay: daysInSea > 0 ? round((currentAverageGram - initialAverageGram) / daysInSea) : null,
      sgrPctPerDay:
        daysInSea > 0 && initialAverageGram > 0 && currentAverageGram > 0
          ? round((100 * (Math.log(currentAverageGram) - Math.log(initialAverageGram))) / daysInSea)
          : null,
      fcr: biomassGainKg > 0 ? round(totalFeedKg / biomassGainKg) : null,
      densityPct: totalCapacityGram > 0 ? round(((currentBiomassKg * 1000) / totalCapacityGram) * 100) : null,
      forecastBiomassKg30d,
      rows,
      metricDefinitions: getRawMetricDefinitions(),
    };
  },

  getBusinessKpiReport: async (projectId: number): Promise<BusinessKpiReport> => {
    const rawReport = await aquaKpiApi.getRawKpiReport(projectId);
    const detail = await projectDetailReportApi.getProjectDetailReport(projectId);
    const businessRows = rawReport.rows.map((row) => {
      const source = detail.cages.find((item) => item.projectCageId === row.projectCageId);
      return toBusinessRow(row, source ?? buildFallbackCage(row.projectCageId, row.cageLabel));
    });

    const estimatedFeedCost = round(businessRows.reduce((sum, row) => sum + row.estimatedFeedCost, 0));
    const projectedHarvestBiomassKg = round(businessRows.reduce((sum, row) => sum + row.projectedHarvestBiomassKg, 0));
    const projectedRevenue = round(businessRows.reduce((sum, row) => sum + row.projectedRevenue, 0));
    const projectedGrossMargin = round(projectedRevenue - estimatedFeedCost);
    const projectedMarginPct = projectedRevenue > 0 ? round((projectedGrossMargin / projectedRevenue) * 100) : null;
    const targetWeightProgressPct = Math.max(
      0,
      Math.min(999, round((rawReport.currentAverageGram / DEFAULT_TARGET_HARVEST_GRAM) * 100))
    );
    const daysToTarget =
      rawReport.adgGramPerDay != null && rawReport.adgGramPerDay > 0 && rawReport.currentAverageGram < DEFAULT_TARGET_HARVEST_GRAM
        ? Math.ceil((DEFAULT_TARGET_HARVEST_GRAM - rawReport.currentAverageGram) / rawReport.adgGramPerDay)
        : rawReport.currentAverageGram >= DEFAULT_TARGET_HARVEST_GRAM
          ? 0
          : null;
    const estimatedHarvestDate =
      daysToTarget != null ? toIsoDate(new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000)) : null;
    const forecastConfidencePct = round(
      businessRows.length > 0
        ? businessRows.reduce((sum, row) => sum + row.forecastConfidencePct, 0) / businessRows.length
        : 0
    );
    const harvestReadinessPct = round(
      businessRows.length > 0
        ? businessRows.reduce((sum, row) => sum + row.harvestReadinessPct, 0) / businessRows.length
        : 0
    );

    return {
      projectId: rawReport.projectId,
      projectCode: rawReport.projectCode,
      projectName: rawReport.projectName,
      estimatedFeedCost,
      feedCostPerCurrentKg: rawReport.currentBiomassKg > 0 ? round(estimatedFeedCost / rawReport.currentBiomassKg) : null,
      projectedHarvestBiomassKg,
      projectedRevenue,
      projectedGrossMargin,
      projectedMarginPct,
      targetWeightProgressPct,
      daysToTarget,
      estimatedHarvestDate,
      forecastConfidencePct,
      harvestReadinessPct,
      assumptions: {
        forecastDays: FORECAST_DAYS,
        targetHarvestGram: DEFAULT_TARGET_HARVEST_GRAM,
        feedCostPerKg: DEFAULT_FEED_COST_PER_KG,
        salePricePerKg: DEFAULT_SALE_PRICE_PER_KG,
      },
      rows: businessRows.sort((a, b) => a.cageLabel.localeCompare(b.cageLabel)),
      metricDefinitions: getBusinessMetricDefinitions(),
    };
  },
};
