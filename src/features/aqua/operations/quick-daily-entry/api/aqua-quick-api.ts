import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse } from '@/types/api';
import type {
  ProjectDto,
  ProjectCageDto,
  StockDto,
  FishBatchDto,
  WeatherSeverityDto,
  WeatherTypeDto,
  NetOperationTypeDto,
  FeedingHeaderDto,
  MortalityHeaderDto,
  NetOperationHeaderDto,
  ActiveCageBatchSnapshot,
  CreateFeedingPayload,
  CreateFeedingLinePayload,
  CreateMortalityPayload,
  CreateMortalityLinePayload,
  CreateDailyWeatherPayload,
  CreateNetOperationPayload,
  CreateNetOperationLinePayload,
  CreateTransferPayload,
  CreateTransferLinePayload,
  CreateStockConvertPayload,
  CreateStockConvertLinePayload,
} from '../types/quick-daily-entry-types';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
}

interface StockListResponseItem {
  id: number;
  erpStockCode?: string;
  stockName?: string;
}

interface CageListResponseItem {
  id: number;
  cageCode?: string;
  cageName?: string;
}

interface ProjectCageListResponseItem {
  id: number;
  projectId: number;
  cageId: number;
  cageCode?: string;
  cageName?: string;
  releasedDate?: string | null;
}

interface BatchCageBalanceListResponseItem {
  fishBatchId?: number;
  liveCount?: number;
  averageGram?: number;
  biomassGram?: number;
}

function isActiveProjectCage(releasedDate?: string | null): boolean {
  if (!releasedDate) return true;
  const parsed = new Date(releasedDate);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getUTCFullYear() <= 1901;
}

function getNumberField(obj: Record<string, unknown>, camel: string, pascal: string): number {
  const raw = obj[camel] ?? obj[pascal];
  return Number(raw ?? 0);
}

function getStringField(
  obj: Record<string, unknown>,
  camel: string,
  pascal: string
): string | null {
  const raw = obj[camel] ?? obj[pascal];
  if (raw == null) return null;
  return String(raw);
}

function normalizeProjectCage(item: Record<string, unknown>): ProjectCageListResponseItem {
  return {
    id: getNumberField(item, 'id', 'Id'),
    projectId: getNumberField(item, 'projectId', 'ProjectId'),
    cageId: getNumberField(item, 'cageId', 'CageId'),
    cageCode: getStringField(item, 'cageCode', 'CageCode') ?? undefined,
    cageName: getStringField(item, 'cageName', 'CageName') ?? undefined,
    releasedDate: getStringField(item, 'releasedDate', 'ReleasedDate'),
  };
}

function normalizeCage(item: Record<string, unknown>): CageListResponseItem {
  return {
    id: getNumberField(item, 'id', 'Id'),
    cageCode: getStringField(item, 'cageCode', 'CageCode') ?? undefined,
    cageName: getStringField(item, 'cageName', 'CageName') ?? undefined,
  };
}

function ensureSuccess<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success) {
    throw new Error(response.message || fallback);
  }
  if (response.data == null) {
    throw new Error(fallback);
  }
  return response.data;
}

function extractPagedItems<T>(raw: PagedResultRaw<T>): T[] {
  return raw.items ?? raw.Items ?? raw.data ?? raw.Data ?? [];
}

function buildPagedQuery(
  pageNumber: number,
  pageSize: number,
  filters?: Array<{ column: string; operator: string; value: string }>,
  sortDirection: 'asc' | 'desc' = 'asc'
): string {
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    sortBy: 'Id',
    sortDirection,
  });

  if (filters && filters.length > 0) {
    query.append('filters', JSON.stringify(filters));
    query.append('filterLogic', 'and');
  }

  return query.toString();
}

function extractStockList(raw: PagedResultRaw<StockListResponseItem>): StockDto[] {
  return extractPagedItems(raw).map((item) => ({
    id: item.id,
    code: item.erpStockCode,
    name: item.stockName,
  }));
}

