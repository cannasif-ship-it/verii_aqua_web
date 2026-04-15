import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { warehouseCageTransferLinesConfig } from '../config/page-configs';

export function WarehouseCageTransferLinesPage(): ReactElement {
  return <AquaCrudPage config={warehouseCageTransferLinesConfig} />;
}
