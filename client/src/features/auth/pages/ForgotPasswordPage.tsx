import { useState } from 'react';
import { Form, Input, Button, message, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { AxiosError } from 'axios';

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.forgotPassword, values);
      setSent(true);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      message.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hrms-bg)' }}>
        <Result
          status="success"
          title="Check your email"
          subTitle="If an account exists with that email, we've sent a password reset link."
          extra={<a href="/login">Back to Login</a>}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hrms-bg)' }}>
      <div style={{ width: 400, padding: 32, background: 'var(--hrms-surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 8 }}>Forgot Password</h2>
        <p style={{ marginBottom: 24, color: 'var(--hrms-text-secondary)' }}>Enter your email and we'll send you a reset link.</p>
        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input prefix={<MailOutlined />} placeholder="admin@hrms.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
