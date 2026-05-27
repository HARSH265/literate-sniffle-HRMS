import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import { ConfigProvider, App as AntApp } from 'antd';
import dayjs from 'dayjs';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as any), useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = dayjs().month() + 1;
  const thisYear = dayjs().year();
  qc.setQueryData(['employees-dash'], { success: true, data: [], meta: { total: 50 } });
  qc.setQueryData(['departments-dash'], { success: true, data: [], meta: { total: 5 } });
  qc.setQueryData(['designations-dash'], { success: true, data: [], meta: { total: 10 } });
  qc.setQueryData(['shifts-dash'], { success: true, data: [], meta: { total: 3 } });
  qc.setQueryData(['dash-attendance-summary', today], { success: true, data: { stats: { totalPresent: 40, totalAbsent: 5, totalHalfDay: 2, totalLeave: 3 } } });
  qc.setQueryData(['dash-pending-leaves'], { success: true, data: [], meta: { total: 3 } });
  qc.setQueryData(['dash-pending-loans'], { success: true, total: 2, data: [] });
  qc.setQueryData(['dash-payroll-status'], { success: true, data: [{ month: 'May', year: 2026, status: 'draft', totalEmployees: 50 }] });
  qc.setQueryData(['dash-ot-summary', thisMonth, thisYear], { success: true, data: { stats: { totalEmployeesWithOT: 10, totalOvertimeHours: 25.5 } } });
  qc.setQueryData(['dash-upcoming-holidays', thisYear], { success: true, data: [{ name: 'Independence Day', date: '2026-08-15', type: 'national', isPaid: true }] });
  qc.setQueryData(['recent-audit-logs'], { success: true, data: [{ _id: '1', action: 'CREATE', module: 'employees', createdAt: new Date().toISOString(), userId: { name: 'Admin' } }] });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><DashboardPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders greeting', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument(); });
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Total Employees')).toBeInTheDocument(); });
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Designations')).toBeInTheDocument();
    expect(screen.getByText('Shifts')).toBeInTheDocument();
  });

  it('renders attendance and pending approvals', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText("Today's Attendance")).toBeInTheDocument(); });
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
  });

  it('renders recent activity section', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Recent Activity')).toBeInTheDocument(); });
  });

  it('renders upcoming holidays and quick actions', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Upcoming Holidays')).toBeInTheDocument(); });
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });
});
