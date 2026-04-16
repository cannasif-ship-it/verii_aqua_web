import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aquaQuickDailyApi } from '../api/aqua-quick-api';
import type {
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
  CreateShipmentLineWithAutoHeaderPayload,
  CreateCageWarehouseTransferLineWithAutoHeaderPayload,
  CreateWarehouseTransferLineWithAutoHeaderPayload,
  CreateWarehouseCageTransferLineWithAutoHeaderPayload,
  CreateTransferLineWithAutoHeaderPayload,
  CreateStockConvertLineWithAutoHeaderPayload,
  CreateFeedingLineWithAutoHeaderPayload,
  CreateMortalityLineWithAutoHeaderPayload,
  CreateNetOperationLineWithAutoHeaderPayload,
} from '../types/quick-daily-entry-types';

const FEEDINGS_KEY = ['aqua', 'feedings'];
const MORTALITIES_KEY = ['aqua', 'mortalities'];
const DAILY_WEATHER_KEY = ['aqua', 'dailyWeathers'];
const NET_OPERATIONS_KEY = ['aqua', 'netOperations'];
const TRANSFERS_KEY = ['aqua', 'transfers'];
const SHIPMENTS_KEY = ['aqua', 'shipments'];
const STOCK_CONVERTS_KEY = ['aqua', 'stockConverts'];
const WAREHOUSE_TRANSFERS_KEY = ['aqua', 'warehouseTransfers'];
const CAGE_WAREHOUSE_TRANSFERS_KEY = ['aqua', 'cageWarehouseTransfers'];
const WAREHOUSE_CAGE_TRANSFERS_KEY = ['aqua', 'warehouseCageTransfers'];

export function useCreateFeedingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeedingPayload) => aquaQuickDailyApi.createFeeding(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEEDINGS_KEY });
    },
  });
}

export function useCreateFeedingLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateFeedingLinePayload) =>
      aquaQuickDailyApi.createFeedingLine(payload),
  });
}

export function useCreateFeedingLineWithAutoHeaderMutation() {
  return useMutation({
    mutationFn: (payload: CreateFeedingLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createFeedingLineWithAutoHeader(payload),
  });
}

export function useCreateMortalityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMortalityPayload) => aquaQuickDailyApi.createMortality(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MORTALITIES_KEY });
    },
  });
}

export function useCreateMortalityLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateMortalityLinePayload) =>
      aquaQuickDailyApi.createMortalityLine(payload),
  });
}

export function useCreateMortalityLineWithAutoHeaderMutation() {
  return useMutation({
    mutationFn: (payload: CreateMortalityLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createMortalityLineWithAutoHeader(payload),
  });
}

export function useCreateDailyWeatherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDailyWeatherPayload) =>
      aquaQuickDailyApi.createDailyWeather(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DAILY_WEATHER_KEY });
    },
  });
}

export function useCreateNetOperationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNetOperationPayload) =>
      aquaQuickDailyApi.createNetOperation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NET_OPERATIONS_KEY });
    },
  });
}

export function useCreateNetOperationLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateNetOperationLinePayload) =>
      aquaQuickDailyApi.createNetOperationLine(payload),
  });
}

export function useCreateNetOperationLineWithAutoHeaderMutation() {
  return useMutation({
    mutationFn: (payload: CreateNetOperationLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createNetOperationLineWithAutoHeader(payload),
  });
}

export function useCreateTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) =>
      aquaQuickDailyApi.createTransfer(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useCreateTransferLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateTransferLinePayload) =>
      aquaQuickDailyApi.createTransferLine(payload),
  });
}

export function useCreateTransferLineWithAutoHeaderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createTransferLineWithAutoHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useCreateShipmentLineWithAutoHeaderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShipmentLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createShipmentLineWithAutoHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHIPMENTS_KEY });
    },
  });
}

export function useCreateCageWarehouseTransferLineWithAutoHeaderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCageWarehouseTransferLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createCageWarehouseTransferLineWithAutoHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAGE_WAREHOUSE_TRANSFERS_KEY });
    },
  });
}

export function useCreateWarehouseTransferLineWithAutoHeaderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehouseTransferLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createWarehouseTransferLineWithAutoHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WAREHOUSE_TRANSFERS_KEY });
    },
  });
}

export function useCreateWarehouseCageTransferLineWithAutoHeaderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehouseCageTransferLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createWarehouseCageTransferLineWithAutoHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WAREHOUSE_CAGE_TRANSFERS_KEY });
    },
  });
}

export function useCreateStockConvertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockConvertPayload) =>
      aquaQuickDailyApi.createStockConvert(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STOCK_CONVERTS_KEY });
    },
  });
}

export function useCreateStockConvertLineMutation() {
  return useMutation({
    mutationFn: (payload: CreateStockConvertLinePayload) =>
      aquaQuickDailyApi.createStockConvertLine(payload),
  });
}

export function useCreateStockConvertLineWithAutoHeaderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockConvertLineWithAutoHeaderPayload) =>
      aquaQuickDailyApi.createStockConvertLineWithAutoHeader(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STOCK_CONVERTS_KEY });
    },
  });
}
