import { useState } from 'react';
import { Tag, Button, Modal, Input, Space, message, Statistic, Row, Col, Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, LeaveApplication } from '../services/leaveService';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

export function LeaveApprovalsPage() {
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');
  const queryClient = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: QUERY_KEYS.leaveApprovalsPending,
    queryFn: () => leaveService.getPendingApprovals(),
  });

  const { data: allApps } = useQuery({
    queryKey: QUERY_KEYS.leaveApplications,
    queryFn: () => leaveService.listApplications({ limit: 500 }),
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { applicationId: string; status: 'approved' | 'rejected'; remarks?: string }) => leaveService.approveApplication(payload),
    onSuccess: () => {
      message.success(`Application ${action === 'approved' ? 'approved' : 'rejected'}`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveApprovalsPending });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveApplications });
      setApproveModalOpen(false);
      setSelectedApp(null);
      setRemarks('');
    },
  });

  const openApproveModal = (app: LeaveApplication, actionType: 'approved' | 'rejected') => {
    setSelectedApp(app);
    setAction(actionType);
    setRemarks('');
    setApproveModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedApp) return;
    approveMutation.mutate({ applicationId: selectedApp.id, status: action, remarks });
  };

  const pendingColumns = [
    { title: 'Employee', dataIndex: ['employee', 'fullName'], key: 'employee' },
    { title: 'Code', dataIndex: ['employee', 'employeeCode'], key: 'code' },
    {
      title: 'Leave Type', key: 'leaveType',
      render: (_: any, r: LeaveApplication) => (
        <Space>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: r.leaveType?.color }} />
          {r.leaveType?.name}
        </Space>
      ),
    },
    { title: 'From', dataIndex: 'startDate', key: 'startDate', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    { title: 'To', dataIndex: 'endDate', key: 'endDate', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    { title: 'Days', dataIndex: 'totalDays', key: 'days', width: 60 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: 'Actions', key: 'actions', width: 150, fixed: 'right' as const,
      render: (_: any, r: LeaveApplication) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => openApproveModal(r, 'approved')}>Approve</Button>
          <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => openApproveModal(r, 'rejected')}>Reject</Button>
        </Space>
      ),
    },
  ];

  const allColumns = [
    { title: 'Employee', dataIndex: ['employee', 'fullName'], key: 'employee' },
    {
      title: 'Leave Type', key: 'type',
      render: (_: any, r: LeaveApplication) => (
        <Space>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: r.leaveType?.color }} />
          {r.leaveType?.name}
        </Space>
      ),
    },
    { title: 'From', dataIndex: 'startDate', key: 'startDate', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    { title: 'To', dataIndex: 'endDate', key: 'endDate', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    { title: 'Days', dataIndex: 'totalDays', key: 'days', width: 60 },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
        return <Tag color={colors[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: 'Applied', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
  ];

  const stats = {
    pending: allApps?.data?.filter((a: LeaveApplication) => a.status === 'pending').length || 0,
    approved: allApps?.data?.filter((a: LeaveApplication) => a.status === 'approved').length || 0,
    rejected: allApps?.data?.filter((a: LeaveApplication) => a.status === 'rejected').length || 0,
  };

  return (
    <div>
      <PageHeader title="Leave Approvals" subtitle="Review and manage leave applications" />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="Pending" value={stats.pending} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="Approved" value={stats.approved} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="Rejected" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="Total" value={(allApps?.data?.length || 0)} /></Card>
        </Col>
      </Row>

      <Card title="Pending Approvals" style={{ marginBottom: 24 }}>
        <DataTable
          dataSource={pending?.data || []}
          columns={pendingColumns}
          rowKey="id"
          loading={isLoading}
          hidePagination
          noCard
          disableRowClick
        />
      </Card>

      <Card title="All Applications" style={{ marginBottom: 24 }}>
        <DataTable
          dataSource={allApps?.data || []}
          columns={allColumns}
          rowKey="id"
          loading={isLoading}
          noCard
        />
      </Card>

      <Modal
        title={`${action === 'approved' ? 'Approve' : 'Reject'} Leave Application`}
        open={approveModalOpen}
        onCancel={() => { setApproveModalOpen(false); setSelectedApp(null); }}
        onOk={handleConfirm}
        confirmLoading={approveMutation.isPending}
        okText={action === 'approved' ? 'Approve' : 'Reject'}
        okType={action === 'approved' ? 'primary' : 'danger'}
      >
        {selectedApp && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Employee:</strong> {selectedApp.employee?.fullName} ({selectedApp.employee?.employeeCode})</p>
            <p><strong>Leave Type:</strong> {selectedApp.leaveType?.name}</p>
            <p><strong>Dates:</strong> {dayjs(selectedApp.startDate).format('DD-MMM-YYYY')} to {dayjs(selectedApp.endDate).format('DD-MMM-YYYY')}</p>
            <p><strong>Days:</strong> {selectedApp.totalDays}</p>
            <p><strong>Reason:</strong> {selectedApp.reason}</p>
          </div>
        )}
        <Input.TextArea
          rows={3}
          placeholder={action === 'approved' ? 'Optional approval remarks...' : 'Reason for rejection (required)'}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </Modal>
    </div>
  );
}
