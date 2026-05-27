import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PayrollPage } from '../PayrollPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockRuns = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', month: '2026-05', status: 'draft', totalEmployees: 10, totalNetPay: 250000 },
    { id: '2', month: '2026-04', status: 'finalized', totalEmployees: 10, totalNetPay: 240000 },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as any, useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['payroll-runs', 1, 10], mockRuns);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><PayrollPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PayrollPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Payroll')).toBeInTheDocument();
  });

  it('renders run payroll and preview buttons', () => {
    renderPage();
    expect(screen.getByText('Run Payroll')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders payroll runs in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('May 2026')).toBeInTheDocument(); });
    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('opens run payroll modal on button click', async () => {
    renderPage();
    screen.getByText('Run Payroll').click();
    await waitFor(() => { expect(screen.getByText('Process Payroll')).toBeInTheDocument(); });
  });
});
