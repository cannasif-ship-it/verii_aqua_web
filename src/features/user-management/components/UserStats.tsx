import { type ReactElement } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { useUserList } from '../hooks/useUserList';

export function UserStats(): ReactElement {
  
  // İstatistikleri çekmek için mevcut listeyi kullanıyoruz (veya özel bir stats hook'u varsa o da olur)
  const { data } = useUserList({ pageNumber: 1, pageSize: 1000 });
  
  const totalUsers = data?.totalCount || 0;
  const activeUsers = data?.data?.filter(u => u.isActive).length || 0;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700 slide-in-from-top-4">
      
      {/* Toplam Kullanıcı Kartı */}
      <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl group transition-all duration-300 hover:border-pink-500/30 shadow-lg shadow-pink-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500 ring-1 ring-pink-500/20">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Toplam Kullanıcı</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 tabular-nums">
                {totalUsers}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aktif Kullanıcı Kartı */}
      <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl group transition-all duration-300 hover:border-emerald-500/30 shadow-lg shadow-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
              <UserCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Aktif Kullanıcılar</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1 tabular-nums">
                {activeUsers}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pasif Kullanıcı Kartı */}
      <Card className="relative overflow-hidden border border-white/5 bg-[#1a1025]/60 backdrop-blur-xl group transition-all duration-300 hover:border-orange-500/30 shadow-lg shadow-orange-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
              <UserX className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pasif Kullanıcılar</p>
              <h3 className="text-3xl font-extrabold text-orange-400 mt-1 tabular-nums">
                {inactiveUsers}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}