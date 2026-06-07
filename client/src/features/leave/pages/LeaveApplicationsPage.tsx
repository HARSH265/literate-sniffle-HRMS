import { useState } from 'react';
import { Tag, Select, Button, message, Modal, Form, Input, DatePicker } from 'antd';
import { PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { leaveService, LeaveApplication } from '../services/leaveService';
import { employeeService } from '../../employees/services/employeeService';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

export function LeaveApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.leaveApplications, statusFilter, page, limit],
    queryFn: () => leaveService.listApplications({ status: statusFilter || undefined, page, limit }),
  });

  const { data: employees } = useQuery({
    queryKey: QUERY_KEYS.employees,
    queryFn: () => employeeService.list({ limit: 500 }),
  });

  const { data: leaveTypes } = useQuery({
    queryKey: QUERY_KEYS.leaveTypes,
    queryFn: () => leaveService.listLeaveTypes(),
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

  const createMutation = useMutation({
    mutationFn: (payload: any) => leaveService.createApplication(payload),
    onSuccess: () => {
      message.success('Leave application submitted');
      setApplyModalOpen(false);
      applyForm.resetFields();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveApplications });
    },
  });

  const handleApplySubmit = async () => {
    const values = await applyForm.validateFields();
    createMutation.mutate({
      employee: values.employee,
      leaveType: values.leaveType,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      reason: values.reason,
    });
  };

  const columns = [
    { title: 'Employee', dataIndex: ['employee', 'fullName'], key: 'employee' },
    { title: 'Code', dataIndex: ['employee', 'employeeCode'], key: 'code' },
    {
      title: 'Leave Type', key: 'type',
      render: (_: any, r: LeaveApplication) => (
        <span className="select-option-badge">
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: r.leaveType?.color }} />
          {r.leaveType?.name}
          <Tag>{r.isPaid ? 'Paid' : 'Unpaid'}</Tag>
        </span>
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
      title: 'Actions', key: 'actions', width: 100, fixed: 'right' as const,
      render: (_: any, r: LeaveApplication) => (
        r.status === 'pending' ? (
          <Button type="link" danger onClick={(e) => { e.stopPropagation(); setSelectedApp(r); setCancelModalOpen(true); }}>Cancel</Button>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Applications"
        subtitle="View all leave applications"
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyModalOpen(true)}>Apply Leave</Button>}
      />

      <DataTable
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        total={data?.meta?.total ?? 0}
        page={page}
        pageSize={limit}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
        filterContent={
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        }
      />

      <Modal title="Apply for Leave" open={applyModalOpen} onOk={handleApplySubmit} onCancel={() => { setApplyModalOpen(false); applyForm.resetFields(); }} confirmLoading={createMutation.isPending} okText="Submit" okButtonProps={{ icon: <SendOutlined /> }} width={520}>
        <Form form={applyForm} layout="vertical" style={{ paddingTop: 8 }}>
          <Form.Item name="employee" label="Employee" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select employee"
              optionFilterProp="label"
              options={employees?.data?.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id }))}
              style={{ height: 40 }}
            />
          </Form.Item>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select
              placeholder="Select leave type"
              style={{ height: 40 }}
              options={leaveTypes?.data?.filter((lt: any) => lt.isActive).map((lt: any) => ({
                label: (
                  <span className="select-option-badge">
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: lt.color }} />
                    {lt.name} ({lt.isPaid ? 'Paid' : 'Unpaid'})
                  </span>
                ),
                value: lt.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="Date Range" rules={[{ required: true, message: 'Select start and end dates' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, min: 10 }]}>
            <Input.TextArea rows={3} placeholder="Explain the reason for leave..." maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>

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
