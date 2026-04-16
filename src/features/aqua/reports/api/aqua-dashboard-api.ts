import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse } from '@/types/api';
import type {
  BatchCageBalanceDto,
  BatchWarehouseBalanceDto,
  FeedingDistributionDto,
  FeedingDto,
  FeedingLineDto,
  MortalityDto,
  MortalityLineDto,
  ProjectCageDto,
  ProjectDto,
} from '../types/project-detail-report-types';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
  totalCount?: number;
  TotalCount?: number;
}

interface DashboardCageSummary {
  projectCageId: number;
  cageLabel: string;
  currentFishCount: number;
  currentBiomassGram: number;
  totalDeadCount: number;
  totalFeedGram: number;
}

export interface DashboardProjectSummary {
  projectId: number;
  projectCode: string;
  projectName: string;
  activeCageCount: number;
  cageFish: number;
  warehouseFish: number;
  totalSystemFish: number;
  totalDead: number;
  totalFeed: number;
  cageBiomassGram: number;
  warehouseBiomassGram: number;
  totalSystemBiomassGram: number;
  cages: DashboardCageSummary[];
}

const PAGE_SIZE = 500;
const MAX_PAGE_GUARD = 100;
const POSTED_STATUS = 1;
const HTTP_NOT_FOUND = 404;

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

function buildPagedQuery(pageNumber: number): string {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(PAGE_SIZE),
    sortBy: 'Id',
    sortDirection: 'asc',
  });

  return query.toString();
}

async function getAllPagedItems<T>(endpoint: string): Promise<T[]> {
  const result: T[] = [];
  let pageNumber = 1;

  while (pageNumber <= MAX_PAGE_GUARD) {
    const query = buildPagedQuery(pageNumber);
    const response = await api.get<ApiResponse<PagedResultRaw<T>>>(`/api/aqua/${endpoint}?${query}`);
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

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const maybeResponse = (error as { response?: { status?: number } }).response;
  return maybeResponse?.status === HTTP_NOT_FOUND;
}

async function getAllPagedItemsOrEmptyOn404<T>(endpoint: string): Promise<T[]> {
  try {
    return await getAllPagedItems<T>(endpoint);
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }
    throw error;
  }
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
  if (project.status === 2) return false;
  if (isProjectEndDateInThePast(project.endDate)) return false;
  return true;
}

function isActiveProjectCage(releasedDate?: string | null): boolean {
  if (!releasedDate) return true;
  const parsed = new Date(releasedDate);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getUTCFullYear() <= 1901;
}

function toProjectSummary(
  project: ProjectDto,
  projectCages: ProjectCageDto[],
  cageCurrentFish: Map<number, number>,
  cageCurrentBiomass: Map<number, number>,
  cageDead: Map<number, number>,
  cageFeed: Map<number, number>,
  warehouseFishByProject: Map<number, number>,
  warehouseBiomassByProject: Map<number, number>
): DashboardProjectSummary {
  const cages: DashboardCageSummary[] = projectCages.map((projectCage) => {
    const projectCageId = projectCage.id;
    return {
      projectCageId,
      cageLabel: projectCage.cageCode ?? projectCage.cageName ?? String(projectCageId),
      currentFishCount: cageCurrentFish.get(projectCageId) ?? 0,
      currentBiomassGram: cageCurrentBiomass.get(projectCageId) ?? 0,
      totalDeadCount: cageDead.get(projectCageId) ?? 0,
      totalFeedGram: cageFeed.get(projectCageId) ?? 0,
    };
  });

  const cageFish = cages.reduce((acc, cage) => acc + cage.currentFishCount, 0);
  const totalDead = cages.reduce((acc, cage) => acc + cage.totalDeadCount, 0);
  const totalFeed = cages.reduce((acc, cage) => acc + cage.totalFeedGram, 0);
  const cageBiomassGram = cages.reduce((acc, cage) => acc + cage.currentBiomassGram, 0);
  const warehouseFish = warehouseFishByProject.get(project.id) ?? 0;
  const warehouseBiomassGram = warehouseBiomassByProject.get(project.id) ?? 0;

  return {
    projectId: project.id,
    projectCode: project.projectCode ?? '-',
    projectName: project.projectName ?? '-',
    activeCageCount: cages.length,
    cageFish,
    warehouseFish,
    totalSystemFish: cageFish + warehouseFish,
    totalDead,
    totalFeed,
    cageBiomassGram,
    warehouseBiomassGram,
    totalSystemBiomassGram: cageBiomassGram + warehouseBiomassGram,
    cages: cages.sort((a, b) => a.cageLabel.localeCompare(b.cageLabel)),
  };
}

