import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse } from '@/types/api';
import type {
  ProjectDto,
  StockDto,
  WarehouseDto,
  ProjectCageDto,
  CageOptionDto,
  CreateProjectPayload,
  CreateGoodsReceiptPayload,
  CreateGoodsReceiptLinePayload,
  CreateGoodsReceiptFishDistributionPayload,
  CreateFishBatchPayload,
  GoodsReceiptCreateResult,
  ExistingGoodsReceiptContext,
  GoodsReceiptLineCreateResult,
  FishBatchCreateResult,
} from '../types/quick-setup-types';

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

interface WarehouseListResponseItem {
  id: number;
  erpWarehouseCode?: number;
  warehouseName?: string;
  branchCode?: number;
}

interface CageListResponseItem {
  id: number;
  cageCode?: string;
  cageName?: string;
}

interface GoodsReceiptListResponseItem {
  id: number;
  projectId?: number | null;
  status?: number | null;
  receiptNo?: string;
  receiptDate?: string;
  warehouseId?: number | null;
  warehouseCode?: number | null;
  warehouseName?: string | null;
}

interface GoodsReceiptLineListResponseItem {
  id: number;
  goodsReceiptId: number;
  itemType: number;
  stockId: number;
  qtyUnit?: number | null;
  gramPerUnit?: number | null;
  totalGram?: number | null;
  fishBatchId?: number | null;
  fishCount?: number | null;
  fishAverageGram?: number | null;
  fishTotalGram?: number | null;
}

interface FishBatchResponseItem {
  id: number;
  batchCode?: string;
}

function isActiveProjectCage(releasedDate?: string | null): boolean {
  if (!releasedDate) return true;
  const parsed = new Date(releasedDate);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getUTCFullYear() <= 1901;
}

function normalizeDateOnly(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
}

