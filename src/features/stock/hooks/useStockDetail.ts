import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { stockApi } from '../api/stock-api';
import { queryKeys } from '../utils/query-keys';
import type { StockGetDto } from '../types';

export const useStockDetail = (id: number): UseQueryResult<StockGetDto, Error> => {
  return useQuery<StockGetDto>({
    queryKey: queryKeys.detail(id),
    queryFn: () => stockApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
