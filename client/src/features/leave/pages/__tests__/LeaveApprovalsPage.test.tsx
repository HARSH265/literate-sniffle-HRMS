import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LeaveApprovalsPage } from '../LeaveApprovalsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockPending = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    {
      id: '1',
      employee: { id: 'e1', fullName: 'John Doe', employeeCode: 'EMP001' },
      leaveType: { id: 'lt1', name: 'Annual', code: 'AL', color: '#1890ff', isPaid: true },
      startDate: '2026-06-01', endDate: '2026-06-03', totalDays: 3,
      reason: 'Vacation', status: 'pending', isPaid: true,
      deductionMethod: 'calendar', currentApprovalLevel: 0, totalApprovalLevels: 1,
      createdAt: '2026-05-20T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z',
    },
  ],
  meta: { page: 1, limit: 500, total: 1, totalPages: 1 },
}));

const mockAll = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    {
      id: '1',
      employee: { id: 'e1', fullName: 'John Doe', employeeCode: 'EMP001' },
      leaveType: { id: 'lt1', name: 'Annual', code: 'AL', color: '#1890ff', isPaid: true },
      startDate: '2026-06-01', endDate: '2026-06-03', totalDays: 3,
      reason: 'Vacation', status: 'pending', isPaid: true,
      deductionMethod: 'calendar', currentApprovalLevel: 0, totalApprovalLevels: 1,
      createdAt: '2026-05-20T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z',
    },
    {
      id: '2',
      employee: { id: 'e2', fullName: 'Jane Smith', employeeCode: 'EMP002' },
      leaveType: { id: 'lt2', name: 'Sick', code: 'SL', color: '#52c41a', isPaid: true },
      startDate: '2026-05-15', endDate: '2026-05-15', totalDays: 1,
      reason: 'Doctor appointment', status: 'approved', isPaid: true,
      deductionMethod: 'calendar', currentApprovalLevel: 1, totalApprovalLevels: 1,
      createdAt: '2026-05-14T08:00:00Z', updatedAt: '2026-05-14T16:00:00Z',
    },
  ],
  meta: { page: 1, limit: 500, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['leave', 'approvals', 'pending'], mockPending);
  qc.setQueryData(['leave', 'applications'], mockAll);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><LeaveApprovalsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LeaveApprovalsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Leave Approvals')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Pending')).toBeInTheDocument(); });
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders pending approvals section', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1); });
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders all applications section', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Jane Smith')).toBeInTheDocument(); });
  });
});
