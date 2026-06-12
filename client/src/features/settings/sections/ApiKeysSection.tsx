import { useState } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Select, InputNumber,
  Tag, Space, Typography, Popconfirm, message, Tooltip, Alert,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, KeyOutlined, CopyOutlined,
  InfoCircleOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyService, ApiKey, CreateApiKeyPayload } from '../services/apiKeyService';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

const PERMISSION_GROUPS: Record<string, string[]> = {
  'Employee Management': ['view-employees', 'manage-employees'],
  'Organization': ['view-departments', 'manage-departments'],
  'Shift Management': ['view-shifts', 'manage-shifts'],
  'Attendance': ['view-attendance', 'manage-attendance', 'manage-overtime', 'check-in-out'],
  'Leave': ['view-leave', 'manage-leave-types', 'manage-leave-applications', 'approve-leave'],
  'Payroll': ['view-payroll', 'process-payroll', 'manage-payroll-config'],
  'Loans': ['view-loans', 'manage-loans', 'apply-loan'],
  'Statutory': ['view-statutory', 'manage-statutory'],
  'Performance': ['view-performance', 'manage-performance'],
  'Training': ['view-training', 'manage-training'],
  'Helpdesk': ['view-tickets', 'manage-tickets'],
  'Announcements': ['view-announcements', 'manage-announcements'],
  'Assets': ['view-assets', 'manage-assets'],
  'Documents': ['view-documents', 'manage-documents'],
  'Reports': ['view-reports'],
  'Audit': ['view-audit', 'manage-audit'],
  'Users': ['view-users', 'manage-users'],
  'Profile': ['view-own-profile', 'update-own-profile'],
};

export function ApiKeysSection() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys', page],
    queryFn: () => apiKeyService.list({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => apiKeyService.create(payload),
    onSuccess: (res) => {
      setCreatedKey(res.data.key);
      message.success('API key created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create API key');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeyService.revoke(id),
    onSuccess: () => {
      message.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to revoke API key');
    },
  });

  const handleCreate = () => {
    form.validateFields().then((values) => {
      createMutation.mutate({
        name: values.name,
        permissions: values.permissions,
        rateLimit: values.rateLimit || 1000,
        expiresInDays: values.expiresInDays || undefined,
      });
    });
  };

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      message.success('API key copied to clipboard');
    }
  };

  const columns: ColumnsType<ApiKey> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Prefix',
      dataIndex: 'prefix',
      key: 'prefix',
      width: 120,
      render: (prefix: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', borderRadius: 4 }}>
          {prefix}***
        </Tag>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 200,
      render: (perms: string[]) => (
        <Tooltip title={perms.join(', ')}>
          <Tag color="green" style={{ borderRadius: 4 }}>
            {perms.length} permission{perms.length !== 1 ? 's' : ''}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Rate Limit',
      dataIndex: 'rateLimit',
      key: 'rateLimit',
      width: 120,
      render: (limit: number) => (
        <span style={{ fontFamily: 'monospace' }}>{limit.toLocaleString()} req/min</span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: ApiKey) => {
        if (!record.isActive) return <Tag color="red" icon={<StopOutlined />}>Revoked</Tag>;
        if (record.expiresAt && dayjs(record.expiresAt).isBefore(dayjs())) return <Tag color="orange">Expired</Tag>;
        return <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>;
      },
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('DD MMM YYYY HH:mm') : <Text type="secondary">Never</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: ApiKey) => (
        record.isActive ? (
          <Popconfirm
            title="Revoke this API key?"
            description="The key will immediately stop working."
            onConfirm={() => revokeMutation.mutate(record.id)}
            okText="Revoke"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Revoke">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>API Keys</h3>
      <p style={{ marginBottom: 16, color: '#666' }}>
        Manage programmatic access tokens for external integrations. API keys allow
        third‑party services to call HRMS endpoints without a user session.
      </p>

      <Alert
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
        message="Store your API key securely — it will only be shown once after creation."
        description="Each key carries its own set of permissions and rate limits. Revoked keys cannot be restored."
      />

      <Card
        size="small"
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <KeyOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: 14 }}>
              {data?.meta?.total ?? 0} API key{(data?.meta?.total ?? 0) !== 1 ? 's' : ''}
            </Text>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setCreatedKey(null); form.resetFields(); setIsCreateOpen(true); }}
          >
            Create API Key
          </Button>
        </div>
      </Card>

      <Table<ApiKey>
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.meta?.total || 0,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
        size="small"
      />

      <Modal
        title={createdKey ? 'API Key Created' : 'Create API Key'}
        open={isCreateOpen}
        onOk={createdKey ? () => { setIsCreateOpen(false); setCreatedKey(null); } : handleCreate}
        onCancel={() => { setIsCreateOpen(false); setCreatedKey(null); }}
        confirmLoading={createMutation.isPending}
        okText={createdKey ? 'Done' : 'Create'}
        width={560}
      >
        {createdKey ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
              padding: 16, marginBottom: 16,
            }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24, marginBottom: 8 }} />
              <div style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>
                Your API key has been generated. Copy it now — it will not be shown again.
              </div>
              <div style={{
                background: '#fff', border: '1px solid #d9d9d9', borderRadius: 6,
                padding: '10px 14px', fontFamily: 'monospace', fontSize: 13,
                wordBreak: 'break-all', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 8,
              }}>
                <code style={{ flex: 1, textAlign: 'left' }}>{createdKey}</code>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyKey}>
                  Copy
                </Button>
              </div>
            </div>
            <Alert
              type="warning"
              showIcon
              message="This key will not be shown again. Store it in a secure location (e.g., a secrets manager)."
            />
          </div>
        ) : (
          <Form form={form} layout="vertical" initialValues={{ rateLimit: 1000, permissions: [] }}>
            <Form.Item
              name="name"
              label="Key Name"
              rules={[{ required: true, message: 'Please enter a name for this key' }]}
            >
              <Input placeholder="e.g. Integration – BI Dashboard" maxLength={100} />
            </Form.Item>

            <Form.Item
              name="permissions"
              label={
                <span>
                  Permissions{' '}
                  <Tooltip title="Select which API operations this key can perform.">
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Select at least one permission' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select permissions"
                style={{ width: '100%' }}
                maxTagCount={4}
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
                options={Object.entries(PERMISSION_GROUPS).map(([group, perms]) => ({
                  label: group,
                  options: perms.map((p) => ({ label: p, value: p })),
                }))}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item
                name="rateLimit"
                label={
                  <span>
                    Rate Limit{' '}
                    <Tooltip title="Maximum requests per minute for this key.">
                      <InfoCircleOutlined style={{ color: '#999' }} />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={100} max={100000} style={{ width: '100%' }} addonAfter="req/min" />
              </Form.Item>

              <Form.Item
                name="expiresInDays"
                label={
                  <span>
                    Expires After{' '}
                    <Tooltip title="Number of days until the key expires. Leave empty for no expiry.">
                      <InfoCircleOutlined style={{ color: '#999' }} />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} addonAfter="days" placeholder="Never" />
              </Form.Item>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
