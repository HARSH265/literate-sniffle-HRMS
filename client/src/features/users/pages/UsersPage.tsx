import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Modal, Form, Select, Tooltip, Popconfirm, Upload, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, SearchOutlined, DownloadOutlined, UploadOutlined, LockOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { userService, User, CreateUser } from '../services/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', page, limit, search, statusFilter],
    queryFn: () => userService.list({ page, limit, search, ...(statusFilter ? { status: statusFilter } : {}) }),
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

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => userService.deactivate(id),
    onSuccess: () => { message.success('User deactivated'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to deactivate'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => userService.activate(id),
    onSuccess: () => { message.success('User activated'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to activate'),
  });

  const handleExport = async () => {
    try {
      const result = await userService.exportUsers();
      if (result.data?.length) {
        const ws = XLSX.utils.json_to_sheet(result.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, `users-export-${dayjs().format('YYYY-MM-DD')}.xlsx`);
        message.success(`Exported ${result.data.length} users`);
      }
    } catch {
      message.error('Failed to export users');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      message.warning('Please select a file first');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];

        const users = json.map(row => ({
          name: row.Name || row.name,
          email: row.Email || row.email,
          password: row.Password || row.password || 'TempPass123',
          role: row.Role || row.role || 'hr-staff',
        })).filter(u => u.name && u.email);

        if (users.length === 0) {
          message.warning('No valid users found in file');
          return;
        }

        const result = await userService.importUsers(users);
        message.success(`Imported: ${result.data.created} created, ${result.data.updated} updated`);
        if (result.data.errors.length > 0) {
          message.warning(`${result.data.errors.length} errors occurred`);
        }
        setImportModalOpen(false);
        setImportFile(null);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      };
      reader.readAsArrayBuffer(importFile);
    } catch {
      message.error('Failed to import users');
    }
  };

  const RoleTag = ({ role }: { role: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: roleBg[role] || '#f1f5f9', color: roleColor[role] || '#64748b', textTransform: 'capitalize' }}>
      {role.replace('-', ' ')}
    </span>
  );

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      width: 220,
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
    { title: 'Role', dataIndex: 'role', key: 'role', width: 140, render: (role: string) => <RoleTag role={role} /> },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (a: boolean) => (
        <Tag color={a ? 'green' : 'default'} style={{ borderRadius: 12, padding: '0 8px' }}>
          {a ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Last Login',
      key: 'lastLogin',
      width: 140,
      render: (_: unknown, r: User) => (
        <span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>
          {r.lastLogin ? dayjs(r.lastLogin).format('DD MMM YY, HH:mm') : 'Never'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, r: User) => (
        <div className="action-group">
          <Tooltip title="View Activity">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/users/${r.id}/activity`)} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue({ name: r.name, email: r.email, role: r.role }); setIsModalOpen(true); }} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          {r.isActive ? (
            <Tooltip title="Deactivate">
              <Popconfirm title="Deactivate this user?" onConfirm={() => deactivateMutation.mutate(r.id)}>
                <Button type="text" size="small" icon={<LockOutlined />} style={{ color: '#f59e0b', borderRadius: 6 }} />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="Activate">
              <Button type="text" size="small" icon={<CheckCircleOutlined />} onClick={() => activateMutation.mutate(r.id)} style={{ color: '#22c55e', borderRadius: 6 }} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Users"
        subtitle="Manage system users and their access roles"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>Import</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>Add User</Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total ?? 0}
        page={page}
        pageSize={limit}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        toolbarLeft={
          <Input.Search placeholder="Search users..." onSearch={(val) => { setSearch(val); setPage(1); }} style={{ width: 260 }} allowClear prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />} enterButton={false} loading={isFetching} />
        }
        filterContent={
          <Select placeholder="Status" allowClear style={{ width: 120 }} value={statusFilter || undefined} onChange={(val) => { setStatusFilter(val || ''); setPage(1); }} options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{data?.meta?.total ?? 0} users</span>
        }
      />

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

      <Modal title="Import Users" open={importModalOpen} onOk={handleImport} onCancel={() => { setImportModalOpen(false); setImportFile(null); }} okText="Import">
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16, color: 'var(--hrms-text-secondary)' }}>
            Upload an Excel file with columns: <strong>Name, Email, Role, Password</strong>
          </p>
          <Upload beforeUpload={(file) => { setImportFile(file); return false; }} accept=".xlsx,.xls">
            <Button icon={<UploadOutlined />}>Select Excel File</Button>
          </Upload>
          {importFile && <p style={{ marginTop: 8, fontSize: 12 }}>Selected: {importFile.name}</p>}
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ fontSize: 12, margin: 0, color: 'var(--hrms-text-muted)' }}>
              <strong>Note:</strong> Existing users (matched by email) will be updated. New users will be created with temporary password.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}