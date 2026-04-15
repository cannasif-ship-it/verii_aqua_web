import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { weighingLinesConfig, weighingsConfig } from '../config/page-configs';

export function WeighingsPage(): ReactElement {
  return <AquaCrudPage config={{ ...weighingLinesConfig, title: weighingsConfig.title, description: weighingsConfig.description }} />;
}