async function getAllAquaItems<T>(endpoint: string, pageSize = 500): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (true) {
    const response = await api.get<ApiResponse<PagedResultRaw<T>>>(`/api/aqua/${endpoint}?${buildPagedQuery(page, pageSize)}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    const items = extractPagedItems(raw);
    all.push(...items);

    if (items.length < pageSize) break;
    page += 1;
  }

  return all;
}

export const aquaQuickDailyApi = {
  getProjects: async (): Promise<ProjectDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectDto>>>(`/api/aqua/Project?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractPagedItems(raw);
  },

  getProjectCages: async (projectId: number): Promise<ProjectCageDto[]> => {
    const query = buildPagedQuery(1, 500, [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectCageDto>>>(`/api/aqua/ProjectCage?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return (extractPagedItems(raw) as unknown as Record<string, unknown>[])
      .map(normalizeProjectCage)
      .filter((x) => Number(x.projectId) === projectId && isActiveProjectCage(x.releasedDate))
      .map((x) => ({
        id: x.id,
        projectId: x.projectId,
        cageId: x.cageId,
        cageCode: x.cageCode,
        cageName: x.cageName,
        releasedDate: x.releasedDate,
      }));
  },

  getTransferTargetProjectCages: async (projectId: number): Promise<ProjectCageDto[]> => {
    const [allCages, allAssignments] = await Promise.all([
      getAllAquaItems<CageListResponseItem>('Cage'),
      getAllAquaItems<ProjectCageListResponseItem>('ProjectCage'),
    ]);
    const normalizedCages = (allCages as unknown as Record<string, unknown>[])
      .map(normalizeCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0);
    const normalizedAssignments = (allAssignments as unknown as Record<string, unknown>[])
      .map(normalizeProjectCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0);
    const cageById = new Map<number, CageListResponseItem>(normalizedCages.map((x) => [x.id, x]));

    return normalizedAssignments
      .filter((x) => isActiveProjectCage(x.releasedDate))
      .filter((x) => Number(x.projectId) === projectId)
      .map((x) => {
        const cage = cageById.get(Number(x.cageId));
        return {
          id: x.id,
          projectId: x.projectId,
          cageId: x.cageId,
          cageCode: x.cageCode ?? cage?.cageCode,
          cageName: x.cageName ?? cage?.cageName,
        } satisfies ProjectCageDto;
      });
  },

  getStocks: async (): Promise<StockDto[]> => {
    const query = new URLSearchParams({
      page: '1',
      pageSize: '500',
      sortBy: 'Id',
      sortDirection: 'asc',
      filters: '[]',
      filterLogic: 'and',
    });
    const response = await api.get<ApiResponse<PagedResultRaw<StockListResponseItem>>>(`/api/Stock?${query.toString()}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractStockList(raw);
  },

  getFishBatches: async (projectId: number): Promise<FishBatchDto[]> => {
    const query = buildPagedQuery(1, 500, [{ column: 'ProjectId', operator: 'eq', value: String(projectId) }]);
    const response = await api.get<ApiResponse<PagedResultRaw<FishBatchDto>>>(`/api/aqua/FishBatch?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractPagedItems(raw);
  },

  findActiveFishBatchByProjectCage: async (
    projectCageId: number
  ): Promise<ActiveCageBatchSnapshot | null> => {
    const query = buildPagedQuery(
      1,
      200,
      [{ column: 'ProjectCageId', operator: 'eq', value: String(projectCageId) }],
      'desc'
    );
    const response = await api.get<ApiResponse<PagedResultRaw<BatchCageBalanceListResponseItem>>>(
      `/api/aqua/BatchCageBalance?${query}`
    );
    const raw = ensureSuccess(response, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
    const items = extractPagedItems(raw);
    const active = items.find((x) => Number(x.liveCount ?? 0) > 0);
    const fishBatchId = Number(active?.fishBatchId ?? 0);
    if (fishBatchId <= 0) return null;
    return {
      fishBatchId,
      liveCount: Number(active?.liveCount ?? 0),
      averageGram: Number(active?.averageGram ?? 0),
      biomassGram: Number(active?.biomassGram ?? 0),
    };
  },

  getWeatherSeverities: async (): Promise<WeatherSeverityDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<WeatherSeverityDto>>>(`/api/aqua/WeatherSeverity?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractPagedItems(raw);
  },

  getWeatherTypes: async (): Promise<WeatherTypeDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<WeatherTypeDto>>>(`/api/aqua/WeatherType?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractPagedItems(raw);
  },

  getNetOperationTypes: async (): Promise<NetOperationTypeDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<NetOperationTypeDto>>>(`/api/aqua/NetOperationType?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractPagedItems(raw);
  },

  findFeedingHeaderByProjectAndDate: async (
    projectId: number,
    feedingDate: string
  ): Promise<FeedingHeaderDto | null> => {
    const query = buildPagedQuery(1, 1, [
      { column: 'ProjectId', operator: 'eq', value: String(projectId) },
      { column: 'FeedingDate', operator: 'eq', value: feedingDate },
    ]);
    const response = await api.get<ApiResponse<PagedResultRaw<FeedingHeaderDto>>>(`/api/aqua/Feeding?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
    const items = extractPagedItems(raw);
    return items.length > 0 ? items[0] : null;
  },

  findMortalityHeaderByProjectAndDate: async (
    projectId: number,
    mortalityDate: string
  ): Promise<MortalityHeaderDto | null> => {
    const query = buildPagedQuery(1, 1, [
      { column: 'ProjectId', operator: 'eq', value: String(projectId) },
      { column: 'MortalityDate', operator: 'eq', value: mortalityDate },
    ]);
    const response = await api.get<ApiResponse<PagedResultRaw<MortalityHeaderDto>>>(`/api/aqua/Mortality?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
    const items = extractPagedItems(raw);
    return items.length > 0 ? items[0] : null;
  },

  findNetOperationHeaderByProjectAndDate: async (
    projectId: number,
    operationDate: string
  ): Promise<NetOperationHeaderDto | null> => {
    const query = buildPagedQuery(1, 1, [
      { column: 'ProjectId', operator: 'eq', value: String(projectId) },
      { column: 'OperationDate', operator: 'eq', value: operationDate },
    ]);
    const response = await api.get<ApiResponse<PagedResultRaw<NetOperationHeaderDto>>>(`/api/aqua/NetOperation?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
    const items = extractPagedItems(raw);
    return items.length > 0 ? items[0] : null;
  },

  createFeeding: async (
    payload: CreateFeedingPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/Feeding',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createFeedingLine: async (
    payload: CreateFeedingLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/FeedingLine',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createMortality: async (
    payload: CreateMortalityPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/Mortality',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createMortalityLine: async (
    payload: CreateMortalityLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/MortalityLine',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createDailyWeather: async (
    payload: CreateDailyWeatherPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/DailyWeather',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createNetOperation: async (
    payload: CreateNetOperationPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/NetOperation',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createNetOperationLine: async (
    payload: CreateNetOperationLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/NetOperationLine',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createTransfer: async (
    payload: CreateTransferPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/Transfer',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createTransferLine: async (
    payload: CreateTransferLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/TransferLine',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  postTransfer: async (transferId: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/transfer/${transferId}`
    );
    return ensureSuccess(response, i18n.t('aqua.api.postFailed', { ns: 'common' }));
  },

  postMortality: async (mortalityId: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/mortality/${mortalityId}`
    );
    return ensureSuccess(response, i18n.t('aqua.api.postFailed', { ns: 'common' }));
  },

  postNetOperation: async (netOperationId: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/net-operation/${netOperationId}`
    );
    return ensureSuccess(response, i18n.t('aqua.api.postFailed', { ns: 'common' }));
  },

  postStockConvert: async (stockConvertId: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/stock-convert/${stockConvertId}`
    );
    return ensureSuccess(response, i18n.t('aqua.api.postFailed', { ns: 'common' }));
  },

  createStockConvert: async (
    payload: CreateStockConvertPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/StockConvert',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createStockConvertLine: async (
    payload: CreateStockConvertLinePayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/StockConvertLine',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },
};
