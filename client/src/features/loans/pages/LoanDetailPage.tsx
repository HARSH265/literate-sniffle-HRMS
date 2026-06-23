import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, message, Modal, Input, Row, Col, Statistic, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { loanService } from '../services/loanService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  applied: 'blue', approved: 'cyan', rejected: 'red', active: 'green', closed: 'default', cancelled: 'orange',
};

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loanService.getLoan(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => loanService.approveLoan(id!, { approve: true }),
    onSuccess: () => { message.success('Loan approved'); queryClient.invalidateQueries({ queryKey: ['loan', id] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => loanService.approveLoan(id!, { approve: false, remarks }),
    onSuccess: () => { message.success('Loan rejected'); setRejectModalOpen(false); queryClient.invalidateQueries({ queryKey: ['loan', id] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to reject'),
  });

  const disburseMutation = useMutation({
    mutationFn: () => loanService.disburseLoan(id!, remarks),
    onSuccess: () => { message.success('Loan disbursed'); setDisburseModalOpen(false); queryClient.invalidateQueries({ queryKey: ['loan', id] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to disburse'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => loanService.cancelLoan(id!),
    onSuccess: () => { message.success('Loan cancelled'); queryClient.invalidateQueries({ queryKey: ['loan', id] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to cancel'),
  });

  const loan = data?.data;
  if (!loan) return null;

  const emp = loan.employee || {};
  const lt = loan.loanType || {};

  const repaymentsColumns = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Principal', dataIndex: 'principal', key: 'principal', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Interest', dataIndex: 'interest', key: 'interest', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Outstanding Before', dataIndex: 'outstandingBefore', key: 'outstandingBefore', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Outstanding After', dataIndex: 'outstandingAfter', key: 'outstandingAfter', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const colors: Record<string, string> = { pending: 'orange', deducted: 'green', missed: 'red', paid: 'blue' };
      return <Tag color={colors[s] || 'default'}>{s.toUpperCase()}</Tag>;
    }},
  ];

  return (
    <PageContainer>
      <PageHeader title="Loan Details" subtitle={`Application #${loan.id?.slice(-6).toUpperCase()}`}
        actions={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/loans')}>Back to Loans</Button>} />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Loan Amount" value={loan.amount} prefix="₹" /></Card></Col>
        <Col span={6}><Card><Statistic title="Monthly EMI" value={loan.emiAmount} prefix="₹" /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Payable" value={loan.totalPayable} prefix="₹" /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Interest" value={loan.totalInterest} prefix="₹" valueStyle={{ color: 'var(--hrms-danger)' }} /></Card></Col>
      </Row>

      <Card title="Loan Information" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Employee">{emp.fullName} ({emp.employeeCode})</Descriptions.Item>
          <Descriptions.Item label="Department">{emp.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="Loan Type">{lt.name} ({lt.code})</Descriptions.Item>
          <Descriptions.Item label="Interest Rate">{loan.interestRate}% p.a.</Descriptions.Item>
          <Descriptions.Item label="Tenure">{loan.tenure} months</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[loan.status]}>{loan.status.toUpperCase()}</Tag></Descriptions.Item>
          <Descriptions.Item label="Applied Date">{loan.applicationDate ? dayjs(loan.applicationDate).format('DD MMM YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Purpose">{loan.purpose || '-'}</Descriptions.Item>
          {loan.disbursedDate && <Descriptions.Item label="Disbursed Date">{dayjs(loan.disbursedDate).format('DD MMM YYYY')}</Descriptions.Item>}
          {loan.closedDate && <Descriptions.Item label="Closed Date">{dayjs(loan.closedDate).format('DD MMM YYYY')}</Descriptions.Item>}
        </Descriptions>

        {loan.status === 'applied' && (
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>Approve</Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModalOpen(true)}>Reject</Button>
            <Popconfirm title="Cancel this application?" onConfirm={() => cancelMutation.mutate()}>
              <Button icon={<StopOutlined />}>Cancel</Button>
            </Popconfirm>
          </Space>
        )}
        {loan.status === 'approved' && (
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<DollarOutlined />} onClick={() => setDisburseModalOpen(true)} loading={disburseMutation.isPending}>Disburse Loan</Button>
            <Popconfirm title="Cancel this loan?" onConfirm={() => cancelMutation.mutate()}>
              <Button icon={<StopOutlined />}>Cancel</Button>
            </Popconfirm>
          </Space>
        )}
      </Card>

      {loan.repayments && loan.repayments.length > 0 && (
        <DataTable
          dataSource={loan.repayments}
          columns={repaymentsColumns}
          rowKey="month"
          loading={isLoading}
          hidePagination
          toolbarLeft={<strong style={{ fontSize: 16 }}>Repayment Schedule</strong>}
        />
      )}

      <Modal title="Reject Loan" open={rejectModalOpen} onCancel={() => setRejectModalOpen(false)} onOk={() => rejectMutation.mutate()} okText="Reject" okButtonProps={{ danger: true }}>
        <Input.TextArea rows={3} placeholder="Reason for rejection" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Modal>
      <Modal title="Disburse Loan" open={disburseModalOpen} onCancel={() => setDisburseModalOpen(false)} onOk={() => disburseMutation.mutate()} okText="Disburse">
        <Input.TextArea rows={2} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Modal>
    </PageContainer>
  );
}
