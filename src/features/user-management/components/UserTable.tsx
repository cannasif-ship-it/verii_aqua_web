import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useUserList } from '../hooks/useUserList';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { Edit2, ChevronsUpDown, MailCheck } from 'lucide-react';
import type { UserDto } from '../types/user-types';
import { cn } from '@/lib/utils';

export function UserTable({ pageNumber, pageSize, sortBy, sortDirection, onPageChange, onSortChange, onEdit }: any): ReactElement {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useUserList({ pageNumber, pageSize, sortBy, sortDirection });
  const updateUser = useUpdateUser();

  const handleSort = (column: string) => {
    onSortChange(column, sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc');
  };

  if (isLoading) return <div className="py-24 text-center text-slate-500 font-medium animate-pulse">Veriler yükleniyor...</div>;

  const users = data?.data || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/2">
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              {['Id', 'Username', 'Email'].map((col) => (
                <TableHead key={col} className="cursor-pointer select-none text-xs font-bold uppercase text-slate-400 hover:text-pink-400" onClick={() => handleSort(col)}>
                  <div className="flex items-center gap-1">{t(`userManagement.table.${col.toLowerCase()}`)} <ChevronsUpDown className="size-3 opacity-30" /></div>
                </TableHead>
              ))}
              <TableHead className="text-xs font-bold uppercase text-slate-400">{t('userManagement.table.role')}</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-400">{t('userManagement.table.status')}</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-400">{t('userManagement.table.createdDate')}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: UserDto) => (
              <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/2 group transition-colors">
                <TableCell className="font-mono text-xs text-slate-500">#{user.id}</TableCell>
                <TableCell className="font-bold text-slate-200 group-hover:text-pink-400">{user.username}</TableCell>
                <TableCell className="text-slate-400 text-sm">
                   <div className="flex items-center gap-2">
                     {user.email} {user.isEmailConfirmed && <MailCheck className="size-3 text-emerald-500" />}
                   </div>
                </TableCell>
                <TableCell><Badge className="bg-white/5 text-slate-300 border-0">{user.role || '-'}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={user.isActive} onCheckedChange={(isActive) => updateUser.mutate({ id: user.id, data: { isActive } })} className="data-[state=checked]:bg-pink-600 scale-90" />
                    <span className={cn("text-[10px] font-bold uppercase", user.isActive ? "text-emerald-500" : "text-rose-500")}>
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-500 text-xs">{user.creationTime ? new Date(user.creationTime).toLocaleDateString(i18n.language) : '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(user)} className="size-8 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg">
                    <Edit2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 bg-[#0b0713]/50 border-t border-white/5">
        <span className="text-xs text-slate-500">Toplam <b className="text-slate-200">{data?.totalCount || 0}</b> kayıt</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(pageNumber - 1)} disabled={pageNumber <= 1} className="h-8 border-white/10 bg-transparent text-white hover:bg-white/5">Geri</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(pageNumber + 1)} disabled={pageNumber >= totalPages} className="h-8 border-white/10 bg-transparent text-white hover:bg-white/5">İleri</Button>
        </div>
      </div>
    </div>
  );
}