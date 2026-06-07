import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoanTypesPage } from '../LoanTypesPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockLoanTypes = vi.hoisted(() => ({
  success: true, message: '',
  data: {
    loanTypes: [
      { id: '1', name: 'Personal Loan', code: 'PL', maxAmount: 500000, interestRate: 12, maxTenure: 36, applicableTo: 'all', maxActiveLoans: 2, isActive: true, minAmount: 10000, minTenure: 6, coolingOffPeriodDays: 30 },
      { id: '2', name: 'Home Loan', code: 'HL', maxAmount: 5000000, interestRate: 9, maxTenure: 120, applicableTo: 'all', maxActiveLoans: 1, isActive: true, minAmount: 100000, minTenure: 12, coolingOffPeriodDays: 0 },
    ],
  },
  meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['loan-types'], mockLoanTypes);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><LoanTypesPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoanTypesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Loan Types')).toBeInTheDocument();
  });

  it('renders add loan type button', () => {
    renderPage();
    expect(screen.getByText('Add Loan Type')).toBeInTheDocument();
  });

  it('renders loan types in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Personal Loan')).toBeInTheDocument(); });
    expect(screen.getByText('Home Loan')).toBeInTheDocument();
  });

  it('opens modal on add button click', async () => {
    renderPage();
    screen.getByText('Add Loan Type').click();
    await waitFor(() => { expect(screen.getByText('Create Loan Type')).toBeInTheDocument(); });
  });
});
