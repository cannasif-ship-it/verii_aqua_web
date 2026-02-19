import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { stockApi } from '../api/stock-api';
import { queryKeys } from '../utils/query-keys';
import type { PagedParams, PagedFilter, PagedResponse } from '@/types/api';
import { normalizeQueryParams } from '@/utils/query-params';
import type { StockGetWithMainImageDto } from '../types';

export const useStockListWithImages = (
  params: PagedParams & { filters?: PagedFilter[] | Record<string, unknown> }
): UseQueryResult<PagedResponse<StockGetWithMainImageDto>, Error> => {
  return useQuery({
    queryKey: queryKeys.listWithImages(normalizeQueryParams(params)),
    queryFn: () => stockApi.getListWithImages(params),
    staleTime: 5 * 60 * 1000,
  });
};
