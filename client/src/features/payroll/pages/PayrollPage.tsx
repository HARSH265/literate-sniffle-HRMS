import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { Button, Modal, Form, DatePicker, message, Tag, Popconfirm, Space, Input, Tooltip } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, EyeOutlined, DeleteOutlined, UndoOutlined, SendOutlined, StopOutlined, ExperimentOutlined } from '@ant-design/icons';
import { payrollService, PayrollRun, PayrollItem } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/stores/authStore';
import { PAYROLL_STATUS_COLORS } from '../../../core/constants/statusColors';
import { formatCurrency } from '../../../core/constants/currency';
import dayjs from 'dayjs';

interface PreviewData {
  month: string;
  totalEmployees: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  items: PayrollItem[];
}


export function PayrollPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canProcessPayroll = user?.role === 'super-admin' || user?.role === 'hr-admin' || user?.role === 'accounts';
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
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
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to run payroll'),
  });

  const previewMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => payrollService.previewRun(month, year),
    onSuccess: (res) => {
      setPreviewData({ ...res.data, items: res.data.items || [] });
      setIsPreviewModalOpen(true);
      previewForm.resetFields();
    },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to preview'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => payrollService.submitRun(id),
    onSuccess: () => { message.success('Payroll submitted for approval'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollService.approveRun(id),
    onSuccess: () => { message.success('Payroll approved'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => payrollService.rejectRun(id),
    onSuccess: () => { message.success('Payroll rejected, returned to draft'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to reject'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => payrollService.finalizeRun(id),
    onSuccess: () => { message.success('Payroll finalized'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to finalize'),
  });

  const unfinalizeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => payrollService.unfinalizeRun(id, reason),
    onSuccess: () => {
      message.success('Payroll unfinalized');
      setUnfinalizeRunId(null);
      unfinalizeForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to unfinalize'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payrollService.deleteRun(id),
    onSuccess: () => { message.success('Payroll run deleted'); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to delete'),
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
      render: (s: string) => <Tag color={PAYROLL_STATUS_COLORS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag>,
    },
    { title: 'Employees', dataIndex: 'totalEmployees', key: 'totalEmployees' },
    {
      title: 'Total Net Pay', dataIndex: 'totalNetPay', key: 'totalNetPay',
      render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: PayrollRun) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/payroll/${record.id}`)}>View</Button>
          {canProcessPayroll && record.status === 'draft' && (
            <>
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => submitMutation.mutate(record.id)}>Submit</Button>
              <Popconfirm title="Delete this payroll run?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
          {canProcessPayroll && record.status === 'submitted' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => approveMutation.mutate(record.id)}>Approve</Button>
              <Popconfirm title="Reject this payroll run? It will return to draft status." onConfirm={() => rejectMutation.mutate(record.id)} okText="Reject" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<StopOutlined />} />
              </Popconfirm>
            </>
          )}
          {canProcessPayroll && record.status === 'approved' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => finalizeMutation.mutate(record.id)}>Finalize</Button>
          )}
          {canProcessPayroll && record.status === 'finalized' && (
            <Tooltip title={record.unfinalizeLocked ? `Unfinalize window of ${record.unfinalizeWindowDays} days has expired (finalized on ${dayjs(record.finalizedAt).format('DD-MMM-YYYY')})` : 'Revert payroll to draft for edits'}>
              <Button size="small" icon={<UndoOutlined />} disabled={record.unfinalizeLocked} onClick={() => setUnfinalizeRunId(record.id)}>Unfinalize</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Payroll"
        subtitle="Process and manage monthly payroll"
        actions={
          <Space size={4}>
            {canProcessPayroll && <Button icon={<ExperimentOutlined />} onClick={() => setIsPreviewModalOpen(true)}>Preview</Button>}
            {canProcessPayroll && <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setIsRunModalOpen(true)}>Run Payroll</Button>}
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
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 10); }}
      />

      <Modal title="Run Payroll" open={isRunModalOpen} onOk={handleRun} onCancel={() => { setIsRunModalOpen(false); form.resetFields(); }} confirmLoading={runMutation.isPending} okText="Process Payroll">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="monthYear" label="Select Month" rules={[{ required: true, message: 'Select month' }]}>
            <DatePicker.MonthPicker style={{ width: '100%' }} placeholder="Select month" />
          </Form.Item>
          <p style={{ fontSize: 12, color: 'var(--hrms-text-secondary)' }}>This will process payroll for all active employees based on attendance, overtime, and leave records.</p>
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
            <p><strong>Estimated Total Net Pay:</strong> {formatCurrency(previewData.totalNetPay)}</p>
            <p style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>This is a what-if preview. No data has been saved.</p>
            <DataTable
              dataSource={previewData.items?.slice(0, 10) || []}
              loading={previewMutation.isPending}
              columns={[
                { title: 'Employee', key: 'name', render: (_: unknown, r: PayrollItem) => r.employee?.name },
                { title: 'Basic', dataIndex: 'basicEarnings', key: 'basic', render: (v: number) => formatCurrency(v) },
                { title: 'Allowances', dataIndex: 'allowancesTotal', key: 'allow', render: (v: number) => formatCurrency(v) },
                { title: 'OT', dataIndex: 'overtimeAmount', key: 'ot', render: (v: number) => formatCurrency(v) },
                { title: 'Deductions', dataIndex: 'totalDeductions', key: 'ded', render: (v: number) => formatCurrency(v) },
                { title: 'Net Pay', dataIndex: 'netPay', key: 'net', render: (v: number) => <strong>{formatCurrency(v)}</strong> },
              ]}
              rowKey={(r: PayrollItem) => r.id || String(Math.random())}
              hidePagination
              disableRowClick
              noCard
            />
            {previewData.items?.length > 10 && <p style={{ textAlign: 'center', marginTop: 8, color: 'var(--hrms-text-muted)' }}>...and {previewData.items.length - 10} more employees</p>}
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
    </PageContainer>
  );
}
