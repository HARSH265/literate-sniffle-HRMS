import { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Switch, Space, ColorPicker, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, LeaveType } from '../services/leaveService';
import { PageHeader } from '../../../core/components/PageHeader';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

const deductionMethodOptions = [
  { label: 'No Deduction', value: 'none' },
  { label: 'Basic Only', value: 'basic-only' },
  { label: 'Basic + Allowances', value: 'basic-plus-allowances' },
  { label: 'Gross', value: 'gross' },
];

const accrualMethodOptions = [
  { label: 'Yearly Lump Sum', value: 'yearly-lump' },
  { label: 'Monthly Pro-rata', value: 'monthly-pro-rata' },
  { label: 'Manual', value: 'manual' },
];

export function LeaveTypesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.leaveTypes,
    queryFn: () => leaveService.listLeaveTypes(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<LeaveType>) => leaveService.createLeaveType(payload),
    onSuccess: () => {
      message.success('Leave type created');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveTypes });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeaveType> }) => leaveService.updateLeaveType(id, payload),
    onSuccess: () => {
      message.success('Leave type updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveTypes });
      setModalOpen(false);
      setEditingType(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leaveService.deleteLeaveType(id),
    onSuccess: () => {
      message.success('Leave type deleted');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveTypes });
    },
  });

  const openCreate = () => {
    setEditingType(null);
    form.resetFields();
    form.setFieldsValue({
      isPaid: true, color: '#4f46e5', maxDaysPerApplication: 30, maxDaysPerYear: 30,
      carryForward: false, carryForwardLimit: 0, encashable: false, encashmentRatePercent: 100,
      requiresDocuments: false, requiresApproval: true, approvalLevels: 1, autoApproveThreshold: 0,
      applicableToGender: 'all', applicableCategories: ['worker', 'office-staff'],
      applicableEmploymentTypes: ['permanent', 'contract', 'temporary', 'trainee'],
      deductionMethod: 'none', accrualMethod: 'yearly-lump', proRataOnJoin: true,
      allowNegativeBalance: false, isActive: true, sortOrder: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (record: LeaveType) => {
    setEditingType(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name',
      render: (_: any, r: LeaveType) => (
        <Space>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: r.color }} />
          {r.name}
        </Space>
      ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Paid', dataIndex: 'isPaid', key: 'isPaid', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Paid' : 'Unpaid'}</Tag> },
    { title: 'Max/App', dataIndex: 'maxDaysPerApplication', key: 'maxDaysPerApp', width: 90 },
    { title: 'Max/Year', dataIndex: 'maxDaysPerYear', key: 'maxDaysPerYear', width: 90 },
    { title: 'Accrual', dataIndex: 'accrualMethod', key: 'accrualMethod', render: (v: string) => <Tag>{v === 'yearly-lump' ? 'Yearly' : v === 'monthly-pro-rata' ? 'Monthly' : 'Manual'}</Tag> },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: any, r: LeaveType) => (
        <Space>
          <Tooltip title="Edit"><Button type="link" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>
          <Popconfirm title="Delete this leave type?" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Tooltip title="Delete"><Button type="link" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Leave Types" subtitle="Configure leave types and rules" actions={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Leave Type</Button>
      } />

      <div className="hrms-table-card">
        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </div>

      <Modal
        title={editingType ? 'Edit Leave Type' : 'Create Leave Type'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingType(null); }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={800}
        okText={editingType ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="e.g. Sick Leave" />
            </Form.Item>
            <Form.Item name="code" label="Code" rules={[{ required: true }]} style={{ width: 120 }}>
              <Input placeholder="SL" />
            </Form.Item>
            <Form.Item name="color" label="Color" style={{ width: 80 }}>
              <ColorPicker format="hex" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="isPaid" label="Paid Leave" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="maxDaysPerApplication" label="Max Days/Application" rules={[{ required: true }]}>
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="maxDaysPerYear" label="Max Days/Year" rules={[{ required: true }]}>
              <InputNumber min={0} max={365} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="sortOrder" label="Sort Order">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="accrualMethod" label="Accrual Method" style={{ flex: 1 }}>
              <Select options={accrualMethodOptions} />
            </Form.Item>
            <Form.Item name="deductionMethod" label="Deduction Method" style={{ flex: 1 }}>
              <Select options={deductionMethodOptions} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="carryForward" label="Carry Forward" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="carryForwardLimit" label="Carry Forward Limit">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="encashable" label="Encashable" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="encashmentRatePercent" label="Encashment Rate %">
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="requiresApproval" label="Requires Approval" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="approvalLevels" label="Approval Levels">
              <InputNumber min={1} max={3} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="autoApproveThreshold" label="Auto-approve Threshold (days)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="requiresDocuments" label="Requires Documents" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="applicableToGender" label="Gender" style={{ width: 150 }}>
              <Select options={[{ label: 'All', value: 'all' }, { label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]} />
            </Form.Item>
            <Form.Item name="applicableCategories" label="Categories">
              <Select mode="multiple" options={[{ label: 'Worker', value: 'worker' }, { label: 'Office Staff', value: 'office-staff' }]} />
            </Form.Item>
            <Form.Item name="applicableEmploymentTypes" label="Employment Types" style={{ flex: 1 }}>
              <Select mode="multiple" options={[
                { label: 'Permanent', value: 'permanent' }, { label: 'Contract', value: 'contract' },
                { label: 'Temporary', value: 'temporary' }, { label: 'Trainee', value: 'trainee' },
              ]} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="proRataOnJoin" label="Pro-rata on Join" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="allowNegativeBalance" label="Allow Negative Balance" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
