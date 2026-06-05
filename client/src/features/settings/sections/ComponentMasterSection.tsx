import { Button, Modal, Form, Input, Select, Switch, Tag, Popconfirm, message, Row, Col, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DataTable } from '../../../core/components/DataTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { componentMasterService, ComponentMaster, CreateComponentMaster, UpdateComponentMaster } from '../../component-master/services/componentMasterService';
import { useState } from 'react';

export function ComponentMasterSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['componentMasters'],
    queryFn: () => componentMasterService.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateComponentMaster) => componentMasterService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentMasters'] });
      setModalOpen(false);
      form.resetFields();
      message.success('Component created');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create component'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateComponentMaster }) => componentMasterService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentMasters'] });
      setEditRecord(undefined);
      setModalOpen(false);
      form.resetFields();
      message.success('Component updated');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update component'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => componentMasterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentMasters'] });
      message.success('Component deleted');
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete component'),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<ComponentMaster | undefined>(undefined);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditRecord(undefined);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: ComponentMaster) => {
    setEditRecord(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      subType: record.subType,
      calcType: record.calcType,
      calcValue: record.calcValue,
      frequency: record.frequency,
      effectiveFrom: record.effectiveFrom ? record.effectiveFrom.slice(0, 10) : undefined,
      effectiveTo: record.effectiveTo ? record.effectiveTo.slice(0, 10) : undefined,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleFinish = (values: any) => {
    if (editRecord) {
      // Update
      updateMutation.mutate({ id: editRecord.id, payload: values });
    } else {
      // Create
      createMutation.mutate(values);
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Sub-Type', dataIndex: 'subType', key: 'subType' },
    { title: 'Calc Type', dataIndex: 'calcType', key: 'calcType' },
    { title: 'Calc Value', dataIndex: 'calcValue', key: 'calcValue' },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (a: boolean) => <Tag color={a ? 'green' : 'red'}>{a ? 'Active' : 'Inactive'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: ComponentMaster) => (
        <span>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this component?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="text" icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Component Master</h3>

        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Component</Button>
      </div>

      <Alert
          message="Component Master defines reusable payroll components (earnings, deductions, employer costs). These components are linked to employees via Salary Structure, enabling accurate payroll calculations. Create components here before assigning them in Salary Structure."
          type="info"
          showIcon
          style={{ marginBottom: 16, marginTop: 16 }}
        />
        
      <DataTable dataSource={data?.data} rowKey="id" loading={isLoading} columns={columns} hidePagination noCard disableRowClick />
        
      
      <Modal title={editRecord ? 'Edit Component' : 'Add Component'} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ isActive: true }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={[{ label: 'Earning', value: 'earning' }, { label: 'Deduction', value: 'deduction' }, { label: 'Employer Cost', value: 'employer-cost' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subType" label="Sub-Type" rules={[{ required: true }]}>
                <Select options={[{ label: 'Fixed', value: 'fixed' }, { label: 'Variable', value: 'variable' }, { label: 'Reimbursement', value: 'reimbursement' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="calcType" label="Calc Type" rules={[{ required: true }]}>
                <Select options={[{ label: 'Fixed', value: 'fixed' }, { label: 'Percentage of Basic', value: 'percentage-of-basic' }, { label: 'Percentage of Gross', value: 'percentage-of-gross' }, { label: 'Percentage of CTC', value: 'percentage-of-ctc' }, { label: 'Formula', value: 'formula' }, { label: 'Slab', value: 'slab' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calcValue" label="Calc Value" rules={[{ required: true, type: 'number' }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="frequency" label="Frequency">
                <Select options={[{ label: 'Monthly', value: 'monthly' }, { label: 'Quarterly', value: 'quarterly' }, { label: 'Annual', value: 'annual' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="effectiveTo" label="Effective To">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">{editRecord ? 'Update' : 'Create'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
