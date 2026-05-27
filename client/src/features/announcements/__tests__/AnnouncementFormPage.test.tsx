import { render, screen } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AnnouncementFormPage } from '../pages/AnnouncementFormPage';

describe('AnnouncementFormPage', () => {
  it('renders create mode title', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/announcements/new']}>
          <ConfigProvider>
            <AntApp>
              <AnnouncementFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('New Announcement')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/announcements/new']}>
          <ConfigProvider>
            <AntApp>
              <AnnouncementFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByPlaceholderText('Enter announcement title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Target Audience')).toBeInTheDocument();
  });

  it('renders back button', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/announcements/new']}>
          <ConfigProvider>
            <AntApp>
              <AnnouncementFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders create button', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/announcements/new']}>
          <ConfigProvider>
            <AntApp>
              <AnnouncementFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Create Announcement')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/announcements/new']}>
          <ConfigProvider>
            <AntApp>
              <AnnouncementFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
