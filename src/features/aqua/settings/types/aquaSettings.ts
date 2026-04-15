import { z } from 'zod';

export interface AquaSettingsDto {
  requireFullTransfer: boolean;
  allowProjectMerge: boolean;
  partialTransferOccupiedCageMode: number;
  feedCostFallbackStrategy: number;
}

export interface UpdateAquaSettingsDto {
  requireFullTransfer: boolean;
  allowProjectMerge: boolean;
  partialTransferOccupiedCageMode: number;
  feedCostFallbackStrategy: number;
}

export const aquaSettingsFormSchema = z.object({
  requireFullTransfer: z.boolean(),
  allowProjectMerge: z.boolean(),
  partialTransferOccupiedCageMode: z.coerce.number().int().min(0).max(2),
  feedCostFallbackStrategy: z.coerce.number().int().min(0).max(2),
});

export type AquaSettingsFormSchema = z.infer<typeof aquaSettingsFormSchema>;
