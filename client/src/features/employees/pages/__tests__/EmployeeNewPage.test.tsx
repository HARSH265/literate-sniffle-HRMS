import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { EmployeeNewPage } from '../EmployeeNewPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockDepartments = vi.hoisted(() => ({
  success: true, data: [{ id: 'd1', name: 'Production' }], meta: { total: 1 },
}));

const mockDesignations = vi.hoisted(() => ({
  success: true, data: [{ id: 'des1', name: 'Machine Operator' }], meta: { total: 1 },
}));

const mockShifts = vi.hoisted(() => ({
  success: true, data: [{ id: 's1', name: 'General' }], meta: { total: 1 },
}));

const mockSettings = vi.hoisted(() => ({
  success: true, data: { employeeCodeConfig: { isAutoGenerate: false } },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['departments'], mockDepartments);
  qc.setQueryData(['designations'], mockDesignations);
  qc.setQueryData(['shifts'], mockShifts);
  qc.setQueryData(['settings'], mockSettings);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider><AntApp><EmployeeNewPage /></AntApp></ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmployeeNewPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders page header', () => {
    renderPage();
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
  });

  it('renders create and cancel buttons', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Create Employee')).toBeInTheDocument(); });
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders form sections', async () => {
    renderPage();
    await waitFor(() => { expect(screen.getByText('Personal Information')).toBeInTheDocument(); });
    expect(screen.getByText('Employment Details')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Salary & Benefits')).toBeInTheDocument();
    expect(screen.getByText('Bank Details')).toBeInTheDocument();
    expect(screen.getByText('Statutory Compliance')).toBeInTheDocument();
  });

  it('renders back to list button', () => {
    renderPage();
    expect(screen.getByText('Back to List')).toBeInTheDocument();
  });
});
