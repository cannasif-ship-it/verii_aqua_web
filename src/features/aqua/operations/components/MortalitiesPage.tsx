import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { mortalitiesConfig, mortalityLinesConfig } from '../config/page-configs';

export function MortalitiesPage(): ReactElement {
  return <AquaCrudPage config={{ ...mortalityLinesConfig, title: mortalitiesConfig.title, description: mortalitiesConfig.description }} />;
}
