import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { WeeklyOffRulesPage } from '../WeeklyOffRulesPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockRules = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Standard Week Off', category: 'all', offDays: [0], isActive: true },
    { id: '2', name: 'Worker Week Off', category: 'worker', offDays: [0, 6], isActive: true },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['weekly-off-rules', 1, 20, ''], mockRules);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><WeeklyOffRulesPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('WeeklyOffRulesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Weekly Off Rules')).toBeInTheDocument();
  });

  it('renders add rule button', () => {
    renderPage();
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
  });

  it('renders rule data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Standard Week Off')).toBeInTheDocument(); });
    expect(screen.getByText('Worker Week Off')).toBeInTheDocument();
  });

  it('shows total rules count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 rules')).toBeInTheDocument(); });
  });
});
