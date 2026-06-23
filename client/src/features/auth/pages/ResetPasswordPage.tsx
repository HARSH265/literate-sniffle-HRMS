import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { AxiosError } from 'axios';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hrms-bg)' }}>
        <Result status="error" title="Invalid Reset Link" subTitle="No reset token found. Please request a new one." extra={<a href="/forgot-password">Request New Link</a>} />
      </div>
    );
  }

  const handleSubmit = async (values: { newPassword: string }) => {
    setLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.resetPassword, { token, newPassword: values.newPassword });
      setSuccess(true);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      message.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hrms-bg)' }}>
        <Result
          status="success"
          title="Password Reset Successful"
          subTitle="Your password has been updated. You can now login with your new password."
          extra={<Button type="primary" onClick={() => navigate('/login')}>Go to Login</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--hrms-bg)' }}>
      <div style={{ width: 400, padding: 32, background: 'var(--hrms-surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 8 }}>Reset Password</h2>
        <p style={{ marginBottom: 24, color: 'var(--hrms-text-secondary)' }}>Enter your new password below.</p>
        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              { pattern: /[A-Z]/, message: 'Must contain at least one uppercase letter' },
              { pattern: /[a-z]/, message: 'Must contain at least one lowercase letter' },
              { pattern: /[0-9]/, message: 'Must contain at least one number' },
              { pattern: /[!@#$%^&*]/, message: 'Must contain at least one special character' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
