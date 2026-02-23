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
  return (
    <Tabs defaultValue="feeding">
      <TabsList className="w-full justify-start">
        <TabsTrigger className="min-w-max" value="feeding">{t('aqua.quickDailyEntry.tabFeeding')}</TabsTrigger>
        <TabsTrigger className="min-w-max" value="mortality">{t('aqua.quickDailyEntry.tabMortality')}</TabsTrigger>
        <TabsTrigger className="min-w-max" value="weather">{t('aqua.quickDailyEntry.tabWeather')}</TabsTrigger>
        <TabsTrigger className="min-w-max" value="net">{t('aqua.quickDailyEntry.tabNetOperation')}</TabsTrigger>
        <TabsTrigger className="min-w-max" value="transfer">
          {t('aqua.quickDailyEntry.tabTransfer', { defaultValue: 'Kafes Değişimi' })}
        </TabsTrigger>
        <TabsTrigger className="min-w-max" value="stockChange">
          {t('aqua.quickDailyEntry.tabStockChange', { defaultValue: 'Stok Değişimi' })}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="feeding">{feedingTab}</TabsContent>
      <TabsContent value="mortality">{mortalityTab}</TabsContent>
      <TabsContent value="weather">{weatherTab}</TabsContent>
      <TabsContent value="net">{netOperationTab}</TabsContent>
      <TabsContent value="transfer">{transferTab}</TabsContent>
      <TabsContent value="stockChange">{stockChangeTab}</TabsContent>
    </Tabs>
  );
}
