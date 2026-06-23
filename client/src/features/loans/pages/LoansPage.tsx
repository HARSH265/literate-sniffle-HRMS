import { useState, useMemo } from 'react';
import { Card, Tag, Select, Space, Button, message, Row, Col, Statistic, Popconfirm } from 'antd';
import { EyeOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { loanService, Loan } from '../services/loanService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  applied: 'blue', approved: 'cyan', rejected: 'red', active: 'green', closed: 'default', cancelled: 'orange',
};

export function LoansPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loans', statusFilter],
    queryFn: () => loanService.listLoans({ status: statusFilter, limit: 100 }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => loanService.cancelLoan(id),
    onSuccess: () => { message.success('Loan cancelled'); queryClient.invalidateQueries({ queryKey: ['loans'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to cancel'),
  });

  const loans = data?.data?.loans || [];
  const stats = useMemo(() => ({
    total: loans.length,
    active: loans.filter((l: any) => l.status === 'active').length,
    applied: loans.filter((l: any) => l.status === 'applied').length,
    approved: loans.filter((l: any) => l.status === 'approved').length,
  }), [loans]);

  const columns = useMemo(() => [
    { title: 'Employee', dataIndex: 'employee', key: 'employee', render: (e: any) => e ? `${e.fullName} (${e.employeeCode})` : '-' },
    { title: 'Loan Type', dataIndex: 'loanType', key: 'loanType', render: (lt: any) => lt?.name || '-' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'EMI', dataIndex: 'emiAmount', key: 'emiAmount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Tenure', dataIndex: 'tenure', key: 'tenure', render: (v: number) => `${v}m` },
    { title: 'Interest', dataIndex: 'interestRate', key: 'interestRate', render: (v: number) => `${v}%` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s.toUpperCase()}</Tag> },
    { title: 'Applied', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
    { title: '', key: 'actions', width: 180, fixed: 'right' as const, render: (_: any, r: Loan) => (
      <Space size={4}>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/loans/${r.id}`)}>View</Button>
        {['applied', 'approved'].includes(r.status) && (
          <Popconfirm title="Cancel this loan?" description="This action cannot be undone." onConfirm={() => cancelMutation.mutate(r.id)} okText="Yes, Cancel" okButtonProps={{ danger: true }} cancelText="No">
            <Button type="link" size="small" danger>Cancel</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ], []);

  return (
    <PageContainer>
      <PageHeader title="Loans" subtitle="View and manage loan applications" />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total" value={stats.total} prefix={<DollarOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Applied" value={stats.applied} valueStyle={{ color: 'var(--hrms-info)' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Approved" value={stats.approved} valueStyle={{ color: 'var(--hrms-success)' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Active" value={stats.active} valueStyle={{ color: 'var(--hrms-warning)' }} /></Card></Col>
      </Row>
      <DataTable
        dataSource={loans}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        toolbarLeft={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/loans/apply')}>Apply Loan</Button>}
        filterContent={
          <Select allowClear placeholder="Filter by status" style={{ width: 160 }} value={statusFilter} onChange={setStatusFilter}
            options={['applied', 'approved', 'rejected', 'active', 'closed', 'cancelled'].map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))} />
        }
      />

    </PageContainer>
  );
}
