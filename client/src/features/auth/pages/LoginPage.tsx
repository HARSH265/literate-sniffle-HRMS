import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { useAuthStore } from '../../../core/stores/authStore';
import apiClient from '../../../core/api/apiClient';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const res = await apiClient.post('/auth/login', values);
      const { user, token, refreshToken } = res.data.data;
      login(user, token, refreshToken);
      message.success('Welcome back! Login successful.');
      navigate('/dashboard');
    } catch {
      message.error('Invalid email or password. Please try again.');
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
          <h2>Welcome back</h2>
          <p>Sign in to your HRMS account</p>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="email" label="Email address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="admin@hrms.com" style={{ height: 44 }} />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password placeholder="Enter your password" style={{ height: 44 }} />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block style={{ height: 44, fontSize: 15, fontWeight: 600 }}>
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--hrms-text-muted)' }}>
          Default: admin@hrms.com / Admin@1234
        </div>
      </div>
    </div>
  );
}

export default LoginPage;