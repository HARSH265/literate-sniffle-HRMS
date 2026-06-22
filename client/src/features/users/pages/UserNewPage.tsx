import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, message, Card, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { userService, CreateUser } from '../services/userService';
import { useMutation } from '@tanstack/react-query';

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'HR Admin', value: 'hr-admin' },
  { label: 'HR Staff', value: 'hr-staff' },
  { label: 'Accounts', value: 'accounts' },
  { label: 'Manager', value: 'manager' },
];

export function UserNewPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: CreateUser) => userService.create(payload),
    onSuccess: () => {
      message.success('User created successfully');
      navigate('/users');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create user');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    createMutation.mutate(values as CreateUser);
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
                <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
                  <Input.Password placeholder="Minimum 6 characters" style={{ height: 40 }} />
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
                Create User
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
    </PageContainer>
  );
}