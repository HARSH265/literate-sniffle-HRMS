import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SalarySlipsPage } from '../SalarySlipsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockSlips = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', month: '2026-05', status: 'finalized', totalEmployees: 10, totalNetPay: 250000, generatedAt: '2026-05-25T10:00:00Z' },
    { id: '2', month: '2026-04', status: 'finalized', totalEmployees: 10, totalNetPay: 240000, generatedAt: '2026-04-25T10:00:00Z' },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as any, useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['salary-slips', undefined], mockSlips);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><SalarySlipsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SalarySlipsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Salary Slips')).toBeInTheDocument();
  });

  it('renders salary slip data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2026-05')).toBeInTheDocument(); });
    expect(screen.getByText('2026-04')).toBeInTheDocument();
  });

  it('renders month filter placeholder', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2026-05')).toBeInTheDocument(); });
    expect(screen.getByText('Filter by month')).toBeInTheDocument();
  });
});
