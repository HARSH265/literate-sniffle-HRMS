import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../../test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { ConfigProvider, App as AntApp } from 'antd';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as any, useNavigate: () => mockNavigate };
});

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../../../../core/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: any) => selector?.({ login: mockLogin, user: null, token: null, refreshToken: null, isAuthenticated: false }) ?? { login: mockLogin },
    { getState: () => ({ login: mockLogin }), setState: vi.fn() },
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ConfigProvider><AntApp><LoginPage /></AntApp></ConfigProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders login form by default', () => {
    renderPage();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderPage();
    expect(screen.getByPlaceholderText('admin@hrms.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('does not render demo credentials hint when not in demo mode', () => {
    renderPage();
    expect(screen.queryByText('Demo credentials')).not.toBeInTheDocument();
  });

  it('renders login form with accessible labels', () => {
    renderPage();
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  it('renders brand panel with feature list', () => {
    renderPage();
    expect(screen.getByText('Orian HRMS')).toBeInTheDocument();
    expect(screen.getByText('Employee Management')).toBeInTheDocument();
    expect(screen.getByText('Attendance & Overtime')).toBeInTheDocument();
  });

  it('renders feature highlights', () => {
    renderPage();
    expect(screen.getByText('Orian HRMS')).toBeInTheDocument();
  });
});
