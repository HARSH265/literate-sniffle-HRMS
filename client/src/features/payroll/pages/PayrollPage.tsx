import { useState } from 'react';
import { PageHeader } from '../../../core/components/PageHeader';
import { Table, Button, Modal, Form, DatePicker, message, Tag, Card, Row, Col, Statistic } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { payrollService, PayrollRun } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  finalized: 'green',
};

export function PayrollPage() {
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: runsData, isLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => payrollService.listRuns(),
    refetchOnWindowFocus: false,
  });

  const runMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => payrollService.runPayroll(month, year),
    onSuccess: (res) => {
      message.success('Payroll processed successfully');
      setIsRunModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      setSelectedRun(res.data);
      setIsDetailsOpen(true);
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to run payroll'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => payrollService.finalizeRun(id),
    onSuccess: () => {
      message.success('Payroll finalized successfully');
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to finalize'),
  });

  const handleRun = () => {
    form.validateFields().then((values) => {
      const { monthYear } = values;
      if (monthYear) {
        runMutation.mutate({ month: monthYear.month() + 1, year: monthYear.year() });
      }
    });
  };

  const handleViewDetails = async (run: PayrollRun) => {
    const result = await payrollService.getRunDetails(run.id);
    setSelectedRun(result.data);
    setIsDetailsOpen(true);
  };

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (m: string) => <span style={{ fontWeight: 600 }}>{dayjs(m + '-01').format('MMMM YYYY')}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag>,
    },
    {
      title: 'Employees',
      dataIndex: 'totalEmployees',
      key: 'totalEmployees',
    },
    {
      title: 'Total Net Pay',
      dataIndex: 'totalNetPay',
      key: 'totalNetPay',
      render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>₹{v.toLocaleString()}</span>,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: PayrollRun) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>View</Button>
          {record.status === 'draft' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => finalizeMutation.mutate(record.id)}>
              Finalize
            </Button>
          )}
        </div>
      ),
    },
  ];

  const detailColumns = [
    { title: 'Employee', key: 'employee', render: (_: any, r: any) => <div><div style={{ fontWeight: 500 }}>{r.employee.name}</div><div style={{ fontSize: 11, color: '#888' }}>{r.employee.code}</div></div> },
    { title: 'Present', dataIndex: 'presentDays', key: 'presentDays' },
    { title: 'Absent', dataIndex: 'absentDays', key: 'absentDays' },
    { title: 'Half Day', dataIndex: 'halfDays', key: 'halfDays' },
    { title: 'OT Hours', dataIndex: 'overtimeHours', key: 'overtimeHours' },
    { title: 'Basic', dataIndex: 'basicEarnings', key: 'basicEarnings', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Allowances', dataIndex: 'allowancesTotal', key: 'allowancesTotal', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'OT Pay', dataIndex: 'overtimeAmount', key: 'overtimeAmount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>₹{v.toLocaleString()}</span> },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader 
        title="Payroll" 
        subtitle="Process and manage monthly payroll"
        actions={
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setIsRunModalOpen(true)}>
            Run Payroll
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={runsData?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Run Payroll"
        open={isRunModalOpen}
        onOk={handleRun}
        onCancel={() => { setIsRunModalOpen(false); form.resetFields(); }}
        confirmLoading={runMutation.isPending}
        okText="Process Payroll"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="monthYear" label="Select Month" rules={[{ required: true, message: 'Select month' }]}>
            <DatePicker.MonthPicker style={{ width: '100%' }} placeholder="Select month" />
          </Form.Item>
          <p style={{ fontSize: 12, color: '#666' }}>
            This will process payroll for all active employees based on their attendance and overtime records.
          </p>
        </Form>
      </Modal>

      <Modal
        title={`Payroll Details - ${selectedRun ? dayjs(selectedRun.month + '-01').format('MMMM YYYY') : ''}`}
        open={isDetailsOpen}
        onCancel={() => setIsDetailsOpen(false)}
        footer={null}
        width={900}
      >
        {selectedRun && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small"><Statistic title="Employees" value={selectedRun.totalEmployees} /></Card>
              </Col>
              <Col span={6}>
                <Card size="small"><Statistic title="Total Net Pay" value={selectedRun.totalNetPay} prefix="₹" /></Card>
              </Col>
              <Col span={6}>
                <Card size="small"><Statistic title="Status" value={selectedRun.status} /></Card>
              </Col>
            </Row>
            <Table
              columns={detailColumns}
              dataSource={selectedRun.items}
              rowKey={(r: any) => r.employee?.id || Math.random()}
              size="small"
              pagination={false}
            />
          </>
        )}
      </Modal>
    </div>
  );
}