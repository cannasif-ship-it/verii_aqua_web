import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { shipmentLinesConfig, shipmentsConfig } from '../config/page-configs';

export function ShipmentsPage(): ReactElement {
  return <AquaCrudPage config={{ ...shipmentLinesConfig, title: shipmentsConfig.title, description: shipmentsConfig.description }} />;
}
