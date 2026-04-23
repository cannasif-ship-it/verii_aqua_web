import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse } from '@/types/api';
import type { ProjectDto } from '../types/project-detail-report-types';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
  totalCount?: number;
  TotalCount?: number;
}

interface DashboardProjectsResponseDto {
  projects: DashboardProjectSummary[];
  yesterdayEntryMissing: boolean;
  yesterdayDate?: string | null;
}

export interface DashboardCageSummary {
  projectCageId: number;
  cageLabel: string;
  cageCode?: string;
  measurementAverageGram: number;
  initialFishCount: number;
  initialBiomassGram: number;
  currentFishCount: number;
  totalShipmentCount: number;
  totalShipmentBiomassGram: number;
  totalDeadCount: number;
  totalDeadBiomassGram: number;
  totalFeedGram: number;
  currentBiomassGram: number;
  fcr: number | null;
}

export interface DashboardProjectSummary {
  projectId: number;
  projectCode: string;
  projectName: string;
  measurementAverageGram: number;
  cageFish: number;
  totalShipmentCount: number;
  totalShipmentBiomassGram: number;
  warehouseFish: number;
  totalSystemFish: number;
  totalDeadCount: number;
  totalDeadBiomassGram: number;
  activeCageCount: number;
  fcr: number | null;
  cageBiomassGram: number;
  warehouseBiomassGram: number;
  totalSystemBiomassGram: number;
  cages: DashboardCageSummary[];
}

export interface DashboardCageDailyRow {
  date: string;
  feedGram: number;
  feedStockCount: number;
  feedDetails: string[];
  deadCount: number;
  deadBiomassGram: number;
  countDelta: number;
  biomassDelta: number;
  weather: string;
  netOperationCount: number;
  netOperationDetails: string[];
  transferCount: number;
  transferDetails: string[];
  weighingCount: number;
  weighingDetails: string[];
  stockConvertCount: number;
  stockConvertDetails: string[];
  shipmentCount: number;
  shipmentDetails: string[];
  shipmentFishCount: number;
  shipmentBiomassGram: number;
  fed: boolean;
}

export interface DashboardProjectDetailCage {
  projectCageId: number;
  cageLabel: string;
  cageCode?: string;
  initialFishCount: number;
  initialAverageGram: number;
  initialBiomassGram: number;
  currentFishCount: number;
  currentAverageGram: number;
  currentBiomassGram: number;
  totalDeadCount: number;
  totalFeedGram: number;
  totalCountDelta: number;
  totalBiomassDelta: number;
  missingFeedingDays: string[];
  dailyRows: DashboardCageDailyRow[];
}

export interface DashboardProjectDetailResponse {
  cages: DashboardProjectDetailCage[];
}

const PAGE_SIZE = 500;
const MAX_PAGE_GUARD = 100;

interface ProjectCageRaw {
  id?: number;
  Id?: number;
  cageCode?: string;
  CageCode?: string;
}

async function getAllProjectCages(): Promise<ProjectCageRaw[]> {
  const result: ProjectCageRaw[] = [];
  let pageNumber = 1;

  while (pageNumber <= MAX_PAGE_GUARD) {
    const query = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(PAGE_SIZE),
      sortBy: 'Id',
      sortDirection: 'asc',
    });

    const response = await api.get<ApiResponse<PagedResultRaw<ProjectCageRaw>>>(`/api/aqua/ProjectCage?${query.toString()}`);
    const raw = ensureSuccess(response, i18n.t('errors.listLoadFailed', { ns: 'dashboard' }));
    const pageItems = extractPagedItems(raw);
    const totalCount = extractTotalCount(raw, result.length + pageItems.length);
    result.push(...pageItems);

    if (pageItems.length === 0 || result.length >= totalCount || pageItems.length < PAGE_SIZE) {
      break;
    }

    pageNumber += 1;
  }

  return result;
}

async function buildProjectCageCodeMap(): Promise<Map<number, string>> {
  const items = await getAllProjectCages();
  const map = new Map<number, string>();
  for (const item of items) {
    const id = item.id ?? item.Id;
    const code = item.cageCode ?? item.CageCode;
    if (id != null && code != null) {
      map.set(id, code);
    }
  }
  return map;
}

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

async function getAllProjects(): Promise<ProjectDto[]> {
  const result: ProjectDto[] = [];
  let pageNumber = 1;

  while (pageNumber <= MAX_PAGE_GUARD) {
    const query = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(PAGE_SIZE),
      sortBy: 'Id',
      sortDirection: 'asc',
    });

    const response = await api.get<ApiResponse<PagedResultRaw<ProjectDto>>>(`/api/aqua/Project?${query.toString()}`);
    const raw = ensureSuccess(response, i18n.t('errors.listLoadFailed', { ns: 'dashboard' }));
    const pageItems = extractPagedItems(raw);
    const totalCount = extractTotalCount(raw, result.length + pageItems.length);
    result.push(...pageItems);

    if (pageItems.length === 0 || result.length >= totalCount || pageItems.length < PAGE_SIZE) {
      break;
    }

    pageNumber += 1;
  }

  return result;
}

export const aquaDashboardApi = {
  getProjects: async (): Promise<ProjectDto[]> => getAllProjects(),

  getCageCodeMap: async (): Promise<Map<number, string>> => buildProjectCageCodeMap(),

  getProjectSummaries: async (projectIds: number[]): Promise<DashboardProjectsResponseDto> => {
    const uniqueProjectIds = Array.from(new Set(projectIds)).filter((id) => Number.isFinite(id));
    if (uniqueProjectIds.length === 0) {
      return { projects: [], yesterdayEntryMissing: false, yesterdayDate: null };
    }

    const query = new URLSearchParams();
    for (const projectId of uniqueProjectIds) {
      query.append('projectIds', String(projectId));
    }

    const response = await api.get<ApiResponse<DashboardProjectsResponseDto>>(
      `/api/aqua/dashboard-project/summary?${query.toString()}`
    );

    return ensureSuccess(response, i18n.t('errors.listLoadFailed', { ns: 'dashboard' }));
  },

  getProjectDetail: async (projectId: number): Promise<DashboardProjectDetailResponse> => {
    const response = await api.get<ApiResponse<DashboardProjectDetailResponse>>(
      `/api/aqua/dashboard-project/detail/${projectId}`
    );

    return ensureSuccess(response, i18n.t('errors.projectNotFound', { ns: 'dashboard' }));
  },
};
