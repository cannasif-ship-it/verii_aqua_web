import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse } from '@/types/api';
import type { AquaListParams, AquaListResponse } from '../types/aqua-crud';

interface AquaListResponseRaw extends Partial<AquaListResponse> {
  items?: Record<string, unknown>[];
  Items?: Record<string, unknown>[];
  totalCount?: number;
  TotalCount?: number;
  pageNumber?: number;
  PageNumber?: number;
  pageSize?: number;
  PageSize?: number;
}

function buildQuery(params: AquaListParams): string {
  const query = new URLSearchParams();
  if (params.pageNumber != null) query.append('pageNumber', String(params.pageNumber));
  if (params.pageSize != null) query.append('pageSize', String(params.pageSize));
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortDirection) query.append('sortDirection', params.sortDirection);
  if (params.filters) query.append('filters', JSON.stringify(params.filters));
  if (params.filterLogic) query.append('filterLogic', params.filterLogic);
  return query.toString();
}

function resolveEndpointPath(endpoint: string): string {
  const normalized = endpoint.trim();
  if (normalized.startsWith('/api/')) return normalized;
  if (normalized.startsWith('api/')) return `/${normalized}`;
  return `/api/aqua/${normalized}`;
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

function normalizeListResponse(raw: AquaListResponseRaw): AquaListResponse {
  const data = raw.data ?? raw.items ?? raw.Items ?? [];
  const totalCount = raw.totalCount ?? raw.TotalCount ?? data.length;
  const pageNumber = raw.pageNumber ?? raw.PageNumber ?? 1;
  const pageSize = raw.pageSize ?? raw.PageSize ?? data.length;
  const totalPages = Math.ceil(totalCount / Math.max(pageSize, 1));

  return {
    data,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  };
}

export const aquaCrudApi = {
  async getList(endpoint: string, params: AquaListParams): Promise<AquaListResponse> {
    const query = buildQuery(params);
    const basePath = resolveEndpointPath(endpoint);
    const response = await api.get<ApiResponse<AquaListResponseRaw>>(`${basePath}${query ? `?${query}` : ''}`);
    const raw = ensureSuccess(response, i18n.t('aqua.api.listLoadFailed', { ns: 'common' }));
    return normalizeListResponse(raw);
  },

  async create(endpoint: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/api/aqua/${endpoint}`, payload);
    return ensureSuccess(response, i18n.t('aqua.api.createFailed', { ns: 'common' }));
  },

  async update(endpoint: string, id: number, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/api/aqua/${endpoint}/${id}`, payload);
    return ensureSuccess(response, i18n.t('aqua.api.updateFailed', { ns: 'common' }));
  },

  async remove(endpoint: string, id: number): Promise<boolean> {
    const response = await api.delete<ApiResponse<boolean>>(`/api/aqua/${endpoint}/${id}`);
    return ensureSuccess(response, i18n.t('aqua.api.deleteFailed', { ns: 'common' }));
  },

  async postDocument(slug: string, id: number): Promise<boolean> {
    const response = await api.post<ApiResponse<boolean>>(`/api/aqua/posting/${slug}/${id}`);
    return ensureSuccess(response, i18n.t('aqua.api.postFailed', { ns: 'common' }));
  },
};
