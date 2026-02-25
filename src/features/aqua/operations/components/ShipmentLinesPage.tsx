import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { shipmentLinesConfig } from '../config/page-configs';

export function ShipmentLinesPage(): ReactElement {
  return <AquaCrudPage config={shipmentLinesConfig} />;
}
