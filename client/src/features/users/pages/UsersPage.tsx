import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, message, Modal, Form, Select, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { userService, User, CreateUser } from '../services/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'HR Admin', value: 'hr-admin' },
  { label: 'HR Staff', value: 'hr-staff' },
  { label: 'Accounts', value: 'accounts' },
  { label: 'Manager', value: 'manager' },
];

const roleColor: Record<string, string> = {
  'super-admin': 'magenta',
  'hr-admin': 'orange',
  'hr-staff': 'blue',
  'accounts': 'green',
  'manager': 'purple',
};

const roleBg: Record<string, string> = {
  'super-admin': '#fdf2f8',
  'hr-admin': '#fff7ed',
  'hr-staff': '#eff6ff',
  'accounts': '#ecfdf5',
  'manager': '#faf5ff',
};

export function UsersPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => userService.list({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUser) => userService.create(payload),
    onSuccess: () => { message.success('User created'); setIsModalOpen(false); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateUser> }) => userService.update(id, payload),
    onSuccess: () => { message.success('User updated'); setIsModalOpen(false); form.resetFields(); setEditingId(null); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { message.success('User deleted'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const RoleTag = ({ role }: { role: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: roleBg[role] || '#f1f5f9', color: roleColor[role] || '#64748b', textTransform: 'capitalize' }}>
      {role.replace('-', ' ')}
    </span>
  );

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, r: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700 }}>
            {r.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <RoleTag role={role} /> },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (a: boolean) => <span className={`status-badge ${a ? 'status-active' : 'status-inactive'}`}>{a ? 'Active' : 'Inactive'}</span>,
    },
{
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: unknown, r: User) => (
        <div className="action-group">
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue({ name: r.name, email: r.email, role: r.role }); setIsModalOpen(true); }} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => deleteMutation.mutate(r.id)} style={{ color: '#ef4444', borderRadius: 6 }} /></Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader title="Users" subtitle="Manage system users and their access roles" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>Add User</Button>} />

      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            <Input.Search placeholder="Search users..." onSearch={(val) => { setSearch(val); setPage(1); }} style={{ width: 260 }} allowClear prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />} enterButton={false} loading={isFetching} />
          </div>
          <div className="hrms-table-toolbar-right">
            <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{data?.meta?.total ?? 0} users</span>
          </div>
        </div>

        <Table columns={columns} dataSource={data?.data} rowKey="id" loading={isLoading} scroll={{ x: 700 }}
          pagination={{ current: page, defaultPageSize: 10, pageSize: limit, total: data?.meta?.total ?? 0, onChange: (p, size) => { setPage(p); setLimit(size ?? 10); }, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
        />
      </div>

      <Modal title={editingId ? 'Edit User' : 'New User'} open={isModalOpen}
        onOk={() => form.validateFields().then(v => editingId ? updateMutation.mutate({ id: editingId, payload: v }) : createMutation.mutate(v as CreateUser))}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Create'} okButtonProps={{ style: { borderRadius: 8 } }} cancelButtonProps={{ style: { borderRadius: 8 } }}>
        <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="John Doe" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="john@company.com" style={{ height: 40 }} />
          </Form.Item>
          {!editingId && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="Minimum 6 characters" style={{ height: 40 }} />
            </Form.Item>
          )}
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role" options={ROLE_OPTIONS} style={{ height: 40 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}