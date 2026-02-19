import { api } from '@/lib/axios';
import type { ApiResponse, PagedParams, PagedResponse } from '@/types/api';
import type { UserAuthorityDto } from '../types/user-types';

function toPagedData<T>(raw: { items?: T[]; data?: T[] } & PagedResponse<T>): PagedResponse<T> {
  const list = raw.items ?? raw.data ?? [];
  return { ...raw, data: list };
}

export const userAuthorityApi = {
  getList: async (params: PagedParams): Promise<PagedResponse<UserAuthorityDto>> => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber != null) queryParams.append('pageNumber', String(params.pageNumber));
    if (params.pageSize != null) queryParams.append('pageSize', String(params.pageSize));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    const response = await api.get<ApiResponse<PagedResponse<UserAuthorityDto>>>(
      `/api/UserAuthority?${queryParams.toString()}`
    );
    if (response.success && response.data) {
      return toPagedData(response.data as { items?: UserAuthorityDto[] } & PagedResponse<UserAuthorityDto>);
    }
    throw new Error(response.message ?? 'Role list could not be loaded');
  },
};
