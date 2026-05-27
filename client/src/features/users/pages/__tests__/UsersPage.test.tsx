import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from '../UsersPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockUsers = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Admin User', email: 'admin@company.com', role: 'super-admin', isActive: true, lastLogin: new Date().toISOString() },
    { id: '2', name: 'HR Staff', email: 'hr@company.com', role: 'hr-staff', isActive: true, lastLogin: null },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as any), useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['users', 1, 10, '', ''], mockUsers);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><UsersPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('UsersPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders add user button', () => {
    renderPage();
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  it('renders export and import buttons', () => {
    renderPage();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('renders user data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Admin User')).toBeInTheDocument(); });
    expect(screen.getByText('HR Staff')).toBeInTheDocument();
  });

  it('shows total users count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 users')).toBeInTheDocument(); });
  });
});
