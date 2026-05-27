import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage } from '../NotificationsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockNotifications = vi.hoisted(() => ({
  success: true,
  data: {
    notifications: [
      { id: '1', title: 'Payroll Processed', message: 'May payroll has been processed', module: 'payroll', type: 'info', isRead: false, createdAt: new Date().toISOString() },
      { id: '2', title: 'Leave Approved', message: 'John Doe leave has been approved', module: 'employees', type: 'success', isRead: true, createdAt: new Date().toISOString() },
    ],
    pagination: { total: 2 },
  },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['notifications', 1, 20, '', ''], mockNotifications);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><NotificationsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NotificationsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders mark all read button', () => {
    renderPage();
    expect(screen.getByText('Mark All Read')).toBeInTheDocument();
  });

  it('renders notification data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Payroll Processed')).toBeInTheDocument(); });
    expect(screen.getByText('Leave Approved')).toBeInTheDocument();
  });

  it('shows total notifications count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 notifications')).toBeInTheDocument(); });
  });
});