function isEffectivelyActiveProjectCage(
  releasedDate?: string | null,
  assignedDate?: string | null
): boolean {
  if (isActiveProjectCage(releasedDate)) return true;
  const releasedDay = normalizeDateOnly(releasedDate);
  const assignedDay = normalizeDateOnly(assignedDate);
  return releasedDay != null && assignedDay != null && releasedDay === assignedDay;
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

function normalizeProjectCage(item: Record<string, unknown>): ProjectCageDto {
  return {
    id: getNumberField(item, 'id', 'Id'),
    projectId: getNumberField(item, 'projectId', 'ProjectId'),
    cageId: getNumberField(item, 'cageId', 'CageId'),
    cageCode: getStringField(item, 'cageCode', 'CageCode') ?? undefined,
    cageName: getStringField(item, 'cageName', 'CageName') ?? undefined,
    assignedDate: getStringField(item, 'assignedDate', 'AssignedDate'),
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

function extractWarehouseList(raw: PagedResultRaw<WarehouseListResponseItem>): WarehouseDto[] {
  return extractPagedItems(raw).map((item) => ({
    id: Number(item.id),
    erpWarehouseCode: Number(item.erpWarehouseCode ?? 0),
    warehouseName: String(item.warehouseName ?? ''),
    branchCode: item.branchCode != null ? Number(item.branchCode) : undefined,
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

export const aquaQuickApi = {
  getProjects: async (): Promise<ProjectDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectDto>>>(`/api/aqua/Project?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractPagedItems(raw);
  },

  createProject: async (payload: CreateProjectPayload): Promise<ProjectDto> => {
    const response = await api.post<ApiResponse<ProjectDto>>('/api/aqua/Project', payload);
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
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

  getWarehouses: async (): Promise<WarehouseDto[]> => {
    const query = buildPagedQuery(1, 500);
    const response = await api.get<ApiResponse<PagedResultRaw<WarehouseListResponseItem>>>(`/api/aqua/Warehouse?${query}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return extractWarehouseList(raw);
  },

  getProjectCages: async (projectId: number): Promise<ProjectCageDto[]> => {
    const [allCages, allAssignments] = await Promise.all([
      getAllAquaItems<CageListResponseItem>('Cage'),
      getAllAquaItems<ProjectCageDto>('ProjectCage'),
    ]);
    const cageById = new Map<number, CageListResponseItem>(
      (allCages as unknown as Record<string, unknown>[])
        .map(normalizeCage)
        .filter((x) => Number.isFinite(x.id) && x.id > 0)
        .map((x) => [x.id, x])
    );

    const finalActive = (allAssignments as unknown as Record<string, unknown>[])
      .map(normalizeProjectCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0)
      .filter(
        (x) =>
          Number(x.projectId) === projectId &&
          isEffectivelyActiveProjectCage(x.releasedDate, x.assignedDate)
      );
    return finalActive.map((x) => {
      const cage = cageById.get(Number(x.cageId));
      return {
        ...x,
        cageCode: x.cageCode ?? cage?.cageCode,
        cageName: x.cageName ?? cage?.cageName,
      };
    });
  },

  getAvailableCagesForProject: async (projectId: number): Promise<CageOptionDto[]> => {
    const [allCages, allAssignments] = await Promise.all([
      getAllAquaItems<CageListResponseItem>('Cage'),
      getAllAquaItems<ProjectCageDto>('ProjectCage'),
    ]);

    const activeAssignments = (allAssignments as unknown as Record<string, unknown>[])
      .map(normalizeProjectCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0)
      .filter((x) => isEffectivelyActiveProjectCage(x.releasedDate, x.assignedDate));

    const projectAssignedCageIds = new Set(
      activeAssignments
        .filter((x) => Number(x.projectId) === Number(projectId))
        .map((x) => Number(x.cageId))
    );
    const globallyAssignedCageIds = new Set(activeAssignments.map((x) => Number(x.cageId)));

    return (allCages as unknown as Record<string, unknown>[])
      .map(normalizeCage)
      .filter((x) => Number.isFinite(x.id) && x.id > 0)
      .filter((x) => !projectAssignedCageIds.has(Number(x.id)))
      .filter((x) => !globallyAssignedCageIds.has(Number(x.id)))
      .map((x) => ({
        id: x.id,
        cageCode: x.cageCode,
        cageName: x.cageName,
      }));
  },

  addCageToProject: async (projectId: number, cageId: number): Promise<ProjectCageDto> => {
    const assignedDate = new Date().toISOString().slice(0, 10);
    const response = await api.post<ApiResponse<ProjectCageDto>>('/api/aqua/ProjectCage', {
      projectId,
      cageId,
      assignedDate,
      releasedDate: null,
    });
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  getExistingGoodsReceiptContext: async (projectId: number): Promise<ExistingGoodsReceiptContext | null> => {
    const draftReceiptQuery = buildPagedQuery(1, 200, undefined, 'desc');
    const receiptResponse = await api.get<ApiResponse<PagedResultRaw<GoodsReceiptListResponseItem>>>(
      `/api/aqua/GoodsReceipt?${draftReceiptQuery}`
    );
    const receiptRaw = ensureSuccess(receiptResponse, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
    const receipts = extractPagedItems(receiptRaw).filter(
      (x) => Number(x.projectId ?? 0) === projectId && Number(x.status ?? -1) !== 2
    );
    const receipt = receipts.find((x) => Number(x.status ?? -1) === 0) ?? receipts[0];
    if (!receipt) return null;

    const fishLineQuery = buildPagedQuery(1, 1, [
      { column: 'GoodsReceiptId', operator: 'eq', value: String(receipt.id) },
      { column: 'ItemType', operator: 'eq', value: '1' },
    ], 'desc');
    const lineResponse = await api.get<ApiResponse<PagedResultRaw<GoodsReceiptLineListResponseItem>>>(
      `/api/aqua/GoodsReceiptLine?${fishLineQuery}`
    );
    const lineRaw = ensureSuccess(lineResponse, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
    const line = extractPagedItems(lineRaw)[0];
    const fishCount = Number(line?.fishCount ?? 0);
    const averageFromLine = Number(line?.fishAverageGram ?? 0);
    const averageFromFishTotal = fishCount > 0 ? Number(line?.fishTotalGram ?? 0) / fishCount : 0;
    const averageFromUnit = Number(line?.gramPerUnit ?? 0);
    const resolvedAverageGram = averageFromLine > 0
      ? averageFromLine
      : averageFromFishTotal > 0
        ? averageFromFishTotal
        : averageFromUnit > 0
          ? averageFromUnit
          : null;
    let fishBatchCode: string | null = null;
    if (line?.fishBatchId != null) {
      try {
        const fishBatchResponse = await api.get<ApiResponse<FishBatchResponseItem>>(
          `/api/aqua/FishBatch/${line.fishBatchId}`
        );
        const fishBatch = ensureSuccess(fishBatchResponse, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
        fishBatchCode = fishBatch.batchCode ?? null;
      } catch {
        fishBatchCode = null;
      }
    }

    return {
      receiptId: receipt.id,
      receiptNo: receipt.receiptNo ?? `#${receipt.id}`,
      receiptDate: receipt.receiptDate?.slice(0, 10) ?? '',
      status: Number(receipt.status ?? 0),
      warehouseId: receipt.warehouseId != null ? Number(receipt.warehouseId) : null,
      warehouseCode: receipt.warehouseCode != null ? Number(receipt.warehouseCode) : null,
      warehouseName: receipt.warehouseName ?? null,
      fishStockId: line?.stockId ?? null,
      fishAverageGram: resolvedAverageGram,
      fishLineId: line?.id ?? null,
      fishBatchId: line?.fishBatchId ?? null,
      fishBatchCode,
      fishCount,
    };
  },

  createGoodsReceipt: async (
    payload: CreateGoodsReceiptPayload
  ): Promise<GoodsReceiptCreateResult> => {
    const response = await api.post<ApiResponse<GoodsReceiptCreateResult>>(
      '/api/aqua/GoodsReceipt',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  updateGoodsReceipt: async (
    id: number,
    payload: CreateGoodsReceiptPayload
  ): Promise<GoodsReceiptCreateResult> => {
    const response = await api.put<ApiResponse<GoodsReceiptCreateResult>>(
      `/api/aqua/GoodsReceipt/${id}`,
      {
        ...payload,
        status: 0,
      }
    );
    return ensureSuccess(response, i18n.t('aqua.api.updateFailed', { ns: 'common' }));
  },

  createGoodsReceiptLine: async (
    payload: CreateGoodsReceiptLinePayload
  ): Promise<GoodsReceiptLineCreateResult> => {
    const response = await api.post<ApiResponse<GoodsReceiptLineCreateResult>>(
      '/api/aqua/GoodsReceiptLine',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  getGoodsReceiptLineById: async (id: number): Promise<GoodsReceiptLineListResponseItem> => {
    const response = await api.get<ApiResponse<GoodsReceiptLineListResponseItem>>(
      `/api/aqua/GoodsReceiptLine/${id}`
    );
    return ensureSuccess(response, i18n.t('aqua.api.queryFailed', { ns: 'common' }));
  },

  updateGoodsReceiptLine: async (
    id: number,
    payload: CreateGoodsReceiptLinePayload
  ): Promise<GoodsReceiptLineCreateResult> => {
    const response = await api.put<ApiResponse<GoodsReceiptLineCreateResult>>(
      `/api/aqua/GoodsReceiptLine/${id}`,
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.updateFailed', { ns: 'common' }));
  },

  createGoodsReceiptFishDistribution: async (
    payload: CreateGoodsReceiptFishDistributionPayload
  ): Promise<{ id: number }> => {
    const response = await api.post<ApiResponse<{ id: number }>>(
      '/api/aqua/GoodsReceiptFishDistribution',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  createFishBatch: async (
    payload: CreateFishBatchPayload
  ): Promise<FishBatchCreateResult> => {
    const response = await api.post<ApiResponse<FishBatchCreateResult>>(
      '/api/aqua/FishBatch',
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  updateFishBatch: async (
    id: number,
    payload: CreateFishBatchPayload
  ): Promise<FishBatchCreateResult> => {
    const response = await api.put<ApiResponse<FishBatchCreateResult>>(
      `/api/aqua/FishBatch/${id}`,
      payload
    );
    return ensureSuccess(response, i18n.t('aqua.api.updateFailed', { ns: 'common' }));
  },

  postGoodsReceipt: async (id: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/api/aqua/posting/goods-receipt/${id}`
    );
    return ensureSuccess(response, i18n.t('aqua.api.postFailed', { ns: 'common' }));
  },
};
