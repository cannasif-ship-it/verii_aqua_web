import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { goodsReceiptFishDistributionsConfig } from '../config/page-configs';

export function GoodsReceiptFishDistributionsPage(): ReactElement {
  return <AquaCrudPage config={goodsReceiptFishDistributionsConfig} />;
}
