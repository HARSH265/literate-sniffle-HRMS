import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string | null;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setPermissions: (permissions: string[]) => void;
  touchActivity: () => void;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

let activityTimer: ReturnType<typeof setTimeout> | null = null;

function startSessionTimer() {
  if (activityTimer) clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    useAuthStore.getState().logout();
    window.location.href = '/';
  }, SESSION_TIMEOUT_MS);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      login: (user, token) => {
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
      updateUser: (user) => set({ user }),
      setPermissions: (permissions) => {
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
      name: 'hrms-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      onRehydrateStorage: (state: any) => {
        if (state && typeof state.lastActivity === 'number') {
          const now = Date.now();
          const timeout = 30 * 60 * 1000; // SESSION_TIMEOUT_MS
          if (state.lastActivity + timeout < now) {
            // Session timed out while app was closed
            useAuthStore.persist.clearStorage();
            // Reset in‑memory auth state
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
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach((event) => {
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