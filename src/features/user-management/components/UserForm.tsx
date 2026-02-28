import { type ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Loader2, User, Mail, Lock, Shield, Power } from 'lucide-react';
import { userFormSchema, userUpdateFormSchema } from '../types/user-types';
import { useUserAuthorityOptionsQuery } from '../hooks/useUserAuthorityOptionsQuery';
import { useUserPermissionGroupsForForm } from '../hooks/useUserPermissionGroupsForForm';
import { UserFormPermissionGroupSelect } from './UserFormPermissionGroupSelect';

export function UserForm({ open, onOpenChange, onSubmit, user, isLoading }: any): ReactElement {
  const isEditMode = !!user;
  const roleOptionsQuery = useUserAuthorityOptionsQuery();
  const permissionGroups = useUserPermissionGroupsForForm(user?.id ?? null);

  const form = useForm({
    resolver: zodResolver(isEditMode ? userUpdateFormSchema : userFormSchema),
    defaultValues: { username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', roleId: 0, isActive: true, permissionGroupIds: [] },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          ...user,
          password: '',
          roleId: user.roleId || 0,
          permissionGroupIds: permissionGroups.data || []
        });
      } else {
        form.reset({ username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', roleId: 0, isActive: true, permissionGroupIds: [] });
      }
    }
  }, [open, user, permissionGroups.data]);

  const inputStyle = "bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 h-11 rounded-xl";
  const labelStyle = "text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0b0713] border-white/10 text-white rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 border-b border-white/5 bg-white/2">
          <DialogTitle className="text-2xl font-bold">{isEditMode ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
          <DialogDescription className="text-slate-400">Kullanıcı bilgilerini ve yetkilerini buradan yönetebilirsiniz.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><User className="size-3" /> Kullanıcı Adı</FormLabel>
                  <FormControl><Input {...field} className={inputStyle} disabled={isEditMode} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><Mail className="size-3" /> E-Posta</FormLabel>
                  <FormControl><Input {...field} type="email" className={inputStyle} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            {!isEditMode && (
              <FormField name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><Lock className="size-3" /> Şifre</FormLabel>
                  <FormControl><Input {...field} type="password" className={inputStyle} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField name="roleId" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><Shield className="size-3" /> Rol</FormLabel>
                  <Combobox 
                    options={(roleOptionsQuery.data || []).map(o => ({ value: String(o.value), label: o.label }))}
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                    className={inputStyle}
                  />
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/5 p-4 bg-white/2 self-end h-11">
                <FormLabel className="text-xs font-bold text-white flex items-center gap-2"><Power className="size-3.5 text-emerald-500" /> Aktif mi?</FormLabel>
                <Switch checked={form.watch('isActive')} onCheckedChange={(v) => form.setValue('isActive', v)} className="data-[state=checked]:bg-pink-600" />
              </FormItem>
            </div>

            <FormField name="permissionGroupIds" render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Yetki Grupları</FormLabel>
                <UserFormPermissionGroupSelect value={field.value} onChange={field.onChange} />
              </FormItem>
            )} />

            <DialogFooter className="pt-6 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">İptal</Button>
              <Button type="submit" disabled={isLoading} className="bg-linear-to-r from-pink-600 to-orange-600 text-white font-bold h-11 px-8 rounded-xl border-0">
                {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}