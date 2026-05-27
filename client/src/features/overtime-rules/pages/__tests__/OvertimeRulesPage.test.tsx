import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { OvertimeRulesPage } from '../OvertimeRulesPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockRules = vi.hoisted(() => ({
  success: true,
  message: '',
  data: [
    {
      id: '1',
      name: 'Standard Overtime',
      applicableTo: 'all',
      multiplier: 1.5,
      maxHoursPerDay: 4,
      maxHoursPerMonth: 50,
      isActive: true,
    },
    {
      id: '2',
      name: 'Weekend Overtime',
      applicableTo: 'worker',
      multiplier: 2.0,
      maxHoursPerDay: 8,
      maxHoursPerMonth: 40,
      isActive: true,
    },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['overtime-rules', 1, 20], mockRules);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><OvertimeRulesPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('OvertimeRulesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Overtime Rules')).toBeInTheDocument();
  });

  it('renders add rule button', () => {
    renderPage();
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Active Rules')).toBeInTheDocument(); });
    expect(screen.getByText('Max Hours/Day')).toBeInTheDocument();
    expect(screen.getByText('Max Hours/Month')).toBeInTheDocument();
    expect(screen.getByText('Default Multiplier')).toBeInTheDocument();
  });

  it('renders rule data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Standard Overtime')).toBeInTheDocument(); });
    expect(screen.getByText('Weekend Overtime')).toBeInTheDocument();
  });

  it('shows total rules count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 rules')).toBeInTheDocument(); });
  });

  it('renders multiplier tags', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('1.5x')).toBeInTheDocument(); });
    expect(screen.getByText('2x')).toBeInTheDocument();
  });
});
