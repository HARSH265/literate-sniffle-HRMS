import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { Button, Modal, Form, Input, message, Tag, Card, Row, Col, Statistic, Space, Timeline, Tabs, InputNumber, Tooltip } from 'antd';
import { CheckCircleOutlined, EditOutlined, UndoOutlined, ArrowLeftOutlined, SendOutlined, StopOutlined, HistoryOutlined, ExperimentOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { payrollService, PayrollItem, PayrollRevision } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/stores/authStore';
import { PAYROLL_STATUS_COLORS } from '../../../core/constants/statusColors';
import { getCurrencySymbol, CURRENCY_MAX_AMOUNT, CURRENCY_PRECISION, formatCurrency } from '../../../core/constants/currency';
import dayjs from 'dayjs';
import apiClient from '../../../core/api/apiClient';

const STATUS_COLORS: Record<string, string> = PAYROLL_STATUS_COLORS;

export function PayrollDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canProcessPayroll = user?.role === 'super-admin' || user?.role === 'hr-admin' || user?.role === 'accounts';
  const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnfinalizeModalOpen, setIsUnfinalizeModalOpen] = useState(false);
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchChanges, setBatchChanges] = useState<Record<string, Record<string, number>>>({});
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(10);
  const [editForm] = Form.useForm();
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unfinalizeForm] = Form.useForm();

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  const { data: runData, isLoading } = useQuery({
    queryKey: ['payroll-run-details', id],
    queryFn: () => {
      if (!id) throw new Error('Run ID is missing');
      return payrollService.getRunDetails(id);
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const runId = id ?? '';

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error('Run ID is missing');
      return payrollService.submitRun(runId);
    },
    onSuccess: () => { message.success('Payroll submitted'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error('Run ID is missing');
      return payrollService.approveRun(runId);
    },
    onSuccess: () => { message.success('Payroll approved'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error('Run ID is missing');
      return payrollService.rejectRun(runId);
    },
    onSuccess: () => { message.success('Payroll rejected'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to reject'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (remarks?: string) => {
      if (!runId) throw new Error('Run ID is missing');
      return payrollService.finalizeRun(runId, remarks);
    },
    onSuccess: () => { message.success('Payroll finalized'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to finalize'),
  });

  const unfinalizeMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!runId) throw new Error('Run ID is missing');
      return payrollService.unfinalizeRun(runId, reason);
    },
    onSuccess: () => {
      message.success('Payroll unfinalized');
      setIsUnfinalizeModalOpen(false);
      unfinalizeForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to unfinalize'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ runId: mutationRunId, itemId, payload }: { runId: string; itemId: string; payload: Partial<PayrollItem> }) => payrollService.updatePayrollItem(mutationRunId, itemId, payload),
    onSuccess: () => { message.success('Payroll item updated'); setIsEditModalOpen(false); setEditingItem(null); editForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to update'),
  });

  const batchMutation = useMutation({
    mutationFn: (items: Array<{ itemId: string; data: Record<string, unknown> }>) => {
      if (!runId) throw new Error('Run ID is missing');
      return payrollService.batchUpdateItems(runId, items);
    },
    onSuccess: (res) => { message.success(`${res.data.totalEmployees} items updated`); setBatchEditMode(false); setBatchChanges({}); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); },
    onError: (err: Error) => message.error((err as any)?.response?.data?.message || 'Failed to batch update'),
  });

  const handleEditItem = (item: PayrollItem) => {
    setEditingItem(item);
    editForm.setFieldsValue({ basicEarnings: item.basicEarnings, netPay: item.netPay });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!runId || !editingItem) return;
    editForm.validateFields().then((values) => {
      const basic = Number(values.basicEarnings);
      const net = Number(values.netPay);
      if (basic < 0) { message.error('Basic Earnings cannot be negative'); return; }
      if (net < 0) { message.error('Net Pay cannot be negative'); return; }
      if (net < basic) {
        message.warning('Net Pay is less than Basic Earnings. Please verify.');
      }
      updateItemMutation.mutate({ runId, itemId: editingItem.id, payload: values });
    });
  };

  const handleBatchChange = useCallback((itemId: string, field: string, value: number | null) => {
    const safeValue = value === null || value === undefined ? 0 : Math.max(0, Number(value));
    // Debounce state updates to reduce re-renders
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    batchTimeoutRef.current = setTimeout(() => {
      setBatchChanges(prev => ({
        ...prev,
        [itemId]: { ...(prev[itemId] || {}), [field]: safeValue },
      }));
    }, 150);
  }, []);

  const handleBatchSave = () => {
    const items = Object.entries(batchChanges)
      .filter(([_, changes]) => Object.keys(changes).length > 0)
      .map(([itemId, data]) => ({ itemId, data: { ...data, netPay: data.netPay !== undefined ? Math.max(0, Number(data.netPay)) : undefined, basicEarnings: data.basicEarnings !== undefined ? Math.max(0, Number(data.basicEarnings)) : undefined } }));
    if (items.length === 0) { message.warning('No changes to save'); return; }
    // Validate: no negative values
    for (const item of items) {
      for (const [key, val] of Object.entries(item.data)) {
        if (typeof val === 'number' && val < 0) {
          message.error(`Negative value not allowed for ${key}`); return;
        }
      }
    }
    batchMutation.mutate(items);
  };

  const handleUnfinalize = () => {
    unfinalizeForm.validateFields().then((values) => {
      unfinalizeMutation.mutate(values.reason);
    });
  };

  const handleDownloadSlip = async (employeeId: string) => {
    try {
      if (!runData?.data || !runId) return;
      const response = await apiClient.get(`/salary-slips/${runId}/pdf`, {
        params: { employeeId },
        responseType: 'blob',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary_slip_${runData.data.month}_${employeeId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Salary slip downloaded');
    } catch { message.error('Failed to download salary slip'); }
  };

  const run = runData?.data;
  const canEdit = run?.status === 'draft';

  const detailColumns = useMemo(() => [
    { title: 'Employee', key: 'employee', width: 180, render: (_: unknown, r: PayrollItem) => <div><div style={{ fontWeight: 500 }}>{r.employee.name}</div><div style={{ fontSize: 11, color: '#888' }}>{r.employee.code}</div></div> },
    { title: 'Present', dataIndex: 'presentDays', key: 'presentDays', width: 68, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.presentDays ?? v} onChange={(val) => handleBatchChange(r.id, 'presentDays', val ?? v)} /> : v },
    { title: 'Absent', dataIndex: 'absentDays', key: 'absentDays', width: 60, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.absentDays ?? v} onChange={(val) => handleBatchChange(r.id, 'absentDays', val ?? v)} /> : v },
    { title: 'Half', dataIndex: 'halfDays', key: 'halfDays', width: 50, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.halfDays ?? v} onChange={(val) => handleBatchChange(r.id, 'halfDays', val ?? v)} /> : v },
    { title: 'Paid Lv', dataIndex: 'paidLeaveDays', key: 'paidLeaveDays', width: 60, render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: 'Unpd Lv', dataIndex: 'unpaidLeaveDays', key: 'unpaidLeaveDays', width: 60, render: (v: number) => <Tag color="red">{v}</Tag> },
    { title: 'OT Hrs', dataIndex: 'overtimeHours', key: 'overtimeHours', width: 60 },
    { title: 'Basic', dataIndex: 'basicEarnings', key: 'basicEarnings', width: 100, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 90 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.basicEarnings ?? v} onChange={(val) => handleBatchChange(r.id, 'basicEarnings', val ?? v)} /> : formatCurrency(v) },
    { title: 'Allow', dataIndex: 'allowancesTotal', key: 'allowancesTotal', width: 80, render: (v: number) => formatCurrency(v) },
    { title: 'OT Pay', dataIndex: 'overtimeAmount', key: 'overtimeAmount', width: 80, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 80 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.overtimeAmount ?? v} onChange={(val) => handleBatchChange(r.id, 'overtimeAmount', val ?? v)} /> : formatCurrency(v) },
    { title: 'Dedn', dataIndex: 'totalDeductions', key: 'totalDeductions', width: 80, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 80 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.totalDeductions ?? v} onChange={(val) => handleBatchChange(r.id, 'totalDeductions', val ?? v)} /> : formatCurrency(v) },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', width: 110, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 100, fontWeight: 600 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.netPay ?? v} onChange={(val) => handleBatchChange(r.id, 'netPay', val ?? v)} /> : <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>{formatCurrency(v)}</span> },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, r: PayrollItem) => (
        <Space size={4}>
          {canEdit && !batchEditMode && <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(r)}>Edit</Button>}
          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleDownloadSlip(r.employee.id)}>Slip</Button>
        </Space>
      ),
    },
  ], [batchEditMode, canEdit, batchChanges, handleBatchChange]);

  if (!run && !isLoading) {
    return (
      <div style={{ padding: '0 4px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>Back to Payroll</Button>
        <Card style={{ marginTop: 20, textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>Payroll run not found</div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)' }}>The payroll run may have been deleted or you don't have access.</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>Back to Payroll</Button>
        <Space>
          {canProcessPayroll && run?.status === 'draft' && (
            <>
              <Button type="primary" icon={<SendOutlined />} onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>Submit</Button>
              <Button icon={<ExperimentOutlined />} onClick={() => setBatchEditMode(!batchEditMode)}>{batchEditMode ? 'Exit Batch' : 'Batch Edit'}</Button>
            </>
          )}
          {canProcessPayroll && run?.status === 'submitted' && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>Approve</Button>
              <Button danger icon={<StopOutlined />} onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending}>Reject</Button>
            </>
          )}
          {canProcessPayroll && run?.status === 'approved' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => finalizeMutation.mutate(undefined)} loading={finalizeMutation.isPending}>Finalize</Button>
          )}
          {canProcessPayroll && run?.status === 'finalized' && (
            <Tooltip title={run?.unfinalizeLocked ? `Unfinalize window of ${run.unfinalizeWindowDays} days has expired (finalized on ${dayjs(run.finalizedAt).format('DD-MMM-YYYY')})` : 'Revert payroll to draft for edits'}>
              <Button icon={<UndoOutlined />} disabled={run?.unfinalizeLocked} onClick={() => setIsUnfinalizeModalOpen(true)} loading={unfinalizeMutation.isPending}>Unfinalize</Button>
            </Tooltip>
          )}
        </Space>
      </div>

      {batchEditMode && canEdit && (
        <Card size="small" style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Batch Edit Mode — Click into any editable cell to change values</span>
            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={handleBatchSave} loading={batchMutation.isPending}>Save All Changes</Button>
            <Button size="small" icon={<CloseOutlined />} onClick={() => { setBatchEditMode(false); setBatchChanges({}); }}>Cancel</Button>
          </Space>
        </Card>
      )}

      <PageHeader title={`Payroll - ${run ? dayjs(run.month + '-01').format('MMMM YYYY') : ''}`} subtitle={`Status: ${run?.status}`} />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Employees" value={run?.totalEmployees || 0} /></Card></Col>
        <Col span={6}><Card><div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Total Net Pay</div><Statistic title="" value={run?.totalNetPay || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Status</div><Tag color={STATUS_COLORS[run?.status || 'draft']} style={{ fontSize: 13, padding: '2px 12px' }}>{run?.status}</Tag></Card></Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Tabs defaultActiveKey="items" items={[
          {
            key: 'items',
            label: 'Payroll Items',
            children: (
              <DataTable
                columns={detailColumns}
                dataSource={run?.items || []}
                rowKey="id"
                loading={isLoading}
                page={itemsPage}
                pageSize={itemsPageSize}
                total={run?.items?.length || 0}
                onPaginationChange={(page, pageSize) => { setItemsPage(page); setItemsPageSize(pageSize); }}
                pageSizeOptions={['10', '25', '50', '100']}
                noCard
                scroll={{ x: 1400 }}
              />
            ),
          },
          {
            key: 'revisions',
            label: <span><HistoryOutlined /> Revision History</span>,
            children: run?.revisions && run.revisions.length > 0 ? (
              <Timeline items={run.revisions.map((rev: PayrollRevision) => ({
                children: <div><strong>{rev.userName}</strong> — {rev.action} <span style={{ color: '#888', fontSize: 12 }}>{dayjs(rev.timestamp).format('DD-MMM-YYYY HH:mm')}</span></div>,
              }))} />
            ) : <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>No revisions yet</div>,
          },
        ]} />
      </Card>

      <Modal title="Edit Payroll Item" open={isEditModalOpen} onOk={handleSaveEdit} onCancel={() => { setIsEditModalOpen(false); setEditingItem(null); editForm.resetFields(); }} confirmLoading={updateItemMutation.isPending} okText="Save Changes">
        {editingItem && (
          <div>
            <p><strong>Employee:</strong> {editingItem.employee.name} ({editingItem.employee.code})</p>
            <Form form={editForm} layout="vertical">
              <Form.Item name="basicEarnings" label="Basic Earnings" rules={[{ required: true }]}>
                <InputNumber min={0} max={CURRENCY_MAX_AMOUNT} precision={CURRENCY_PRECISION} prefix={getCurrencySymbol()} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="netPay" label="Net Pay" rules={[{ required: true }]}>
                <InputNumber min={0} max={CURRENCY_MAX_AMOUNT} precision={CURRENCY_PRECISION} prefix={getCurrencySymbol()} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="Unfinalize Payroll"
        open={isUnfinalizeModalOpen}
        onOk={handleUnfinalize}
        onCancel={() => { setIsUnfinalizeModalOpen(false); unfinalizeForm.resetFields(); }}
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
