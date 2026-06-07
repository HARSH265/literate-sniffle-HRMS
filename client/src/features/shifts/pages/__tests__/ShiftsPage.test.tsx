import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ShiftsPage } from '../ShiftsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockData = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Morning', startTime: '06:00', endTime: '14:00', workingHours: 8, applicableTo: 'all', isActive: true },
    { id: '2', name: 'Evening', startTime: '14:00', endTime: '22:00', workingHours: 8, applicableTo: 'worker', isActive: true },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['shifts', 1, 20, ''], mockData);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><ShiftsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShiftsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Shifts')).toBeInTheDocument();
    expect(screen.getByText('Configure work schedules and timing')).toBeInTheDocument();
  });

  it('renders add shift button', () => {
    renderPage();
    expect(screen.getByText('Add Shift')).toBeInTheDocument();
  });

  it('renders shift data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Morning')).toBeInTheDocument(); });
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText(/Search shifts/)).toBeInTheDocument(); });
  });

  it('shows total count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 shifts')).toBeInTheDocument(); });
  });

  it('opens modal on add button click', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Morning')).toBeInTheDocument(); });
    screen.getByText('Add Shift').click();
    await waitFor(() => { expect(screen.getByText('New Shift')).toBeInTheDocument(); });
  });
});
