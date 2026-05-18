import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Progress } from 'antd';
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
      navigate('/dashboard');
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
      <div className="hrms-login-card">
        <div className="hrms-login-logo">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>H</span>
          </div>
          <h2>{isRegistering ? 'Create Account' : 'Welcome back'}</h2>
          <p>{isRegistering ? 'Sign up to get started' : 'Sign in to your HRMS account'}</p>
        </div>

        {isRegistering ? (
          <RegisterForm onSubmit={handleRegister} loading={loading} onToggle={() => setIsRegistering(false)} />
        ) : (
          <LoginForm onSubmit={handleLogin} loading={loading} onToggle={() => setIsRegistering(true)} />
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--hrms-text-muted)' }}>
          Default: admin@hrms.com / Admin@1234
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, loading, onToggle }: { onSubmit: (v: any) => void; loading: boolean; onToggle: () => void }) {
  return (
    <>
      <Form layout="vertical" onFinish={onSubmit} size="large">
        <Form.Item name="email" label="Email address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
          <Input placeholder="admin@hrms.com" style={{ height: 44 }} />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
          <Input.Password placeholder="Enter your password" style={{ height: 44 }} />
        </Form.Item>
        <Form.Item style={{ marginTop: 8 }}>
          <Button type="primary" htmlType="submit" block style={{ height: 44, fontSize: 15, fontWeight: 600 }} loading={loading}>
            Sign in
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button type="link" onClick={onToggle} style={{ color: 'var(--hrms-primary-color)' }}>
          Create an account
        </Button>
      </div>
    </>
  );
}

function RegisterForm({ onSubmit, loading, onToggle }: { onSubmit: (v: any) => void; loading: boolean; onToggle: () => void }) {
  const [strength, setStrength] = useState<{ score: number; label: string; color: string } | null>(null);
  const [form] = Form.useForm();

  return (
    <>
      <Form layout="vertical" form={form} onFinish={onSubmit} size="large">
        <Form.Item name="name" label="Full Name" rules={[{ required: true, min: 2, message: 'Name must be at least 2 characters' }]}>
          <Input placeholder="John Doe" style={{ height: 44 }} />
        </Form.Item>
        <Form.Item name="email" label="Email address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
          <Input placeholder="john@company.com" style={{ height: 44 }} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 8, message: 'Password must be at least 8 characters' },
            { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
            { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter' },
            { pattern: /[0-9]/, message: 'Password must contain at least one number' },
            { pattern: /[!@#$%^&*]/, message: 'Password must contain at least one special character (!@#$%^&*)' },
          ]}
        >
          <Input.Password
            placeholder="Create a strong password"
            style={{ height: 44 }}
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
        <Form.Item style={{ marginTop: 8 }}>
          <Button type="primary" htmlType="submit" block style={{ height: 44, fontSize: 15, fontWeight: 600 }} loading={loading}>
            Create Account
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button type="link" onClick={onToggle} style={{ color: 'var(--hrms-primary-color)' }}>
          Already have an account? Sign in
        </Button>
      </div>
    </>
  );
}

export default LoginPage;