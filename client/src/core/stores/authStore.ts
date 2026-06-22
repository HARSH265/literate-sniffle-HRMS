import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import type { AuthUser } from '../types/auth.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  setPermissions: (permissions: string[]) => void;
  touchActivity: () => void;
}

let activityTimer: ReturnType<typeof setTimeout> | null = null;

function startSessionTimer() {
  if (activityTimer) clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    useAuthStore.getState().logout();
    window.location.href = '/';
  }, AUTH_CONSTANTS.sessionTimeoutMs);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      login: (user: AuthUser, token: string) => {
        set({ user, token, isAuthenticated: true, lastActivity: Date.now() });
        startSessionTimer();
      },
logout: () => {
          if (activityTimer) clearTimeout(activityTimer);
          activityTimer = null;
          set({ user: null, token: null, isAuthenticated: false, lastActivity: 0 });
          // Clear persisted auth slice to avoid ghost sessions
          useAuthStore.persist.clearStorage();
        },
      updateUser: (user: AuthUser) => set({ user }),
      setPermissions: (permissions: string[]) => {
        const state = get();
        if (state.user) {
          set({ user: { ...state.user, permissions } });
        }
      },
      touchActivity: () => {
        const state = get();
        if (state.isAuthenticated) {
          set({ lastActivity: Date.now() });
startSessionTimer();
        }
      },
    }),
    {
      name: AUTH_CONSTANTS.storageKeys.authSlice,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      onRehydrateStorage: (state: any) => {
        if (state && typeof state.lastActivity === 'number') {
          const now = Date.now();
          if (state.lastActivity + AUTH_CONSTANTS.sessionTimeoutMs < now) {
            useAuthStore.persist.clearStorage();
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  AUTH_CONSTANTS.activityEvents.forEach((event) => {
    window.addEventListener(event, () => {
      useAuthStore.getState().touchActivity();
    }, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      useAuthStore.getState().touchActivity();
    }
  });
}