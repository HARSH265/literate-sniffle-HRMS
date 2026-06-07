import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { TicketDetailPage } from '../TicketDetailPage';

const mockTicket = {
  _id: '1',
  ticketId: 'TKT-0001',
  subject: 'Keyboard not working',
  description: 'Broken keyboard',
  category: 'it',
  priority: 'high',
  status: 'open',
  requestedBy: { _id: 'u1', name: 'John Doe', email: 'john@test.com' },
  comments: [
    { _id: 'c1', user: { _id: 'u2', name: 'Support Agent', email: 'support@test.com' }, message: 'Checking this issue', createdAt: '2024-01-16T10:00:00Z' },
  ],
  createdAt: '2024-01-15T00:00:00Z',
  isActive: true,
};

const mockTicketWithDates = {
  ...mockTicket,
  resolvedAt: '2024-01-17T10:00:00Z',
  closedAt: '2024-01-18T10:00:00Z',
};

function renderDetailPage(queryData?: any) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['tickets', '1'], queryData || { success: true, data: mockTicket });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/helpdesk/1']}>
        <Routes>
          <Route path="/helpdesk/:id" element={
            <ConfigProvider>
              <AntApp>
                <TicketDetailPage />
              </AntApp>
            </ConfigProvider>
          } />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TicketDetailPage', () => {
  it('renders ticket ID', async () => {
    renderDetailPage();
    expect(await screen.findByText('TKT-0001')).toBeInTheDocument();
  });

  it('renders ticket subject', async () => {
    renderDetailPage();
    expect(await screen.findByText('Keyboard not working')).toBeInTheDocument();
  });

  it('renders ticket description', async () => {
    renderDetailPage();
    expect(await screen.findByText('Broken keyboard')).toBeInTheDocument();
  });

  it('renders priority tag', async () => {
    renderDetailPage();
    expect(await screen.findByText('HIGH')).toBeInTheDocument();
  });

  it('renders status tag', async () => {
    renderDetailPage();
    expect(await screen.findByText('open')).toBeInTheDocument();
  });

  it('renders requested by name', async () => {
    renderDetailPage();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('renders edit button', async () => {
    renderDetailPage();
    expect(await screen.findByText('Edit')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    renderDetailPage();
    const backButton = document.querySelector('.anticon-arrow-left');
    expect(backButton).toBeTruthy();
  });

  it('renders comment from user', async () => {
    renderDetailPage();
    expect(await screen.findByText('Support Agent')).toBeInTheDocument();
    expect(await screen.findByText('Checking this issue')).toBeInTheDocument();
  });

  it('renders comment input', async () => {
    renderDetailPage();
    expect(await screen.findByPlaceholderText('Add a comment...')).toBeInTheDocument();
  });

  it('shows resolvedAt when present', async () => {
    renderDetailPage({ success: true, data: mockTicketWithDates });
    expect(await screen.findByText('Resolved At')).toBeInTheDocument();
  });

  it('shows closedAt when present', async () => {
    renderDetailPage({ success: true, data: mockTicketWithDates });
    expect(await screen.findByText('Closed At')).toBeInTheDocument();
  });

  it('shows not found when ticket is null', async () => {
    renderDetailPage({ success: true, data: null });
    expect(await screen.findByText('Ticket not found')).toBeInTheDocument();
  });

  it('shows back to help desk button when not found', async () => {
    renderDetailPage({ success: true, data: null });
    expect(await screen.findByText('Back to Help Desk')).toBeInTheDocument();
  });

  it('renders comments section title', async () => {
    renderDetailPage();
    expect(await screen.findByText('Comments (1)')).toBeInTheDocument();
  });

  it('shows no comments yet when empty', async () => {
    renderDetailPage({ success: true, data: { ...mockTicket, comments: [] } });
    expect(await screen.findByText('No comments yet')).toBeInTheDocument();
  });
});
