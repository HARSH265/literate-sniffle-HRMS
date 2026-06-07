import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { EssPayslipsPage } from '../EssPayslipsPage';

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

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['ess', 'profile'], mockProfile);
  qc.setQueryData(['ess', 'payslips'], { success: true, data: [] });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <EssPayslipsPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EssPayslipsPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('My Payslips')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    renderPage();
    expect(screen.getByText('No payslips available yet')).toBeInTheDocument();
  });
});
