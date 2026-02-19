import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { stockApi } from '../api/stock-api';
import { queryKeys } from '../utils/query-keys';
import type { StockDetailGetDto } from '../types';

export const useStockDetailQuery = (stockId: number): UseQueryResult<StockDetailGetDto | null, Error> => {
  return useQuery<StockDetailGetDto | null>({
    queryKey: queryKeys.detailByStock(stockId),
    queryFn: () => stockApi.getDetail(stockId),
    enabled: !!stockId,
    staleTime: 5 * 60 * 1000,
  });
};
