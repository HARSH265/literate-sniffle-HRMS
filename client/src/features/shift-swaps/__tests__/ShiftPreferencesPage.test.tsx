import { render, screen } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { ShiftPreferencesPage } from '../pages/ShiftPreferencesPage';

const mockPreference = {
  success: true,
  data: {
    preferredShift: { _id: 's1', name: 'Morning' },
    effectiveFrom: '2026-06-01T00:00:00Z',
    effectiveTo: '2026-12-31T00:00:00Z',
    priority: 1,
    reason: 'Prefer morning shifts',
  },
};

const mockShifts = { success: true, data: [{ _id: 's1', name: 'Morning' }, { _id: 's2', name: 'Evening' }] };

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['shift-preference'], mockPreference);
  qc.setQueryData(['shifts'], mockShifts);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <ShiftPreferencesPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShiftPreferencesPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Shift Preferences')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderPage();
    expect(screen.getByText('Set your preferred shift schedule')).toBeInTheDocument();
  });

  it('renders save button', () => {
    renderPage();
    expect(screen.getByText('Save Preference')).toBeInTheDocument();
  });

  it('renders back to swaps link', () => {
    renderPage();
    expect(screen.getByText('Back to Swaps')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    renderPage();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders shift select', () => {
    renderPage();
    expect(screen.getByText('Preferred Shift')).toBeInTheDocument();
  });

  it('renders priority input', () => {
    renderPage();
    expect(screen.getByText('Priority (1-10)')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <ShiftPreferencesPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Shift Preferences')).toBeInTheDocument();
  });
});
