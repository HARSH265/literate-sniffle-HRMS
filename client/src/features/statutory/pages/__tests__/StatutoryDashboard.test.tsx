import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StatutoryDashboard } from '../StatutoryDashboard';
import { ConfigProvider, App as AntApp } from 'antd';
import dayjs from 'dayjs';

const selectedMonth = `${dayjs().year()}-${String(dayjs().month() + 1).padStart(2, '0')}`;

const mockSummary = vi.hoisted(() => ({
  success: true,
  pf: { totalPfDue: 50000, applicableEmployees: 20, totalWages: 200000, eps: 15000, edli: 5000, employeeContribution: 25000, employerContribution: 25000 },
  esi: { totalEsiDue: 8000, applicableEmployees: 15, totalWages: 150000, employeeContribution: 1125, employerContribution: 4875 },
  pt: { totalAmount: 3000, applicableEmployees: 20 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['statutory-summary', selectedMonth], mockSummary);
  qc.setQueryData(['statutory-challans', selectedMonth], []);
  qc.setQueryData(['statutory-reports', selectedMonth], []);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><StatutoryDashboard /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StatutoryDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Statutory Compliance')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('PF Due (Employee + Employer)')).toBeInTheDocument(); });
    expect(screen.getByText('ESI Due (Employee + Employer)')).toBeInTheDocument();
    expect(screen.getByText('Professional Tax Due')).toBeInTheDocument();
  });

  it('renders PF challans and reports sections', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('PF Challans')).toBeInTheDocument(); });
    expect(screen.getByText('Statutory Reports')).toBeInTheDocument();
  });

  it('renders generate buttons', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Generate Challan')).toBeInTheDocument(); });
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });
});
