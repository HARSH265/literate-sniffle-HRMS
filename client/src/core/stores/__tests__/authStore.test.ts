import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('login sets user, token, and isAuthenticated', () => {
    const user = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'super-admin' };
    useAuthStore.getState().login(user, 'token123');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe('token123');
  });

  it('logout clears all auth state', () => {
    const user = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'super-admin' };
    useAuthStore.getState().login(user, 'token123');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('updateUser updates user without changing auth state', () => {
    const user = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'super-admin' };
    useAuthStore.getState().login(user, 'token123');
    useAuthStore.getState().updateUser({ ...user, name: 'Updated Admin' });
    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Updated Admin');
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('token123');
  });
});
