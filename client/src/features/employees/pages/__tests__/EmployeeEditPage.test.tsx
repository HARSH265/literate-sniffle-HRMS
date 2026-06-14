import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EmployeeEditPage } from '../EmployeeEditPage';
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
    pfExempted: false,
    esiExempted: false,
    ptExempted: false,
    ptState: 'Karnataka',
  },
}));

const mockDepartments = vi.hoisted(() => ({
  success: true, data: [{ id: 'd1', name: 'Production' }], meta: { total: 1 },
}));

const mockDesignations = vi.hoisted(() => ({
  success: true, data: [{ id: 'des1', name: 'Machine Operator' }], meta: { total: 1 },
}));

const mockShifts = vi.hoisted(() => ({
  success: true, data: [{ id: 's1', name: 'General' }], meta: { total: 1 },
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as any), useNavigate: () => mockNavigate };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['employee', '1'], mockEmployee);
  qc.setQueryData(['departments'], mockDepartments);
  qc.setQueryData(['designations'], mockDesignations);
  qc.setQueryData(['shifts'], mockShifts);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/employees/1/edit']}>
        <Routes>
          <Route path="/employees/:id/edit" element={<ConfigProvider><AntApp><EmployeeEditPage /></AntApp></ConfigProvider>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmployeeEditPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Edit Employee')).toBeInTheDocument(); });
  });

  it('renders form sections', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Personal Information')).toBeInTheDocument(); });
    expect(screen.getByText('Employment Details')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
  });

  it('renders back to details button', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Back to Details')).toBeInTheDocument(); });
  });

  it('renders employee code as disabled input', async () => {
    renderPage();
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const disabledInput = inputs.find(i => i.getAttribute('disabled') !== null);
      expect(disabledInput).toBeDefined();
    });
  });
});
