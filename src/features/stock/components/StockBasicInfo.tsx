import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info, 
  Box, 
  Hash, 
  Building2, 
  Calendar,
  CheckCircle2,
  ListFilter,
  Copy
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StockGetDto } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StockBasicInfoProps {
  stock: StockGetDto;
}

export function StockBasicInfo({ stock }: StockBasicInfoProps): ReactElement {
  const { t, i18n } = useTranslation();

  const specialCodes = [
    { id: 1, code: stock.kod1, name: stock.kod1Adi },
    { id: 2, code: stock.kod2, name: stock.kod2Adi },
    { id: 3, code: stock.kod3, name: stock.kod4Adi }, 
    { id: 4, code: stock.kod4, name: stock.kod4Adi },
    { id: 5, code: stock.kod5, name: stock.kod5Adi },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <Alert className="bg-cyan-500/5 border-cyan-500/10 text-slate-600 dark:text-slate-400 p-3 rounded-xl">
        <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
        <AlertDescription className="text-[10px] md:text-xs font-medium leading-tight ml-2">
          {t('stock.detail.basicInfoReadonly')}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex flex-col gap-3">
            <InfoItem 
                label={t('stock.detail.erpStockCode')} 
                value={stock.erpStockCode} 
                icon={Hash}
                copyable
                featured
            />

            <InfoItem 
                label={t('stock.detail.unit')} 
                value={stock.unit} 
                icon={Box}
            />

             <InfoItem 
                label={t('stock.detail.ureticiKodu')} 
                value={stock.ureticiKodu} 
                icon={Building2}
                copyable
            />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-cyan-800/20">
        <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ListFilter className="w-3 h-3 text-cyan-500" />
            {t('stock.detail.specialCodes')}
        </h4>
        
        <div className="grid grid-cols-2 gap-2">
            {specialCodes.map((item) => (
                <div 
                    key={item.id} 
                    className="p-3 bg-white dark:bg-blue-950/40 border border-slate-100 dark:border-cyan-800/20 rounded-xl"
                >
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">KOD {item.id}</span>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate block">{item.code || '-'}</span>
                </div>
            ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-cyan-800/20">
         <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3 h-3 text-cyan-500/70" />
            <span>{t('stock.detail.created')}: {stock.createdAt ? new Date(stock.createdAt).toLocaleDateString(i18n.language) : '-'}</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
            <span>{t('stock.detail.updated')}: {stock.updatedAt ? new Date(stock.updatedAt).toLocaleDateString(i18n.language) : '-'}</span>
         </div>
      </div>

    </div>
  );
}

interface InfoItemProps {
  label: string;
  value?: string | null;
  icon?: LucideIcon;
  copyable?: boolean;
  featured?: boolean;
}

function InfoItem({ label, value, icon: Icon, copyable, featured }: InfoItemProps) {
    const { t } = useTranslation();
    const handleCopy = () => {
        if (value) {
            navigator.clipboard.writeText(value);
            toast.success(t('stock.detail.copied'));
        }
    };

    return (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-all",
            featured 
              ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800/40 shadow-sm" 
              : "bg-white dark:bg-blue-950/40 border-slate-100 dark:border-cyan-800/20"
        )}>
            <div className="flex items-center gap-3 min-w-0">
                {Icon && <Icon className={cn("w-4 h-4 shrink-0", featured ? "text-cyan-600 dark:text-cyan-500" : "text-slate-400")} />}
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className={cn("text-sm font-bold truncate", featured ? "text-cyan-900 dark:text-white" : "text-slate-900 dark:text-white")}>{value || '-'}</p>
                </div>
            </div>
            {copyable && value && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-slate-400 hover:text-cyan-600" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}
