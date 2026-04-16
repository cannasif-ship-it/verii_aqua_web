import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Combobox } from '@/components/ui/combobox';
import { formatLabelWithKey } from '@/shared/utils/dropdown-label';
import { OperationTypeTabs } from './components/OperationTypeTabs';
import { FeedingQuickForm } from './components/FeedingQuickForm';
import { MortalityQuickForm } from './components/MortalityQuickForm';
import { WeatherQuickForm } from './components/WeatherQuickForm';
import { NetOperationQuickForm } from './components/NetOperationQuickForm';
import { TransferQuickForm } from './components/TransferQuickForm';
import { CageWarehouseTransferQuickForm } from './components/CageWarehouseTransferQuickForm';
import { WarehouseTransferQuickForm } from './components/WarehouseTransferQuickForm';
import { WarehouseCageTransferQuickForm } from './components/WarehouseCageTransferQuickForm';
import { ShipmentQuickForm } from './components/ShipmentQuickForm';
import { useAquaSettingsQuery } from '@/features/aqua/settings/hooks/useAquaSettingsQuery';
import { StockChangeQuickForm } from './components/StockChangeQuickForm';
import { ProjectMergeQuickForm } from './components/ProjectMergeQuickForm';
import { useProjectListQuery } from './hooks/useProjectListQuery';
import { useProjectCageListByProjectQuery } from './hooks/useProjectCageListByProjectQuery';
import { useTransferTargetProjectCagesQuery } from './hooks/useTransferTargetProjectCagesQuery';
import { useStockListQuery } from './hooks/useStockListQuery';
import { useWarehouseListQuery } from './hooks/useWarehouseListQuery';
import { useFishBatchListByProjectQuery } from './hooks/useFishBatchListByProjectQuery';
import { useWeatherSeverityListQuery } from './hooks/useWeatherSeverityListQuery';
import { useWeatherTypeListQuery } from './hooks/useWeatherTypeListBySeverityQuery';
import { useNetOperationTypeListQuery } from './hooks/useNetOperationTypeListQuery';
import { aquaQuickDailyApi } from './api/aqua-quick-api';
import {
  useCreateFeedingLineWithAutoHeaderMutation,
  useCreateMortalityLineWithAutoHeaderMutation,
  useCreateDailyWeatherMutation,
  useCreateNetOperationLineWithAutoHeaderMutation,
  useCreateTransferLineWithAutoHeaderMutation,
  useCreateCageWarehouseTransferLineWithAutoHeaderMutation,
  useCreateWarehouseTransferLineWithAutoHeaderMutation,
  useCreateWarehouseCageTransferLineWithAutoHeaderMutation,
  useCreateShipmentLineWithAutoHeaderMutation,
  useCreateStockConvertLineWithAutoHeaderMutation,
} from './hooks/useQuickDailyEntryMutations';
import type { 
  FeedingQuickFormSchema, 
  MortalityQuickFormSchema, 
  WeatherQuickFormSchema, 
  NetOperationQuickFormSchema, 
  TransferQuickFormSchema, 
  CageWarehouseTransferQuickFormSchema,
  WarehouseTransferQuickFormSchema,
  WarehouseCageTransferQuickFormSchema,
  ShipmentQuickFormSchema,
  StockChangeQuickFormSchema 
} from './schema/quick-daily-entry-schema';
import type { ActiveCageBatchSnapshot, ActiveWarehouseBatchSnapshot } from './types/quick-daily-entry-types';
import {
  localDateString,
} from './utils/quick-operations';
import { ChevronRight, ClipboardEdit, CheckCircle2, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { hasPermission } from '@/features/access-control/utils/hasPermission';
import { AQUA_SPECIAL_PERMISSION_CODES } from '@/features/access-control/utils/permission-config';
import { useCreateProjectMergeMutation } from '../project-merges/hooks/useCreateProjectMergeMutation';
import type { ProjectMergeFormSchema } from '../project-merges/types/projectMerge';

export function QuickDailyEntryPage(): ReactElement {
  const { t } = useTranslation('common');
  const { data: aquaSettings } = useAquaSettingsQuery();
  const { data: permissions } = useMyPermissionsQuery();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('projectId');
  const projectCageIdParam = searchParams.get('projectCageId');
  const initialProjectId = projectIdParam ? Number(projectIdParam) : null;
  const initialProjectCageId = projectCageIdParam ? Number(projectCageIdParam) : null;
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectCageId, setProjectCageId] = useState<number | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(localDateString());
  const [sourceBatch, setSourceBatch] = useState<ActiveCageBatchSnapshot | null>(null);
  const [sourceBatchByCageId, setSourceBatchByCageId] = useState<Record<number, ActiveCageBatchSnapshot | null>>({});
  const [transferTargetBatchByCageId, setTransferTargetBatchByCageId] = useState<Record<number, ActiveCageBatchSnapshot | null>>({});
  const [warehouseBatchByWarehouseId, setWarehouseBatchByWarehouseId] = useState<Record<number, ActiveWarehouseBatchSnapshot[]>>({});
  const [warehouseTransferSourceWarehouseId, setWarehouseTransferSourceWarehouseId] = useState<number | null>(null);
  const [warehouseCageSourceWarehouseId, setWarehouseCageSourceWarehouseId] = useState<number | null>(null);
  const [isTransferSuccessDialogOpen, setIsTransferSuccessDialogOpen] = useState(false);
  const canCreateQuickDailyEntry =
    !AQUA_SPECIAL_PERMISSION_CODES.quickDailyEntry.create ||
    hasPermission(permissions, AQUA_SPECIAL_PERMISSION_CODES.quickDailyEntry.create);

  const { data: projects } = useProjectListQuery();
  const { data: projectCages, refetch: refetchProjectCages } = useProjectCageListByProjectQuery(projectId);
  const { data: transferTargetProjectCages, refetch: refetchTransferTargetProjectCages } = useTransferTargetProjectCagesQuery(targetProjectId);
  const { data: stocks, isLoading: isLoadingStocks } = useStockListQuery();
  const { data: warehouses } = useWarehouseListQuery();
  const { data: fishBatches } = useFishBatchListByProjectQuery(projectId);
  const { data: weatherSeverities } = useWeatherSeverityListQuery();
  const { data: weatherTypes } = useWeatherTypeListQuery();
  const { data: netOperationTypes } = useNetOperationTypeListQuery();

  const createFeedingLineWithAutoHeader = useCreateFeedingLineWithAutoHeaderMutation();
  const createMortalityLineWithAutoHeader = useCreateMortalityLineWithAutoHeaderMutation();
  const createDailyWeather = useCreateDailyWeatherMutation();
  const createNetOperationLineWithAutoHeader = useCreateNetOperationLineWithAutoHeaderMutation();
  const createTransferLineWithAutoHeader = useCreateTransferLineWithAutoHeaderMutation();
  const createCageWarehouseTransferLineWithAutoHeader = useCreateCageWarehouseTransferLineWithAutoHeaderMutation();
  const createWarehouseTransferLineWithAutoHeader = useCreateWarehouseTransferLineWithAutoHeaderMutation();
  const createWarehouseCageTransferLineWithAutoHeader = useCreateWarehouseCageTransferLineWithAutoHeaderMutation();
  const createShipmentLineWithAutoHeader = useCreateShipmentLineWithAutoHeaderMutation();
  const createStockConvertLineWithAutoHeader = useCreateStockConvertLineWithAutoHeaderMutation();
  const createProjectMerge = useCreateProjectMergeMutation();

  const handleProjectChange = (value: string): void => {
    const id = value ? Number(value) : null;
    setProjectId(id);
    setTargetProjectId(id);
    setProjectCageId(null);
    setWarehouseTransferSourceWarehouseId(null);
    setWarehouseCageSourceWarehouseId(null);
  };

  const handleCageChange = (value: string): void => {
    setProjectCageId(value ? Number(value) : null);
  };

  const refreshActiveBatches = async (
    cages: Array<{ id: number }> | undefined,
    setter: (value: Record<number, ActiveCageBatchSnapshot | null>) => void
  ): Promise<void> => {
    const ids = (Array.isArray(cages) ? cages : []).map((cage) => Number(cage.id)).filter((id) => Number.isFinite(id) && id > 0);
    if (ids.length === 0) {
      setter({});
      return;
    }

    try {
      const snapshots = await aquaQuickDailyApi.getActiveFishBatchSnapshotsByProjectCageIds(ids);
      setter(snapshots);
    } catch {
      setter(Object.fromEntries(ids.map((id) => [id, null])));
    }
  };

  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
      setTargetProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (projectId == null) {
      setTargetProjectId(null);
      setWarehouseTransferSourceWarehouseId(null);
      setWarehouseCageSourceWarehouseId(null);
      return;
    }
    setTargetProjectId((current) => current ?? projectId);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    if (projectCageId == null) {
      setSourceBatch(null);
      return;
    }
    void (async () => {
      try {
        const snapshot = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
        if (!active) return;
        setSourceBatch(snapshot);
      } catch {
        if (!active) return;
        setSourceBatch(null);
      }
    })();
    return () => { active = false; };
  }, [projectCageId]);

  useEffect(() => {
    let active = true;
    const cages = Array.isArray(projectCages) ? projectCages : [];
    if (cages.length === 0) {
      setSourceBatchByCageId({});
      return;
    }
    void (async () => {
      let snapshots: Record<number, ActiveCageBatchSnapshot | null>;
      try {
        snapshots = await aquaQuickDailyApi.getActiveFishBatchSnapshotsByProjectCageIds(
          cages.map((cage) => cage.id)
        );
      } catch {
        snapshots = Object.fromEntries(cages.map((cage) => [cage.id, null]));
      }
      if (!active) return;
      setSourceBatchByCageId(snapshots);
    })();
    return () => { active = false; };
  }, [projectCages]);

  useEffect(() => {
    let active = true;
    const cages = Array.isArray(transferTargetProjectCages) ? transferTargetProjectCages : [];
    if (cages.length === 0) {
      setTransferTargetBatchByCageId({});
      return;
    }
    void (async () => {
      let snapshots: Record<number, ActiveCageBatchSnapshot | null>;
      try {
        snapshots = await aquaQuickDailyApi.getActiveFishBatchSnapshotsByProjectCageIds(
          cages.map((cage) => cage.id)
        );
      } catch {
        snapshots = Object.fromEntries(cages.map((cage) => [cage.id, null]));
      }
      if (!active) return;
      setTransferTargetBatchByCageId(snapshots);
    })();
    return () => { active = false; };
  }, [transferTargetProjectCages]);

  useEffect(() => {
    let active = true;
    const warehouseIds = (Array.isArray(warehouses) ? warehouses : []).map((warehouse) => Number(warehouse.id)).filter((id) => Number.isFinite(id) && id > 0);
    if (projectId == null || warehouseIds.length === 0) {
      setWarehouseBatchByWarehouseId({});
      return;
    }

    void (async () => {
      try {
        const snapshots = await aquaQuickDailyApi.getActiveFishBatchSnapshotsByWarehouseIds(projectId, warehouseIds);
        if (!active) return;
        setWarehouseBatchByWarehouseId(snapshots);
      } catch {
        if (!active) return;
        setWarehouseBatchByWarehouseId(Object.fromEntries(warehouseIds.map((id) => [id, []])));
      }
    })();

    return () => { active = false; };
  }, [projectId, warehouses]);

  const sourceProjectCages = useMemo(() =>
    (Array.isArray(projectCages) ? projectCages : []).filter((cage) =>
      projectId == null ? true : Number(cage.projectId) === Number(projectId)
    ),
    [projectCages, projectId]
  );

  const projectOptions = useMemo(
    () =>
      (Array.isArray(projects) ? projects : []).map((p) => ({
        value: String(p.id),
        label: formatLabelWithKey(`${p.projectCode ?? ''} - ${p.projectName ?? ''}`.trim().replace(/^-\s*|\s*-\s*$/g, ''), p.id),
      })),
    [projects]
  );

  const cageOptions = useMemo(
    () =>
      sourceProjectCages.map((pc) => {
      const snapshot = sourceBatchByCageId[pc.id];
      const liveCount = Number(snapshot?.liveCount ?? 0);
      const averageGram = Number(snapshot?.averageGram ?? 0);
      const baseLabel = pc.cageCode ?? pc.cageName ?? String(pc.id);
      return {
        value: String(pc.id),
        label: `${formatLabelWithKey(baseLabel, pc.id)} - ${liveCount}/${averageGram}`,
      };
      }),
    [sourceProjectCages, sourceBatchByCageId]
  );

  const transferTargetOptions = useMemo(() => {
    const cages = Array.isArray(transferTargetProjectCages) ? transferTargetProjectCages : [];
    const requireFullTransfer = aquaSettings?.requireFullTransfer ?? true;
    const partialMode = aquaSettings?.partialTransferOccupiedCageMode ?? 0;

    return cages
      .filter((pc) => pc.id !== projectCageId)
      .filter((pc) => {
        if (requireFullTransfer) return true;
        const snapshot = transferTargetBatchByCageId[pc.id];
        const liveCount = Number(snapshot?.liveCount ?? 0);
        if (liveCount <= 0) return true;
        if (partialMode === 0) return false;
        if (partialMode === 1) return Number(snapshot?.fishBatchId ?? 0) === Number(sourceBatch?.fishBatchId ?? 0);
        return true;
      })
      .map((pc) => {
        const snapshot = transferTargetBatchByCageId[pc.id];
        const liveCount = Number(snapshot?.liveCount ?? 0);
        const baseLabel = pc.cageCode ?? pc.cageName ?? String(pc.id);
        const project = (Array.isArray(projects) ? projects : []).find((item) => Number(item.id) === Number(pc.projectId));
        const projectLabel = project?.projectCode ?? project?.projectName ?? String(pc.projectId);
        const occupancyLabel = liveCount > 0 ? t('aqua.quickDailyEntry.transfer.occupied') : t('aqua.quickDailyEntry.transfer.empty');
        return {
          value: String(pc.id),
          label: `${formatLabelWithKey(baseLabel, pc.id)} - ${projectLabel} - ${occupancyLabel}`,
        };
      });
  }, [aquaSettings?.partialTransferOccupiedCageMode, aquaSettings?.requireFullTransfer, projectCageId, projects, sourceBatch?.fishBatchId, t, transferTargetBatchByCageId, transferTargetProjectCages]);

  const warehouseOptions = useMemo(
    () =>
      (Array.isArray(warehouses) ? warehouses : []).map((warehouse) => ({
        value: String(warehouse.id),
        label: formatLabelWithKey(`${warehouse.erpWarehouseCode} - ${warehouse.warehouseName}`.trim(), warehouse.id),
      })),
    [warehouses]
  );

  const warehouseTransferBatchSnapshots = useMemo(
    () => (warehouseTransferSourceWarehouseId != null ? warehouseBatchByWarehouseId[warehouseTransferSourceWarehouseId] ?? [] : []),
    [warehouseBatchByWarehouseId, warehouseTransferSourceWarehouseId]
  );

  const warehouseTransferBatchOptions = useMemo(
    () =>
      warehouseTransferBatchSnapshots.map((batch) => ({
        value: String(batch.fishBatchId),
        label: `${batch.batchCode ?? batch.fishBatchId} - ${batch.liveCount}/${batch.averageGram}`,
      })),
    [warehouseTransferBatchSnapshots]
  );

  const warehouseCageTransferBatchSnapshots = useMemo(
    () => (warehouseCageSourceWarehouseId != null ? warehouseBatchByWarehouseId[warehouseCageSourceWarehouseId] ?? [] : []),
    [warehouseBatchByWarehouseId, warehouseCageSourceWarehouseId]
  );

  const warehouseCageTransferBatchOptions = useMemo(
    () =>
      warehouseCageTransferBatchSnapshots.map((batch) => ({
        value: String(batch.fishBatchId),
        label: `${batch.batchCode ?? batch.fishBatchId} - ${batch.liveCount}/${batch.averageGram}`,
      })),
    [warehouseCageTransferBatchSnapshots]
  );

  useEffect(() => {
    if (projectCageId == null) return;
    const existsInSourceList = sourceProjectCages.some((c) => c.id === projectCageId);
    if (!existsInSourceList) setProjectCageId(null);
  }, [projectCageId, sourceProjectCages]);

  useEffect(() => {
    if (!initialProjectCageId) return;
    if (!projectId) return;

    const exists = sourceProjectCages.some((c) => c.id === initialProjectCageId);
    if (exists) {
      setProjectCageId(initialProjectCageId);
    }
  }, [initialProjectCageId, projectId, sourceProjectCages]);

  const handleFeedingSubmit = async (data: FeedingQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const effectiveGramPerUnit = data.gramPerUnit > 0 ? data.gramPerUnit : 1;
      await createFeedingLineWithAutoHeader.mutateAsync({
        projectId,
        feedingDate: selectedDate,
        feedingSlot: data.feedingSlot,
        sourceType: 0,
        stockId: data.stockId,
        qtyUnit: data.qtyUnit,
        gramPerUnit: effectiveGramPerUnit,
        totalGram: data.qtyUnit * effectiveGramPerUnit,
      });
      toast.success(t('aqua.quickDailyEntry.toast.feedingSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleMortalitySubmit = async (data: MortalityQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (sourceBatch == null) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      const mortalityLine = await createMortalityLineWithAutoHeader.mutateAsync({
        projectId,
        mortalityDate: selectedDate,
        fishBatchId: sourceBatch.fishBatchId,
        projectCageId,
        deadCount: data.deadCount,
      });
      if (Number(mortalityLine.mortalityId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postMortality(Number(mortalityLine.mortalityId)); } catch {}
      }
      toast.success(t('aqua.quickDailyEntry.toast.mortalitySaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleWeatherSubmit = async (data: WeatherQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null) return;
    try {
      await createDailyWeather.mutateAsync({ projectId, weatherDate: selectedDate, weatherSeverityId: data.weatherSeverityId, weatherTypeId: data.weatherTypeId, note: data.description });
      toast.success(t('aqua.quickDailyEntry.toast.weatherSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleNetOperationSubmit = async (data: NetOperationQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const netOperationLine = await createNetOperationLineWithAutoHeader.mutateAsync({
        projectId,
        operationDate: selectedDate,
        operationTypeId: data.netOperationTypeId,
        projectCageId,
        fishBatchId: data.fishBatchId > 0 ? data.fishBatchId : undefined,
        note: data.description,
      });
      if (Number(netOperationLine.netOperationId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postNetOperation(Number(netOperationLine.netOperationId)); } catch {}
      }
      toast.success(t('aqua.quickDailyEntry.toast.netOperationSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleTransferSubmit = async (data: TransferQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    if (targetProjectId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!sourceBatch) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (data.toProjectCageId === projectCageId) throw new Error(t('aqua.quickDailyEntry.toast.sameCageTransferNotAllowed'));
      const transferFishCount = aquaSettings?.requireFullTransfer
        ? Number(sourceBatch.liveCount ?? 0)
        : Number(data.fishCount ?? 0);
      if (transferFishCount <= 0) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (transferFishCount > sourceBatch.liveCount) throw new Error(t('aqua.quickDailyEntry.toast.transferCountTooHigh'));
      const isPartialTransfer = transferFishCount < Number(sourceBatch.liveCount ?? 0);
      if (isPartialTransfer) {
        const targetSnapshot = transferTargetBatchByCageId[data.toProjectCageId];
        const targetLiveCount = Number(targetSnapshot?.liveCount ?? 0);
        if (targetLiveCount > 0) {
          const partialMode = aquaSettings?.partialTransferOccupiedCageMode ?? 0;
          if (partialMode === 0) throw new Error(t('aqua.quickDailyEntry.toast.partialTransferToOccupiedCageNotAllowed'));
          if (partialMode === 1 && Number(targetSnapshot?.fishBatchId ?? 0) !== Number(sourceBatch.fishBatchId)) {
            throw new Error(t('aqua.quickDailyEntry.toast.partialTransferToOccupiedCageOnlySameBatchAllowed'));
          }
        }
      }

      const averageGram = sourceBatch.averageGram > 0 ? sourceBatch.averageGram : 0;
      const biomassGram = transferFishCount * averageGram;
      const transferLine = await createTransferLineWithAutoHeader.mutateAsync({
        projectId,
        transferDate: selectedDate,
        fishBatchId: sourceBatch.fishBatchId,
        fromProjectCageId: projectCageId,
        toProjectCageId: data.toProjectCageId,
        fishCount: transferFishCount,
        averageGram,
        biomassGram,
      });
      if (Number(transferLine.transferId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postTransfer(Number(transferLine.transferId)); } catch {}
      }
      const [sourceProjectCagesResponse, targetProjectCagesResponse] = await Promise.all([
        refetchProjectCages(),
        refetchTransferTargetProjectCages(),
      ]);
      await Promise.all([
        refreshActiveBatches(sourceProjectCagesResponse.data, setSourceBatchByCageId),
        refreshActiveBatches(targetProjectCagesResponse.data, setTransferTargetBatchByCageId),
      ]);
      const refreshedSourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      setSourceBatch(refreshedSourceBatch);
      setIsTransferSuccessDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleCageWarehouseTransferSubmit = async (data: CageWarehouseTransferQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const activeBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!activeBatch) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (Number(data.fishCount ?? 0) > Number(activeBatch.liveCount ?? 0)) {
        throw new Error(t('aqua.quickDailyEntry.toast.cageWarehouseTransferCountTooHigh'));
      }

      const averageGram = Number(activeBatch.averageGram ?? 0);
      const biomassGram = Number(data.fishCount ?? 0) * averageGram;
      const line = await createCageWarehouseTransferLineWithAutoHeader.mutateAsync({
        projectId,
        transferDate: selectedDate,
        fishBatchId: activeBatch.fishBatchId,
        fromProjectCageId: projectCageId,
        toWarehouseId: Number(data.toWarehouseId),
        fishCount: Number(data.fishCount ?? 0),
        averageGram,
        biomassGram,
      });

      if (Number(line.cageWarehouseTransferId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postCageWarehouseTransfer(Number(line.cageWarehouseTransferId)); } catch {}
      }

      const refreshedSourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      setSourceBatch(refreshedSourceBatch);
      await Promise.all([
        refreshActiveBatches(sourceProjectCages, setSourceBatchByCageId),
        projectId != null && Array.isArray(warehouses) && warehouses.length > 0
          ? aquaQuickDailyApi.getActiveFishBatchSnapshotsByWarehouseIds(projectId, warehouses.map((warehouse) => warehouse.id)).then(setWarehouseBatchByWarehouseId)
          : Promise.resolve(),
      ]);
      toast.success(t('aqua.quickDailyEntry.toast.cageWarehouseTransferSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleWarehouseTransferSubmit = async (data: WarehouseTransferQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null) return;
    try {
      if (Number(data.fromWarehouseId) === Number(data.toWarehouseId)) {
        throw new Error(t('aqua.quickDailyEntry.toast.sameWarehouseTransferNotAllowed'));
      }
      const sourceBatchSnapshot = (warehouseBatchByWarehouseId[Number(data.fromWarehouseId)] ?? []).find(
        (item) => Number(item.fishBatchId) === Number(data.fishBatchId)
      );
      if (!sourceBatchSnapshot) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForWarehouse'));
      if (Number(data.fishCount ?? 0) > Number(sourceBatchSnapshot.liveCount ?? 0)) {
        throw new Error(t('aqua.quickDailyEntry.toast.warehouseTransferCountTooHigh'));
      }

      const averageGram = Number(sourceBatchSnapshot.averageGram ?? 0);
      const biomassGram = Number(data.fishCount ?? 0) * averageGram;
      const line = await createWarehouseTransferLineWithAutoHeader.mutateAsync({
        projectId,
        transferDate: selectedDate,
        fishBatchId: sourceBatchSnapshot.fishBatchId,
        fromWarehouseId: Number(data.fromWarehouseId),
        toWarehouseId: Number(data.toWarehouseId),
        fishCount: Number(data.fishCount ?? 0),
        averageGram,
        biomassGram,
      });

      if (Number(line.warehouseTransferId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postWarehouseTransfer(Number(line.warehouseTransferId)); } catch {}
      }

      if (Array.isArray(warehouses) && warehouses.length > 0) {
        const refreshed = await aquaQuickDailyApi.getActiveFishBatchSnapshotsByWarehouseIds(projectId, warehouses.map((warehouse) => warehouse.id));
        setWarehouseBatchByWarehouseId(refreshed);
      }
      toast.success(t('aqua.quickDailyEntry.toast.warehouseTransferSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleWarehouseCageTransferSubmit = async (data: WarehouseCageTransferQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatchSnapshot = (warehouseBatchByWarehouseId[Number(data.fromWarehouseId)] ?? []).find(
        (item) => Number(item.fishBatchId) === Number(data.fishBatchId)
      );
      if (!sourceBatchSnapshot) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForWarehouse'));
      if (Number(data.fishCount ?? 0) > Number(sourceBatchSnapshot.liveCount ?? 0)) {
        throw new Error(t('aqua.quickDailyEntry.toast.warehouseCageTransferCountTooHigh'));
      }

      const averageGram = Number(sourceBatchSnapshot.averageGram ?? 0);
      const biomassGram = Number(data.fishCount ?? 0) * averageGram;
      const line = await createWarehouseCageTransferLineWithAutoHeader.mutateAsync({
        projectId,
        transferDate: selectedDate,
        fishBatchId: sourceBatchSnapshot.fishBatchId,
        fromWarehouseId: Number(data.fromWarehouseId),
        toProjectCageId: projectCageId,
        fishCount: Number(data.fishCount ?? 0),
        averageGram,
        biomassGram,
      });

      if (Number(line.warehouseCageTransferId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postWarehouseCageTransfer(Number(line.warehouseCageTransferId)); } catch {}
      }

      const refreshedSourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      setSourceBatch(refreshedSourceBatch);
      await Promise.all([
        refreshActiveBatches(sourceProjectCages, setSourceBatchByCageId),
        Array.isArray(warehouses) && warehouses.length > 0
          ? aquaQuickDailyApi.getActiveFishBatchSnapshotsByWarehouseIds(projectId, warehouses.map((warehouse) => warehouse.id)).then(setWarehouseBatchByWarehouseId)
          : Promise.resolve(),
      ]);
      toast.success(t('aqua.quickDailyEntry.toast.warehouseCageTransferSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleStockChangeSubmit = async (data: StockChangeQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const sourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!sourceBatch) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (data.toFishBatchId === sourceBatch.fishBatchId) throw new Error(t('aqua.quickDailyEntry.toast.sameBatchStockChangeNotAllowed'));
      if (data.fishCount > sourceBatch.liveCount) throw new Error(t('aqua.quickDailyEntry.toast.stockChangeCountTooHigh'));

      const averageGram = sourceBatch.averageGram > 0 ? sourceBatch.averageGram : 0;
      const newAverageGram = Number(data.newAverageGram);
      if (newAverageGram <= 0) throw new Error(t('aqua.quickDailyEntry.toast.invalidNewAverageGram'));
      const biomassGram = data.fishCount * averageGram;
      const stockConvertLine = await createStockConvertLineWithAutoHeader.mutateAsync({
        projectId,
        convertDate: selectedDate,
        fromFishBatchId: sourceBatch.fishBatchId,
        toFishBatchId: data.toFishBatchId,
        fromProjectCageId: projectCageId,
        toProjectCageId: projectCageId,
        fishCount: data.fishCount,
        averageGram,
        newAverageGram,
        biomassGram,
      });
      if (Number(stockConvertLine.stockConvertId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postStockConvert(Number(stockConvertLine.stockConvertId)); } catch {}
      }
      toast.success(t('aqua.quickDailyEntry.toast.stockChangeSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleShipmentSubmit = async (data: ShipmentQuickFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    if (projectId == null || projectCageId == null) return;
    try {
      const activeBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      if (!activeBatch) throw new Error(t('aqua.quickDailyEntry.toast.noActiveBatchForCage'));
      if (Number(data.fishCount ?? 0) > Number(activeBatch.liveCount ?? 0)) {
        throw new Error(t('aqua.quickDailyEntry.toast.shipmentCountTooHigh'));
      }

      const averageGram = Number(activeBatch.averageGram ?? 0);
      const biomassGram = Number(data.fishCount ?? 0) * averageGram;
      const shipmentLine = await createShipmentLineWithAutoHeader.mutateAsync({
        projectId,
        shipmentDate: selectedDate,
        targetWarehouseId: Number(data.targetWarehouseId ?? 0),
        fishBatchId: activeBatch.fishBatchId,
        fromProjectCageId: projectCageId,
        fishCount: Number(data.fishCount ?? 0),
        averageGram,
        biomassGram,
        currencyCode: data.currencyCode || 'TRY',
        unitPrice: data.unitPrice ? Number(data.unitPrice) : 0,
        description: data.description,
      });

      if (Number(shipmentLine.shipmentId ?? 0) > 0) {
        try { await aquaQuickDailyApi.postShipment(Number(shipmentLine.shipmentId)); } catch {}
      }

      const refreshedSourceBatch = await aquaQuickDailyApi.findActiveFishBatchByProjectCage(projectCageId);
      setSourceBatch(refreshedSourceBatch);
      await refreshActiveBatches(sourceProjectCages, setSourceBatchByCageId);
      toast.success(t('aqua.quickDailyEntry.toast.shipmentSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('aqua.quickDailyEntry.toast.saveFailed')); throw e;
    }
  };

  const handleProjectMergeSubmit = async (data: ProjectMergeFormSchema): Promise<void> => {
    if (!canCreateQuickDailyEntry) return;
    try {
      await createProjectMerge.mutateAsync({
        targetProjectId: data.targetProjectId,
        mergeDate: data.mergeDate,
        description: data.description,
        sourceProjectIds: data.sourceProjectIds,
        sourceProjectStateAfterMerge: data.sourceProjectStateAfterMerge,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('projectMerge.toast.saveFailed'));
      throw e;
    }
  };

  return (
    <div className="w-full space-y-6 pb-10 animate-in fade-in duration-500">
      
      {/* Üst Başlık Alanı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            <ClipboardEdit className="size-6 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              {t('aqua.quickDailyEntry.pageTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
              {t('aqua.quickDailyEntry.pageDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Proje ve Kafes Seçim Kartı */}
      <div className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-2xl p-6 transition-all duration-300 relative overflow-hidden">
        {/* Şık Arka Plan Parıltısı */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 relative z-10">
          <div className="space-y-3 w-full">
            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ChevronRight size={14} className="text-cyan-500" />
              {t('aqua.quickDailyEntry.project')}
            </label>
            <Combobox
              options={projectOptions}
              value={projectId != null ? String(projectId) : ''}
              onValueChange={handleProjectChange}
              placeholder={t('aqua.quickDailyEntry.selectProject')}
              searchPlaceholder={t('common.search')}
              emptyText={t('common.noResults')}
              className="w-full bg-slate-50 dark:bg-blue-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-cyan-800/30 h-12 rounded-xl focus-visible:ring-cyan-500/20 font-medium transition-all"
            />
          </div>
          
          <div className="space-y-3 w-full">
            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ChevronRight size={14} className="text-cyan-500" />
              {t('aqua.quickDailyEntry.cage')}
            </label>
            <Combobox
              options={cageOptions}
              value={projectCageId != null ? String(projectCageId) : ''}
              onValueChange={handleCageChange}
              placeholder={t('aqua.quickDailyEntry.selectCage')}
              searchPlaceholder={t('common.search')}
              emptyText={t('common.noResults')}
              disabled={!projectId}
              className="w-full bg-slate-50 dark:bg-blue-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-cyan-800/30 h-12 rounded-xl focus-visible:ring-cyan-500/20 font-medium disabled:opacity-50 transition-all"
            />
          </div>

          <div className="space-y-3 w-full">
            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <CalendarDays size={14} className="text-cyan-500" />
              {t('aqua.quickDailyEntry.date')}
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full bg-slate-50 dark:bg-blue-900/20 text-slate-900 dark:text-white border-slate-200 dark:border-cyan-800/30 h-12 rounded-xl focus-visible:ring-cyan-500/20 font-medium transition-all dark:[&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
        </div>
      </div>
      
      {/* İşlem Sekmeleri (Tab'lar) */}
      <OperationTypeTabs
        feedingTab={<FeedingQuickForm projectId={projectId} projectCageId={projectCageId} stocks={stocks} isLoadingStocks={isLoadingStocks} onSubmit={handleFeedingSubmit} isSubmitting={createFeedingLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        mortalityTab={<MortalityQuickForm projectId={projectId} projectCageId={projectCageId} onSubmit={handleMortalitySubmit} isSubmitting={createMortalityLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        weatherTab={<WeatherQuickForm projectId={projectId} weatherTypes={weatherTypes} severities={weatherSeverities} onSubmit={handleWeatherSubmit} isSubmitting={createDailyWeather.isPending} canSubmit={canCreateQuickDailyEntry} />}
        netOperationTab={<NetOperationQuickForm projectId={projectId} projectCageId={projectCageId} fishBatches={fishBatches} netOperationTypes={netOperationTypes} onSubmit={handleNetOperationSubmit} isSubmitting={createNetOperationLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        transferTab={<TransferQuickForm projectId={projectId} projectCageId={projectCageId} targetProjectId={targetProjectId} projects={projectOptions} projectCages={transferTargetOptions} sourceBatch={sourceBatch} onSubmit={handleTransferSubmit} onTargetProjectChange={setTargetProjectId} isSubmitting={createTransferLineWithAutoHeader.isPending} requireFullTransfer={aquaSettings?.requireFullTransfer ?? true} canSubmit={canCreateQuickDailyEntry} />}
        cageWarehouseTransferTab={<CageWarehouseTransferQuickForm projectId={projectId} projectCageId={projectCageId} warehouseOptions={warehouseOptions} sourceBatch={sourceBatch} onSubmit={handleCageWarehouseTransferSubmit} isSubmitting={createCageWarehouseTransferLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        warehouseTransferTab={<WarehouseTransferQuickForm projectId={projectId} warehouseOptions={warehouseOptions} batchOptions={warehouseTransferBatchOptions} batchSnapshots={warehouseTransferBatchSnapshots} onSubmit={handleWarehouseTransferSubmit} onSourceWarehouseChange={setWarehouseTransferSourceWarehouseId} isSubmitting={createWarehouseTransferLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        warehouseCageTransferTab={<WarehouseCageTransferQuickForm projectId={projectId} projectCageId={projectCageId} warehouseOptions={warehouseOptions} batchOptions={warehouseCageTransferBatchOptions} batchSnapshots={warehouseCageTransferBatchSnapshots} onSubmit={handleWarehouseCageTransferSubmit} onSourceWarehouseChange={setWarehouseCageSourceWarehouseId} isSubmitting={createWarehouseCageTransferLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        shipmentTab={<ShipmentQuickForm projectId={projectId} projectCageId={projectCageId} warehouseOptions={warehouseOptions} sourceBatch={sourceBatch} onSubmit={handleShipmentSubmit} isSubmitting={createShipmentLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        stockChangeTab={<StockChangeQuickForm projectId={projectId} projectCageId={projectCageId} fishBatches={fishBatches} sourceBatch={sourceBatch} onSubmit={handleStockChangeSubmit} isSubmitting={createStockConvertLineWithAutoHeader.isPending} canSubmit={canCreateQuickDailyEntry} />}
        projectMergeTab={<ProjectMergeQuickForm selectedProjectId={projectId} selectedDate={selectedDate} projects={Array.isArray(projects) ? projects : []} onSubmit={handleProjectMergeSubmit} isSubmitting={createProjectMerge.isPending} canSubmit={canCreateQuickDailyEntry} mergeEnabled={aquaSettings?.allowProjectMerge ?? false} />}
      />

      {/* Transfer Başarılı Dialog */}
      <AlertDialog open={isTransferSuccessDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-blue-950 border border-slate-200 dark:border-cyan-800/30 shadow-2xl rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-xl">
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <CheckCircle2 className="text-emerald-500 size-6" />
              </div>
              {t('aqua.quickDailyEntry.transferSuccessDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium mt-2">
              {t('aqua.quickDailyEntry.transferSuccessDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 border-0 font-bold h-11 px-8 rounded-xl transition-all"
              onClick={() => {
                setIsTransferSuccessDialogOpen(false);
              }}
            >
              {t('common.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
