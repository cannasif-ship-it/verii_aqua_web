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
      <ChevronUp className="ml-1.5 w-3.5 h-3.5 text-pink-500 animate-in fade-in zoom-in" /> : 
      <ChevronDown className="ml-1.5 w-3.5 h-3.5 text-pink-500 animate-in fade-in zoom-in" />;
  };

  if (isLoading || isFetching) {
    return (
      <div className="bg-transparent">
        <div className="p-4 space-y-4">
           <div className="flex justify-between px-4 pb-2 border-b border-white/5">
              <Skeleton className="h-4 w-1/4 bg-white/5" />
              <Skeleton className="h-4 w-1/4 bg-white/5" />
              <Skeleton className="h-4 w-1/4 bg-white/5" />
           </div>
           {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 px-4">
                 <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
              </div>
           ))}
        </div>
      </div>
    );
  }

  const stocks = data?.data || [];

  if (!data || stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/2">
        <div className="p-4 bg-white/5 rounded-full shadow-sm mb-4">
            <PackageOpen size={48} className="text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('stock.list.noData')}</h3>
        <p className="text-sm max-w-xs text-center mt-1">Arama kriterlerinize uygun stok kaydı mevcut değil.</p>
      </div>
    );
  }

  const totalPages = Math.ceil((data.totalCount || 0) / pageSize);

  return (
    <div className="bg-transparent">
      <Table>
        <TableHeader className="bg-white/2">
          <TableRow className="hover:bg-transparent border-b border-white/5">
            {[
              { id: 'Id', label: t('stock.list.id'), className: "w-[80px]" },
              { id: 'ErpStockCode', label: t('stock.list.erpStockCode') },
              { id: 'StockName', label: t('stock.list.stockName') }
            ].map((col) => (
              <TableHead 
                key={col.id}
                className={cn(
                    "group cursor-pointer select-none py-4 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors",
                    col.className
                )}
                onClick={() => handleSort(col.id)}
              >
                <div className="flex items-center">
                  {col.label} <SortIcon column={col.id} />
                </div>
              </TableHead>
            ))}
            
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-[100px]">
              {t('stock.list.unit')}
            </TableHead>
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right w-[80px]">
              {t('stock.list.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {stocks.map((stock: StockGetDto) => (
            <TableRow
              key={stock.id}
              className="group cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors duration-200"
              onClick={() => onRowClick(stock.id)}
            >
              <TableCell className="font-mono text-xs text-slate-500 group-hover:text-slate-400">
                #{stock.id}
              </TableCell>
              
              <TableCell className="font-semibold text-sm text-slate-200 group-hover:text-pink-400 transition-colors">
                {stock.erpStockCode || '-'}
              </TableCell>
              
              <TableCell className="text-sm text-slate-300 font-medium">
                {stock.stockName || '-'}
              </TableCell>
              
              <TableCell className="text-center">
                <Badge className="bg-white/5 text-slate-300 hover:bg-white/10 border-0 rounded-md px-3 font-medium">
                  {stock.unit || '-'}
                </Badge>
              </TableCell>
              
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 opacity-70 group-hover:opacity-100 transition-all"
                  onClick={(e) => { e.stopPropagation(); onRowClick(stock.id); }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-[#0b0713]/50 border-t border-white/5 gap-4">
        <div className="text-xs text-slate-400 font-medium">
            {t('stock.list.total')} <span className="font-bold text-white mx-1">{data.totalCount || 0}</span> {t('stock.list.recordsListed')}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs bg-transparent border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            {t('stock.list.previous')}
          </Button>
          
          <div className="text-xs font-semibold bg-white/5 px-3 py-1.5 rounded-md min-w-12 text-center text-white">
            {pageNumber} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs bg-transparent border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages}
          >
            {t('stock.list.next')}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}