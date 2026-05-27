import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { EmployeesPage } from '../EmployeesPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as any, useNavigate: () => mockNavigate };
});

const mockEmployees = vi.hoisted(() => ({
  success: true, message: '',
  data: [
    { id: '1', employeeCode: 'EMP001', fullName: 'John Doe', fatherName: 'Robert Doe', category: 'worker', employmentType: 'permanent', department: { id: 'd1', name: 'Production' }, designation: { id: 'des1', name: 'Worker' }, shift: { id: 's1', name: 'Morning' }, joiningDate: '2024-01-15', salaryType: 'monthly', baseSalary: 25000, dailyWage: 0, overtimeEligible: true, status: 'active', contactNumber: '1234567890' },
    { id: '2', employeeCode: 'EMP002', fullName: 'Jane Smith', fatherName: 'Alan Smith', category: 'office-staff', employmentType: 'permanent', department: { id: 'd2', name: 'HR' }, designation: { id: 'des2', name: 'Manager' }, shift: { id: 's2', name: 'General' }, joiningDate: '2024-02-01', salaryType: 'monthly', baseSalary: 45000, dailyWage: 0, overtimeEligible: false, status: 'active' },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
}));

const mockDepts = vi.hoisted(() => ({
  success: true, message: '', data: [{ id: 'd1', name: 'Production' }, { id: 'd2', name: 'HR' }],
  meta: { page: 1, limit: 1000, total: 2, totalPages: 1 },
}));

const mockDesignations = vi.hoisted(() => ({
  success: true, message: '', data: [{ id: 'des1', name: 'Worker' }, { id: 'des2', name: 'Manager' }],
  meta: { page: 1, limit: 1000, total: 2, totalPages: 1 },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['employees', 1, 10, '', '', '', '', ''], mockEmployees);
  qc.setQueryData(['departments-filter'], mockDepts);
  qc.setQueryData(['designations-filter', ''], mockDesignations);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><EmployeesPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmployeesPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Manage employee records and information')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderPage();
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
  });

  it('renders employee data in table', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('EMP002')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByPlaceholderText(/Search by code, name/)).toBeInTheDocument(); });
  });

  it('shows total count', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('2 employees')).toBeInTheDocument(); });
  });

  it('navigates to add employee on button click', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('John Doe')).toBeInTheDocument(); });
    screen.getByText('Add Employee').click();
    expect(mockNavigate).toHaveBeenCalledWith('/employees/new');
  });
});
