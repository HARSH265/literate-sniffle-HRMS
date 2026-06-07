import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DesignationsPage } from '../DesignationsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockDesignations = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Manager', department: { id: 'd1', name: 'Engineering', code: 'ENG' }, code: 'MGR', isActive: true, createdAt: '', updatedAt: '' },
    { id: '2', name: 'Worker', department: { id: 'd2', name: 'Production', code: 'PROD' }, code: 'WRK', isActive: true, createdAt: '', updatedAt: '' },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

const mockDepts = vi.hoisted(() => ({
  success: true, message: '', data: [
    { id: 'd1', name: 'Engineering', code: 'ENG' },
    { id: 'd2', name: 'Production', code: 'PROD' },
  ],
  meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['designations', 1, 20, '', ''], mockDesignations);
  qc.setQueryData(['departments'], mockDepts);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><DesignationsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DesignationsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Designations')).toBeInTheDocument();
    expect(screen.getByText('Define roles and positions within departments')).toBeInTheDocument();
  });

  it('renders add designation button', () => {
    renderPage();
    expect(screen.getByText('Add Designation')).toBeInTheDocument();
  });

  it('renders designation data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Manager')).toBeInTheDocument(); });
    expect(screen.getByText('Worker')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText(/Search designations/)).toBeInTheDocument(); });
  });

  it('shows total count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 designations')).toBeInTheDocument(); });
  });

  it('opens modal on add button click', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Manager')).toBeInTheDocument(); });
    screen.getByText('Add Designation').click();
    await waitFor(() => { expect(screen.getByText('New Designation')).toBeInTheDocument(); });
  });
});
