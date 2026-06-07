import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { EssLeavePage } from '../EssLeavePage';

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
    editableFields: [],
  },
};

const mockBalances = { success: true, data: [] };
const mockApplications = { success: true, data: [] };

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['ess', 'profile'], mockProfile);
  qc.setQueryData(['ess', 'leave', 'balances'], mockBalances);
  qc.setQueryData(['ess', 'leave', 'applications'], mockApplications);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <EssLeavePage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EssLeavePage', () => {
  it('renders leave balance stats', () => {
    renderPage();
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders leave balances table', () => {
    renderPage();
    expect(screen.getByText('Leave Balances')).toBeInTheDocument();
  });

  it('renders recent applications section', () => {
    renderPage();
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
  });

  it('renders Apply Leave button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /apply leave/i })).toBeInTheDocument();
  });

  it('shows empty state for leave balances', () => {
    renderPage();
    expect(screen.getByText('No leave balances found')).toBeInTheDocument();
  });

  it('shows empty state for applications', () => {
    renderPage();
    expect(screen.getByText('No leave applications')).toBeInTheDocument();
  });
});
