import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DepartmentsPage } from '../DepartmentsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockData = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Production', code: 'PROD', description: 'Manufacturing', isActive: true, createdAt: '', updatedAt: '' },
    { id: '2', name: 'HR', code: 'HR', description: null as string | null, isActive: true, createdAt: '', updatedAt: '' },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['departments', 1, 20, ''], mockData);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><DepartmentsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DepartmentsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Departments')).toBeInTheDocument();
  });

  it('renders add department button', () => {
    renderPage();
    expect(screen.getByText('Add Department')).toBeInTheDocument();
  });

  it('renders department data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Production')).toBeInTheDocument(); });
    const hrElements = screen.getAllByText('HR');
    expect(hrElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('PROD')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText(/Search by name or code/)).toBeInTheDocument(); });
  });

  it('shows total count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 total')).toBeInTheDocument(); });
  });

  it('opens modal on add button click', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Production')).toBeInTheDocument(); });
    screen.getByText('Add Department').click();
    await waitFor(() => { expect(screen.getByText('New Department')).toBeInTheDocument(); });
  });
});
