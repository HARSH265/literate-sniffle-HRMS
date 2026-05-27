import { render, screen } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AnnouncementsPage } from '../pages/AnnouncementsPage';

const mockData = {
  success: true,
  data: [
    { _id: '1', title: 'Holiday Notice', content: 'Office closed', priority: 'high', targetAudience: 'all', isActive: true, createdAt: '2024-01-15T00:00:00Z', readBy: [{ user: 'u1', readAt: '2024-01-15T10:00:00Z' }], createdBy: { _id: 'u1', name: 'Admin', email: 'admin@test.com' } },
    { _id: '2', title: 'Meeting Reminder', content: 'Team meeting', priority: 'normal', targetAudience: 'department', isActive: true, createdAt: '2024-01-10T00:00:00Z', readBy: [], createdBy: { _id: 'u1', name: 'Admin', email: 'admin@test.com' } },
  ],
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['announcements', { page: 1, limit: 20, priority: undefined, status: undefined, search: '' }], mockData);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <AnnouncementsPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AnnouncementsPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Announcements')).toBeInTheDocument();
  });

  it('renders new announcement button', () => {
    renderPage();
    expect(screen.getByText('New Announcement')).toBeInTheDocument();
  });

  it('renders announcement titles', () => {
    renderPage();
    expect(screen.getByText('Holiday Notice')).toBeInTheDocument();
    expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
  });

  it('renders priority tags', () => {
    renderPage();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderPage();
    expect(screen.getByPlaceholderText('Search announcements...')).toBeInTheDocument();
  });

  it('renders priority filter select', () => {
    renderPage();
    expect(screen.getAllByText('Priority').length).toBeGreaterThanOrEqual(1);
  });

  it('renders status filter select', () => {
    renderPage();
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <AnnouncementsPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('shows empty state when no announcements', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['announcements', { page: 1, limit: 20, priority: undefined, status: undefined, search: '' }], { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <AnnouncementsPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('No announcements yet')).toBeInTheDocument();
  });
});
