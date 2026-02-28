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
  ListFilter
} from 'lucide-react';
import type { StockGetDto } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface StockBasicInfoProps {
  stock: StockGetDto;
}

export function StockBasicInfo({ stock }: StockBasicInfoProps): ReactElement {
  const { t, i18n } = useTranslation();

  const specialCodes = [
    { id: 1, code: stock.kod1, name: stock.kod1Adi },
    { id: 2, code: stock.kod2, name: stock.kod2Adi },
    { id: 3, code: stock.kod3, name: stock.kod4Adi }, // Verideki olası isimlendirme hatası korunmuştur
    { id: 4, code: stock.kod4, name: stock.kod4Adi },
    { id: 5, code: stock.kod5, name: stock.kod5Adi },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <Alert className="bg-pink-500/5 border-pink-500/10 text-zinc-600 dark:text-zinc-400 p-3">
        <Info className="h-4 w-4 text-pink-500" />
        <AlertDescription className="text-[10px] md:text-xs font-medium leading-tight">
          {t('stock.detail.basicInfoReadonly')}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
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

      <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ListFilter className="w-3 h-3" />
            {t('stock.detail.specialCodes')}
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2">
            {specialCodes.map((item) => (
                <div 
                    key={item.id} 
                    className="p-2 bg-white dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-lg"
                >
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">KOD {item.id}</span>
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate block">{item.code || '-'}</span>
                </div>
            ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
         <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Calendar className="w-3 h-3" />
            <span>{t('stock.detail.created')}: {stock.createdAt ? new Date(stock.createdAt).toLocaleDateString(i18n.language) : '-'}</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('stock.detail.updated')}: {stock.updatedAt ? new Date(stock.updatedAt).toLocaleDateString(i18n.language) : '-'}</span>
         </div>
      </div>

    </div>
  );
}

function InfoItem({ label, value, icon: Icon, copyable, featured }: any) {
    const handleCopy = () => {
        if (value) {
            navigator.clipboard.writeText(value);
            toast.success('Kopyalandı');
        }
    };

    return (
        <div className={cn(
            "flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-white/5",
            featured ? "bg-pink-500/5 border-pink-500/10" : "bg-white dark:bg-white/5"
        )}>
            <div className="flex items-center gap-3 min-w-0">
                {Icon && <Icon className={cn("w-4 h-4 shrink-0", featured ? "text-pink-500" : "text-slate-400")} />}
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{value || '-'}</p>
                </div>
            </div>
            {copyable && value && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleCopy}>
                    <Copy className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}