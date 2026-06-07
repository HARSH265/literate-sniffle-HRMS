import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { render, screen, waitFor } from './test/test-utils';
import App from './App';

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  user: {
    id: 'user-1',
    name: 'Employee User',
    email: 'employee@test.com',
    role: 'employee',
    employeeId: 'emp-1',
  },
}));

vi.mock('./core/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: typeof authState) => unknown) => selector(authState),
    {
      persist: {
        hasHydrated: () => true,
        onFinishHydration: () => () => undefined,
      },
      getState: () => ({
        ...authState,
        logout: vi.fn(),
      }),
    },
  ),
}));

vi.mock('./layout/AppLayout', () => ({
  AppLayout: () => <Outlet />,
}));

vi.mock('./features/employee-self-service/layout/EssLayout', () => ({
  EssLayout: () => <Outlet />,
}));

vi.mock('./features/employee-self-service/pages/EssDashboardPage', () => ({
  EssDashboardPage: () => <div>ESS Dashboard</div>,
}));

vi.mock('./features/auth/pages/DashboardPage', () => ({
  DashboardPage: () => <div>Admin Dashboard</div>,
}));

describe('App employee routing', () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.user = {
      id: 'user-1',
      name: 'Employee User',
      email: 'employee@test.com',
      role: 'employee',
      employeeId: 'emp-1',
    };
  });

  it('redirects authenticated employee users from /login to /ess', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('ESS Dashboard')).toBeInTheDocument());
  });

  it('redirects authenticated employee users from / to /ess', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('ESS Dashboard')).toBeInTheDocument());
  });
});
