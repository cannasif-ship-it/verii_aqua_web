import type { CageAllocationRow } from '../types/quick-setup-types';

export function distributeEqually(
  rows: CageAllocationRow[],
  totalFishCount: number
): CageAllocationRow[] {
  if (rows.length === 0) return [];
  const base = Math.floor(totalFishCount / rows.length);
  const remainder = totalFishCount % rows.length;
  return rows.map((row, index) => ({
    ...row,
    fishCount: index < remainder ? base + 1 : base,
  }));
}

export function assignAllToCage(
  rows: CageAllocationRow[],
  projectCageId: number,
  totalFishCount: number
): CageAllocationRow[] {
  return rows.map((row) => ({
    ...row,
    fishCount: row.projectCageId === projectCageId ? totalFishCount : 0,
  }));
}
