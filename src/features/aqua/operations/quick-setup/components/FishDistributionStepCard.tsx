import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isDistributionValid } from '../schema/quick-setup-schema';
import type { CageAllocationRow, CageOptionDto } from '../types/quick-setup-types';
import { distributeEqually, assignAllToCage } from '../utils/quick-operations';
import { Target, GripVertical } from 'lucide-react';

interface FishDistributionStepCardProps {
  allocations: CageAllocationRow[];
  totalFishCount: number;
  onAllocationsChange: (rows: CageAllocationRow[]) => void;
  onSaveAndPost: () => void;
  isPosting: boolean;
  selectedCageId: number | null;
  onSelectCage: (projectCageId: number | null) => void;
  availableCages: CageOptionDto[];
  selectedAvailableCageId: number | null;
  onSelectAvailableCage: (cageId: number | null) => void;
  onAddCage: () => void;
  isAddingCage: boolean;
  canCreate: boolean;
}

export function FishDistributionStepCard({
  allocations,
  totalFishCount,
  onAllocationsChange,
  onSaveAndPost,
  isPosting,
  selectedCageId,
  onSelectCage,
  availableCages,
  selectedAvailableCageId,
  onSelectAvailableCage,
  onAddCage,
  isAddingCage,
  canCreate,
}: FishDistributionStepCardProps): ReactElement {
  const { t } = useTranslation('common');
  const totalAllocated = allocations.reduce((acc, row) => acc + row.fishCount, 0);
  const isValid = isDistributionValid(allocations, totalFishCount);

  const handleEqualDistribute = (): void => {
    const next = distributeEqually(allocations, totalFishCount);
    onAllocationsChange(next);
  };

  const handleAssignAllToSelected = (): void => {
    if (selectedCageId == null) return;
    const next = assignAllToCage(allocations, selectedCageId, totalFishCount);
    onAllocationsChange(next);
  };

  const setFishCount = (projectCageId: number, value: number): void => {
    const clamped = Math.max(0, Math.floor(Number(value)));
    const next = allocations.map((row) =>
      row.projectCageId === projectCageId ? { ...row, fishCount: clamped } : row
    );
    onAllocationsChange(next);
  };

  return (
    // Mor zemin `#1a1025` silindi, yerine Deep Blue teması (`blue-950`) eklendi
    <Card className="bg-card dark:bg-blue-950/60 dark:backdrop-blur-xl border border-border dark:border-cyan-800/30 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-border dark:border-cyan-800/30 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {/* Pembe İkonlar Korundu */}
            <div className="h-8 w-8 rounded-lg bg-pink-100 border border-pink-200 dark:bg-pink-500/20 flex items-center justify-center dark:border-pink-500/30">
                <span className="text-pink-600 dark:text-pink-400 text-sm font-black">3</span>
            </div>
            {t('aqua.quickSetup.step3Title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Mor zemin silindi, buradaki `bg-white/2` Deep Blue slate temasından gelir */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-muted/30 dark:bg-blue-900/20 border border-border dark:border-cyan-800/30 p-4 rounded-xl relative overflow-hidden group">
          <GripVertical className="absolute -left-1.5 h-16 w-16 text-slate-500/5 group-hover:scale-110 transition-transform touch-none" strokeWidth={1}/>
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
              <div className="w-full sm:w-auto sm:min-w-[220px]">
                <Select
                  value={selectedAvailableCageId != null ? String(selectedAvailableCageId) : undefined}
                  onValueChange={(value) => onSelectAvailableCage(value ? Number(value) : null)}
                >
                  <SelectTrigger className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground dark:text-white">
                    <SelectValue
                      placeholder={t('aqua.quickSetup.selectAvailableCage')}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50">
                    {availableCages.map((cage) => (
                      <SelectItem key={cage.id} value={String(cage.id)} className="focus:bg-muted dark:focus:bg-blue-900/50 cursor-pointer text-foreground dark:text-white">
                        {cage.cageCode ?? cage.cageName ?? String(cage.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="bg-transparent border-border dark:border-cyan-800/50 text-foreground hover:bg-muted dark:hover:bg-blue-900/50 transition-colors"
                onClick={onAddCage}
                disabled={selectedAvailableCageId == null || isAddingCage || !canCreate}
              >
                {t('aqua.quickSetup.addCage')}
              </Button>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
              <Button type="button" variant="outline" className="bg-transparent border-border dark:border-cyan-800/50 text-foreground hover:bg-muted dark:hover:bg-blue-900/50 transition-colors" onClick={handleEqualDistribute} disabled={!canCreate}>
                {t('aqua.quickSetup.equalDistribute')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-transparent border-border dark:border-cyan-800/50 text-foreground hover:bg-muted dark:hover:bg-blue-900/50 transition-colors"
                onClick={handleAssignAllToSelected}
                disabled={selectedCageId == null || !canCreate}
              >
                {t('aqua.quickSetup.assignAllToSelectedCage')}
              </Button>
              {/* Yeşil Rozet (Emerald) silindi, Deep Blue slate temasından gelir */}
              <Badge className={`px-3 py-1.5 rounded-lg font-medium border-0 ${isValid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                {isValid ? t('aqua.quickSetup.distributionMatch') : t('aqua.quickSetup.distributionMismatch')}
              </Badge>
          </div>
        </div>

        {/* Mor zemin silindi, buradaki `bg-white/1` Deep Blue slate temasından gelir */}
        <div className="rounded-xl border border-border dark:border-cyan-800/30 overflow-hidden bg-background dark:bg-blue-950/40">
            <Table>
            {/* Mor zemin silindi, buradaki `bg-white/2` Deep Blue slate temasından gelir */}
            <TableHeader className="bg-muted/50 dark:bg-blue-900/30 border-b border-border dark:border-cyan-800/30">
                <TableRow className="hover:bg-transparent border-0">
                <TableHead className="text-muted-foreground dark:text-slate-300 font-semibold">{t('aqua.quickSetup.cage')}</TableHead>
                <TableHead className="text-muted-foreground dark:text-slate-300 font-semibold w-[140px] sm:w-[200px]">{t('aqua.quickSetup.count')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {allocations.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={2} className="text-muted-foreground dark:text-slate-500 text-center py-8">
                    {t('aqua.quickSetup.noAvailableCages')}
                    </TableCell>
                </TableRow>
                ) : (
                allocations.map((row) => (
                    // Buradaki pembe vurguyu (bg-pink-50) koruduk.
                    <TableRow
                    key={row.projectCageId}
                    className={`border-b border-border dark:border-cyan-800/20 transition-colors cursor-pointer group ${selectedCageId === row.projectCageId ? 'bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/10' : 'hover:bg-muted dark:hover:bg-blue-900/30'}`}
                    onClick={() =>
                        onSelectCage(selectedCageId === row.projectCageId ? null : row.projectCageId)
                    }
                    >
                    <TableCell className="font-medium text-foreground dark:text-slate-200">
                        {row.cageCode ?? row.cageName ?? String(row.projectCageId)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        {/* Mor zemin `#0b0713` silindi */}
                        <Input
                        type="number"
                        min={0}
                        step={1}
                        value={row.fishCount}
                        className="bg-background dark:bg-blue-950 border-border dark:border-cyan-800/50 text-foreground dark:text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-9"
                        onChange={(e) =>
                            setFishCount(row.projectCageId, e.target.value ? Number(e.target.value) : 0)
                        }
                        disabled={!canCreate}
                        />
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </div>

        <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Rozetlerdeki yeşil (Emerald) silindi, Deep Blue slate temasından gelir */}
            <div className="text-sm font-medium text-muted-foreground dark:text-slate-300 bg-muted/50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-border dark:border-cyan-800/30 relative overflow-hidden group">
                 <Target className="absolute -left-1 h-12 w-12 text-pink-500/5 group-hover:scale-110 transition-transform touch-none" strokeWidth={1}/>
                {t('aqua.quickSetup.total')}: <span className={isValid ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-red-600 dark:text-red-400 font-black'}>{totalAllocated}</span> / {totalFishCount}
            </div>
            {/* Butondaki pembe-turuncu gradyanı koruduk */}
            <Button
            type="button"
            className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20 w-full sm:w-auto font-bold transition-all"
            onClick={onSaveAndPost}
            disabled={!isValid || isPosting || !canCreate}
            >
            {t('aqua.quickSetup.saveAndPost')}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
