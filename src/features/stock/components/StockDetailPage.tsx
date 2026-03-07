import { type ReactElement, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Box, Image as ImageIcon, Layers, Info, PackageOpen, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockDetail } from '../hooks/useStockDetail';
import { StockBasicInfo } from './StockBasicInfo';
import { StockDetailForm } from './StockDetailForm';
import { StockImageUpload } from './StockImageUpload';
import { StockImageList } from './StockImageList';
import { StockRelationForm } from './StockRelationForm';
import { StockRelationList } from './StockRelationList';

export function StockDetailPage(): ReactElement {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle } = useUIStore();
  const [activeTab, setActiveTab] = useState('basic');
  const stockId = id ? parseInt(id, 10) : 0;

  const { data: stock, isLoading } = useStockDetail(stockId);

  useEffect(() => {
    if (stock) setPageTitle(t('stock.detail.title'));
    return () => setPageTitle(null);
  }, [stock, t, setPageTitle]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-200 dark:bg-cyan-800/20" />
          <div className="space-y-2">
             <Skeleton className="h-6 w-32 md:w-48 bg-slate-200 dark:bg-cyan-800/20" />
             <Skeleton className="h-4 w-24 md:w-32 bg-slate-200 dark:bg-cyan-800/20" />
          </div>
        </div>
        <Skeleton className="h-[400px] md:h-[500px] w-full rounded-3xl bg-slate-200 dark:bg-cyan-800/20" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 px-4">
        <div className="relative bg-slate-100 dark:bg-blue-950/40 p-6 rounded-full border border-slate-200 dark:border-cyan-800/30 shadow-xl">
          <PackageOpen className="h-10 w-10 text-cyan-600 dark:text-cyan-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('stock.detail.notFound')}</h2>
        <Button onClick={() => navigate('/stocks')} className="bg-cyan-600 text-white dark:bg-cyan-500 dark:text-white rounded-full px-8 w-full md:w-auto hover:bg-cyan-700 dark:hover:bg-cyan-600">
          {t('stock.detail.backToStockList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 md:space-y-8 pb-10 px-0 md:px-4">
      <div className="flex items-center gap-4 md:gap-5 px-4 md:px-0">
        <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/stocks')}
            className="group h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl md:rounded-2xl bg-white dark:bg-blue-950/50 border-slate-200 dark:border-cyan-800/30 hover:bg-slate-50 dark:hover:bg-blue-900/50 transition-colors"
        >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-500 transition-colors" />
        </Button>
        <div className="space-y-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 md:gap-3 truncate">
                <span className="truncate">{stock.stockName}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                <Box className="w-3 h-3 md:w-4 md:h-4 text-cyan-600 dark:text-cyan-500 shrink-0" />
                <span className="truncate">{stock.erpStockCode || 'Kod Yok'}</span>
            </div>
        </div>
      </div>

      <div className="relative bg-white dark:bg-blue-950/60 backdrop-blur-xl border-y md:border border-slate-200 dark:border-cyan-800/30 rounded-none md:rounded-2xl shadow-sm overflow-hidden transition-colors">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-slate-100 dark:border-cyan-800/20 px-4 md:px-6 pt-4 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-transparent">
                  <TabsList className="bg-transparent h-auto p-0 flex justify-start gap-4 md:gap-8 min-w-max">
                      <TabItem value="basic" icon={Info} label={t('stock.detail.basicInfo')} active={activeTab === 'basic'} />
                      <TabItem value="images" icon={ImageIcon} label={t('stock.detail.images')} active={activeTab === 'images'} />
                      <TabItem value="relations" icon={Layers} label={t('stock.detail.relations')} active={activeTab === 'relations'} />
                  </TabsList>
              </div>

              <div className="p-4 md:p-8">
                  <TabsContent value="basic" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex flex-col lg:flex-row gap-8">
                          <div className="w-full lg:w-1/3 space-y-6 order-2 lg:order-1">
                              <div className="bg-slate-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-slate-100 dark:border-cyan-800/20 transition-colors">
                                  <h3 className="text-base font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                      <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                                      {t('stock.detail.summary')}
                                  </h3>
                                  <StockBasicInfo stock={stock} />
                              </div>
                          </div>
                          <div className="w-full lg:w-2/3 order-1 lg:order-2">
                              <StockDetailForm stockId={stockId} />
                          </div>
                      </div>
                  </TabsContent>

                  <TabsContent value="images" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-6">
                          <div className="bg-slate-50 dark:bg-blue-900/10 border-2 border-dashed border-slate-200 dark:border-cyan-800/30 rounded-2xl p-8 transition-colors">
                              <StockImageUpload stockId={stockId} />
                          </div>
                          <StockImageList stockId={stockId} />
                      </div>
                  </TabsContent>

                  <TabsContent value="relations" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex flex-col lg:flex-row gap-8">
                            <div className="w-full lg:w-1/3 order-2 lg:order-1">
                              <div className="bg-slate-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-slate-100 dark:border-cyan-800/20 transition-colors">
                                  <h3 className="font-bold text-base mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                                    {t('stock.detail.addRelation')}
                                  </h3>
                                  <StockRelationForm stockId={stockId} />
                              </div>
                            </div>
                            <div className="w-full lg:w-2/3 order-1 lg:order-2">
                              <StockRelationList stockId={stockId} />
                            </div>
                      </div>
                  </TabsContent>
              </div>
          </Tabs>
      </div>
    </div>
  );
}

function TabItem({ value, icon: Icon, label, active }: any) {
  return (
    <TabsTrigger value={value} className={cn(
      "relative pb-4 rounded-none bg-transparent shadow-none border-b-2 border-transparent transition-all duration-300",
      "text-xs md:text-sm text-slate-500 dark:text-slate-400",
      active && "text-cyan-600 border-cyan-600 dark:text-cyan-400 dark:border-cyan-400 font-bold"
    )}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
    </TabsTrigger>
  );
}