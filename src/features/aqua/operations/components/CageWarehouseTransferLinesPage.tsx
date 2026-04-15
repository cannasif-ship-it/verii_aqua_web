import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { cageWarehouseTransferLinesConfig } from '../config/page-configs';

export function CageWarehouseTransferLinesPage(): ReactElement {
  return <AquaCrudPage config={cageWarehouseTransferLinesConfig} />;
}
