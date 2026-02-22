import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { stockConvertLinesConfig } from '../config/page-configs';

export function StockConvertLinesPage(): ReactElement {
  return <AquaCrudPage config={stockConvertLinesConfig} />;
}
