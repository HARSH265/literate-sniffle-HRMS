import { useState } from 'react';
import { Button, Input, message, Modal, Form, Select, InputNumber, Tooltip, Tag, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { shiftService, Shift } from '../services/shiftService';
import { employeeService } from '../../employees/services/employeeService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const APPLICABLE_OPTIONS = [
  { label: 'All Employees', value: 'all' },
  { label: 'Workers Only', value: 'worker' },
  { label: 'Office Staff Only', value: 'office-staff' },
];

export function ShiftsPage() {
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['shifts', page, limit, search],
    queryFn: () => shiftService.list({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: employees } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
    enabled: bulkModalOpen,
  });

  const { data: shiftList } = useQuery({
    queryKey: ['shifts', 'all'],
    queryFn: () => shiftService.list({ limit: 100 }),
    enabled: bulkModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => shiftService.create(payload),
    onSuccess: () => { message.success('Shift created'); setIsModalOpen(false); form.resetFields(); queryClient.invalidateQueries({ queryKey: ['shifts'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => shiftService.update(id, payload),
    onSuccess: () => { message.success('Shift updated'); setIsModalOpen(false); form.resetFields(); setEditingId(null); queryClient.invalidateQueries({ queryKey: ['shifts'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftService.delete(id),
    onSuccess: () => { message.success('Shift deleted'); queryClient.invalidateQueries({ queryKey: ['shifts'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ employeeIds, shiftId }: { employeeIds: string[]; shiftId: string }) => shiftService.bulkAssignShift(employeeIds, shiftId),
    onSuccess: (res) => { message.success(res.message); setBulkModalOpen(false); bulkForm.resetFields(); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to assign shift'),
  });

  const columns: ColumnsType<Shift> = [
    { title: 'Shift Name', dataIndex: 'name', key: 'name', render: (n: string) => <span style={{ fontWeight: 600, fontSize: 14 }}>{n}</span> },
    {
      title: 'Time',
      key: 'time',
      width: 200,
      render: (_: unknown, r: Shift) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'var(--hrms-primary-light)', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 600, color: 'var(--hrms-primary)' }}>{r.startTime}</div>
          <span style={{ color: 'var(--hrms-text-muted)' }}>→</span>
          <div style={{ background: 'var(--hrms-warning-light)', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 600, color: 'var(--hrms-warning)' }}>{r.endTime}</div>
        </div>
      ),
    },
    { title: 'Hours/Day', dataIndex: 'workingHours', key: 'workingHours', width: 110, render: (h: number) => <Tag style={{ borderRadius: 20, fontWeight: 600 }} color="blue">{h}h</Tag> },
    { title: 'Applicable To', dataIndex: 'applicableTo', key: 'applicableTo', width: 160, render: (v: string) => <span className="cat-tag" style={{ background: v === 'all' ? 'var(--hrms-success-light)' : v === 'worker' ? 'var(--hrms-info-light)' : 'var(--hrms-primary-light)', color: v === 'all' ? 'var(--hrms-success)' : v === 'worker' ? 'var(--hrms-info)' : 'var(--hrms-primary)' }}>{APPLICABLE_OPTIONS.find(o => o.value === v)?.label || v}</span> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 110, render: (a: boolean) => <span className={`status-badge ${a ? 'status-active' : 'status-inactive'}`}>{a ? 'Active' : 'Inactive'}</span> },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, r: Shift) => (
        <div className="action-group">
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setIsModalOpen(true); }} style={{ color: 'var(--hrms-text-muted)', borderRadius: 6 }} /></Tooltip>
          <Popconfirm title="Delete this shift?" description="This cannot be undone." onConfirm={() => deleteMutation.mutate(r.id)} okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel">
            <Tooltip title="Delete">          <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: 'var(--hrms-danger)', borderRadius: 6 }} /></Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Shifts" subtitle="Configure work schedules and timing" actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<SwapOutlined />} onClick={() => { setBulkModalOpen(true); }}>Bulk Assign</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>Add Shift</Button>
        </div>
      } />

      <DataTable
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total ?? 0}
        page={page}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        toolbarLeft={
          <Input.Search placeholder="Search shifts..." onSearch={(val) => { setSearch(val); setPage(1); }} style={{ width: 260 }} allowClear prefix={<SearchOutlined style={{ color: 'var(--hrms-text-muted)' }} />} enterButton={false} loading={isFetching} />
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{data?.meta?.total ?? 0} shifts</span>
        }
      />

      <Modal title={editingId ? 'Edit Shift' : 'New Shift'} open={isModalOpen}
        onOk={() => form.validateFields().then(v => editingId ? updateMutation.mutate({ id: editingId, payload: v }) : createMutation.mutate(v))}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingId ? 'Update' : 'Create'} okButtonProps={{ style: { borderRadius: 8 } }} cancelButtonProps={{ style: { borderRadius: 8 } }}>
        <Form form={form} layout="vertical" style={{ paddingTop: 8 }}>
          <Form.Item name="name" label="Shift Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Morning Shift" style={{ height: 40 }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
              <Input type="time" style={{ height: 40 }} />
            </Form.Item>
            <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
              <Input type="time" style={{ height: 40 }} />
            </Form.Item>
            <Form.Item name="workingHours" label="Hours/Day" rules={[{ required: true }]}>
              <InputNumber min={1} max={24} style={{ width: '100%', height: 40 }} />
            </Form.Item>
          </div>
          <Form.Item name="applicableTo" label="Applicable To" rules={[{ required: true }]}>
            <Select options={APPLICABLE_OPTIONS} style={{ height: 40 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Bulk Assign Shift" open={bulkModalOpen}
        onOk={() => bulkForm.validateFields().then(v => bulkMutation.mutate(v))}
        onCancel={() => { setBulkModalOpen(false); bulkForm.resetFields(); }}
        confirmLoading={bulkMutation.isPending}
        okText="Assign" okButtonProps={{ style: { borderRadius: 8 } }} cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={600}
      >
        <Form form={bulkForm} layout="vertical" style={{ paddingTop: 8 }}>
          <Form.Item name="shiftId" label="Select Shift" rules={[{ required: true, message: 'Select a shift' }]}>
            <Select
              showSearch
              placeholder="Search and select a shift"
              style={{ height: 40 }}
              filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
              options={(shiftList?.data || []).map((s: Shift) => ({ label: `${s.name} (${s.startTime}-${s.endTime})`, value: s.id }))}
            />
          </Form.Item>
          <Form.Item name="employeeIds" label="Select Employees" rules={[{ required: true, message: 'Select at least one employee' }]}>
            <Select
              mode="multiple"
              showSearch
              placeholder="Search and select employees"
              style={{ height: 40 }}
              filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
              options={(employees?.data || []).map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
