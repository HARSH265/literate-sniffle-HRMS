import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../SettingsPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockSettings = vi.hoisted(() => ({
  success: true,
  data: { companyName: 'Test Corp', address: '123 Test St', email: 'test@corp.com' },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['settings'], mockSettings);
  qc.setQueryData(['employees'], { success: true, data: [] });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><SettingsPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('renders settings menu items', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('My Profile')).toBeInTheDocument(); });
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Payroll')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Leave Config')).toBeInTheDocument();
  });
});
