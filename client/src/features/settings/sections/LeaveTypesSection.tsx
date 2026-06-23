import { useState } from 'react';
import { Button, Tag, Modal, Form, Input, InputNumber, Select, Switch, Space, ColorPicker, Popconfirm, message, Tooltip, Row, Col, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { DataTable } from '../../../core/components/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, LeaveType } from '../../leave/services/leaveService';

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

const CATEGORY_OPTIONS = [
  { label: 'Worker', value: 'worker' },
  { label: 'Office Staff', value: 'office-staff' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temporary', value: 'temporary' },
  { label: 'Trainee', value: 'trainee' },
];

export function LeaveTypesSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leave-types-settings'],
    queryFn: () => leaveService.listLeaveTypes(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<LeaveType>) => leaveService.createLeaveType(payload),
    onSuccess: () => {
      message.success('Leave type created');
      queryClient.invalidateQueries({ queryKey: ['leave-types-settings'] });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeaveType> }) => leaveService.updateLeaveType(id, payload),
    onSuccess: () => {
      message.success('Leave type updated');
      queryClient.invalidateQueries({ queryKey: ['leave-types-settings'] });
      setModalOpen(false);
      setEditingType(null);
      form.resetFields();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leaveService.deleteLeaveType(id),
    onSuccess: () => {
      message.success('Leave type deleted');
      queryClient.invalidateQueries({ queryKey: ['leave-types-settings'] });
    },
  });

  const openCreate = () => {
    setEditingType(null);
    form.resetFields();
    form.setFieldsValue({
      isPaid: true, color: 'var(--hrms-primary)', maxDaysPerApplication: 30, maxDaysPerYear: 30,
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
    {
      title: 'Name', dataIndex: 'name', key: 'name',
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
        <Space size={4}>
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Leave Types</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Leave Type</Button>
      </div>

      <Alert
          message="Leave Types configure entitlement policies, accrual methods and deduction rules for employee leaves. These settings feed into payroll calculations for leave pay and balances."
          type="info"
          showIcon
          style={{ marginBottom: 16, marginTop:16 }}
        /> 
        
      <DataTable dataSource={data?.data || []} columns={columns} rowKey="id" loading={isLoading} hidePagination noCard disableRowClick />
        

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
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Sick Leave" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                <Input placeholder="SL" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="color" label="Color">
                <ColorPicker format="hex" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="sortOrder" label="Sort Order">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="isPaid" label="Paid Leave" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="maxDaysPerApplication" label="Max Days/App" rules={[{ required: true }]}>
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="maxDaysPerYear" label="Max Days/Year" rules={[{ required: true }]}>
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="accrualMethod" label="Accrual Method">
                <Select options={accrualMethodOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="deductionMethod" label="Deduction Method">
                <Select options={deductionMethodOptions} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="carryForward" label="Carry Forward" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="carryForwardLimit" label="Carry Forward Limit">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="encashmentRatePercent" label="Encashment Rate %">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="requiresApproval" label="Requires Approval" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="approvalLevels" label="Approval Levels">
                <InputNumber min={1} max={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="autoApproveThreshold" label="Auto-approve (days)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="requiresDocuments" label="Requires Docs" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="applicableToGender" label="Gender">
                <Select options={[{ label: 'All', value: 'all' }, { label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="applicableCategories" label="Categories">
                <Select mode="multiple" options={CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="applicableEmploymentTypes" label="Employment Types">
                <Select mode="multiple" options={EMPLOYMENT_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="proRataOnJoin" label="Pro-rata on Join" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="allowNegativeBalance" label="Allow Negative" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="encashable" label="Encashable" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
