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
}

export interface StockDto {
  id: number;
  code?: string;
  name?: string;
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
}

export interface WeatherTypeDto {
  id: number;
  severityId?: number;
  code?: string;
  name?: string;
}

export interface NetOperationTypeDto {
  id: number;
  code?: string;
  name?: string;
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
  projectCageId: number;
  stockId: number;
  qtyUnit: number;
}

export interface CreateMortalityPayload {
  projectId: number;
  mortalityNo: string;
  mortalityDate: string;
  status?: number;
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
  projectCageId: number;
  operationTypeId: number;
  operationNo: string;
  operationDate: string;
  note?: string;
}
