import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
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
      },
      updateUser: (user) => set({ user }),
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
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
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