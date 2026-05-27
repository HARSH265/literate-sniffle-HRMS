import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AttendancePage } from '../AttendancePage';
import { ConfigProvider, App as AntApp } from 'antd';
import dayjs from 'dayjs';

const mockAttendance = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    {
      id: '1',
      employee: { id: 'e1', fullName: 'John Doe', employeeCode: 'EMP001', department: 'Production' },
      shift: { id: 's1', name: 'Morning', startTime: '09:00', endTime: '18:00' },
      date: '2026-05-27',
      status: 'present',
      inTime: '09:00',
      outTime: '18:00',
      isLate: false,
      remarks: '',
    },
    {
      id: '2',
      employee: { id: 'e2', fullName: 'Jane Smith', employeeCode: 'EMP002', department: 'HR' },
      shift: null,
      date: '2026-05-27',
      status: 'absent',
      inTime: undefined,
      outTime: undefined,
      isLate: false,
      remarks: 'Sick',
    },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const dateStr = dayjs().format('YYYY-MM-DD');
  qc.setQueryData(['attendance', 1, 20, dateStr, ''], mockAttendance);
  qc.setQueryData(['employees-active-with-shift'], { data: [] });
  qc.setQueryData(['departments-attendance'], { data: [] });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><AttendancePage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AttendancePage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
  });

  it('renders mark attendance tab content', () => {
    renderPage();
    expect(screen.getByText(/Mark Attendance for/)).toBeInTheDocument();
  });

  it('renders records tab with attendance data', async () => {
    renderPage();
    screen.getByText('Records').click();
    await waitFor(() => { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows total count in records tab', async () => {
    renderPage();
    screen.getByText('Records').click();
    await waitFor(() => { expect(screen.getByText('2 records')).toBeInTheDocument(); });
  });

  it('opens mark attendance modal on button click', async () => {
    renderPage();
    screen.getByText(/Mark Attendance for/).click();
    await waitFor(() => { expect(screen.getByText('Save Attendance')).toBeInTheDocument(); });
  });
});
