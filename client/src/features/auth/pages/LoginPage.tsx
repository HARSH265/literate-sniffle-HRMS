import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Progress } from 'antd';
import {
  TeamOutlined, DollarOutlined, SafetyCertificateOutlined,
  BarChartOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../core/stores/authStore';
import apiClient from '../../../core/api/apiClient';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  if (score <= 2) return { score: (score / 6) * 100, label: 'Weak', color: '#ff4d4f' };
  if (score <= 4) return { score: (score / 6) * 100, label: 'Medium', color: '#faad14' };
  return { score: (score / 6) * 100, label: 'Strong', color: '#52c41a' };
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', values);
      const { user, token, refreshToken } = res.data.data;
      login(user, token, refreshToken);
      message.success('Welcome back! Login successful.');
      const returnUrl = sessionStorage.getItem('returnUrl');
      sessionStorage.removeItem('returnUrl');
      navigate(returnUrl || (user.employeeId ? '/ess' : '/dashboard'));
    } catch {
      message.error('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      await apiClient.post('/users', { ...values, role: 'hr-staff' });
      message.success('Registration successful! Please login.');
      setIsRegistering(false);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hrms-login-wrapper">
      <div className="hrms-login-left">
        <div className="hrms-login-card">
          <div className="hrms-login-logo">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--hrms-primary) 0%, #7c3aed 100%)',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: -1 }}>Or</span>
            </div>
            <h2>{isRegistering ? 'Create Account' : 'Welcome back'}</h2>
            <p>{isRegistering ? 'Sign up to get started' : 'Sign in to your Orian account'}</p>
          </div>

          {isRegistering ? (
            <RegisterForm onSubmit={handleRegister} loading={loading} onToggle={() => setIsRegistering(false)} />
          ) : (
            <LoginForm onSubmit={handleLogin} loading={loading} onToggle={() => setIsRegistering(true)} />
          )}

          <div className="hrms-login-defaults">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hrms-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <div>
                <span className="hrms-login-defaults-label">Demo credentials</span>
              </div>
              <div className="hrms-login-defaults-codes">
                <code>admin@hrms.com</code>
                <span style={{ color: 'var(--hrms-text-muted)' }}>/</span>
                <code>Admin@1234</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hrms-login-right">
        <BrandPanel />
      </div>
    </div>
  );
}

function BrandPanel() {
  const features = [
    {
      icon: <TeamOutlined />,
      title: 'Employee Management',
      desc: 'Full lifecycle management with auto-generated codes and bulk operations.',
    },
    {
      icon: <FieldTimeOutlined />,
      title: 'Attendance & Overtime',
      desc: 'Manual register entry with shift validation and Factories Act 1948 compliance.',
    },
    {
      icon: <DollarOutlined />,
      title: 'Payroll Processing',
      desc: 'Automated salary calculation with configurable allowances, deductions, and OT rules.',
    },
    {
      icon: <BarChartOutlined />,
      title: 'Reports & Analytics',
      desc: 'Interactive dashboards and Excel exports for employees, attendance, and payroll.',
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: 'Compliant by Design',
      desc: 'Built for Factories Act 1948 and Payment of Wages Act compliance.',
    },
  ];

  return (
    <div className="hrms-brand-panel">
      <div className="hrms-brand-logo">
        <div className="hrms-brand-logo-icon">Or</div>
        <span className="hrms-brand-logo-text">Orian HRMS</span>
      </div>

      <div className="hrms-brand-title">
        Manufacturing workforce<br />
        managed <em>intelligently</em>
      </div>

      <div className="hrms-brand-subtitle">
        A production-grade HRMS built for manufacturing companies.
        Digitize attendance, automate payroll, and stay compliant with Indian labour laws.
      </div>

      <div className="hrms-brand-features">
        {features.map((f, i) => (
          <div key={i} className="hrms-brand-feature">
            <div className="hrms-brand-feature-icon">{f.icon}</div>
            <div className="hrms-brand-feature-text">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 10,
  fontSize: 14,
};

function LoginForm({ onSubmit, loading, onToggle }: { onSubmit: (v: any) => void; loading: boolean; onToggle: () => void }) {
  return (
    <>
      <Form layout="vertical" onFinish={onSubmit} size="large" requiredMark={false}>
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 500, fontSize: 13, color: 'var(--hrms-text-primary)' }}>Email address</span>}
          rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          style={{ marginBottom: 24 }}
        >
          <Input
            placeholder="admin@hrms.com"
            style={inputStyle}
            prefix={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, fontSize: 13, color: 'var(--hrms-text-primary)' }}>Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
          style={{ marginBottom: 24 }}
        >
          <Input.Password
            placeholder="Enter your password"
            style={inputStyle}
            prefix={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{
              height: 48,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--hrms-primary) 0%, #7c3aed 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            }}
          >
            Sign in
          </Button>
        </Form.Item>
      </Form>
      <div className="hrms-login-divider">
        <span style={{ color: 'var(--hrms-text-muted)' }}>New to Orian?</span>
        <Button type="link" onClick={onToggle}>Create an account</Button>
      </div>
    </>
  );
}

function RegisterForm({ onSubmit, loading, onToggle }: { onSubmit: (v: any) => void; loading: boolean; onToggle: () => void }) {
  const [strength, setStrength] = useState<{ score: number; label: string; color: string } | null>(null);
  const [form] = Form.useForm();

  return (
    <>
      <Form layout="vertical" form={form} onFinish={onSubmit} size="large" requiredMark={false}>
        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 500, fontSize: 13, color: 'var(--hrms-text-primary)' }}>Full Name</span>}
          rules={[{ required: true, min: 2, message: 'Name must be at least 2 characters' }]}
          style={{ marginBottom: 24 }}
        >
          <Input placeholder="John Doe" style={{ height: 48, borderRadius: 10, fontSize: 14 }} />
        </Form.Item>
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 500, fontSize: 13, color: 'var(--hrms-text-primary)' }}>Email address</span>}
          rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          style={{ marginBottom: 24 }}
        >
          <Input placeholder="john@company.com" style={{ height: 48, borderRadius: 10, fontSize: 14 }} />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, fontSize: 13, color: 'var(--hrms-text-primary)' }}>Password</span>}
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 8, message: 'Password must be at least 8 characters' },
            { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
            { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter' },
            { pattern: /[0-9]/, message: 'Password must contain at least one number' },
            { pattern: /[!@#$%^&*]/, message: 'Password must contain at least one special character (!@#$%^&*)' },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input.Password
            placeholder="Create a strong password"
            style={{ height: 48, borderRadius: 10, fontSize: 14 }}
            onChange={(e) => setStrength(getPasswordStrength(e.target.value))}
          />
        </Form.Item>
        {strength && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>Password strength</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: strength.color }}>{strength.label}</span>
            </div>
            <Progress percent={strength.score} showInfo={false} strokeColor={strength.color} size="small" />
            <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)', marginTop: 4 }}>
              Use 8+ characters with uppercase, lowercase, numbers & special chars
            </div>
          </div>
        )}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{
              height: 48,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--hrms-primary) 0%, #7c3aed 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            }}
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>
      <div className="hrms-login-divider">
        <span style={{ color: 'var(--hrms-text-muted)' }}>Already registered?</span>
        <Button type="link" onClick={onToggle}>Sign in to your account</Button>
      </div>
    </>
  );
}

export default LoginPage;
