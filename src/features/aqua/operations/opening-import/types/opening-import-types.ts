export type OpeningImportTargetField =
  | 'projectCode'
  | 'projectName'
  | 'startDate'
  | 'status'
  | 'note'
  | 'cageCode'
  | 'cageName'
  | 'assignedDate'
  | 'batchCode'
  | 'fishStockCode'
  | 'fishCount'
  | 'averageGram'
  | 'warehouseCode'
  | 'asOfDate'
  | 'receiptNo'
  | 'receiptDate'
  | 'deadCount'
  | 'mortalityDate';

export interface OpeningImportTargetDefinition {
  field: OpeningImportTargetField;
  label: string;
  required?: boolean;
}

export interface OpeningImportSheetDefinition {
  sheetName: 'Projects' | 'Cages' | 'OpeningStock' | 'OpeningGoodsReceipts' | 'OpeningMortality';
  titleKey: string;
  targets: OpeningImportTargetDefinition[];
}

export interface ParsedImportSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, string | null>[];
  mappings: Record<string, OpeningImportTargetField | ''>;
}

export interface OpeningImportFieldMappingDto {
  sourceColumn: string;
  targetField: string;
}

export interface OpeningImportSheetPayloadDto {
  sheetName: string;
  rows: Record<string, string | null>[];
  mappings: OpeningImportFieldMappingDto[];
}

export interface OpeningImportPreviewRequestDto {
  fileName?: string;
  sourceSystem?: string;
  sheets: OpeningImportSheetPayloadDto[];
}

export interface OpeningImportSummaryDto {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
}

export interface OpeningImportRowResultDto {
  rowId: number;
  sheetName: string;
  rowNumber: number;
  status: string;
  messages: string[];
  rawData: Record<string, string | null>;
  normalizedData: Record<string, string | null>;
}

export interface OpeningImportPreviewResponseDto {
  jobId: number;
  status: string;
  summary: OpeningImportSummaryDto;
  rows: OpeningImportRowResultDto[];
}

export interface OpeningImportCommitResultDto {
  jobId: number;
  createdProjects: number;
  createdCages: number;
  createdProjectCages: number;
  createdFishBatches: number;
  createdGoodsReceipts: number;
  createdMortalityHeaders: number;
  createdGoodsReceiptLines: number;
  createdMortalityLines: number;
  appliedCageRows: number;
  appliedWarehouseRows: number;
  skippedRows: number;
}
