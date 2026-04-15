import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { transferLinesConfig, transfersConfig } from '../config/page-configs';

export function TransfersPage(): ReactElement {
  return <AquaCrudPage config={{ ...transferLinesConfig, title: transfersConfig.title, description: transfersConfig.description }} />;
}
