import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Button, Space, Select, Input, Tooltip, Modal, Form } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, BellOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { useAnnouncements, useDeleteAnnouncement, useCreateAnnouncement } from '../hooks/useAnnouncements';
import dayjs from 'dayjs';

const { TextArea } = Input;

const priorityColors: Record<string, string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

export function AnnouncementsPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [priority, setPriority] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data, isLoading } = useAnnouncements({ page, limit, priority, status, search });
  const deleteMutation = useDeleteAnnouncement();
  const createMutation = useCreateAnnouncement();

  const handleCreate = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values, {
        onSuccess: () => {
          form.resetFields();
          setCreateModalOpen(false);
        },
      });
    });
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <Space>
          <BellOutlined style={{ color: priorityColors[record.priority] || 'var(--hrms-text-muted)' }} />
          <span style={{ fontWeight: record.readBy?.length === 0 ? 600 : 400 }}>{title}</span>
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => <Tag color={priorityColors[p] || 'default'}>{p?.toUpperCase()}</Tag>,
    },
    {
      title: 'Target',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 120,
      render: (t: string) => t?.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()) || 'All',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: any) => {
        if (!record.isActive) return <Tag>Inactive</Tag>;
        if (record.expiresAt && dayjs(record.expiresAt).isBefore(dayjs())) return <Tag color="red">Expired</Tag>;
        return <Tag color="green">Active</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: any) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/announcements/${record._id}`)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" danger icon={<DeleteOutlined />}
              onClick={() => deleteMutation.mutate(record._id)}
              loading={deleteMutation.isPending}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <div>
      <PageHeader
        title="Announcements"
        subtitle="Manage company-wide announcements and broadcasts"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            New Announcement
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total}
        page={page}
        onPaginationChange={(p, ps) => { setPage(p); setLimit(ps); }}
        toolbarLeft={
          <>
            <Input.Search
              placeholder="Search announcements..."
              onSearch={(val) => { setSearch(val); setPage(1); }}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="Priority"
              value={priority}
              onChange={(val) => { setPriority(val); setPage(1); }}
              style={{ width: 140 }}
              allowClear
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Normal', value: 'normal' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
              ]}
            />
            <Select
              placeholder="Status"
              value={status}
              onChange={(val) => { setStatus(val); setPage(1); }}
              style={{ width: 140 }}
              allowClear
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Expired', value: 'expired' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </>
        }
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BellOutlined style={{ fontSize: 16, color: 'var(--hrms-primary)' }} />
            New Announcement
          </div>
        }
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText="Create Announcement"
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <div style={{ padding: '8px 0 0' }}>
          <Form form={form} layout="vertical" initialValues={{ priority: 'normal', targetAudience: 'all' }}>
            <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
              <Input placeholder="e.g. Holiday Announcement" style={{ height: 40 }} />
            </Form.Item>
            <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Content is required' }]}>
              <TextArea rows={4} placeholder="Write announcement content..." />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="priority" label="Priority">
                <Select
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                  style={{ height: 40 }}
                />
              </Form.Item>
              <Form.Item name="targetAudience" label="Target Audience">
                <Select
                  options={[
                    { value: 'all', label: 'All Employees' },
                    { value: 'department', label: 'Department' },
                    { value: 'designation', label: 'Designation' },
                    { value: 'specificEmployees', label: 'Specific Employees' },
                  ]}
                  style={{ height: 40 }}
                />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
    </PageContainer>
  );
}
