import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { feedingDistributionsConfig } from '../config/page-configs';

export function FeedingDistributionsPage(): ReactElement {
  return <AquaCrudPage config={feedingDistributionsConfig} />;
}