export const aquaDashboardApi = {
  getActiveProjectSummaries: async (): Promise<DashboardProjectSummary[]> => {
    const [projects, projectCages, balances, warehouseBalances, feedings, feedingLines, feedingDistributions, mortalities, mortalityLines] =
      await Promise.all([
        getAllPagedItems<ProjectDto>('Project'),
        getAllPagedItems<ProjectCageDto>('ProjectCage'),
        getAllPagedItems<BatchCageBalanceDto>('BatchCageBalance'),
        getAllPagedItemsOrEmptyOn404<BatchWarehouseBalanceDto>('BatchWarehouseBalance'),
        getAllPagedItems<FeedingDto>('Feeding'),
        getAllPagedItems<FeedingLineDto>('FeedingLine'),
        getAllPagedItems<FeedingDistributionDto>('FeedingDistribution'),
        getAllPagedItems<MortalityDto>('Mortality'),
        getAllPagedItems<MortalityLineDto>('MortalityLine'),
      ]);

    const activeProjects = projects.filter(isActiveProject);
    const activeProjectIdSet = new Set(activeProjects.map((project) => project.id));

    const activeProjectCages = projectCages.filter(
      (projectCage) => activeProjectIdSet.has(projectCage.projectId) && isActiveProjectCage(projectCage.releasedDate)
    );
    const cageToProjectId = new Map<number, number>(
      activeProjectCages.map((projectCage) => [projectCage.id, projectCage.projectId])
    );

    const cageCurrentFish = new Map<number, number>();
    const cageCurrentBiomass = new Map<number, number>();
    const warehouseFishByProject = new Map<number, number>();
    const warehouseBiomassByProject = new Map<number, number>();

    for (const balance of balances) {
      if (!cageToProjectId.has(balance.projectCageId)) continue;
      cageCurrentFish.set(
        balance.projectCageId,
        (cageCurrentFish.get(balance.projectCageId) ?? 0) + (balance.liveCount ?? 0)
      );
      cageCurrentBiomass.set(
        balance.projectCageId,
        (cageCurrentBiomass.get(balance.projectCageId) ?? 0) + (balance.biomassGram ?? 0)
      );
    }

    for (const balance of warehouseBalances) {
      if (!activeProjectIdSet.has(balance.projectId)) continue;
      warehouseFishByProject.set(
        balance.projectId,
        (warehouseFishByProject.get(balance.projectId) ?? 0) + (balance.liveCount ?? 0)
      );
      warehouseBiomassByProject.set(
        balance.projectId,
        (warehouseBiomassByProject.get(balance.projectId) ?? 0) + (balance.biomassGram ?? 0)
      );
    }

    const postedFeedingIds = new Set(
      feedings
        .filter((feeding) => activeProjectIdSet.has(feeding.projectId) && (feeding.status ?? POSTED_STATUS) === POSTED_STATUS)
        .map((feeding) => feeding.id)
    );
    const feedingLineToHeader = new Map<number, number>();
    for (const line of feedingLines) {
      if (postedFeedingIds.has(line.feedingId)) {
        feedingLineToHeader.set(line.id, line.feedingId);
      }
    }

    const cageFeed = new Map<number, number>();
    for (const distribution of feedingDistributions) {
      if (!feedingLineToHeader.has(distribution.feedingLineId)) continue;
      if (!cageToProjectId.has(distribution.projectCageId)) continue;
      cageFeed.set(
        distribution.projectCageId,
        (cageFeed.get(distribution.projectCageId) ?? 0) + (distribution.feedGram ?? 0)
      );
    }

    const postedMortalityIds = new Set(
      mortalities
        .filter(
          (mortality) => activeProjectIdSet.has(mortality.projectId) && (mortality.status ?? POSTED_STATUS) === POSTED_STATUS
        )
        .map((mortality) => mortality.id)
    );

    const cageDead = new Map<number, number>();
    for (const line of mortalityLines) {
      if (!postedMortalityIds.has(line.mortalityId)) continue;
      if (!cageToProjectId.has(line.projectCageId)) continue;
      cageDead.set(line.projectCageId, (cageDead.get(line.projectCageId) ?? 0) + (line.deadCount ?? 0));
    }

    const cagesByProject = new Map<number, ProjectCageDto[]>();
    for (const projectCage of activeProjectCages) {
      const list = cagesByProject.get(projectCage.projectId) ?? [];
      list.push(projectCage);
      cagesByProject.set(projectCage.projectId, list);
    }

    return activeProjects
      .map((project) =>
        toProjectSummary(
          project,
          cagesByProject.get(project.id) ?? [],
          cageCurrentFish,
          cageCurrentBiomass,
          cageDead,
          cageFeed,
          warehouseFishByProject,
          warehouseBiomassByProject
        )
      )
      .sort((a, b) => a.projectCode.localeCompare(b.projectCode));
  },
};
