import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star, Trash2, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStockImages } from '../hooks/useStockImages';
import { useStockImageDelete } from '../hooks/useStockImageDelete';
import { useStockImageSetPrimary } from '../hooks/useStockImageSetPrimary';
import { getImageUrl } from '../utils/image-url';
import type { StockImageDto } from '../types';

interface StockImageListProps {
  stockId: number;
}

export function StockImageList({ stockId }: StockImageListProps): ReactElement {
  const { t } = useTranslation();
  const { data: images, isLoading, isFetching } = useStockImages(stockId);
  const deleteImage = useStockImageDelete();
  const setPrimary = useStockImageSetPrimary();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<StockImageDto | null>(null);

  const handleDeleteClick = (image: StockImageDto): void => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (imageToDelete) {
      await deleteImage.mutateAsync({
        id: imageToDelete.id,
        stockId,
      });
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const handleSetPrimary = async (image: StockImageDto): Promise<void> => {
    await setPrimary.mutateAsync({
      id: image.id,
      stockId,
    });
  };

  if (isLoading || isFetching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
             <Skeleton className="h-48 w-full rounded-2xl bg-slate-100 dark:bg-blue-900/20" />
             <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg bg-slate-100 dark:bg-blue-900/20" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-1/2 rounded-lg bg-slate-100 dark:bg-blue-900/20" />
                    <Skeleton className="h-8 w-1/2 rounded-lg bg-slate-100 dark:bg-blue-900/20" />
                </div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-cyan-800/30 rounded-2xl bg-slate-50/50 dark:bg-blue-950/20 transition-all hover:bg-slate-50 dark:hover:bg-blue-900/20">
        <div className="p-4 bg-white dark:bg-blue-900/40 rounded-full shadow-sm mb-4">
            <ImageIcon className="h-8 w-8 text-slate-400 dark:text-cyan-500/50" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {t('stock.images.noImages')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs font-medium">
            {t('stock.images.noImagesDesc')}
        </p>
      </div>
    );
  }

  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {sortedImages.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all duration-300 overflow-hidden flex flex-col"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-blue-950">
                {image.isPrimary && (
                  <Badge
                    className="absolute top-3 left-3 z-10 bg-linear-to-r from-cyan-600 to-blue-600 border-0 shadow-lg shadow-cyan-500/30 text-white px-3 py-1 font-bold rounded-lg"
                  >
                    <Star className="h-3 w-3 mr-1.5 fill-white" />
                    {t('stock.images.primary')}
                  </Badge>
                )}
                
                <img
                  src={getImageUrl(image.filePath) || ''}
                  alt={image.altText || image.stockName || 'Stock image'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="12" font-weight="bold"%3EGörsel Yok%3C/text%3E%3C/svg%3E';
                  }}
                />
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-blue-900/10 transition-colors duration-300" />
            </div>

            <div className="p-4 space-y-4 flex flex-col flex-1 bg-white dark:bg-blue-950/40 backdrop-blur-sm">
              <div className="relative">
                  <Input
                    type="text"
                    value={image.altText || ''}
                    readOnly
                    className="
                        h-8 text-xs font-medium rounded-lg
                        bg-slate-50 dark:bg-blue-950/50 
                        border-slate-200 dark:border-cyan-800/30
                        focus-visible:ring-0
                        text-slate-600 dark:text-slate-300
                    "
                    placeholder={t('stock.images.altText')}
                  />
              </div>

              <div className="flex gap-2 mt-auto">
                {!image.isPrimary ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs font-bold border-slate-200 dark:border-cyan-800/50 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-all rounded-xl"
                    onClick={() => handleSetPrimary(image)}
                    disabled={setPrimary.isPending}
                  >
                    {setPrimary.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <>
                            <Star className="h-3 w-3 mr-1.5" />
                            {t('stock.images.setPrimary')}
                        </>
                    )}
                  </Button>
                ) : (
                    <div className="flex-1 flex items-center justify-center h-9 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        {t('stock.images.isPrimary')}
                    </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  onClick={() => handleDeleteClick(image)}
                  disabled={deleteImage.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-[425px] bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 rounded-2xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <AlertTriangle className="h-6 w-6" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                      {t('stock.images.deleteConfirm')}
                  </DialogTitle>
              </div>
              <DialogDescription className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {t('stock.images.deleteConfirmMessage')}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="bg-slate-50 dark:bg-blue-950/50 px-6 py-4 border-t border-slate-100 dark:border-cyan-800/30 gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteImage.isPending}
              className="rounded-xl font-bold border-slate-200 dark:border-cyan-800/50"
            >
              {t('stock.images.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteImage.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-500/20 border-0"
            >
              {deleteImage.isPending ? (
                 <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('stock.images.deleting')}
                  </>
                ) : (
                 t('stock.images.confirmDelete')
                )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}