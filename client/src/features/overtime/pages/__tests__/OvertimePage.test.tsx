import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { OvertimePage } from '../OvertimePage';
import { ConfigProvider, App as AntApp } from 'antd';
import dayjs from 'dayjs';

const mockEntries = vi.hoisted(() => ({
  success: true,
  message: '',
  data: [
    {
      id: '1',
      employee: { id: 'e1', fullName: 'John Doe', employeeCode: 'EMP001' },
      overtimeRule: { id: 'r1', name: 'Standard OT', multiplier: 1.5 },
      date: '2026-05-15',
      hours: 3,
      remarks: 'Project work',
      createdAt: '2026-05-15T10:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    },
    {
      id: '2',
      employee: { id: 'e2', fullName: 'Jane Smith', employeeCode: 'EMP002' },
      overtimeRule: { id: 'r2', name: 'Double OT', multiplier: 2.0 },
      date: '2026-05-16',
      hours: 2.5,
      remarks: 'Weekend work',
      createdAt: '2026-05-16T10:00:00Z',
      updatedAt: '2026-05-16T10:00:00Z',
    },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['overtime-entries', 1, 20, '', dayjs().month() + 1, dayjs().year()], mockEntries);
  qc.setQueryData(['employees-select'], { success: true, data: [{ id: 'e1', fullName: 'John Doe', employeeCode: 'EMP001' }], meta: { total: 1 } });
  qc.setQueryData(['overtime-rules-select'], { success: true, data: [{ id: 'r1', name: 'Standard OT', multiplier: 1.5 }], meta: { total: 1 } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><OvertimePage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OvertimePage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Overtime Entries')).toBeInTheDocument();
  });

  it('renders add overtime button', () => {
    renderPage();
    expect(screen.getByText('Add Overtime')).toBeInTheDocument();
  });

  it('renders overtime data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText(/John Doe/)).toBeInTheDocument(); });
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it('renders month and year filters', () => {
    renderPage();
    expect(screen.getByText(dayjs().format('MMMM'))).toBeInTheDocument();
    expect(screen.getByText(String(dayjs().year()))).toBeInTheDocument();
  });

  it('shows total entries count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 entries')).toBeInTheDocument(); });
  });

  it('renders hours in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText(/John Doe/)).toBeInTheDocument(); });
    expect(screen.getByText('3 hrs')).toBeInTheDocument();
    expect(screen.getByText('2.5 hrs')).toBeInTheDocument();
  });
});
