import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { warehouseCageTransferLinesConfig, warehouseCageTransfersConfig } from '../config/page-configs';

export function WarehouseCageTransfersPage(): ReactElement {
  return <AquaCrudPage config={{ ...warehouseCageTransferLinesConfig, title: warehouseCageTransfersConfig.title, description: warehouseCageTransfersConfig.description }} />;
}
