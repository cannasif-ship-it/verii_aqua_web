import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { warehouseTransferLinesConfig, warehouseTransfersConfig } from '../config/page-configs';

export function WarehouseTransfersPage(): ReactElement {
  return <AquaCrudPage config={{ ...warehouseTransferLinesConfig, title: warehouseTransfersConfig.title, description: warehouseTransfersConfig.description }} />;
}
