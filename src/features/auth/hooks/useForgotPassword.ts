import { useMutation } from '@tanstack/react-query';
import i18n from '@/lib/i18n';
import { toast } from 'sonner';
import { authApi } from '../api/auth-api';

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
    onSuccess: (response) => {
      if (response.success) {
        const message = response.message || i18n.t('auth.forgotPassword.successMessage', { ns: 'auth' });
        toast.success(message, {
          style: {
            background: '#140a1e', // Sayfanın koyu mor teması
            borderColor: 'rgba(236, 72, 153, 0.2)', // Pembe border (sayfa aksanı)
            color: '#fff',
            backdropFilter: 'blur(10px)'
          },
          className: 'text-white border-pink-500/20 shadow-xl shadow-pink-500/10'
        });
      } else {
        const errorMessage = response.message || i18n.t('auth.forgotPassword.emailNotFound', { ns: 'auth' });
        toast.error(errorMessage, {
          style: {
            background: '#140a1e',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: '#fff',
            backdropFilter: 'blur(10px)'
          },
          className: 'text-white border-red-500/20 shadow-xl shadow-red-500/10'
        });
      }
    },
    onError: (error: Error) => {
      console.error('Forgot password error:', error);
      const errorMessage = i18n.t('auth.forgotPassword.emailNotFound', { ns: 'auth' });
      toast.error(errorMessage, {
        style: {
          background: '#140a1e',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: '#fff',
          backdropFilter: 'blur(10px)'
        },
        className: 'text-white border-red-500/20 shadow-xl shadow-red-500/10'
      });
    },
  });
};
