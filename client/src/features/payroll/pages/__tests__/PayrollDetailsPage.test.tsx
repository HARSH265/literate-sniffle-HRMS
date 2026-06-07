import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PayrollDetailsPage } from '../PayrollDetailsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockRun = vi.hoisted(() => ({
  success: true, message: '',
  data: {
    id: '1', month: '2026-05', status: 'draft', totalEmployees: 10, totalNetPay: 250000,
    items: [
      { id: 'i1', employee: { id: 'e1', name: 'John Doe', code: 'EMP001' }, basicEarnings: 25000, allowancesTotal: 5000, overtimeAmount: 2000, totalDeductions: 3000, netPay: 29000, presentDays: 22, absentDays: 1, halfDays: 0, paidLeaveDays: 1, unpaidLeaveDays: 0, overtimeHours: 10, overtimeRate: 200, advanceDeduction: 0, loanDeduction: 0, otherDeductions: 0, earnings: {}, deductions: {}, adjustments: {} },
    ],
    revisions: [],
  },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['payroll-run-details', '1'], mockRun);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/payroll/1']}>
        <Routes>
          <Route path="/payroll/:id" element={<ConfigProvider><AntApp><PayrollDetailsPage /></AntApp></ConfigProvider>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PayrollDetailsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header with month', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText(/Payroll -/)).toBeInTheDocument(); });
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Employees')).toBeInTheDocument(); });
    expect(screen.getByText('Total Net Pay')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Back to Payroll')).toBeInTheDocument(); });
  });

  it('renders employee data in payroll items table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
  });
});
