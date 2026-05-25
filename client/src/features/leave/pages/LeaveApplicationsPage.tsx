import { useState } from 'react';
import { Table, Tag, Space, Select, Row, Col, Card, Button, message, Modal } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { leaveService, LeaveApplication } from '../services/leaveService';
import { PageHeader } from '../../../core/components/PageHeader';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

export function LeaveApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.leaveApplications, statusFilter],
    queryFn: () => leaveService.listApplications({ status: statusFilter || undefined, limit: 500 }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveService.cancelApplication(id),
    onSuccess: () => {
      message.success('Application cancelled');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveApplications });
      setCancelModalOpen(false);
      setSelectedApp(null);
    },
  });

  const columns = [
    { title: 'Employee', dataIndex: ['employee', 'fullName'], key: 'employee' },
    { title: 'Code', dataIndex: ['employee', 'employeeCode'], key: 'code' },
    {
      title: 'Leave Type', key: 'type',
      render: (_: any, r: LeaveApplication) => (
        <Space>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: r.leaveType?.color }} />
          {r.leaveType?.name}
          <Tag>{r.isPaid ? 'Paid' : 'Unpaid'}</Tag>
        </Space>
      ),
    },
    { title: 'From', dataIndex: 'startDate', key: 'startDate', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    { title: 'To', dataIndex: 'endDate', key: 'endDate', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    { title: 'Days', dataIndex: 'totalDays', key: 'days', width: 60 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
        return <Tag color={colors[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: 'Applied', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('DD-MMM-YYYY') },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_: any, r: LeaveApplication) => (
        r.status === 'pending' ? (
          <Button type="link" danger onClick={() => { setSelectedApp(r); setCancelModalOpen(true); }}>Cancel</Button>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Leave Applications" subtitle="View all leave applications" />

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v || '')}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <div className="hrms-table-card">
        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </div>

      <Modal
        title="Cancel Application"
        open={cancelModalOpen}
        onCancel={() => { setCancelModalOpen(false); setSelectedApp(null); }}
        onOk={() => selectedApp && cancelMutation.mutate(selectedApp.id)}
        confirmLoading={cancelMutation.isPending}
        okText="Yes, Cancel"
        okType="danger"
      >
        {selectedApp && (
          <p>Are you sure you want to cancel the {selectedApp.leaveType?.name} application for {selectedApp.totalDays} day(s)?</p>
        )}
      </Modal>
    </div>
  );
}
