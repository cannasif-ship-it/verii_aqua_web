import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserFromToken, isTokenValid } from '@/utils/jwt';

interface User {
  id: number;
  email: string;
  name?: string;
  role?: string;
  roles?: string[];
}

interface Branch {
  id: string;
  name: string;
  code?: string;
}

function mergeUserWithTokenClaims(user: User | null, token: string | null): User | null {
  if (!user || !token) return user;

  const tokenUser = getUserFromToken(token);
  if (!tokenUser) return user;

  const nextRole = user.role ?? tokenUser.role;
  const nextRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : tokenUser.roles;
  const sameRole = user.role === nextRole;
  const sameRoles =
    (user.roles ?? []).length === (nextRoles ?? []).length &&
    (user.roles ?? []).every((value, index) => value === (nextRoles ?? [])[index]);

  if (sameRole && sameRoles) {
    return user;
  }

  return {
    ...user,
    role: nextRole,
    roles: nextRoles,
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  branch: Branch | null;
  authReady: boolean;
  setAuth: (user: User, token: string, branch: Branch | null, rememberMe: boolean, refreshToken?: string | null) => void;
  replaceToken: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  init: () => void;
}

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

function hasPersistentSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('access_token') || localStorage.getItem('refresh_token'));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      branch: null,
      authReady: false,
      setAuth: (user, token, branch, rememberMe, refreshToken) => {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');

        if (rememberMe) {
          localStorage.setItem('access_token', token);
          if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
          sessionStorage.removeItem('access_token');
        } else {
          sessionStorage.setItem('access_token', token);
          if (refreshToken) sessionStorage.setItem('refresh_token', refreshToken);
          localStorage.removeItem('access_token');
        }
        set({ user: mergeUserWithTokenClaims(user, token), token, branch, authReady: true });
      },
      replaceToken: (token, refreshToken) => {
        const persistInLocalStorage = hasPersistentSession();
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');

        if (persistInLocalStorage) {
          localStorage.setItem('access_token', token);
          if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        } else {
          sessionStorage.setItem('access_token', token);
          if (refreshToken) sessionStorage.setItem('refresh_token', refreshToken);
        }

        set((state) => ({
          user: mergeUserWithTokenClaims(state.user, token) ?? getUserFromToken(token),
          token,
          authReady: true,
        }));
      },
      logout: () => {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');
        set({ user: null, token: null, branch: null, authReady: true });
      },
      isAuthenticated: () => {
        const state = get();
        const storedToken = getStoredAccessToken();
        if (!storedToken || !isTokenValid(storedToken)) {
          return false;
        }
        const hydratedUser = mergeUserWithTokenClaims(state.user, storedToken);
        if (hydratedUser && hydratedUser !== state.user) {
          set({ user: hydratedUser, token: storedToken });
        }
        if (!hydratedUser) {
          const tokenUser = getUserFromToken(storedToken);
          if (tokenUser) {
            set({ user: tokenUser, token: storedToken });
            return true;
          }
          return false;
        }
        return true;
      },
      init: () => {
        const storedToken = getStoredAccessToken();
        if (storedToken && isTokenValid(storedToken)) {
          const state = get();
          const tokenUser = getUserFromToken(storedToken);
          const hydratedUser = mergeUserWithTokenClaims(state.user, storedToken) ?? tokenUser;
          set({
            user: hydratedUser,
            token: storedToken,
            authReady: true,
          });
          return;
        }

        set({ user: null, token: null, authReady: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, branch: state.branch }),
    }
  )
);
