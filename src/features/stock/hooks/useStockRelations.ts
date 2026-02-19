import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { stockApi } from '../api/stock-api';
import { queryKeys } from '../utils/query-keys';
import type { StockRelationDto } from '../types';

export const useStockRelations = (stockId: number): UseQueryResult<StockRelationDto[], Error> => {
  return useQuery<StockRelationDto[]>({
    queryKey: queryKeys.relations(stockId),
    queryFn: () => stockApi.getRelations(stockId),
    enabled: !!stockId,
    staleTime: 5 * 60 * 1000,
  });
};
