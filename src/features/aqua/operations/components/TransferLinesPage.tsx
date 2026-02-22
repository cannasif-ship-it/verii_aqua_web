import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { transferLinesConfig } from '../config/page-configs';

export function TransferLinesPage(): ReactElement {
  return <AquaCrudPage config={transferLinesConfig} />;
}
