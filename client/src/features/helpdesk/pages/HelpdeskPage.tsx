import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Button, Select, Input, Typography, Tooltip, Modal, Form, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { useTickets, useDeleteTicket, useCreateTicket } from '../hooks/useHelpdesk';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const statusColors: Record<string, string> = {
  open: 'blue',
  'in-progress': 'orange',
  resolved: 'green',
  closed: 'default',
};

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'it', label: 'IT' },
  { value: 'hr', label: 'HR' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'other', label: 'Other' },
];

export function HelpdeskPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data, isLoading } = useTickets({ page, limit, status, priority, category, search });
  const deleteMutation = useDeleteTicket();
  const createMutation = useCreateTicket();

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

  const columns = useMemo(() => [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketId',
      key: 'ticketId',
      width: 110,
      render: (id: string) => <Text code style={{ fontSize: 12 }}>{id}</Text>,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string, record: any) => (
        <span style={{ fontWeight: record.status === 'open' ? 600 : 400 }}>{subject}</span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: string) => <Tag>{cat?.toUpperCase()}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p: string) => <Tag color={priorityColors[p] || 'default'}>{p?.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'} style={{ textTransform: 'capitalize' }}>
          {s}
        </Tag>
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 150,
      render: (user: any) => user?.name || '—',
    },
    {
      title: 'SLA',
      key: 'sla',
      width: 70,
      render: (_: unknown, record: any) => {
        if (record.status === 'resolved' || record.status === 'closed') return <span style={{ color: '#94a3b8' }}>—</span>;
        if (record.slaBreached) {
          return (
            <Tooltip title={
              record.slaDeadline
                ? `SLA breached! Deadline was ${dayjs(record.slaDeadline).format('DD MMM h:mm A')}`
                : 'SLA breached!'
            }>
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>
                <WarningOutlined style={{ marginRight: 4 }} />Overdue
              </span>
            </Tooltip>
          );
        }
        if (record.slaDeadline) {
          const deadline = dayjs(record.slaDeadline);
          const hoursLeft = deadline.diff(dayjs(), 'hour', true);
          const color = hoursLeft < 2 ? '#ef4444' : hoursLeft < 8 ? '#d97706' : '#22c55e';
          return (
            <Tooltip title={`Deadline: ${deadline.format('DD MMM h:mm A')}`}>
              <span style={{ color, fontSize: 12, fontWeight: 500 }}>
                {hoursLeft < 1
                  ? '< 1h'
                  : hoursLeft < 24
                    ? `${Math.floor(hoursLeft)}h`
                    : deadline.format('DD MMM')}
              </span>
            </Tooltip>
          );
        }
        return <span style={{ color: '#94a3b8' }}>—</span>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD MMM YY'),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: any) => (
        <div className="action-group">
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/helpdesk/${record._id}`)}
              style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Popconfirm title="Delete this ticket?" description="This cannot be undone." onConfirm={() => deleteMutation.mutate(record._id)} okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel">
            <Tooltip title="Delete">
              <Button type="text" size="small" icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
                style={{ color: '#ef4444', borderRadius: 6 }} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ], []);

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Help Desk"
        subtitle="Manage support tickets"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            New Ticket
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="_id"
        loading={isLoading}
        total={data?.meta?.total}
        page={page}
        pageSize={limit}
        onPaginationChange={(p, s) => { setPage(p); setLimit(s); }}
        toolbarLeft={
          <>
            <Select
              placeholder="Status"
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <Select
              placeholder="Priority"
              value={priority}
              onChange={(v) => { setPriority(v); setPage(1); }}
              allowClear
              style={{ width: 130 }}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
            <Select
              placeholder="Category"
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); }}
              allowClear
              style={{ width: 150 }}
              options={categoryOptions}
            />
            <Input.Search
              placeholder="Search tickets..."
              onSearch={(v) => { setSearch(v); setPage(1); }}
              style={{ width: 240 }}
              allowClear
            />
          </>
        }
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PlusOutlined style={{ fontSize: 16, color: 'var(--hrms-primary)' }} />
            New Ticket
          </div>
        }
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText="Create Ticket"
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <div style={{ padding: '8px 0 0' }}>
          <Form form={form} layout="vertical" initialValues={{ category: 'other', priority: 'medium' }}>
            <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Subject is required' }]}>
              <Input placeholder="e.g. Keyboard not working" style={{ height: 40 }} />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Description is required' }]}>
              <TextArea rows={4} placeholder="Describe the issue in detail..." />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="category" label="Category">
                <Select
                  options={[
                    { value: 'it', label: 'IT' },
                    { value: 'hr', label: 'HR' },
                    { value: 'facilities', label: 'Facilities' },
                    { value: 'payroll', label: 'Payroll' },
                    { value: 'other', label: 'Other' },
                  ]}
                  style={{ height: 40 }}
                />
              </Form.Item>
              <Form.Item name="priority" label="Priority">
                <Select
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                  style={{ height: 40 }}
                />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
