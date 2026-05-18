import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { Table, Button, Modal, Form, DatePicker, message, Tag, Popconfirm } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, EyeOutlined, DeleteOutlined, UndoOutlined } from '@ant-design/icons';
import { payrollService, PayrollRun } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  finalized: 'green',
};

export function PayrollPage() {
  const navigate = useNavigate();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: runsData, isLoading } = useQuery({
    queryKey: ['payroll-runs', page, limit],
    queryFn: () => payrollService.listRuns({ page, limit }),
    refetchOnWindowFocus: false,
  });

  const runMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => payrollService.runPayroll(month, year),
    onSuccess: (res) => {
      message.success('Payroll processed successfully');
      setIsRunModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      navigate(`/payroll/${res.data.id}`);
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

  const unfinalizeMutation = useMutation({
    mutationFn: (id: string) => payrollService.unfinalizeRun(id),
    onSuccess: () => {
      message.success('Payroll unfinalized successfully');
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to unfinalize'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payrollService.deleteRun(id),
    onSuccess: () => {
      message.success('Payroll run deleted');
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const handleRun = () => {
    form.validateFields().then((values) => {
      const { monthYear } = values;
      if (monthYear) {
        runMutation.mutate({ month: monthYear.month() + 1, year: monthYear.year() });
      }
    });
  };

  const handleFinalize = (id: string) => {
    Modal.confirm({
      title: 'Finalize Payroll',
      content: 'Are you sure you want to finalize this payroll? This action cannot be undone.',
      okText: 'Finalize',
      onOk: () => finalizeMutation.mutate(id),
    });
  };

  const handleUnfinalize = (id: string) => {
    Modal.confirm({
      title: 'Unfinalize Payroll',
      content: 'Are you sure you want to unfinalize this payroll?',
      okText: 'Unfinalize',
      onOk: () => unfinalizeMutation.mutate(id),
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
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
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PayrollRun) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/payroll/${record.id}`)}>View</Button>
          {record.status === 'draft' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleFinalize(record.id)}>
                Finalize
              </Button>
              <Popconfirm title="Delete this payroll run?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {record.status === 'finalized' && (
            <Button size="small" icon={<UndoOutlined />} onClick={() => handleUnfinalize(record.id)}>
              Unfinalize
            </Button>
          )}
        </div>
      ),
    },
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
        dataSource={(runsData as any)?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: limit,
          total: (runsData as any)?.meta?.total ?? 0,
          onChange: (p, size) => { setPage(p); setLimit(size ?? 10); },
          showSizeChanger: true,
        }}
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
    </div>
  );
}