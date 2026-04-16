import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OperationTypeTabsProps {
  feedingTab: ReactElement;
  mortalityTab: ReactElement;
  weatherTab: ReactElement;
  netOperationTab: ReactElement;
  transferTab: ReactElement;
  cageWarehouseTransferTab: ReactElement;
  warehouseTransferTab: ReactElement;
  warehouseCageTransferTab: ReactElement;
  shipmentTab: ReactElement;
  stockChangeTab: ReactElement;
  projectMergeTab: ReactElement;
}

export function OperationTypeTabs({
  feedingTab,
  mortalityTab,
  weatherTab,
  netOperationTab,
  transferTab,
  cageWarehouseTransferTab,
  warehouseTransferTab,
  warehouseCageTransferTab,
  shipmentTab,
  stockChangeTab,
  projectMergeTab,
}: OperationTypeTabsProps): ReactElement {
  const { t } = useTranslation('common');
  
  // AQUA KONSEPT STİLLERİ: Pembe/Mor yerine Cyan/Mavi tonları
  const tabTriggerStyle = `
    min-w-max px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
    text-slate-500 hover:text-slate-900 hover:bg-slate-100
    dark:text-slate-400 dark:hover:text-white dark:hover:bg-blue-900/50
    data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm
    dark:data-[state=active]:bg-cyan-900/30 dark:data-[state=active]:text-cyan-400 dark:data-[state=active]:shadow-lg dark:data-[state=active]:shadow-cyan-500/10
  `;

  return (
    <Tabs defaultValue="feeding" className="w-full space-y-6">
      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
        <TabsList className="w-full justify-start bg-white/70 dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 p-2 rounded-2xl h-auto gap-2 inline-flex min-w-max shadow-sm dark:shadow-none">
          <TabsTrigger className={tabTriggerStyle} value="feeding">{t('aqua.quickDailyEntry.tabFeeding')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="mortality">{t('aqua.quickDailyEntry.tabMortality')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="weather">{t('aqua.quickDailyEntry.tabWeather')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="net">{t('aqua.quickDailyEntry.tabNetOperation')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="transfer">
            {t('aqua.quickDailyEntry.tabTransfer')}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="cageWarehouseTransfer">
            {t('aqua.quickDailyEntry.tabCageWarehouseTransfer')}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="warehouseTransfer">
            {t('aqua.quickDailyEntry.tabWarehouseTransfer')}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="warehouseCageTransfer">
            {t('aqua.quickDailyEntry.tabWarehouseCageTransfer')}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="shipment">
            {t('aqua.quickDailyEntry.tabShipment')}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="stockChange">
            {t('aqua.quickDailyEntry.tabStockChange')}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="projectMerge">
            {t('aqua.quickDailyEntry.tabProjectMerge')}
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="transition-all duration-500 ease-in-out">
        <TabsContent value="feeding" className="m-0 focus-visible:ring-0">{feedingTab}</TabsContent>
        <TabsContent value="mortality" className="m-0 focus-visible:ring-0">{mortalityTab}</TabsContent>
        <TabsContent value="weather" className="m-0 focus-visible:ring-0">{weatherTab}</TabsContent>
        <TabsContent value="net" className="m-0 focus-visible:ring-0">{netOperationTab}</TabsContent>
        <TabsContent value="transfer" className="m-0 focus-visible:ring-0">{transferTab}</TabsContent>
        <TabsContent value="cageWarehouseTransfer" className="m-0 focus-visible:ring-0">{cageWarehouseTransferTab}</TabsContent>
        <TabsContent value="warehouseTransfer" className="m-0 focus-visible:ring-0">{warehouseTransferTab}</TabsContent>
        <TabsContent value="warehouseCageTransfer" className="m-0 focus-visible:ring-0">{warehouseCageTransferTab}</TabsContent>
        <TabsContent value="shipment" className="m-0 focus-visible:ring-0">{shipmentTab}</TabsContent>
        <TabsContent value="stockChange" className="m-0 focus-visible:ring-0">{stockChangeTab}</TabsContent>
        <TabsContent value="projectMerge" className="m-0 focus-visible:ring-0">{projectMergeTab}</TabsContent>
      </div>
    </Tabs>
  );
}
