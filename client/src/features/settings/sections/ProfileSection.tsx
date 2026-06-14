import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Row, Col, Avatar, Upload, Popconfirm, message } from 'antd';
import { UserOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { useAuthStore } from '../../../core/stores/authStore';

export function ProfileSection({ form }: { form: any }) {
  const [logoutLoading, setLogoutLoading] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogoutAll = async () => {
    setLogoutLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.auth.logoutAllDevices);
      logout();
      message.success('Logged out from all devices');
      navigate('/');
    } catch {
      message.error('Failed to logout from all devices');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        textAlign: 'center',
        marginBottom: 32,
        padding: 24,
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)',
        borderRadius: 12,
      }}>
        <Avatar
          size={100}
          icon={<UserOutlined />}
          style={{
            backgroundColor: 'var(--hrms-primary-color)',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          }}
        />
        <div style={{ marginTop: 12 }}>
          <Upload showUploadList={false}>
            <Button type="link" icon={<PlusOutlined />}>Change Photo</Button>
          </Upload>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '2px solid #f0f0f0',
          color: 'var(--hrms-text-primary)',
        }}>
          Personal Information
        </h3>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={20}>
          <Col span={12}>
            <Form.Item name="fullName" label="Full Name">
              <Input style={{ height: 44 }} placeholder="Your name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input style={{ height: 44 }} placeholder="your.email@company.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone">
              <Input style={{ height: 44 }} placeholder="+91 9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="department" label="Department">
              <Input style={{ height: 44 }} placeholder="Your department" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} placeholder="Your address" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{
          margin: '32px 0 24px',
          paddingTop: 24,
          borderTop: '1px dashed #e0e0e0',
        }}>
          <h3 style={{
            marginBottom: 16,
            color: 'var(--hrms-text-primary)',
          }}>
            Change Password
          </h3>
        </div>

        <Row gutter={20}>
          <Col span={8}>
            <Form.Item name="currentPassword" label="Current Password">
              <Input.Password style={{ height: 44 }} placeholder="Enter current password" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="newPassword" label="New Password">
              <Input.Password style={{ height: 44 }} placeholder="Enter new password" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="confirmPassword" label="Confirm Password">
              <Input.Password style={{ height: 44 }} placeholder="Confirm new password" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />}>
            Save Profile
          </Button>
          <Popconfirm
            title="Logout from all devices?"
            description="This will end all active sessions on other devices."
            onConfirm={handleLogoutAll}
            okText="Yes, logout all"
            cancelText="Cancel"
          >
            <Button size="large" danger loading={logoutLoading}>
              Logout All Devices
            </Button>
          </Popconfirm>
        </div>
      </Form>
    </div>
  );
}
