import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { Button, Modal, Form, DatePicker, message, Tag, Popconfirm, Space, Input } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, EyeOutlined, DeleteOutlined, UndoOutlined, SendOutlined, StopOutlined, ExperimentOutlined } from '@ant-design/icons';
import { payrollService, PayrollRun } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  submitted: 'blue',
  approved: 'purple',
  finalized: 'green',
};

export function PayrollPage() {
  const navigate = useNavigate();
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [unfinalizeRunId, setUnfinalizeRunId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [previewForm] = Form.useForm();
  const [unfinalizeForm] = Form.useForm();
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

  const previewMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => payrollService.previewRun(month, year),
    onSuccess: (res) => {
      setPreviewData(res.data);
      setIsPreviewModalOpen(true);
      previewForm.resetFields();
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to preview'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => payrollService.submitRun(id),
    onSuccess: () => { message.success('Payroll submitted for approval'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollService.approveRun(id),
    onSuccess: () => { message.success('Payroll approved'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => payrollService.rejectRun(id),
    onSuccess: () => { message.success('Payroll rejected, returned to draft'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to reject'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => payrollService.finalizeRun(id),
    onSuccess: () => { message.success('Payroll finalized'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to finalize'),
  });

  const unfinalizeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => payrollService.unfinalizeRun(id, reason),
    onSuccess: () => {
      message.success('Payroll unfinalized');
      setUnfinalizeRunId(null);
      unfinalizeForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to unfinalize'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payrollService.deleteRun(id),
    onSuccess: () => { message.success('Payroll run deleted'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const handleRun = () => {
    form.validateFields().then((values) => {
      const { monthYear } = values;
      runMutation.mutate({ month: monthYear.month() + 1, year: monthYear.year() });
    });
  };

  const handlePreview = () => {
    previewForm.validateFields().then((values) => {
      const { monthYear } = values;
      previewMutation.mutate({ month: monthYear.month() + 1, year: monthYear.year() });
    });
  };

  const handleUnfinalize = () => {
    if (!unfinalizeRunId) return;
    unfinalizeForm.validateFields().then((values) => {
      unfinalizeMutation.mutate({ id: unfinalizeRunId, reason: values.reason });
    });
  };

  const columns = [
    {
      title: 'Month', dataIndex: 'month', key: 'month',
      render: (m: string) => <span style={{ fontWeight: 600 }}>{dayjs(m + '-01').format('MMMM YYYY')}</span>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag>,
    },
    { title: 'Employees', dataIndex: 'totalEmployees', key: 'totalEmployees' },
    {
      title: 'Total Net Pay', dataIndex: 'totalNetPay', key: 'totalNetPay',
      render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>₹{v.toLocaleString()}</span>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: PayrollRun) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/payroll/${record.id}`)}>View</Button>
          {record.status === 'draft' && (
            <>
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => submitMutation.mutate(record.id)}>Submit</Button>
              <Popconfirm title="Delete this payroll run?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {record.status === 'submitted' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => approveMutation.mutate(record.id)}>Approve</Button>
              <Button size="small" danger icon={<StopOutlined />} onClick={() => rejectMutation.mutate(record.id)}>Reject</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => finalizeMutation.mutate(record.id)}>Finalize</Button>
          )}
          {record.status === 'finalized' && (
            <Button size="small" icon={<UndoOutlined />} onClick={() => setUnfinalizeRunId(record.id)}>Unfinalize</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Payroll"
        subtitle="Process and manage monthly payroll"
        actions={
          <Space>
            <Button icon={<ExperimentOutlined />} onClick={() => setIsPreviewModalOpen(true)}>Preview</Button>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setIsRunModalOpen(true)}>Run Payroll</Button>
          </Space>
        }
      />

      <DataTable
        columns={columns}
        dataSource={runsData?.data || []}
        rowKey="id"
        loading={isLoading}
        total={runsData?.meta?.total ?? 0}
        page={page}
        pageSize={limit}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
      />

      <Modal title="Run Payroll" open={isRunModalOpen} onOk={handleRun} onCancel={() => { setIsRunModalOpen(false); form.resetFields(); }} confirmLoading={runMutation.isPending} okText="Process Payroll">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="monthYear" label="Select Month" rules={[{ required: true, message: 'Select month' }]}>
            <DatePicker.MonthPicker style={{ width: '100%' }} placeholder="Select month" />
          </Form.Item>
          <p style={{ fontSize: 12, color: '#666' }}>This will process payroll for all active employees based on attendance, overtime, and leave records.</p>
        </Form>
      </Modal>

      <Modal title="Payroll Preview" open={isPreviewModalOpen} onCancel={() => { setIsPreviewModalOpen(false); setPreviewData(null); }} footer={[
        <Button key="close" onClick={() => { setIsPreviewModalOpen(false); setPreviewData(null); }}>Close</Button>,
      ]} width={700}>
        <Form form={previewForm} layout="vertical" style={{ marginBottom: 16 }}>
          <Form.Item name="monthYear" label="Select Month" rules={[{ required: true }]}>
            <DatePicker.MonthPicker style={{ width: '100%' }} placeholder="Select month" />
          </Form.Item>
          <Button type="primary" onClick={handlePreview} loading={previewMutation.isPending} icon={<ExperimentOutlined />}>Generate Preview</Button>
        </Form>
        {previewData && (
          <div>
            <p><strong>Month:</strong> {dayjs(previewData.month + '-01').format('MMMM YYYY')}</p>
            <p><strong>Employees:</strong> {previewData.totalEmployees}</p>
            <p><strong>Estimated Total Net Pay:</strong> ₹{previewData.totalNetPay.toLocaleString()}</p>
            <p style={{ fontSize: 12, color: '#888' }}>This is a what-if preview. No data has been saved.</p>
            <DataTable
              dataSource={previewData.items?.slice(0, 10) || []}
              loading={previewMutation.isPending}
              columns={[
                { title: 'Employee', key: 'name', render: (_: any, r: any) => r.employee?.name },
                { title: 'Basic', dataIndex: 'basicEarnings', key: 'basic', render: (v: number) => `₹${v.toLocaleString()}` },
                { title: 'Allowances', dataIndex: 'allowancesTotal', key: 'allow', render: (v: number) => `₹${v.toLocaleString()}` },
                { title: 'OT', dataIndex: 'overtimeAmount', key: 'ot', render: (v: number) => `₹${v.toLocaleString()}` },
                { title: 'Deductions', dataIndex: 'totalDeductions', key: 'ded', render: (v: number) => `₹${v.toLocaleString()}` },
                { title: 'Net Pay', dataIndex: 'netPay', key: 'net', render: (v: number) => <strong>₹{v.toLocaleString()}</strong> },
              ]}
              rowKey={(r: any) => r.employee?.id || String(Math.random())}
              hidePagination
              disableRowClick
              noCard
            />
            {previewData.items?.length > 10 && <p style={{ textAlign: 'center', marginTop: 8, color: '#888' }}>...and {previewData.items.length - 10} more employees</p>}
          </div>
        )}
      </Modal>

      <Modal
        title="Unfinalize Payroll"
        open={!!unfinalizeRunId}
        onOk={handleUnfinalize}
        onCancel={() => { setUnfinalizeRunId(null); unfinalizeForm.resetFields(); }}
        confirmLoading={unfinalizeMutation.isPending}
        okText="Unfinalize"
      >
        <Form form={unfinalizeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Enter a reason' }]}>
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
