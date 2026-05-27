import { render, screen } from '../../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { EssProfilePage } from '../EssProfilePage';

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
    contactNumber: '1234567890',
    address: '123 Main St',
    bankDetails: { bankName: 'Test Bank', accountNumber: 'ACC001', ifscCode: 'IFSC001' },
    editableFields: ['contactNumber', 'address', 'bankDetails'],
  },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  qc.setQueryData(['ess', 'profile'], mockProfile);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <EssProfilePage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EssProfilePage', () => {
  it('renders profile information', () => {
    renderPage();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Robert Doe')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders editable fields as tags', () => {
    renderPage();
    expect(screen.getByText('contactNumber')).toBeInTheDocument();
    expect(screen.getByText('address')).toBeInTheDocument();
    expect(screen.getByText('bankDetails')).toBeInTheDocument();
  });

  it('renders Edit Profile button when editable fields exist', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('enters edit mode on button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows bank details', () => {
    renderPage();
    expect(screen.getByText('Test Bank')).toBeInTheDocument();
    expect(screen.getByText('ACC001')).toBeInTheDocument();
    expect(screen.getByText('IFSC001')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConfigProvider>
            <AntApp>
              <EssProfilePage />
            </AntApp>
          </ConfigProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('.ant-spin')).toBeTruthy();
  });
});
