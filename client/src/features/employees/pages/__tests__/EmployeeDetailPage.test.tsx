import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EmployeeDetailPage } from '../EmployeeDetailPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockEmployee = vi.hoisted(() => ({
  success: true,
  data: {
    id: '1',
    employeeCode: 'EMP001',
    fullName: 'John Doe',
    fatherName: 'Robert Doe',
    category: 'worker',
    employmentType: 'permanent',
    department: { id: 'd1', name: 'Production' },
    designation: { id: 'des1', name: 'Machine Operator' },
    shift: { id: 's1', name: 'General' },
    joiningDate: '2024-01-15',
    salaryType: 'monthly',
    baseSalary: 25000,
    dailyWage: 800,
    overtimeEligible: true,
    status: 'active',
    contactNumber: '+91 98765 43210',
    email: 'john@example.com',
    address: '123 Main St',
    bankDetails: { bankName: 'SBI', accountNumber: '123456789', ifscCode: 'SBIN0001234' },
    photo: '',
    documents: [],
    pfUAN: 'IN/UAN/123456',
    esiNumber: '1234567890',
    pfJoiningDate: '2024-01-15',
    pfExempted: false,
    esiExempted: false,
    ptExempted: false,
    ptState: 'Karnataka',
  },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as any), useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['employee', '1'], mockEmployee);
  qc.setQueryData(['employee-attendance', '1'], []);
  qc.setQueryData(['employee-payroll', '1'], []);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/employees/1']}>
        <Routes>
          <Route path="/employees/:id" element={<ConfigProvider><AntApp><EmployeeDetailPage /></AntApp></ConfigProvider>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmployeeDetailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders employee name in header', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0); });
  });

  it('renders employee code', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getAllByText('EMP001').length).toBeGreaterThan(0); });
  });

  it('renders status tag', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('ACTIVE')).toBeInTheDocument(); });
  });

  it('renders organization card', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Production')).toBeInTheDocument(); });
    expect(screen.getByText('Machine Operator')).toBeInTheDocument();
  });

  it('renders back and edit buttons', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Back')).toBeInTheDocument(); });
    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
  });
});
