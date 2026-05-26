import { useState } from 'react';
import { Button, Input, Select, message, Modal, Form, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { designationService, Designation, CreateDesignation } from '../services/designationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function DesignationsPage() {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const queryClient = useQueryClient();

const { data, isLoading, isFetching } = useQuery({
    queryKey: ['designations', page, limit, search, deptFilter],
    queryFn: () => designationService.list({ page, limit, search, department: deptFilter }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => import('../../departments/services/departmentService').then(m => m.departmentService.list({ limit: 100 })),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateDesignation) => designationService.create(payload),
    onSuccess: () => { message.success('Designation created'); setIsModalOpen(false); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['designations'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateDesignation> }) => designationService.update(id, payload),
    onSuccess: () => { message.success('Designation updated'); setIsModalOpen(false); form.resetFields(); setEditingId(null); queryClient.invalidateQueries({ queryKey: ['designations'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => designationService.delete(id),
    onSuccess: () => { message.success('Designation deleted'); queryClient.invalidateQueries({ queryKey: ['designations'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>{isActive ? 'Active' : 'Inactive'}</span>
  );

  const columns: ColumnsType<Designation> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span> },
    {
      title: 'Department',
      key: 'department',
      render: (_: unknown, r: Designation) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--hrms-text-secondary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
          {r.department?.name || '—'}
        </span>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (c?: string) => c ? <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{c}</span> : '—' },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 110, render: (isActive: boolean) => <StatusBadge isActive={isActive} /> },
    {
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, r: Designation) => (
        <div className="action-group">
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue({ name: r.name, department: r.department?.id }); setIsModalOpen(true); }} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} /></Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />}
              onClick={() => deleteMutation.mutate(r.id)}
              style={{ color: '#ef4444', borderRadius: 6 }} />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Designations"
        subtitle="Define roles and positions within departments"
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>Add Designation</Button>}
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
          <Input.Search placeholder="Search designations..." onSearch={(val) => { setSearch(val); setPage(1); }} style={{ width: 260 }} allowClear prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />} enterButton={false} loading={isFetching} />
        }
        filterContent={
          <Select placeholder="Filter by department" allowClear style={{ width: 200 }}
            onChange={(val) => { setDeptFilter(val || ''); setPage(1); }}
            options={deptData?.data.map((d: any) => ({ label: d.name, value: d.id }))}
          />
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{data?.meta?.total ?? 0} designations</span>
        }
      />

      <Modal title={editingId ? 'Edit Designation' : 'New Designation'} open={isModalOpen}
        onOk={() => form.validateFields().then((v) => editingId ? updateMutation.mutate({ id: editingId, payload: v }) : createMutation.mutate(v as CreateDesignation))}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Create'} okButtonProps={{ style: { borderRadius: 8 } }} cancelButtonProps={{ style: { borderRadius: 8 } }}>
        <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
          <Form.Item name="name" label="Designation Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Production Manager" style={{ height: 40 }} />
          </Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select placeholder="Select department" options={deptData?.data.map((d: any) => ({ label: d.name, value: d.id }))} style={{ height: 40 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}