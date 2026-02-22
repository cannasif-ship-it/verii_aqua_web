import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { mortalityLinesConfig } from '../config/page-configs';

export function MortalityLinesPage(): ReactElement {
  return <AquaCrudPage config={mortalityLinesConfig} />;
}
