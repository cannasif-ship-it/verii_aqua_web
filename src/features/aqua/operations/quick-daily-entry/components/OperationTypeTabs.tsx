import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OperationTypeTabsProps {
  feedingTab: ReactElement;
  mortalityTab: ReactElement;
  weatherTab: ReactElement;
  netOperationTab: ReactElement;
}

export function OperationTypeTabs({
  feedingTab,
  mortalityTab,
  weatherTab,
  netOperationTab,
}: OperationTypeTabsProps): ReactElement {
  const { t } = useTranslation('common');
  return (
    <Tabs defaultValue="feeding">
      <TabsList>
        <TabsTrigger value="feeding">{t('aqua.quickDailyEntry.tabFeeding')}</TabsTrigger>
        <TabsTrigger value="mortality">{t('aqua.quickDailyEntry.tabMortality')}</TabsTrigger>
        <TabsTrigger value="weather">{t('aqua.quickDailyEntry.tabWeather')}</TabsTrigger>
        <TabsTrigger value="net">{t('aqua.quickDailyEntry.tabNetOperation')}</TabsTrigger>
      </TabsList>
      <TabsContent value="feeding">{feedingTab}</TabsContent>
      <TabsContent value="mortality">{mortalityTab}</TabsContent>
      <TabsContent value="weather">{weatherTab}</TabsContent>
      <TabsContent value="net">{netOperationTab}</TabsContent>
    </Tabs>
  );
}
