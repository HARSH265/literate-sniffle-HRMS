import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { departmentService, Department, CreateDepartment, UpdateDepartment } from '../services/departmentService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function DepartmentsPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => import('../../settings/services/settingsService').then(m => m.settingsService.get()),
    enabled: isModalOpen && !editingId,
  });
  const isAutoGenerate = !editingId ? settings?.data?.departmentCodeConfig?.isAutoGenerate !== false : false;

  const { data: nextCode } = useQuery({
    queryKey: ['next-dept-code'],
    queryFn: () => departmentService.getNextCode(),
    enabled: isModalOpen && !editingId && isAutoGenerate,
  });

  useEffect(() => {
    if (nextCode && !editingId) {
      form.setFieldValue('code', nextCode);
    }
  }, [nextCode, form, editingId]);

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, limit, search],
    queryFn: () => departmentService.list({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateDepartment) => departmentService.create(payload),
    onSuccess: () => {
      message.success('Department created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create department'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartment }) =>
      departmentService.update(id, payload),
    onSuccess: () => {
      message.success('Department updated successfully');
      setIsModalOpen(false);
      form.resetFields();
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update department'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: () => {
      message.success('Department deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete department'),
  });

  const handleEdit = (record: Department) => {
    setEditingId(record.id);
    form.setFieldsValue({ name: record.name, code: record.code, description: record.description, isActive: record.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingId) updateMutation.mutate({ id: editingId, payload: values });
      else createMutation.mutate(values as CreateDepartment);
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const columns: ColumnsType<Department> = [
    {
      title: 'Department Code',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{code}</span>
      ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (d?: string) => <span style={{ color: d ? 'var(--hrms-text-secondary)' : 'var(--hrms-text-muted)' }}>{d || '—'}</span> },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean) => <StatusBadge isActive={isActive} />,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: Department) => (
        <div className="action-group">
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}
              style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} />
          </Tooltip>
          <Popconfirm title="Delete this department?" description="This action cannot be undone." onConfirm={() => handleDelete(record.id)}
            okText="Delete" okButtonProps={{ danger: true }}>
            <Tooltip title="Delete">
              <Button type="text" size="small" icon={<DeleteOutlined />}
                style={{ color: '#ef4444', borderRadius: 6 }} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Departments"
        subtitle="Manage your organization's departments and divisions"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add Department
          </Button>
        }
      />

      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            <Input.Search
              placeholder="Search by name or code..."
              onSearch={(val) => { setSearch(val); setPage(1); }}
              style={{ width: 280 }}
              allowClear
              prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />}
              enterButton={false}
              loading={isLoading}
            />
          </div>
          <div className="hrms-table-toolbar-right">
            <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
              {data?.meta?.total ?? 0} total
            </span>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 600 }}
          pagination={{
            current: page,
            defaultPageSize: 10,
            pageSize: limit,
            total: data?.meta?.total ?? 0,
            onChange: (p, size) => { setPage(p); setLimit(size ?? 10); },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
          }}
        />
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hrms-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16 }}>🏢</span>
            </div>
            {editingId ? 'Edit Department' : 'New Department'}
          </div>
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Create'}
        okButtonProps={{ style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <div style={{ padding: '8px 0 0' }}>
          <Form form={form} layout="vertical">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="code" label="Department Code" rules={editingId || !isAutoGenerate ? [{ required: true, message: 'Code is required' }] : []}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {!editingId && isAutoGenerate ? (
                    <Input
                      placeholder="Auto-generated"
                      style={{ height: 40, flex: 1 }}
                      disabled
                      suffix={<Tag color="blue" style={{ marginRight: 0, fontSize: 11, lineHeight: '18px' }}>Auto</Tag>}
                    />
                  ) : (
                    <Input placeholder="e.g. PROD" style={{ height: 40, flex: 1 }} />
                  )}
                  <Button
                    type="default"
                    icon={<SettingOutlined />}
                    style={{ height: 40, width: 40 }}
                    onClick={() => navigate('/settings', { state: { section: 'codeConfig' } })}
                  />
                </div>
              </Form.Item>
              <Form.Item name="name" label="Department Name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input placeholder="e.g. Production" style={{ height: 40 }} />
              </Form.Item>
            </div>
            <Form.Item name="description" label="Description" style={{ marginBottom: 0 }}>
              <Input.TextArea placeholder="Brief description of the department..." rows={3} />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}