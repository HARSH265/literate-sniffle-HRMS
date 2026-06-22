import { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, Switch, Space, message, Tag, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { loanService, LoanType } from '../services/loanService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function LoanTypesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loan-types'],
    queryFn: () => loanService.getLoanTypes(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<LoanType>) => loanService.createLoanType(payload),
    onSuccess: () => { message.success('Loan type created'); closeModal(); queryClient.invalidateQueries({ queryKey: ['loan-types'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LoanType> }) => loanService.updateLoanType(id, payload),
    onSuccess: () => { message.success('Loan type updated'); closeModal(); queryClient.invalidateQueries({ queryKey: ['loan-types'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => loanService.deleteLoanType(id),
    onSuccess: () => { message.success('Loan type deleted'); queryClient.invalidateQueries({ queryKey: ['loan-types'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const closeModal = () => { setModalOpen(false); setEditingId(null); form.resetFields(); };

  const handleEdit = (record: LoanType) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: 'Max Amount', dataIndex: 'maxAmount', key: 'maxAmount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Interest Rate', dataIndex: 'interestRate', key: 'interestRate', render: (v: number) => `${v}%` },
    { title: 'Max Tenure', dataIndex: 'maxTenure', key: 'maxTenure', render: (v: number) => `${v} months` },
    { title: 'Applicable To', dataIndex: 'applicableTo', key: 'applicableTo', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Max Active', dataIndex: 'maxActiveLoans', key: 'maxActiveLoans' },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (s: boolean) => <Tag color={s ? 'green' : 'red'}>{s ? 'Active' : 'Inactive'}</Tag> },
    { title: '', key: 'actions', width: 120, fixed: 'right' as const, render: (_: any, r: LoanType) => (
      <Space>
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
        <Popconfirm title="Delete this loan type?" onConfirm={() => deleteMutation.mutate(r.id)}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <PageContainer>
      <PageHeader title="Loan Types" subtitle="Configure loan types and their rules" />
      <DataTable
        dataSource={data?.data?.loanTypes || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        hidePagination
        toolbarLeft={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Loan Type</Button>}
      />

      <Modal title={editingId ? 'Edit Loan Type' : 'Create Loan Type'} open={modalOpen} onCancel={closeModal} onOk={form.submit} okText={editingId ? 'Update' : 'Create'} width={640}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Personal Loan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                <Input placeholder="e.g. PL" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="minAmount" label="Min Amount" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxAmount" label="Max Amount" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="interestRate" label="Interest Rate (%)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="minTenure" label="Min Tenure (months)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxTenure" label="Max Tenure (months)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={120} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxActiveLoans" label="Max Active Loans" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="applicableTo" label="Applicable To">
                <Select>
                  <Select.Option value="all">All</Select.Option>
                  <Select.Option value="worker">Worker</Select.Option>
                  <Select.Option value="office-staff">Office Staff</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="coolingOffPeriodDays" label="Cooling Off (days)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </PageContainer>
  );
}
