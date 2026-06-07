import { render, screen } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AnnouncementDetailPage } from '../pages/AnnouncementDetailPage';

const mockAnnouncement = {
  success: true,
  data: {
    _id: '1',
    title: 'Holiday Notice',
    content: 'Office will remain closed on Friday for the national holiday.',
    priority: 'high',
    targetAudience: 'all',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    readBy: [{ user: { _id: 'u1', name: 'Admin', email: 'admin@test.com' }, readAt: '2024-01-15T10:00:00Z' }],
    createdBy: { _id: 'u1', name: 'Admin', email: 'admin@test.com' },
  },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['announcements', '1'], mockAnnouncement);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/announcements/1']}>
        <Routes>
          <Route path="/announcements/:id" element={
            <ConfigProvider>
              <AntApp>
                <AnnouncementDetailPage />
              </AntApp>
            </ConfigProvider>
          } />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AnnouncementDetailPage', () => {
  it('renders announcement title', async () => {
    renderPage();
    const els = await screen.findAllByText('Holiday Notice');
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it('renders announcement content', async () => {
    renderPage();
    expect(await screen.findByText(/Office will remain closed/)).toBeInTheDocument();
  });

  it('renders priority tag', async () => {
    renderPage();
    expect(await screen.findByText('HIGH')).toBeInTheDocument();
  });

  it('renders created by', async () => {
    renderPage();
    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    renderPage();
    expect(await screen.findByText('Back')).toBeInTheDocument();
  });

  it('shows not found when no data', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['announcements', '2'], { success: false, data: null });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/announcements/2']}>
          <Routes>
            <Route path="/announcements/:id" element={
              <ConfigProvider>
                <AntApp>
                  <AnnouncementDetailPage />
                </AntApp>
              </ConfigProvider>
            } />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Announcement not found')).toBeInTheDocument();
  });
});
