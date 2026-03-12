import type { PagedParams } from '@/types/api';

export const USER_MANAGEMENT_QUERY_KEYS = {
  LIST: 'userManagement.list',
  DETAIL: 'userManagement.detail',
  STATS: 'userManagement.stats',
} as const;

export const queryKeys = {
  all: () => [USER_MANAGEMENT_QUERY_KEYS.LIST] as const,
  list: (params?: PagedParams) => [USER_MANAGEMENT_QUERY_KEYS.LIST, params] as const,
  detail: (id: number) => [USER_MANAGEMENT_QUERY_KEYS.DETAIL, id] as const,
  stats: () => [USER_MANAGEMENT_QUERY_KEYS.STATS] as const,
};
