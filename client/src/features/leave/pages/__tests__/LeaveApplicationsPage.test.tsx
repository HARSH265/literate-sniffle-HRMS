import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LeaveApplicationsPage } from '../LeaveApplicationsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockApplications = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    {
      id: '1',
      employee: { id: 'e1', fullName: 'John Doe', employeeCode: 'EMP001' },
      leaveType: { id: 'lt1', name: 'Annual', code: 'AL', color: '#1890ff', isPaid: true },
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      totalDays: 3,
      reason: 'Vacation',
      status: 'pending',
      isPaid: true,
      deductionMethod: 'calendar',
      currentApprovalLevel: 0,
      totalApprovalLevels: 1,
      createdAt: '2026-05-20T10:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z',
    },
    {
      id: '2',
      employee: { id: 'e2', fullName: 'Jane Smith', employeeCode: 'EMP002' },
      leaveType: { id: 'lt2', name: 'Sick', code: 'SL', color: '#52c41a', isPaid: true },
      startDate: '2026-05-15',
      endDate: '2026-05-15',
      totalDays: 1,
      reason: 'Doctor appointment',
      status: 'approved',
      isPaid: true,
      deductionMethod: 'calendar',
      currentApprovalLevel: 1,
      totalApprovalLevels: 1,
      createdAt: '2026-05-14T08:00:00Z',
      updatedAt: '2026-05-14T16:00:00Z',
    },
  ],
  meta: { page: 1, limit: 500, total: 2, totalPages: 1 },
}));

const mockEmployees = vi.hoisted(() => ({
  success: true, message: '', data: [], meta: { page: 1, limit: 500, total: 0, totalPages: 0 },
}));

const mockLeaveTypes = vi.hoisted(() => ({
  success: true, message: '', data: [], meta: { page: 1, limit: 500, total: 0, totalPages: 0 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['leave', 'applications', ''], mockApplications);
  qc.setQueryData(['employees'], mockEmployees);
  qc.setQueryData(['leave', 'types'], mockLeaveTypes);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><LeaveApplicationsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LeaveApplicationsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Leave Applications')).toBeInTheDocument();
  });

  it('renders apply leave button', () => {
    renderPage();
    expect(screen.getByText('Apply Leave')).toBeInTheDocument();
  });

  it('renders leave applications in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows status filter after clicking filters button', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
    screen.getByText('Filters').click();
    await waitFor(() => { expect(screen.getByText('Filter by status')).toBeInTheDocument(); });
  });

  it('opens apply leave modal on button click', async () => {
    renderPage();
    screen.getByText('Apply Leave').click();
    await waitFor(() => { expect(screen.getByText('Submit')).toBeInTheDocument(); });
  });
});
