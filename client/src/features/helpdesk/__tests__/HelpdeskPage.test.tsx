import { render, screen, within } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { HelpdeskPage } from '../pages/HelpdeskPage';

const mockData = {
  success: true,
  data: [
    { _id: '1', ticketId: 'TKT-0001', subject: 'Keyboard not working', description: 'Broken keyboard', category: 'it', priority: 'high', status: 'open', requestedBy: { _id: 'u1', name: 'John', email: 'john@test.com' }, comments: [], createdAt: '2024-01-15T00:00:00Z', isActive: true },
    { _id: '2', ticketId: 'TKT-0002', subject: 'Printer jam', description: 'Paper stuck', category: 'facilities', priority: 'medium', status: 'in-progress', requestedBy: { _id: 'u1', name: 'John', email: 'john@test.com' }, comments: [], createdAt: '2024-01-10T00:00:00Z', isActive: true },
  ],
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['tickets', { page: 1, limit: 20, status: undefined, priority: undefined, category: undefined, search: '' }], mockData);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <HelpdeskPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HelpdeskPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Help Desk')).toBeInTheDocument();
  });

  it('renders new ticket button', () => {
    renderPage();
    expect(screen.getByText('New Ticket')).toBeInTheDocument();
  });

  it('renders ticket subjects', () => {
    renderPage();
    expect(screen.getByText('Keyboard not working')).toBeInTheDocument();
    expect(screen.getByText('Printer jam')).toBeInTheDocument();
  });

  it('renders ticket IDs', () => {
    renderPage();
    expect(screen.getByText('TKT-0001')).toBeInTheDocument();
    expect(screen.getByText('TKT-0002')).toBeInTheDocument();
  });

  it('renders priority tags', () => {
    renderPage();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('renders status tags', () => {
    renderPage();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('in-progress')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderPage();
    expect(screen.getByPlaceholderText('Search tickets...')).toBeInTheDocument();
  });

  it('renders status filter select', () => {
    renderPage();
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders priority filter select', () => {
    renderPage();
    expect(screen.getAllByText('Priority').length).toBeGreaterThanOrEqual(1);
  });

  it('renders category filter select', () => {
    renderPage();
    expect(screen.getAllByText('Category').length).toBeGreaterThanOrEqual(1);
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <HelpdeskPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('shows empty state when no tickets', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['tickets', { page: 1, limit: 20, status: undefined, priority: undefined, category: undefined, search: '' }], { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <HelpdeskPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const emptyDesc = container.querySelector('.ant-empty-description');
    expect(emptyDesc).toBeTruthy();
  });
});
