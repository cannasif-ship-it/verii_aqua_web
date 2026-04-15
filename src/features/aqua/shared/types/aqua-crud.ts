import type { PagedParams, PagedResponse } from '@/types/api';

export type AquaFieldType = 'text' | 'number' | 'date' | 'datetime' | 'textarea' | 'select';

export interface AquaFieldOption {
  label: string;
  value: string | number;
}

export interface AquaFieldLookupConfig {
  endpoint: string;
  labelKey?: string;
  labelKeys?: string[];
  labelSeparator?: string;
  valueKey: string;
  staleTimeMs: number;
  dependsOnFieldKey?: string;
  filterColumn?: string;
  clientFilterColumn?: string;
  includeNullClientFilterMatch?: boolean;
  contextFilters?: Array<{
    sourceKey: string;
    column: string;
    operator?: string;
  }>;
}

export interface AquaFieldConfig {
  key: string;
  label: string;
  type: AquaFieldType;
  required?: boolean;
  hideInForm?: boolean;
  hideOnEdit?: boolean;
  placeholder?: string;
  numberStep?: string;
  numberMin?: number;
  numberMax?: number;
  options?: AquaFieldOption[];
  lookup?: AquaFieldLookupConfig;
  visibleWhen?: {
    fieldKey: string;
    values: Array<string | number | boolean>;
  };
}

export interface AquaColumnConfig {
  key: string;
  label: string;
}

export interface AquaCrudConfig {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  createEndpoint?: string;
  listStaleTimeMs: number;
  fields: AquaFieldConfig[];
  columns?: AquaColumnConfig[];
  defaultValues?: Record<string, unknown>;
  readOnly?: boolean;
  prepareSubmitPayload?: (args: {
    payload: Record<string, unknown>;
    formValues: Record<string, unknown>;
    editingRow: Record<string, unknown> | null;
    mode: 'create' | 'update';
  }) => Promise<Record<string, unknown>> | Record<string, unknown>;
  postingSlug?: 'goods-receipt' | 'transfer' | 'shipment' | 'warehouse-transfer' | 'cage-warehouse-transfer' | 'warehouse-cage-transfer' | 'mortality' | 'weighing' | 'stock-convert' | 'net-operation';
  autoPostOnSave?: boolean;
}

export interface AquaCrudContextFilter {
  fieldKey: string;
  value: number | null;
  lockValue?: boolean;
  hideFieldInForm?: boolean;
}

export interface AquaListParams extends PagedParams {}

export type AquaListResponse = PagedResponse<Record<string, unknown>>;
