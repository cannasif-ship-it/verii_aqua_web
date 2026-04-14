import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { CreateProjectMergeDto, ProjectMergeDto } from '../types/projectMerge';

interface PagedResultRaw<T> {
  items?: T[];
  Items?: T[];
  data?: T[];
  Data?: T[];
}

function getErrorMessage(response: ApiResponse<unknown>, fallback: string): string {
  if (response.message?.trim()) return response.message;
  if (response.errors?.length) return response.errors.join(' ');
  return fallback;
}

function extractPagedItems<T>(raw: PagedResultRaw<T>): T[] {
  return raw.items ?? raw.Items ?? raw.data ?? raw.Data ?? [];
}

export const projectMergeApi = {
  getList: async (): Promise<ProjectMergeDto[]> => {
    const query = new URLSearchParams({
      pageNumber: '1',
      pageSize: '100',
      sortBy: 'MergeDate',
      sortDirection: 'desc',
    });
    const response = await api.get<ApiResponse<PagedResultRaw<ProjectMergeDto>>>(`/api/aqua/ProjectMerge?${query.toString()}`);
    if (response.success === true && response.data) {
      return extractPagedItems(response.data);
    }
    throw new Error(getErrorMessage(response, 'Project merge list could not be loaded.'));
  },

  create: async (data: CreateProjectMergeDto): Promise<ProjectMergeDto> => {
    const response = await api.post<ApiResponse<ProjectMergeDto>>('/api/aqua/ProjectMerge', data);
    if (response.success === true && response.data) {
      return response.data;
    }
    throw new Error(getErrorMessage(response, 'Project merge could not be completed.'));
  },
};
