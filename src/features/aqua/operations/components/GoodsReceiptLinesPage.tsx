import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { goodsReceiptLinesConfig } from '../config/page-configs';

export function GoodsReceiptLinesPage(): ReactElement {
  return <AquaCrudPage config={goodsReceiptLinesConfig} />;
}
