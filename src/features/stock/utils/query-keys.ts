export const STOCK_QUERY_KEYS = {
  LIST: 'stock.list',
  LIST_WITH_IMAGES: 'stock.list.withImages',
  DETAIL: 'stock.detail',
  DETAIL_BY_STOCK: 'stock.detail.byStock',
  IMAGES: 'stock.images',
  RELATIONS: 'stock.relations',
} as const;

export const queryKeys = {
  list: (params?: {
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: string;
    filters?: Record<string, unknown>;
  }) => [STOCK_QUERY_KEYS.LIST, params] as const,
  listWithImages: (params?: {
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: string;
    filters?: Record<string, unknown>;
  }) => [STOCK_QUERY_KEYS.LIST_WITH_IMAGES, params] as const,
  detail: (id: number) => [STOCK_QUERY_KEYS.DETAIL, id] as const,
  detailByStock: (stockId: number) => [STOCK_QUERY_KEYS.DETAIL_BY_STOCK, stockId] as const,
  images: (stockId: number) => [STOCK_QUERY_KEYS.IMAGES, stockId] as const,
  relations: (stockId: number) => [STOCK_QUERY_KEYS.RELATIONS, stockId] as const,
};
