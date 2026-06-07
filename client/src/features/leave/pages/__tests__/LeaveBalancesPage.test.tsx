import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LeaveBalancesPage } from '../LeaveBalancesPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockEmployees = vi.hoisted(() => ({
  success: true, message: '', data: [], meta: { page: 1, limit: 500, total: 0, totalPages: 0 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['employees'], mockEmployees);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><LeaveBalancesPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LeaveBalancesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Leave Balances')).toBeInTheDocument();
  });

  it('renders employee select placeholder', () => {
    renderPage();
    expect(screen.getByText('Select employee')).toBeInTheDocument();
  });

  it('shows select prompt when no employee chosen', () => {
    renderPage();
    expect(screen.getByText('Select an employee to view balances')).toBeInTheDocument();
  });

  it('renders year selector', () => {
    renderPage();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });
});
