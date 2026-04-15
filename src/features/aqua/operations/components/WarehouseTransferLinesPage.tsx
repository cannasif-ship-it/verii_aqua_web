import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { warehouseTransferLinesConfig } from '../config/page-configs';

export function WarehouseTransferLinesPage(): ReactElement {
  return <AquaCrudPage config={warehouseTransferLinesConfig} />;
}
