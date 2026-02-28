import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OperationTypeTabsProps {
  feedingTab: ReactElement;
  mortalityTab: ReactElement;
  weatherTab: ReactElement;
  netOperationTab: ReactElement;
  transferTab: ReactElement;
  stockChangeTab: ReactElement;
}

export function OperationTypeTabs({
  feedingTab,
  mortalityTab,
  weatherTab,
  netOperationTab,
  transferTab,
  stockChangeTab,
}: OperationTypeTabsProps): ReactElement {
  const { t } = useTranslation('common');
  
  const tabTriggerStyle = `
    min-w-max px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
    text-slate-400 hover:text-white hover:bg-white/5
    data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-400 data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/10
  `;

  return (
    <Tabs defaultValue="feeding" className="w-full space-y-6">
      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
        <TabsList className="w-full justify-start bg-white/70 dark:bg-[#1a1025]/60 backdrop-blur-xl border border-white/60 dark:border-white/5 p-2 rounded-2xl h-auto gap-2 inline-flex min-w-max">
          <TabsTrigger className={tabTriggerStyle} value="feeding">{t('aqua.quickDailyEntry.tabFeeding')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="mortality">{t('aqua.quickDailyEntry.tabMortality')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="weather">{t('aqua.quickDailyEntry.tabWeather')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="net">{t('aqua.quickDailyEntry.tabNetOperation')}</TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="transfer">
            {t('aqua.quickDailyEntry.tabTransfer', { defaultValue: 'Kafes Değişimi' })}
          </TabsTrigger>
          <TabsTrigger className={tabTriggerStyle} value="stockChange">
            {t('aqua.quickDailyEntry.tabStockChange', { defaultValue: 'Stok Değişimi' })}
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="transition-all duration-500 ease-in-out">
        <TabsContent value="feeding" className="m-0 focus-visible:ring-0">{feedingTab}</TabsContent>
        <TabsContent value="mortality" className="m-0 focus-visible:ring-0">{mortalityTab}</TabsContent>
        <TabsContent value="weather" className="m-0 focus-visible:ring-0">{weatherTab}</TabsContent>
        <TabsContent value="net" className="m-0 focus-visible:ring-0">{netOperationTab}</TabsContent>
        <TabsContent value="transfer" className="m-0 focus-visible:ring-0">{transferTab}</TabsContent>
        <TabsContent value="stockChange" className="m-0 focus-visible:ring-0">{stockChangeTab}</TabsContent>
      </div>
    </Tabs>
  );
}