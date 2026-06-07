import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { TicketFormPage } from '../TicketFormPage';

const mockTicket = {
  _id: '1',
  ticketId: 'TKT-0001',
  subject: 'Keyboard not working',
  description: 'Broken keyboard',
  category: 'it',
  priority: 'high',
  status: 'open',
  requestedBy: { _id: 'u1', name: 'John', email: 'john@test.com' },
  comments: [],
  createdAt: '2024-01-15T00:00:00Z',
  isActive: true,
};

describe('TicketFormPage', () => {
  it('renders create mode title', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/new']}>
          <ConfigProvider>
            <AntApp>
              <TicketFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('New Ticket')).toBeInTheDocument();
  });

  it('renders form fields in create mode', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/new']}>
          <ConfigProvider>
            <AntApp>
              <TicketFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByPlaceholderText('e.g. Keyboard not working')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('renders create button', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/new']}>
          <ConfigProvider>
            <AntApp>
              <TicketFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Create Ticket')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/new']}>
          <ConfigProvider>
            <AntApp>
              <TicketFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders back button', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/new']}>
          <ConfigProvider>
            <AntApp>
              <TicketFormPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const backButton = document.querySelector('.anticon-arrow-left');
    expect(backButton).toBeTruthy();
  });

  it('renders edit mode title', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['tickets', '1'], { success: true, data: mockTicket });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/1/edit']}>
          <Routes>
            <Route path="/helpdesk/:id/edit" element={
              <ConfigProvider>
                <AntApp>
                  <TicketFormPage />
                </AntApp>
              </ConfigProvider>
            } />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Edit Ticket')).toBeInTheDocument();
  });

  it('renders status field in edit mode', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['tickets', '1'], { success: true, data: mockTicket });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/1/edit']}>
          <Routes>
            <Route path="/helpdesk/:id/edit" element={
              <ConfigProvider>
                <AntApp>
                  <TicketFormPage />
                </AntApp>
              </ConfigProvider>
            } />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const statusLabels = screen.getAllByText('Status');
    expect(statusLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders update button in edit mode', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['tickets', '1'], { success: true, data: mockTicket });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/helpdesk/1/edit']}>
          <Routes>
            <Route path="/helpdesk/:id/edit" element={
              <ConfigProvider>
                <AntApp>
                  <TicketFormPage />
                </AntApp>
              </ConfigProvider>
            } />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Update Ticket')).toBeInTheDocument();
  });
});
