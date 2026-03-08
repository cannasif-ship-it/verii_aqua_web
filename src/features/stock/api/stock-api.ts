import { api } from '@/lib/axios';
import i18n from '@/lib/i18n';
import type { ApiResponse, PagedResponse, PagedParams, PagedFilter } from '@/types/api';
import type {
  StockGetDto,
  StockGetWithMainImageDto,
  StockDetailGetDto,
  StockDetailCreateDto,
  StockDetailUpdateDto,
  StockImageDto,
  StockRelationDto,
  StockRelationCreateDto,
} from '../types';

export const stockApi = {
  getList: async (params: PagedParams & { filters?: PagedFilter[] | Record<string, unknown> }): Promise<PagedResponse<StockGetDto>> => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append('page', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.filters) {
      queryParams.append('filters', JSON.stringify(params.filters));
      queryParams.append('filterLogic', params.filterLogic ?? 'and');
    }

    const response = await api.get<ApiResponse<PagedResponse<StockGetDto>>>(
      `/api/Stock?${queryParams.toString()}`
    );
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.listLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    const pagedData = response.data;
    
    const rawData = pagedData as unknown as { items?: StockGetWithMainImageDto[], data?: StockGetWithMainImageDto[] };
    if (rawData.items && !rawData.data) {
      return {
        ...pagedData,
        data: rawData.items,
      };
    }
    
    return pagedData;
  },

  getById: async (id: number): Promise<StockGetDto> => {
    const response = await api.get<ApiResponse<StockGetDto>>(`/api/Stock/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.detailLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    return response.data;
  },

  getDetail: async (stockId: number): Promise<StockDetailGetDto | null> => {
    const response = await api.get<ApiResponse<StockDetailGetDto>>(`/api/StockDetail/stock/${stockId}`);
    
    if (response.statusCode === 404) {
      return null;
    }

    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.detailLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      return null;
    }

    return response.data;
  },

  createDetail: async (data: StockDetailCreateDto): Promise<StockDetailGetDto> => {
    const response = await api.post<ApiResponse<StockDetailGetDto>>('/api/StockDetail', data);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.createFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    return response.data;
  },

  updateDetail: async (id: number, data: StockDetailUpdateDto): Promise<StockDetailGetDto> => {
    const response = await api.put<ApiResponse<StockDetailGetDto>>(`/api/StockDetail/${id}`, data);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.updateFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    return response.data;
  },

  uploadImages: async (stockId: number, files: File[], altTexts?: string[]): Promise<StockImageDto[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (altTexts) {
      altTexts.forEach((text, index) => {
        formData.append(`altTexts[${index}]`, text);
      });
    }

    const response = await api.post<ApiResponse<StockImageDto[]>>(
      `/api/StockImage/upload/${stockId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.imagesLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    return response.data;
  },

  getImages: async (stockId: number): Promise<StockImageDto[]> => {
    const response = await api.get<ApiResponse<StockImageDto[]>>(`/api/StockImage/by-stock/${stockId}`);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.imagesLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      return [];
    }

    return response.data;
  },

  deleteImage: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<object>>(`/api/StockImage/${id}`);
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.imageDeleteFailed', { ns: 'stock' }));
    }
  },

  setPrimaryImage: async (id: number): Promise<StockImageDto> => {
    const response = await api.put<ApiResponse<StockImageDto>>(`/api/StockImage/set-primary/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.primaryImageSetFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    return response.data;
  },

  getRelations: async (stockId: number): Promise<StockRelationDto[]> => {
    const response = await api.get<ApiResponse<StockRelationDto[]>>(`/api/StockRelation/by-stock/${stockId}`);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.relationsLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      return [];
    }

    return response.data;
  },

  createRelation: async (data: StockRelationCreateDto): Promise<StockRelationDto> => {
    const response = await api.post<ApiResponse<StockRelationDto>>('/api/StockRelation', data);
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.relationCreateFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    return response.data;
  },

  deleteRelation: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<object>>(`/api/StockRelation/${id}`);
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.relationDeleteFailed', { ns: 'stock' }));
    }
  },

  getListWithImages: async (params: PagedParams & { filters?: PagedFilter[] | Record<string, unknown> }): Promise<PagedResponse<StockGetWithMainImageDto>> => {
    const queryParams = new URLSearchParams();
    if (params.pageNumber) queryParams.append('page', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.filters) {
      queryParams.append('filters', JSON.stringify(params.filters));
      queryParams.append('filterLogic', params.filterLogic ?? 'and');
    }

    const response = await api.get<ApiResponse<PagedResponse<StockGetWithMainImageDto>>>(
      `/api/Stock/withImages?${queryParams.toString()}`
    );
    
    if (!response.success) {
      throw new Error(response.message || i18n.t('stock.api.visualListLoadFailed', { ns: 'stock' }));
    }

    if (!response.data) {
      throw new Error(i18n.t('stock.api.dataUnavailable', { ns: 'stock' }));
    }

    const pagedData = response.data;
    
    const rawData = pagedData as unknown as { items?: StockGetWithMainImageDto[], data?: StockGetWithMainImageDto[] };
    
    if (rawData.items && !rawData.data) {
      return {
        ...pagedData,
        data: rawData.items,
      };
    }
    
    return pagedData;
  },
};
