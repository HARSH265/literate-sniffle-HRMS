import { useState } from 'react';
import { Form, Input, DatePicker, Select, Button, Card, message, Space, Row, Col, Tag, Table } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, LeaveApplication } from '../services/leaveService';
import { employeeService } from '../../employees/services/employeeService';
import { PageHeader } from '../../../core/components/PageHeader';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

export function LeaveApplyPage() {
  const [form] = Form.useForm();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: QUERY_KEYS.employees,
    queryFn: () => employeeService.list({ limit: 500 }),
  });

  const { data: leaveTypes } = useQuery({
    queryKey: QUERY_KEYS.leaveTypes,
    queryFn: () => leaveService.listLeaveTypes(),
  });

  const { data: balances, refetch: refetchBalances } = useQuery({
    queryKey: QUERY_KEYS.leaveBalances(selectedEmployee),
    queryFn: () => leaveService.getBalances(selectedEmployee),
    enabled: !!selectedEmployee,
  });

  const { data: myApplications } = useQuery({
    queryKey: QUERY_KEYS.leaveApplicationsMy,
    queryFn: () => leaveService.getMyApplications(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof leaveService.createApplication>[0]) => leaveService.createApplication(payload),
    onSuccess: () => {
      message.success('Leave application submitted');
      form.resetFields();
      setSelectedEmployee('');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveApplicationsMy });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveBalancesMy });
      refetchBalances();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveService.cancelApplication(id),
    onSuccess: () => {
      message.success('Application cancelled');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaveApplicationsMy });
    },
  });

  const handleSubmit = async () => {
    const values = await form.validateFields();
    createMutation.mutate({
      employee: values.employee,
      leaveType: values.leaveType,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      reason: values.reason,
    });
  };

  const myAppColumns = [
    { title: 'Type', dataIndex: ['leaveType', 'name'], key: 'type',
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
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
        return <Tag color={colors[v] || 'default'}>{v}</Tag>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_: any, r: LeaveApplication) => (
        r.status === 'pending' ? (
          <Button type="link" danger onClick={() => cancelMutation.mutate(r.id)}>Cancel</Button>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Apply for Leave" subtitle="Submit a new leave application" />

      <Row gutter={24}>
        <Col span={14}>
          <Card title="New Leave Application" style={{ marginBottom: 24 }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="employee" label="Employee" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="Select employee"
                  optionFilterProp="label"
                  options={employees?.data?.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id }))}
                  onChange={(val) => setSelectedEmployee(val)}
                />
              </Form.Item>

              <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
                <Select
                  placeholder="Select leave type"
                  options={leaveTypes?.data?.filter(lt => lt.isActive).map(lt => ({
                    label: <Space><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: lt.color }} />{lt.name} ({lt.isPaid ? 'Paid' : 'Unpaid'})</Space>,
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

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={createMutation.isPending}>
                  Submit Application
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {myApplications?.data && myApplications.data.length > 0 && (
            <Card title="My Recent Applications">
              <Table
                dataSource={myApplications.data.slice(0, 10)}
                columns={myAppColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Col>

        <Col span={10}>
          {balances?.data && (
            <Card title="Leave Balances">
              {balances.data.map((b) => (
                <div key={b.leaveType.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hrms-border)' }}>
                  <Space>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: b.leaveType.color }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b.leaveType.name}</span>
                  </Space>
                  <Space size={12}>
                    <span style={{ fontSize: 12, color: 'var(--hrms-text-secondary)' }}>Entitled: {b.totalEntitled}</span>
                    <span style={{ fontSize: 12, color: b.balance > 0 ? 'var(--hrms-success)' : 'var(--hrms-danger)', fontWeight: 600 }}>{b.balance}</span>
                  </Space>
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
