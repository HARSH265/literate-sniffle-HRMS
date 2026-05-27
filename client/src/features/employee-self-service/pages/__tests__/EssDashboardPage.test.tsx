import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { EssDashboardPage } from '../EssDashboardPage';

const mockProfile = {
  success: true,
  data: {
    id: 'emp1',
    employeeCode: 'EMP001',
    fullName: 'John Doe',
    fatherName: 'Robert Doe',
    department: { id: 'dept1', name: 'Engineering' },
    designation: { id: 'desig1', name: 'Software Engineer' },
    shift: { id: 'shift1', name: 'Morning' },
    joiningDate: '2023-01-15',
    editableFields: ['contactNumber'],
  },
};

const mockChangeRequests = {
  success: true,
  data: [
    { id: 'cr1', field: 'contactNumber', oldValue: '123', newValue: '456', status: 'pending', createdAt: '2024-01-01' },
    { id: 'cr2', field: 'address', oldValue: 'Old', newValue: 'New', status: 'approved', createdAt: '2024-01-02' },
  ],
  meta: { total: 2 },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['ess', 'profile'], mockProfile);
  qc.setQueryData(['ess', 'change-requests', undefined], mockChangeRequests);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <EssDashboardPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EssDashboardPage', () => {
  it('renders employee name from profile', () => {
    renderPage();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders employee code', () => {
    renderPage();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
  });

  it('renders department name', () => {
    renderPage();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('renders designation name', () => {
    renderPage();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('shows pending change requests count', () => {
    renderPage();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/pending request awaiting approval/)).toBeInTheDocument();
  });

  it('renders quick links section', () => {
    renderPage();
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('View & Edit')).toBeInTheDocument();
    expect(screen.getByText('View Log')).toBeInTheDocument();
    expect(screen.getByText('Apply / View')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <EssDashboardPage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });
});
