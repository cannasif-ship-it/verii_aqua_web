import { type ReactElement, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { cn } from '@/lib/utils';
import type { PermissionDefinitionDto } from '../types/access-control.types';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

export function PermissionDefinitionMultiSelect({
  value = [],
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  
  const { data: permissionsResponse, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'Name',
    sortDirection: 'asc'
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredPermissions = useMemo(() => {
    const items = permissionsResponse?.data || [];
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (p: PermissionDefinitionDto) =>
        p.name.toLowerCase().includes(lower) ||
        p.code.toLowerCase().includes(lower)
    );
  }, [permissionsResponse, searchTerm]);

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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-cyan-500">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs font-medium">{t('common.loading')}...</span>
          </div>
        ) : (
          <div className="pb-4">
            <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-4 ml-1">
              <Globe className="w-3.5 h-3.5" /> {t('permissionGroups.moduleTitle')}
            </p>
            
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3">
              {filteredPermissions.map((permission) => {
                const isSelected = value.includes(permission.id);
                return (
                  <div
                    key={permission.id}
                    onClick={() => togglePermission(permission.id)}
                    className={cn(
                      "group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-[0.99]",
                      isSelected
                        ? "bg-cyan-50 dark:bg-cyan-900/40 border-cyan-400/50 shadow-sm"
                        : "bg-white/50 dark:bg-blue-900/10 border-slate-100 dark:border-cyan-800/10 hover:border-cyan-500/50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                        isSelected 
                          ? "bg-cyan-600 border-cyan-600 text-white shadow-inner" 
                          : "bg-white dark:bg-blue-950 border-slate-300 dark:border-cyan-800 group-hover:border-cyan-500"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shadow-sm" />}
                      </div>
                      
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "text-sm font-bold truncate transition-colors",
                          isSelected ? "text-cyan-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {permission.name}
                        </span>
                        <code className="text-[9px] font-mono text-slate-400 dark:text-slate-500/70 truncate mt-0.5">
                          {permission.code}
                        </code>
                      </div>
                    </div>
                    
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all opacity-0 group-hover:opacity-100 shrink-0",
                      isSelected ? "text-cyan-500 translate-x-1 opacity-100" : "text-slate-300"
                    )} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
