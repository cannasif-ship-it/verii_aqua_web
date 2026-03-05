import { type ReactElement, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui-store';
import { StockTable } from './StockTable';
import { PageToolbar } from '@/components/shared/PageToolbar';
import { STOCK_QUERY_KEYS } from '../utils/query-keys';
import type { PagedFilter } from '@/types/api';

export function StockListPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('Id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setPageTitle(t('stock.list.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  useEffect(() => {
    const newFilters: PagedFilter[] = [];
    if (searchTerm) {
      newFilters.push(
        { column: 'stockName', operator: 'contains', value: searchTerm },
        { column: 'erpStockCode', operator: 'contains', value: searchTerm }
      );
    }
    setFilters(newFilters.length > 0 ? { filters: newFilters } : {});
    setPageNumber(1);
  }, [searchTerm]);

  const handleSortChange = (newSortBy: string, newSortDirection: 'asc' | 'desc'): void => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    setPageNumber(1);
  };

  const handleRowClick = (stockId: number): void => {
    navigate(`/stocks/${stockId}`);
  };

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEYS.LIST] });
    await queryClient.invalidateQueries({ queryKey: [STOCK_QUERY_KEYS.LIST_WITH_IMAGES] });
  };

  return (
    <div className="relative min-h-screen space-y-6 overflow-hidden w-full">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 pt-2">
        <div className="space-y-1">
          {/* FIX: text-white yerine text-slate-900 dark:text-white */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors">
            {t('stock.list.title')}
          </h1>
          {/* FIX: text-slate-400 yerine text-slate-500 dark:text-slate-400 */}
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 font-medium transition-colors">
            {t('stock.list.description')}
          </p>
        </div>

        <div className="w-full md:w-auto">
          <PageToolbar
            searchPlaceholder={t('stock.list.search')}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* FIX: Dış çerçevenin sabit rengi akıllı temaya geçirildi */}
      <div className="relative z-10 bg-white dark:bg-[#1a1025]/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        <StockTable
          pageNumber={pageNumber}
          pageSize={pageSize}
          sortBy={sortBy}
          sortDirection={sortDirection}
          filters={filters}
          onPageChange={setPageNumber}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}