import { z } from 'zod';

export interface AquaSettingsDto {
  partialTransferOccupiedCageMode: number;
}

export interface UpdateAquaSettingsDto {
  partialTransferOccupiedCageMode: number;
}

export const aquaSettingsFormSchema = z.object({
  partialTransferOccupiedCageMode: z.coerce.number().int().min(0).max(2),
});

export type AquaSettingsFormSchema = z.infer<typeof aquaSettingsFormSchema>;
