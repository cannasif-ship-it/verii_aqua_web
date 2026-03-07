import { type ReactElement, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CloudUpload, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { useStockImageUpload } from '../hooks/useStockImageUpload';
import { cn } from '@/lib/utils';

interface StockImageUploadProps {
  stockId: number;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif', 'image/webp'];

export function StockImageUpload({ stockId }: StockImageUploadProps): ReactElement {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const uploadImages = useStockImageUpload();

  useEffect(() => {
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    let invalidTypeCount = 0;
    let oversizedCount = 0;

    for (const file of files) {
      const extensionIndex = file.name.lastIndexOf('.');
      const extension = extensionIndex >= 0 ? file.name.slice(extensionIndex).toLowerCase() : '';
      const hasValidType = ALLOWED_MIME_TYPES.includes(file.type) && ALLOWED_EXTENSIONS.includes(extension);
      if (!hasValidType) {
        invalidTypeCount += 1;
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        oversizedCount += 1;
        continue;
      }

      validFiles.push(file);
    }

    if (invalidTypeCount > 0) {
      toast.error(
        t('stock.images.invalidFileType', {
          count: invalidTypeCount,
          formats: ALLOWED_EXTENSIONS.join(', ').toUpperCase(),
        })
      );
    }

    if (oversizedCount > 0) {
      toast.error(
        t('stock.images.fileTooLarge', {
          count: oversizedCount,
          maxSizeMb: MAX_IMAGE_SIZE_MB,
        })
      );
    }

    return validFiles;
  };

  const addFiles = (files: File[]) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setAltTexts((prev) => [...prev, ...validFiles.map(() => '')]);
  };

  const handleRemoveFile = (index: number): void => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setAltTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAltTextChange = (index: number, value: string): void => {
    const newAltTexts = [...altTexts];
    newAltTexts[index] = value;
    setAltTexts(newAltTexts);
  };

  const handleUpload = async (): Promise<void> => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      await uploadImages.mutateAsync({
        stockId,
        files: selectedFiles,
        altTexts: altTexts.length > 0 ? altTexts : undefined,
      });

      setSelectedFiles([]);
      setAltTexts([]);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 0) {
      addFiles(files);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
            "relative group border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300",
            isDragging 
                ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10 scale-[1.01]" 
                : "border-slate-200 dark:border-cyan-800/30 hover:border-cyan-400 hover:bg-slate-50 dark:hover:bg-blue-900/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex flex-col items-center gap-3">
            <div className={cn(
                "p-4 rounded-full bg-slate-100 dark:bg-blue-900/40 transition-colors duration-300",
                isDragging ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/60" : "group-hover:text-cyan-600 dark:group-hover:text-cyan-400 text-slate-400"
            )}>
                <CloudUpload className="h-8 w-8" />
            </div>
            <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                    {t('stock.images.upload')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {t('stock.images.uploadHint')}
                </p>
            </div>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold text-slate-500 dark:text-slate-400 pl-1 uppercase tracking-wide">
              {t('stock.images.selectedFiles')} ({selectedFiles.length})
            </Label>
          </div>

          <div className="grid gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="
                    relative flex items-start gap-4 p-4 
                    bg-white dark:bg-blue-950/40 
                    border border-slate-200 dark:border-cyan-800/30 
                    rounded-2xl shadow-sm
                    backdrop-blur-sm
                    group
                "
              >
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-100 dark:border-cyan-800/50 bg-slate-100 dark:bg-blue-950">
                    <img 
                        src={previews[index]} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0 tabular-nums">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                  </div>
                  
                  <div className="relative">
                      <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-500/70" />
                      <Input
                        type="text"
                        placeholder={t('stock.images.altText')}
                        value={altTexts[index] || ''}
                        onChange={(e) => handleAltTextChange(index, e.target.value)}
                        className="
                            h-8 pl-8 text-xs rounded-lg
                            bg-slate-50 dark:bg-blue-950/50
                            border-slate-200 dark:border-cyan-800/30
                            focus-visible:ring-1 focus-visible:ring-cyan-500
                        "
                      />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg -mt-1 -mr-1"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
                onClick={handleUpload}
                disabled={uploadImages.isPending || uploading}
                className="
                    w-full h-11 relative overflow-hidden
                    bg-linear-to-r from-cyan-600 to-blue-600 
                    hover:opacity-95
                    text-white font-bold tracking-wide rounded-xl
                    shadow-lg shadow-cyan-500/25 
                    hover:scale-[1.01] active:scale-[0.99]
                    transition-all duration-300
                    border-0
                "
            >
                {uploadImages.isPending || uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('stock.images.uploading')}
                    </>
                ) : (
                    <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {t('stock.images.uploadButton')}
                    </>
                )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}