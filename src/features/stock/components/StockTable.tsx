import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useStockList } from '../hooks/useStockList';
import { ChevronUp, ChevronDown, ChevronsUpDown, PackageOpen, Eye, ArrowRight, ArrowLeft } from 'lucide-react';
import type { PagedFilter } from '@/types/api';
import { cn } from '@/lib/utils';
import type { StockGetDto } from '../types';

interface StockTableProps {
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: PagedFilter[] | Record<string, unknown>;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  onRowClick: (stockId: number) => void;
}

export function StockTable({
  pageNumber,
  pageSize,
  sortBy = 'Id',
  sortDirection = 'desc',
  filters = {},
  onPageChange,
  onSortChange,
  onRowClick,
}: StockTableProps): ReactElement {
  const { t } = useTranslation();

  const { data, isLoading, isFetching } = useStockList({
    pageNumber,
    pageSize,
    sortBy,
    sortDirection,
    filters: filters as PagedFilter[] | undefined,
  });

  const handleSort = (column: string): void => {
    const newDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newDirection);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronsUpDown className="ml-1.5 w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="ml-1.5 w-3.5 h-3.5 text-pink-600 dark:text-pink-500 animate-in fade-in zoom-in" /> : 
      <ChevronDown className="ml-1.5 w-3.5 h-3.5 text-pink-600 dark:text-pink-500 animate-in fade-in zoom-in" />;
  };

  if (isLoading || isFetching) {
    return (
      <div className="bg-transparent">
        <div className="p-4 space-y-4">
           <div className="flex justify-between px-4 pb-2 border-b border-slate-100 dark:border-white/5">
              <Skeleton className="h-4 w-1/4 bg-slate-100 dark:bg-white/5" />
              <Skeleton className="h-4 w-1/4 bg-slate-100 dark:bg-white/5" />
              <Skeleton className="h-4 w-1/4 bg-slate-100 dark:bg-white/5" />
           </div>
           {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 px-4">
                 <Skeleton className="h-12 w-full rounded-xl bg-slate-50 dark:bg-white/5" />
              </div>
           ))}
        </div>
      </div>
    );
  }

  const stocks = data?.data || [];

  if (!data || stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-white/2">
        <div className="p-4 bg-white dark:bg-white/5 rounded-full shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent mb-4">
            <PackageOpen size={48} className="text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('stock.list.noData')}</h3>
        <p className="text-sm max-w-xs text-center mt-1 text-slate-500 dark:text-slate-400">Arama kriterlerinize uygun stok kaydı mevcut değil.</p>
      </div>
    );
  }

  const totalPages = Math.ceil((data.totalCount || 0) / pageSize);

  return (
    <div className="bg-transparent flex flex-col min-h-0">
      <div className="overflow-x-auto min-h-[300px] custom-scrollbar">
        <Table className="w-full text-sm">
          <TableHeader className="bg-slate-50/80 dark:bg-white/2 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-white/5">
              {[
                { id: 'Id', label: t('stock.list.id'), className: "w-[80px]" },
                { id: 'ErpStockCode', label: t('stock.list.erpStockCode') },
                { id: 'StockName', label: t('stock.list.stockName') }
              ].map((col) => (
                <TableHead 
                  key={col.id}
                  className={cn(
                      "group cursor-pointer select-none py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap",
                      col.className
                  )}
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center">
                    {col.label} <SortIcon column={col.id} />
                  </div>
                </TableHead>
              ))}
              
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-[100px] whitespace-nowrap">
                {t('stock.list.unit')}
              </TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-[80px] whitespace-nowrap">
                {t('stock.list.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {stocks.map((stock: StockGetDto) => (
              <TableRow
                key={stock.id}
                className="group cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/80 dark:hover:bg-white/2 transition-colors duration-200"
                onClick={() => onRowClick(stock.id)}
              >
                <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400 transition-colors">
                  #{stock.id}
                </TableCell>
                
                <TableCell className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  {stock.erpStockCode || '-'}
                </TableCell>
                
                <TableCell className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {stock.stockName || '-'}
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 border-0 rounded-md px-3 font-medium">
                    {stock.unit || '-'}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:text-pink-400 dark:hover:bg-pink-500/10 opacity-70 group-hover:opacity-100 transition-all"
                    onClick={(e) => { e.stopPropagation(); onRowClick(stock.id); }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer - Tam Uyumlu */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-slate-50/80 dark:bg-[#0b0713]/50 border-t border-slate-200 dark:border-white/5 gap-4 shrink-0">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('stock.list.total')} <span className="font-bold text-slate-900 dark:text-white mx-1">{data.totalCount || 0}</span> {t('stock.list.recordsListed')}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-transparent dark:border-white/10 dark:text-white dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            {t('stock.list.previous', { defaultValue: 'Önceki' })}
          </Button>
          
          <div className="text-xs font-semibold bg-white border border-slate-200 text-slate-800 dark:bg-white/5 dark:border-transparent px-3 py-1.5 rounded-md min-w-12 text-center dark:text-white shadow-sm dark:shadow-none">
            {pageNumber} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-transparent dark:border-white/10 dark:text-white dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
          >
            {t('stock.list.next', { defaultValue: 'Sonraki' })}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
