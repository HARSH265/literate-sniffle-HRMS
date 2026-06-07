import { render, screen } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { ShiftSwapApprovalsPage } from '../pages/ShiftSwapApprovalsPage';

const mockData = {
  success: true,
  data: [
    { _id: '1', requestor: { fullName: 'John Doe' }, fromShift: { name: 'Morning' }, toShift: { name: 'Evening' }, fromDate: '2026-06-01T00:00:00Z', toDate: '2026-06-15T00:00:00Z', reason: 'Need change', status: 'pending' },
    { _id: '2', requestor: { fullName: 'Jane Smith' }, fromShift: { name: 'Night' }, toShift: { name: 'Morning' }, fromDate: '2026-06-10T00:00:00Z', toDate: '2026-06-20T00:00:00Z', reason: 'Family reasons', status: 'pending' },
  ],
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['pending-swap-approvals'], mockData);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <ShiftSwapApprovalsPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShiftSwapApprovalsPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Swap Approvals')).toBeInTheDocument();
  });

  it('renders requestor names', () => {
    renderPage();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders approve buttons', () => {
    renderPage();
    const approveBtns = screen.getAllByText('Approve');
    expect(approveBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('renders reject buttons', () => {
    renderPage();
    const rejectBtns = screen.getAllByText('Reject');
    expect(rejectBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('renders reasons', () => {
    renderPage();
    expect(screen.getByText('Need change')).toBeInTheDocument();
    expect(screen.getByText('Family reasons')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <ShiftSwapApprovalsPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });
});
