import { useQuery } from '@tanstack/react-query';
import { aquaSettingsApi } from '../api/aquaSettingsApi';

export function useAquaSettingsQuery() {
  return useQuery({
    queryKey: ['aqua-settings'],
    queryFn: () => aquaSettingsApi.get(),
  });
}
