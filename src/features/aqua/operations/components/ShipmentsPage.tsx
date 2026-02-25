import { type ReactElement } from 'react';
import { AquaHeaderLineCrudPage } from './AquaHeaderLineCrudPage';
import { shipmentLinesConfig, shipmentsConfig } from '../config/page-configs';

export function ShipmentsPage(): ReactElement {
  return (
    <AquaHeaderLineCrudPage
      headerConfig={shipmentsConfig}
      lineConfig={shipmentLinesConfig}
      lineForeignKey="shipmentId"
      lineSectionTitle="aqua.pages.shipmentLines.title"
      lineSectionDescription="aqua.common.linesForRecord"
    />
  );
}
