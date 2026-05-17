import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, message, Card, Row, Col, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { userService, CreateUser } from '../services/userService';
import { useQuery, useMutation } from '@tanstack/react-query';

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'HR Admin', value: 'hr-admin' },
  { label: 'HR Staff', value: 'hr-staff' },
  { label: 'Accounts', value: 'accounts' },
  { label: 'Manager', value: 'manager' },
];

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateUser> }) => userService.update(id, payload),
    onSuccess: () => {
      message.success('User updated successfully');
      navigate('/users');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update user');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    const payload = { ...values };
    if (!payload.password) delete payload.password;
    updateMutation.mutate({ id: id!, payload });
  };

  if (userLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!userData?.data) {
    message.error('User not found');
    navigate('/users');
    return null;
  }

  const user = userData.data;

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader 
        title="Edit User" 
        breadcrumbs={[
          { label: 'Users', path: '/users' },
          { label: user.name },
        ]}
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
            initialValues={{
              name: user.name,
              email: user.email,
              role: user.role,
            }}
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
                <Form.Item name="password" label="New Password (leave blank to keep current)">
                  <Input.Password placeholder="Optional - leave blank to keep current" style={{ height: 40 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                  <Select placeholder="Select role" options={ROLE_OPTIONS} style={{ height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hrms-border-light)' }}>
              <Button onClick={() => navigate('/users')}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
                Update User
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}