export interface ProjectDto {
  id: number;
  projectCode: string;
  projectName: string;
}

export interface ProjectCageDto {
  id: number;
  cageId: number;
  projectId: number;
  cageCode?: string;
  cageName?: string;
  releasedDate?: string | null;
}

export interface StockDto {
  id: number;
  code?: string;
  name?: string;
}

export interface WarehouseDto {
  id: number;
  erpWarehouseCode: number;
  warehouseName: string;
  branchCode?: number;
}

export interface FishBatchDto {
  id: number;
  fishStockId?: number;
  currentAverageGram?: number;
}

export interface WeatherSeverityDto {
  id: number;
  code?: string;
  name?: string;
  score?: number;
  weatherTypeId?: number | null;
  weatherTypeCode?: string | null;
  weatherTypeName?: string | null;
}

export interface WeatherTypeDto {
  id: number;
  code?: string;
  name?: string;
}

export interface NetOperationTypeDto {
  id: number;
  code?: string;
  name?: string;
}

export interface FeedingHeaderDto {
  id: number;
  projectId: number;
  feedingDate: string;
  feedingSlot?: number;
}

export interface MortalityHeaderDto {
  id: number;
  projectId: number;
  mortalityDate: string;
  status?: number;
}

export interface NetOperationHeaderDto {
  id: number;
  projectId: number;
  operationDate: string;
  operationTypeId?: number;
  status?: number;
}

export interface ActiveCageBatchSnapshot {
  fishBatchId: number;
  liveCount: number;
  averageGram: number;
  biomassGram: number;
  batchCode?: string;
}

export interface ActiveWarehouseBatchSnapshot {
  warehouseId: number;
  fishBatchId: number;
  liveCount: number;
  averageGram: number;
  biomassGram: number;
  batchCode?: string;
  warehouseCode?: number;
  warehouseName?: string;
}

export interface CreateFeedingPayload {
  projectId: number;
  feedingNo: string;
  feedingDate: string;
  feedingSlot: number;
  sourceType?: number;
  status?: number;
}

export interface CreateFeedingLinePayload {
  feedingId: number;
  projectId?: number;
  feedingDate?: string;
  feedingSlot?: number;
  sourceType?: number;
  status?: number;
  feedingNo?: string;
  note?: string;
  stockId: number;
  qtyUnit: number;
  gramPerUnit: number;
  totalGram: number;
}

export interface CreateMortalityPayload {
  projectId: number;
  mortalityDate: string;
  status?: number;
  note?: string;
}

export interface CreateMortalityLinePayload {
  mortalityId: number;
  fishBatchId: number;
  projectCageId: number;
  deadCount: number;
}

export interface CreateDailyWeatherPayload {
  projectId: number;
  weatherDate: string;
  weatherSeverityId: number;
  weatherTypeId: number;
  note?: string;
}

export interface CreateNetOperationPayload {
  projectId: number;
  operationTypeId: number;
  operationNo: string;
  operationDate: string;
  status?: number;
  note?: string;
}

export interface CreateNetOperationLinePayload {
  netOperationId: number;
  projectCageId: number;
  fishBatchId?: number;
  note?: string;
}

export interface CreateTransferPayload {
  projectId: number;
  transferNo: string;
  transferDate: string;
  status?: number;
  note?: string;
}

export interface CreateTransferLinePayload {
  transferId: number;
  fishBatchId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount: number;
  averageGram: number;
  biomassGram: number;
}

export interface CreateStockConvertPayload {
  projectId: number;
  convertNo: string;
  convertDate: string;
  status?: number;
  note?: string;
}

export interface CreateStockConvertLinePayload {
  stockConvertId: number;
  fromFishBatchId: number;
  toFishBatchId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount: number;
  averageGram: number;
  newAverageGram: number;
  biomassGram: number;
}

export interface CreateShipmentLineWithAutoHeaderPayload {
  projectId: number;
  shipmentDate: string;
  targetWarehouseId?: number;
  fishBatchId: number;
  fromProjectCageId: number;
  fishCount: number;
  averageGram: number;
  biomassGram: number;
  currencyCode?: string;
  unitPrice?: number;
  description?: string;
}

export interface CreateCageWarehouseTransferLineWithAutoHeaderPayload {
  projectId: number;
  transferDate: string;
  fishBatchId: number;
  fromProjectCageId: number;
  toWarehouseId: number;
  fishCount: number;
  averageGram: number;
  biomassGram: number;
}

export interface CreateWarehouseTransferLineWithAutoHeaderPayload {
  projectId: number;
  transferDate: string;
  fishBatchId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  fishCount: number;
  averageGram: number;
  biomassGram: number;
}

export interface CreateWarehouseCageTransferLineWithAutoHeaderPayload {
  projectId: number;
  transferDate: string;
  fishBatchId: number;
  fromWarehouseId: number;
  toProjectCageId: number;
  fishCount: number;
  averageGram: number;
  biomassGram: number;
}

export interface CreateTransferLineWithAutoHeaderPayload {
  projectId: number;
  transferDate: string;
  fishBatchId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount: number;
  averageGram: number;
  biomassGram: number;
}

export interface CreateStockConvertLineWithAutoHeaderPayload {
  projectId: number;
  convertDate: string;
  fromFishBatchId: number;
  toFishBatchId: number;
  fromProjectCageId: number;
  toProjectCageId: number;
  fishCount: number;
  averageGram: number;
  newAverageGram: number;
  biomassGram: number;
}

export interface CreateFeedingLineWithAutoHeaderPayload {
  projectId: number;
  feedingDate: string;
  feedingSlot: number;
  sourceType?: number;
  note?: string;
  stockId: number;
  qtyUnit: number;
  gramPerUnit: number;
  totalGram: number;
}

export interface CreateMortalityLineWithAutoHeaderPayload {
  projectId: number;
  mortalityDate: string;
  fishBatchId: number;
  projectCageId: number;
  deadCount: number;
}

export interface CreateNetOperationLineWithAutoHeaderPayload {
  projectId: number;
  operationDate: string;
  operationTypeId: number;
  projectCageId: number;
  fishBatchId?: number;
  note?: string;
}
