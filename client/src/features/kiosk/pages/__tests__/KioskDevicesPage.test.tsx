import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { KioskDevicesPage } from '../KioskDevicesPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockDevices = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', name: 'Main Gate Kiosk', address: 'Gate 1, Main Entrance', isActive: true, lastSeenAt: new Date().toISOString() },
    { id: '2', name: 'Back Gate Kiosk', address: 'Gate 2, Rear Entrance', isActive: false, lastSeenAt: null },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['kiosk-devices', 1, 20, ''], mockDevices);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><KioskDevicesPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KioskDevicesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Kiosk Devices')).toBeInTheDocument();
  });

  it('renders register kiosk button', () => {
    renderPage();
    expect(screen.getByText('Register Kiosk')).toBeInTheDocument();
  });

  it('renders kiosk data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Main Gate Kiosk')).toBeInTheDocument(); });
    expect(screen.getByText('Back Gate Kiosk')).toBeInTheDocument();
  });

  it('shows total devices count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 devices')).toBeInTheDocument(); });
  });
});
