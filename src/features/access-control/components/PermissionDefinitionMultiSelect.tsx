import { type ReactElement, useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, Loader2, ShieldCheck } from 'lucide-react';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { useSyncPermissionDefinitionsMutation } from '../hooks/useSyncPermissionDefinitionsMutation';
import { useMyPermissionsQuery } from '../hooks/useMyPermissionsQuery';
import { cn } from '@/lib/utils';
import type { PermissionDefinitionDto } from '../types/access-control.types';
import { getPermissionDisplayMeta, PERMISSION_CODE_CATALOG } from '../utils/permission-config';
import { hasPermission } from '../utils/hasPermission';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

type PermissionAction = 'view' | 'create' | 'update' | 'delete';

interface PermissionMatrixRow {
  baseCode: string;
  title: string;
  subtitle: string;
  section: string;
  actions: Partial<Record<PermissionAction, PermissionDefinitionDto>>;
}

const ACTION_ORDER: PermissionAction[] = ['view', 'create', 'update', 'delete'];

export function PermissionDefinitionMultiSelect({
  value = [],
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const autoSyncTriggeredRef = useRef(false);
  const actionLabels: Record<PermissionAction, string> = {
    view: t('common.view', { ns: 'common', defaultValue: 'Görüntüleme' }),
    create: t('common.create', { ns: 'common', defaultValue: 'Oluşturma' }),
    update: t('common.update', { ns: 'common', defaultValue: 'Güncelleme' }),
    delete: t('common.delete', { ns: 'common', defaultValue: 'Silme' }),
  };
  
  const { data: permissionsResponse, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'Name',
    sortDirection: 'asc'
  });
  const syncMutation = useSyncPermissionDefinitionsMutation();
  const { data: myPermissions } = useMyPermissionsQuery();
  const canSync =
    hasPermission(myPermissions, 'access-control.permission-definitions.create') ||
    hasPermission(myPermissions, 'access-control.permission-definitions.update');

  const [searchTerm, setSearchTerm] = useState('');

  const missingPermissionCodes = useMemo(() => {
    const items = permissionsResponse?.data || [];
    const existingCodes = new Set(items.map((permission) => permission.code.toLowerCase()));
    return PERMISSION_CODE_CATALOG.filter((code) => !existingCodes.has(code.toLowerCase()));
  }, [permissionsResponse]);

  useEffect(() => {
    if (!canSync || autoSyncTriggeredRef.current || missingPermissionCodes.length === 0) {
      return;
    }

    autoSyncTriggeredRef.current = true;
    void syncMutation.mutateAsync({
      items: PERMISSION_CODE_CATALOG.map((code) => {
        const meta = getPermissionDisplayMeta(code);
        const name = meta ? t(meta.key, { ns: 'common', defaultValue: meta.fallback }) : code;
        return { code, name, isActive: true };
      }),
      reactivateSoftDeleted: true,
      updateExistingNames: true,
      updateExistingDescriptions: true,
      updateExistingIsActive: true,
    });
  }, [canSync, missingPermissionCodes, syncMutation, t]);

  const matrixRows = useMemo<PermissionMatrixRow[]>(() => {
    const items = permissionsResponse?.data || [];
    const rows = new Map<string, PermissionMatrixRow>();

    const getSectionTitle = (baseCode: string): string => {
      if (baseCode.startsWith('aqua.definitions.')) return t('permissionGroups.sections.aquaDefinitions');
      if (baseCode.startsWith('aqua.operations.')) return t('permissionGroups.sections.aquaOperations');
      if (baseCode.startsWith('aqua.reports.')) return t('permissionGroups.sections.aquaReports');
      if (baseCode.startsWith('access-control.')) return t('permissionGroups.sections.accessControl');
      if (baseCode.startsWith('stock.')) return t('permissionGroups.sections.stock');
      if (baseCode.startsWith('users.')) return t('permissionGroups.sections.users');
      if (baseCode.startsWith('dashboard.')) return t('permissionGroups.sections.dashboard');
      return t('permissionGroups.sections.other');
    };

    for (const permission of items) {
      const parts = permission.code.split('.');
      const action = parts[parts.length - 1] as PermissionAction;
      const isActionCode = ACTION_ORDER.includes(action);
      const baseCode = isActionCode ? parts.slice(0, -1).join('.') : permission.code;
      const viewMeta = getPermissionDisplayMeta(`${baseCode}.view`) ?? getPermissionDisplayMeta(permission.code);
      const title = viewMeta
        ? t(viewMeta.key, { ns: 'common', defaultValue: viewMeta.fallback })
        : permission.name;

      const existing = rows.get(baseCode) ?? {
        baseCode,
        title,
        subtitle: baseCode,
        section: getSectionTitle(baseCode),
        actions: {},
      };

      if (isActionCode) {
        existing.actions[action] = permission;
      } else {
        existing.actions.view = permission;
      }

      rows.set(baseCode, existing);
    }

    return Array.from(rows.values()).sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  }, [permissionsResponse, t]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return matrixRows;
    const lower = searchTerm.toLowerCase();

    return matrixRows.filter((row) => {
      const actionText = ACTION_ORDER.map((action) => row.actions[action]?.code ?? '').join(' ');
      return (
        row.title.toLowerCase().includes(lower) ||
        row.subtitle.toLowerCase().includes(lower) ||
        row.section.toLowerCase().includes(lower) ||
        actionText.toLowerCase().includes(lower)
      );
    });
  }, [matrixRows, searchTerm]);

  const groupedRows = useMemo(() => {
    return filteredRows.reduce<Record<string, PermissionMatrixRow[]>>((acc, row) => {
      if (!acc[row.section]) {
        acc[row.section] = [];
      }
      acc[row.section].push(row);
      return acc;
    }, {});
  }, [filteredRows]);

  const filteredPermissions = useMemo(
    () => filteredRows.flatMap((row) => ACTION_ORDER.map((action) => row.actions[action]).filter(Boolean) as PermissionDefinitionDto[]),
    [filteredRows]
  );

  const togglePermission = (id: number) => {
    if (disabled) return;
    const newValue = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(newValue);
  };

  const toggleAll = () => {
    if (disabled || filteredPermissions.length === 0) return;
    if (value.length === filteredPermissions.length) {
      onChange([]);
    } else {
      onChange(filteredPermissions.map((p) => p.id));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[450px] bg-white dark:bg-blue-950/20 rounded-xl overflow-hidden border-0">
      <div className="p-4 border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/80 dark:bg-blue-900/20 backdrop-blur-sm shrink-0">
        <div className="relative group mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-blue-950 border-slate-200 dark:border-cyan-800/30 rounded-xl h-10 text-slate-900 dark:text-white transition-all focus-visible:ring-cyan-500/20"
          />
        </div>
        
        <div className="flex items-center justify-between px-1">
          <div 
            className="flex items-center gap-2 cursor-pointer group select-none active:scale-95 transition-transform"
            onClick={toggleAll}
          >
            <Checkbox
              checked={filteredPermissions.length > 0 && value.length === filteredPermissions.length}
              onCheckedChange={toggleAll}
              disabled={disabled}
              className="border-slate-300 dark:border-cyan-800 data-[state=checked]:bg-cyan-600 pointer-events-none"
            />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
              {t('permissionGroups.selectAll')}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-800/50">
            {value.length} / {filteredPermissions.length}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-transparent">
        {isLoading || syncMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-20 text-cyan-500">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs font-medium">{t('common.loading')}...</span>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            <div className="rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-slate-50 dark:bg-blue-900/10 px-4 py-3">
              <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> {t('permissionGroups.moduleTitle')}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('permissionGroups.matrixDescription')}
              </p>
            </div>

            {Object.entries(groupedRows).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-cyan-800/30 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('permissionGroups.noDefinitions')}
              </div>
            ) : (
              Object.entries(groupedRows).map(([sectionTitle, rows]) => (
                <section key={sectionTitle} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{sectionTitle}</h4>
                    <Badge variant="outline" className="rounded-full border-cyan-200/70 bg-cyan-50 text-[10px] text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-400">
                      {rows.length}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-cyan-800/30 bg-white dark:bg-blue-950/30">
                    <div className="min-w-[680px]">
                      <div className="grid grid-cols-[minmax(220px,2fr)_repeat(4,minmax(88px,1fr))] border-b border-slate-200 dark:border-cyan-800/30 bg-slate-50/80 dark:bg-blue-900/20">
                        <div className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                          {t('permissionGroups.matrix.resource')}
                        </div>
                        {ACTION_ORDER.map((action) => (
                          <div key={action} className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {actionLabels[action]}
                          </div>
                        ))}
                      </div>

                      {rows.map((row) => (
                        <div
                          key={row.baseCode}
                          className="grid grid-cols-[minmax(220px,2fr)_repeat(4,minmax(88px,1fr))] border-b border-slate-100 last:border-b-0 dark:border-cyan-800/10"
                        >
                          <div className="px-4 py-4">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{row.title}</div>
                            <code className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">{row.subtitle}</code>
                          </div>

                          {ACTION_ORDER.map((action) => {
                            const permission = row.actions[action];
                            const isSelected = permission ? value.includes(permission.id) : false;

                            return (
                              <div key={action} className="flex items-center justify-center px-3 py-4">
                                {permission ? (
                                  <label
                                    className={cn(
                                      "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all",
                                      disabled
                                        ? "cursor-not-allowed opacity-60"
                                        : "hover:border-cyan-400 hover:bg-cyan-50 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20",
                                      isSelected
                                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-300"
                                        : "border-slate-200 bg-white text-slate-500 dark:border-cyan-800/30 dark:bg-blue-950/40 dark:text-slate-300"
                                    )}
                                    title={actionLabels[action]}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => togglePermission(permission.id)}
                                      disabled={disabled}
                                      className="border-slate-300 dark:border-cyan-700 data-[state=checked]:bg-cyan-600"
                                    />
                                    <span className="sr-only">{actionLabels[action]}</span>
                                  </label>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-300 dark:text-slate-600">-</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
