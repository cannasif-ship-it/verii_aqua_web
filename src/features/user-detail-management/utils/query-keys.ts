export const USER_DETAIL_QUERY_KEYS = {
  LIST: 'userDetailManagement.list',
  DETAIL: 'userDetailManagement.detail',
  BY_USER_ID: 'userDetailManagement.byUserId',
} as const;

export const queryKeys = {
  list: (params?: {
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: string;
    filters?: Record<string, unknown>;
  }) => [USER_DETAIL_QUERY_KEYS.LIST, params] as const,
  detail: (id: number) => [USER_DETAIL_QUERY_KEYS.DETAIL, id] as const,
  byUserId: (userId: number) => [USER_DETAIL_QUERY_KEYS.BY_USER_ID, userId] as const,
};
