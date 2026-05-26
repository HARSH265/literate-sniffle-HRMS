import { useState } from 'react';
import { Card, Tag, Select, Space, Button, message, Row, Col, Statistic, Modal, Form, Input, InputNumber, Descriptions, Popconfirm } from 'antd';
import { EyeOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { loanService, Loan } from '../services/loanService';
import { employeeService } from '../../employees/services/employeeService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  applied: 'blue', approved: 'cyan', rejected: 'red', active: 'green', closed: 'default', cancelled: 'orange',
};

export function LoansPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyForm] = Form.useForm();
  const [selectedType, setSelectedType] = useState<any>(null);
  const [calculatedEMI, setCalculatedEMI] = useState<{ emi: number; totalInterest: number; totalPayable: number } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loans', statusFilter],
    queryFn: () => loanService.listLoans({ status: statusFilter, limit: 100 }),
  });

  const { data: loanTypes } = useQuery({
    queryKey: ['loan-types-apply'],
    queryFn: () => loanService.getLoanTypes(),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-loan'],
    queryFn: () => employeeService.list({ limit: 1000, status: 'active' }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => loanService.cancelLoan(id),
    onSuccess: () => { message.success('Loan cancelled'); queryClient.invalidateQueries({ queryKey: ['loans'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to cancel'),
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { employee: string; loanType: string; amount: number; tenure: number; purpose?: string }) => loanService.applyLoan(payload),
    onSuccess: () => { message.success('Loan application submitted'); setApplyModalOpen(false); applyForm.resetFields(); setCalculatedEMI(null); queryClient.invalidateQueries({ queryKey: ['loans'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to apply'),
  });

  const handleTypeChange = (typeId: string) => {
    const lt = loanTypes?.data?.loanTypes?.find((t: any) => t.id === typeId) || null;
    setSelectedType(lt);
    setCalculatedEMI(null);
    applyForm.setFieldValue('amount', undefined);
    applyForm.setFieldValue('tenure', undefined);
  };

  const calculateEMI = () => {
    const amount = applyForm.getFieldValue('amount');
    const tenure = applyForm.getFieldValue('tenure');
    if (!amount || !tenure || !selectedType) return;
    const monthlyRate = selectedType.interestRate / 100 / 12;
    if (monthlyRate === 0) {
      const emi = amount / tenure;
      setCalculatedEMI({ emi: Math.round(emi * 100) / 100, totalInterest: 0, totalPayable: amount });
    } else {
      const factor = Math.pow(1 + monthlyRate, tenure);
      const emi = amount * monthlyRate * factor / (factor - 1);
      setCalculatedEMI({
        emi: Math.round(emi * 100) / 100,
        totalInterest: Math.round((emi * tenure - amount) * 100) / 100,
        totalPayable: Math.round(emi * tenure * 100) / 100,
      });
    }
  };

  const loans = data?.data?.loans || [];
  const stats = {
    total: loans.length,
    active: loans.filter((l: any) => l.status === 'active').length,
    applied: loans.filter((l: any) => l.status === 'applied').length,
    approved: loans.filter((l: any) => l.status === 'approved').length,
  };

  const activeTypes = loanTypes?.data?.loanTypes?.filter((t: any) => t.isActive) || [];

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee', render: (e: any) => e ? `${e.fullName} (${e.employeeCode})` : '-' },
    { title: 'Loan Type', dataIndex: 'loanType', key: 'loanType', render: (lt: any) => lt?.name || '-' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'EMI', dataIndex: 'emiAmount', key: 'emiAmount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Tenure', dataIndex: 'tenure', key: 'tenure', render: (v: number) => `${v}m` },
    { title: 'Interest', dataIndex: 'interestRate', key: 'interestRate', render: (v: number) => `${v}%` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s.toUpperCase()}</Tag> },
    { title: 'Applied', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
    { title: '', key: 'actions', width: 180, fixed: 'right' as const, render: (_: any, r: Loan) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/loans/${r.id}`)}>View</Button>
        {['applied', 'approved'].includes(r.status) && (
          <Popconfirm title="Cancel this loan?" description="This action cannot be undone." onConfirm={() => cancelMutation.mutate(r.id)} okText="Yes, Cancel" okButtonProps={{ danger: true }} cancelText="No">
            <Button type="link" size="small" danger>Cancel</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  return (
    <div>
      <PageHeader title="Loans" subtitle="View and manage loan applications" />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total" value={stats.total} prefix={<DollarOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Applied" value={stats.applied} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Approved" value={stats.approved} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Active" value={stats.active} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>
      <DataTable
        dataSource={loans}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pageSize={20}
        toolbarLeft={<Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyModalOpen(true)}>Apply Loan</Button>}
        filterContent={
          <Select allowClear placeholder="Filter by status" style={{ width: 160 }} value={statusFilter} onChange={setStatusFilter}
            options={['applied', 'approved', 'rejected', 'active', 'closed', 'cancelled'].map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))} />
        }
      />

      <Modal title="Apply for Loan" open={applyModalOpen} onCancel={() => { setApplyModalOpen(false); applyForm.resetFields(); setCalculatedEMI(null); }} width={600}
        onOk={() => applyForm.submit()} okText="Submit Application" confirmLoading={applyMutation.isPending}>
        <Form form={applyForm} layout="vertical" onFinish={(values) => applyMutation.mutate(values)}>
          <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Select employee' }]}>
            <Select showSearch placeholder="Select employee" filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
              options={employees?.data?.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id })) || []} />
          </Form.Item>
          <Form.Item name="loanType" label="Loan Type" rules={[{ required: true, message: 'Select loan type' }]}>
            <Select placeholder="Select loan type" onChange={handleTypeChange}
              options={activeTypes.map((t: any) => ({ label: `${t.name} (${t.interestRate}% p.a.)`, value: t.id }))} />
          </Form.Item>
          {selectedType && (
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Min Amount">₹{selectedType.minAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Max Amount">₹{selectedType.maxAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Interest Rate">{selectedType.interestRate}% p.a.</Descriptions.Item>
              <Descriptions.Item label="Max Tenure">{selectedType.maxTenure} months</Descriptions.Item>
            </Descriptions>
          )}
          <Form.Item name="amount" label="Loan Amount" rules={[{ required: true, message: 'Enter amount' }]}>
            <InputNumber style={{ width: '100%' }} min={selectedType?.minAmount || 0} max={selectedType?.maxAmount || 1000000} placeholder="Enter amount" onChange={calculateEMI} />
          </Form.Item>
          <Form.Item name="tenure" label="Tenure (months)" rules={[{ required: true, message: 'Enter tenure' }]}>
            <InputNumber style={{ width: '100%' }} min={selectedType?.minTenure || 1} max={selectedType?.maxTenure || 120} placeholder="Enter tenure in months" onChange={calculateEMI} />
          </Form.Item>
          <Form.Item name="purpose" label="Purpose">
            <Input.TextArea rows={2} placeholder="Reason for loan" />
          </Form.Item>
          {calculatedEMI && (
            <Descriptions column={3} bordered size="small">
              <Descriptions.Item label="Monthly EMI">₹{calculatedEMI.emi.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Total Interest">₹{calculatedEMI.totalInterest.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Total Payable">₹{calculatedEMI.totalPayable.toLocaleString()}</Descriptions.Item>
            </Descriptions>
          )}
        </Form>
      </Modal>
    </div>
  );
}
