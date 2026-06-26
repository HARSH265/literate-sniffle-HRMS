import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, message, Card, Row, Col, Switch, Modal, Typography, Space, Divider, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CopyOutlined, CheckCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { userService, CreateUser } from '../services/userService';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

const { Text, Title } = Typography;

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'HR Admin', value: 'hr-admin' },
  { label: 'HR Staff', value: 'hr-staff' },
  { label: 'Accounts', value: 'accounts' },
  { label: 'Manager', value: 'manager' },
  { label: 'Worker (ESS)', value: 'worker' },
];

export function UserNewPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    name: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const { data: employeeData } = useQuery({
    queryKey: ['employees', 'search', employeeSearch],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.employees.list, {
        params: { search: employeeSearch, limit: 20, status: 'active' },
      });
      return data?.data || [];
    },
    enabled: employeeSearch.length >= 2,
  });

  const employees: Array<{ id: string; employeeCode: string; fullName: string; email: string }> = employeeData || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateUser) => userService.create(payload),
    onSuccess: (response) => {
      const data = response.data;
      if (data.generatedPassword) {
        setCreatedCredentials({
          email: data.loginEmail || data.email,
          password: data.generatedPassword,
          name: data.name,
          role: data.role,
        });
        setCredentialsModalOpen(true);
      } else {
        message.success('User created successfully');
        navigate('/users');
      }
      setIsSubmitting(false);
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create user');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    const payload: CreateUser = {
      name: values.name,
      email: values.email,
      role: values.role,
      employeeId: values.employeeId || undefined,
    };
    if (!autoGenerate && values.password) {
      payload.password = values.password;
    }
    createMutation.mutate(payload);
  };

  const handleEmployeeSelect = useCallback((employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      form.setFieldsValue({
        name: emp.fullName,
        email: emp.email,
      });
    }
  }, [employees, form]);

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Login Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nNote: You must change your password on first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    setCredentialsModalOpen(false);
    setCreatedCredentials(null);
    form.resetFields();
    setAutoGenerate(true);
  };

  const handleDone = () => {
    setCredentialsModalOpen(false);
    setCreatedCredentials(null);
    navigate('/users');
  };

  return (
    <PageContainer>
      <div>
        <PageHeader
          title="Add User"
          breadcrumbs={[{ label: 'Users', path: '/users' }, { label: 'New' }]}
          actions={
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
              Back to List
            </Button>
          }
        />

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Card style={{ borderRadius: 12 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ autoGenerate: true }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                    <Input placeholder="John Doe" style={{ height: 40 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="john@company.com" style={{ height: 40 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                    <Select placeholder="Select role" options={ROLE_OPTIONS} style={{ height: 40 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="employeeId" label="Link to Employee (Optional)">
                    <Select
                      showSearch
                      placeholder="Search employee by name or code..."
                      style={{ height: 40 }}
                      filterOption={false}
                      onSearch={(val) => setEmployeeSearch(val)}
                      onSelect={handleEmployeeSelect}
                      allowClear
                      notFoundContent={employeeSearch.length < 2 ? 'Type at least 2 characters to search' : 'No employees found'}
                      options={employees.map((emp) => ({
                        label: `${emp.employeeCode} - ${emp.fullName}`,
                        value: emp.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="autoGenerate"
                label="Password"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Auto-generate password"
                  unCheckedChildren="Set password manually"
                  onChange={(checked) => setAutoGenerate(checked)}
                />
              </Form.Item>

              {!autoGenerate && (
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="password"
                      label="Password"
                      rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
                    >
                      <Input.Password placeholder="Minimum 8 characters" style={{ height: 40 }} />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {autoGenerate && (
                <div style={{ padding: '12px 16px', background: 'var(--hrms-info-light)', borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, color: 'var(--hrms-info)' }}>
                    <KeyOutlined style={{ marginRight: 6 }} />
                    A secure password will be auto-generated. The user will be required to change it on first login.
                  </Text>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hrms-border-light)' }}>
                <Button onClick={() => navigate('/users')}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
                  Create User
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>

      <Modal
        open={credentialsModalOpen}
        onCancel={handleDone}
        footer={
          <Space size={4}>
            <Button onClick={handleCreateAnother}>Create Another</Button>
            <Button type="primary" onClick={handleDone}>Done</Button>
          </Space>
        }
        width={480}
        closable={false}
      >
        {createdCredentials && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--hrms-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircleOutlined style={{ fontSize: 28, color: 'var(--hrms-success)' }} />
            </div>
            <Title level={4} style={{ marginBottom: 4 }}>User Created Successfully</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Share these credentials with the user securely.</Text>

            <Divider />

            <div style={{ textAlign: 'left', background: 'var(--hrms-bg)', borderRadius: 8, padding: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>NAME</Text>
                <Text strong style={{ fontSize: 14 }}>{createdCredentials.name}</Text>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>LOGIN EMAIL</Text>
                <Text strong style={{ fontSize: 14, fontFamily: 'monospace' }}>{createdCredentials.email}</Text>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>PASSWORD</Text>
                <Text strong style={{ fontSize: 16, fontFamily: 'monospace', color: 'var(--hrms-danger)', letterSpacing: 1 }}>{createdCredentials.password}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>ROLE</Text>
                <Tag color="blue">{createdCredentials.role}</Tag>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--hrms-warning-light)', borderRadius: 6 }}>
              <Text style={{ fontSize: 12, color: 'var(--hrms-warning)' }}>
                User must change password on first login.
              </Text>
            </div>

            <Button
              icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
              onClick={handleCopyCredentials}
              style={{ marginTop: 16 }}
              block
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
            </Button>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
