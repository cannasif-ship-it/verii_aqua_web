import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { cageWarehouseTransferLinesConfig, cageWarehouseTransfersConfig } from '../config/page-configs';

export function CageWarehouseTransfersPage(): ReactElement {
  return <AquaCrudPage config={{ ...cageWarehouseTransferLinesConfig, title: cageWarehouseTransfersConfig.title, description: cageWarehouseTransfersConfig.description }} />;
}
