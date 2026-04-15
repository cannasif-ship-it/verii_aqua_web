import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { stockConvertLinesConfig, stockConvertsConfig } from '../config/page-configs';

export function StockConvertsPage(): ReactElement {
  return <AquaCrudPage config={{ ...stockConvertLinesConfig, title: stockConvertsConfig.title, description: stockConvertsConfig.description }} />;
}
