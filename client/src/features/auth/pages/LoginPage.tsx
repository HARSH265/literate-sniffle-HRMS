import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import {
  TeamOutlined, DollarOutlined, SafetyCertificateOutlined,
  BarChartOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../core/stores/authStore';
import { ROLES } from '../../../core/constants/permissions';
import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { AxiosError } from 'axios';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.login, values);
      const { user, token } = res.data.data;
      login(user, token);

      // Fetch effective permissions for the user's role
      try {
        const permRes = await apiClient.get(API_ENDPOINTS.permissions.role(user.role));
        const roleData = permRes.data.data;
        if (roleData?.permissions) {
          const { setPermissions } = useAuthStore.getState();
          setPermissions(roleData.permissions);
        }
      } catch {
        // Permission fetch failed — will use static defaults
      }

      message.success('Welcome back! Login successful.');
      const returnUrl = sessionStorage.getItem('returnUrl');
      sessionStorage.removeItem('returnUrl');
      const isBackOfficeRole = user.role && Object.values(ROLES).includes(user.role);
      navigate(returnUrl || (user.employeeId && !isBackOfficeRole ? '/ess' : '/dashboard'));
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;
      const fallbackMessage = error.request && !error.response
        ? 'Cannot reach the server. Check that your phone is on the same network and the API URL is reachable.'
        : 'Invalid email or password. Please try again.';

      message.error(status === 429 ? 'Too many login attempts. Please try again later.' : serverMessage || fallbackMessage);
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
              <span style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: -1 }}>O</span>
            </div>
            <h2>Welcome back</h2>
            <p>Sign in to your Orian account</p>
          </div>

          <LoginForm onSubmit={handleLogin} loading={loading} />

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
        <div className="hrms-brand-logo-icon">O</div>
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

function LoginForm({ onSubmit, loading }: { onSubmit: (v: any) => void; loading: boolean }) {
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
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <a href="/forgot-password" style={{ fontSize: 13, color: 'var(--hrms-primary)' }}>Forgot password?</a>
      </div>
    </>
  );
}

export default LoginPage;
