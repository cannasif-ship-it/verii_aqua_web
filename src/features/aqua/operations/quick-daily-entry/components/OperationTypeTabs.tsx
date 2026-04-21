import { type ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState<string>('feeding');
  
  // AQUA KONSEPT STİLLERİ: Pembe/Mor yerine Cyan/Mavi tonları
  const tabTriggerStyle = `
    min-w-max px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
    text-slate-500 hover:text-slate-900 hover:bg-slate-100
    dark:text-slate-400 dark:hover:text-white dark:hover:bg-blue-900/50
    data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm
    dark:data-[state=active]:bg-cyan-900/30 dark:data-[state=active]:text-cyan-400 dark:data-[state=active]:shadow-lg dark:data-[state=active]:shadow-cyan-500/10
  `;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
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

      <ActiveTabContent
        activeTab={activeTab}
        feedingTab={feedingTab}
        mortalityTab={mortalityTab}
        weatherTab={weatherTab}
        netOperationTab={netOperationTab}
        transferTab={transferTab}
        cageWarehouseTransferTab={cageWarehouseTransferTab}
        warehouseTransferTab={warehouseTransferTab}
        warehouseCageTransferTab={warehouseCageTransferTab}
        shipmentTab={shipmentTab}
        stockChangeTab={stockChangeTab}
        projectMergeTab={projectMergeTab}
      />
    </Tabs>
  );
}

function ActiveTabContent(props: OperationTypeTabsProps & { activeTab: string }): ReactElement {
  const content = useMemo(() => {
    switch (props.activeTab) {
      case 'mortality':
        return props.mortalityTab;
      case 'weather':
        return props.weatherTab;
      case 'net':
        return props.netOperationTab;
      case 'transfer':
        return props.transferTab;
      case 'cageWarehouseTransfer':
        return props.cageWarehouseTransferTab;
      case 'warehouseTransfer':
        return props.warehouseTransferTab;
      case 'warehouseCageTransfer':
        return props.warehouseCageTransferTab;
      case 'shipment':
        return props.shipmentTab;
      case 'stockChange':
        return props.stockChangeTab;
      case 'projectMerge':
        return props.projectMergeTab;
      case 'feeding':
      default:
        return props.feedingTab;
    }
  }, [props]);

  return <div className="transition-all duration-500 ease-in-out">{content}</div>;
}
