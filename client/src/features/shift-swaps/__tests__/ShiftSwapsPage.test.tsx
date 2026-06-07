import { render, screen } from '../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { vi } from 'vitest';
import { ShiftSwapsPage } from '../pages/ShiftSwapsPage';

vi.mock('../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/shift-swaps') return Promise.resolve({ data: mockData });
      if (url === '/shifts') return Promise.resolve({ data: mockShifts });
      if (url === '/employees') return Promise.resolve({ data: mockEmployees });
      return Promise.resolve({ data: { data: [] } });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

const mockData = {
  success: true,
  data: [
    { _id: '1', requestor: { fullName: 'John Doe' }, fromShift: { name: 'Morning' }, toShift: { name: 'Evening' }, fromDate: '2026-06-01T00:00:00Z', toDate: '2026-06-15T00:00:00Z', status: 'pending', swapType: 'one-time' },
    { _id: '2', requestor: { fullName: 'Jane Smith' }, fromShift: { name: 'Night' }, toShift: { name: 'Morning' }, fromDate: '2026-06-10T00:00:00Z', toDate: '2026-06-20T00:00:00Z', status: 'approved', swapType: 'recurring' },
  ],
  meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
};

const mockShifts = { success: true, data: [{ _id: 's1', name: 'Morning' }, { _id: 's2', name: 'Evening' }] };

const mockEmployees = { success: true, data: [{ _id: 'e1', fullName: 'Alice', employeeCode: 'EMP001' }] };

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['shift-swaps', {}], mockData);
  qc.setQueryData(['shifts'], mockShifts);
  qc.setQueryData(['employees', 'list', 'active'], mockEmployees);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <ShiftSwapsPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ShiftSwapsPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('Shift Swaps')).toBeInTheDocument();
  });

  it('renders request swap button', () => {
    renderPage();
    expect(screen.getByText('Request Swap')).toBeInTheDocument();
  });

  it('renders swap requestor names', () => {
    renderPage();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders status tags', () => {
    renderPage();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
  });

  it('renders shift names', () => {
    renderPage();
    expect(screen.getAllByText('Morning').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Evening').length).toBeGreaterThan(0);
  });

  it('renders swap type tags', () => {
    renderPage();
    expect(screen.getByText('one-time')).toBeInTheDocument();
    expect(screen.getByText('recurring')).toBeInTheDocument();
  });

  it('renders status filter', () => {
    renderPage();
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(2);
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <ShiftSwapsPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });

  it('opens modal on request swap click', async () => {
    renderPage();
    const btn = screen.getByText('Request Swap');
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    expect(screen.getAllByText('Target Employee (optional)').length).toBeGreaterThan(0);
  });
});
