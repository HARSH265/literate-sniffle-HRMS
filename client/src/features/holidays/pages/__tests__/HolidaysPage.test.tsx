import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HolidaysPage } from '../HolidaysPage';
import { ConfigProvider, App as AntApp } from 'antd';
import dayjs from 'dayjs';

const mockHolidays = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Republic Day', date: '2026-01-26', type: 'national', applicableTo: 'all', year: 2026, isPaid: true },
    { id: '2', name: 'Independence Day', date: '2026-08-15', type: 'national', applicableTo: 'all', year: 2026, isPaid: true },
  ],
  meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const year = dayjs().year();
  qc.setQueryData(['holidays', 1, 20, '', year], mockHolidays);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><HolidaysPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HolidaysPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Holidays')).toBeInTheDocument();
  });

  it('renders add holiday button', () => {
    renderPage();
    expect(screen.getByText('Add Holiday')).toBeInTheDocument();
  });

  it('renders holiday data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Republic Day')).toBeInTheDocument(); });
    expect(screen.getByText('Independence Day')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText(/Search holidays/)).toBeInTheDocument(); });
  });

  it('shows total count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 holidays')).toBeInTheDocument(); });
  });

  it('opens modal on add button click', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Republic Day')).toBeInTheDocument(); });
    screen.getByText('Add Holiday').click();
    await waitFor(() => { expect(screen.getAllByText('Holiday Name').length).toBeGreaterThanOrEqual(2); });
  });
});
