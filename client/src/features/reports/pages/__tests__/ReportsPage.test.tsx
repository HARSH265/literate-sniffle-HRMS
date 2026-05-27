import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReportsPage } from '../ReportsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockDepartments = vi.hoisted(() => ({
  success: true, data: [{ id: 'd1', name: 'Production' }], meta: { total: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['departments-report'], mockDepartments);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><ReportsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ReportsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders export cards with titles', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Employee Export')).toBeInTheDocument(); });
    expect(screen.getByText('Attendance Report')).toBeInTheDocument();
    expect(screen.getByText('Payroll Report')).toBeInTheDocument();
    expect(screen.getByText('Overtime Report')).toBeInTheDocument();
  });

  it('renders export buttons', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getAllByText('Export').length).toBeGreaterThanOrEqual(4); });
  });
});
