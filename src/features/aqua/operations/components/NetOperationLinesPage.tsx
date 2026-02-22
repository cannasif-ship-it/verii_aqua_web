import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { netOperationLinesConfig } from '../config/page-configs';

export function NetOperationLinesPage(): ReactElement {
  return <AquaCrudPage config={netOperationLinesConfig} />;
}
