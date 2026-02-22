import { type ReactElement } from 'react';
import { AquaCrudPage } from '@/features/aqua/shared/components/AquaCrudPage';
import { feedingLinesConfig } from '../config/page-configs';

export function FeedingLinesPage(): ReactElement {
  return <AquaCrudPage config={feedingLinesConfig} />;
}
