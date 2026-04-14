import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { AquaSettingsDto, UpdateAquaSettingsDto } from '../types/aquaSettings';

const AQUA_SETTINGS_BASE = '/api/aqua/AquaSettings';

function getErrorMessage(response: ApiResponse<unknown>, fallback: string): string {
  if (response.message?.trim()) return response.message;
  if (response.errors?.length) return response.errors.join(' ');
  return fallback;
}

export const aquaSettingsApi = {
  get: async (): Promise<AquaSettingsDto> => {
    const response = await api.get<ApiResponse<AquaSettingsDto>>(AQUA_SETTINGS_BASE);
    if (response.success === true && response.data) {
      return response.data;
    }
    throw new Error(getErrorMessage(response, 'Aqua settings could not be loaded.'));
  },

  update: async (data: UpdateAquaSettingsDto): Promise<AquaSettingsDto> => {
    const response = await api.put<ApiResponse<AquaSettingsDto>>(AQUA_SETTINGS_BASE, data);
    if (response.success === true && response.data) {
      return response.data;
    }
    throw new Error(getErrorMessage(response, 'Aqua settings could not be saved.'));
  },
};
