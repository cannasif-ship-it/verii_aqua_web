import type { ReactElement } from 'react';
import { AquaCrudPage } from '../../shared/components/AquaCrudPage';
import { fishBatchesConfig } from '../config/page-configs';

export function FishBatchesPage(): ReactElement {
  return <AquaCrudPage config={fishBatchesConfig} />;
}
