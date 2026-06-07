import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoansPage } from '../LoansPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockLoans = vi.hoisted(() => ({
  success: true, message: '',
  data: {
    loans: [
      { id: '1', employee: { fullName: 'John Doe', employeeCode: 'EMP001' }, loanType: { name: 'Personal Loan' }, amount: 50000, emiAmount: 4500, tenure: 12, interestRate: 12, status: 'active', createdAt: '2026-05-01T10:00:00Z' },
      { id: '2', employee: { fullName: 'Jane Smith', employeeCode: 'EMP002' }, loanType: { name: 'Home Loan' }, amount: 200000, emiAmount: 8500, tenure: 36, interestRate: 9, status: 'applied', createdAt: '2026-05-15T10:00:00Z' },
    ],
  },
  meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as any, useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['loans', undefined], mockLoans);
  qc.setQueryData(['loan-types-apply'], { success: true, data: { loanTypes: [] } });
  qc.setQueryData(['employees-loan'], { success: true, data: [] });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><LoansPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoansPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Loans')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Loans')).toBeInTheDocument(); });
    expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Applied').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders loan data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText(/John Doe/)).toBeInTheDocument(); });
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it('renders apply loan button', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText(/John Doe/)).toBeInTheDocument(); });
    expect(screen.getByText('Apply Loan')).toBeInTheDocument();
  });
});
