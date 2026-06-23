import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { Button, Modal, Form, Input, message, Tag, Card, Row, Col, Statistic, Space, Timeline, Tabs, InputNumber, Tooltip } from 'antd';
import { CheckCircleOutlined, EditOutlined, UndoOutlined, ArrowLeftOutlined, SendOutlined, StopOutlined, HistoryOutlined, ExperimentOutlined, SaveOutlined, CloseOutlined, DownloadOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { payrollService, PayrollItem, PayrollRevision, ApprovalHistoryEntry } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../core/stores/authStore';
import { PAYROLL_STATUS_COLORS } from '../../../core/constants/statusColors';
import { getCurrencySymbol, CURRENCY_MAX_AMOUNT, CURRENCY_PRECISION, formatCurrency } from '../../../core/constants/currency';
import dayjs from 'dayjs';
import apiClient from '../../../core/api/apiClient';
import * as XLSX from 'xlsx';

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
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [editForm] = Form.useForm();
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unfinalizeForm] = Form.useForm();
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

  const getStatutoryDeduction = (item: PayrollItem, name: string): number => {
    const found = item.deductions?.find((d) => d.name.toLowerCase().includes(name.toLowerCase()));
    return found?.calculatedValue || 0;
  };

  const totalBatchChanges = useMemo(() => {
    return Object.values(batchChanges).reduce((sum, changes) => sum + Object.keys(changes).length, 0);
  }, [batchChanges]);

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
    onSuccess: (res) => { message.success(`${res.data.updated} items updated`); setBatchEditMode(false); setBatchChanges({}); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); },
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

  const handleExportItems = () => {
    const items = filteredItems;
    if (!items.length) { message.warning('No items to export'); return; }
    const data = items.map((item) => ({
      'Employee Name': item.employee.name,
      'Employee Code': item.employee.code,
      'Total Days': item.totalDays,
      'Present Days': item.presentDays,
      'Absent Days': item.absentDays,
      'Half Days': item.halfDays,
      'Paid Leave': item.paidLeaveDays,
      'Unpaid Leave': item.unpaidLeaveDays,
      'Weekly Offs': item.weeklyOffs,
      'Holidays': item.holidays,
      'Effective Working Days': item.effectiveWorkingDays,
      'OT Hours': item.overtimeHours,
      'Basic Earnings': item.basicEarnings,
      'Allowances': item.allowancesTotal,
      'OT Pay': item.overtimeAmount,
      'Gross Earnings': item.grossEarnings,
      'PF': getStatutoryDeduction(item, 'pf'),
      'ESI': getStatutoryDeduction(item, 'esi'),
      'PT': getStatutoryDeduction(item, 'pt'),
      'Total Deductions': item.totalDeductions,
      'Arrears': item.arrears?.reduce((sum, a) => sum + a.effectiveArrearAmount, 0) || 0,
      'Net Pay': item.netPay,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Items');
    XLSX.writeFile(wb, `payroll_items_${run?.month || 'export'}.xlsx`);
    message.success('Exported to Excel');
  };

  const run = runData?.data;
  const canEdit = run?.status === 'draft';
  const filteredItems = useMemo(() => {
    const items = run?.items || [];
    if (!employeeSearch.trim()) return items;
    const q = employeeSearch.toLowerCase();
    return items.filter((item) =>
      item.employee.name.toLowerCase().includes(q) || item.employee.code.toLowerCase().includes(q),
    );
  }, [run?.items, employeeSearch]);

  const detailColumns = useMemo(() => [
    {
      title: 'Employee', key: 'employee', width: 200,
      render: (_: unknown, r: PayrollItem) => {
        const hasComplianceIssues = r.complianceFlags?.some((f) => f.status === 'fail');
        const complianceWarnings = r.complianceFlags?.filter((f) => f.status === 'warning') || [];
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{r.employee.name}</div>
            <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{r.employee.code}</div>
            {r.proRataDetails?.isJoiner && <div style={{ fontSize: 11, color: 'var(--hrms-info)' }}>Joined {dayjs(r.proRataDetails.joinDate).format('DD-MMM')} • {r.proRataDetails.daysWorked}d paid</div>}
            {r.proRataDetails?.isLeaver && <div style={{ fontSize: 11, color: 'var(--hrms-warning)' }}>Left {dayjs(r.proRataDetails.leaveDate).format('DD-MMM')} • {r.proRataDetails.daysWorked}d paid</div>}
            {hasComplianceIssues && <Tooltip title={r.complianceFlags?.filter((f) => f.status === 'fail').map((f) => `${f.check}: ${f.notes || 'gap ' + f.gap}`).join('\n')}><Tag color="error" style={{ fontSize: 10, marginTop: 2 }}><WarningOutlined /> Compliance</Tag></Tooltip>}
            {complianceWarnings.length > 0 && <Tooltip title={complianceWarnings.map((f) => `${f.check}: ${f.notes || 'gap ' + f.gap}`).join('\n')}><Tag color="warning" style={{ fontSize: 10, marginTop: 2 }}><InfoCircleOutlined /> Warning</Tag></Tooltip>}
          </div>
        );
      },
    },
    { title: 'Present', dataIndex: 'presentDays', key: 'presentDays', width: 68, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.presentDays ?? v} onChange={(val) => handleBatchChange(r.id, 'presentDays', val ?? v)} /> : v },
    { title: 'Absent', dataIndex: 'absentDays', key: 'absentDays', width: 60, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.absentDays ?? v} onChange={(val) => handleBatchChange(r.id, 'absentDays', val ?? v)} /> : v },
    { title: 'Half', dataIndex: 'halfDays', key: 'halfDays', width: 50, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.halfDays ?? v} onChange={(val) => handleBatchChange(r.id, 'halfDays', val ?? v)} /> : v },
    { title: 'Paid Lv', dataIndex: 'paidLeaveDays', key: 'paidLeaveDays', width: 60, render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: 'Unpd Lv', dataIndex: 'unpaidLeaveDays', key: 'unpaidLeaveDays', width: 60, render: (v: number) => <Tag color="red">{v}</Tag> },
    { title: 'PF', key: 'pf', width: 70, render: (_: unknown, r: PayrollItem) => { const v = getStatutoryDeduction(r, 'pf'); return v > 0 ? formatCurrency(v) : '-'; } },
    { title: 'ESI', key: 'esi', width: 70, render: (_: unknown, r: PayrollItem) => { const v = getStatutoryDeduction(r, 'esi'); return v > 0 ? formatCurrency(v) : '-'; } },
    { title: 'PT', key: 'pt', width: 60, render: (_: unknown, r: PayrollItem) => { const v = getStatutoryDeduction(r, 'pt'); return v > 0 ? formatCurrency(v) : '-'; } },
    { title: 'OT Hrs', dataIndex: 'overtimeHours', key: 'overtimeHours', width: 60 },
    { title: 'Basic', dataIndex: 'basicEarnings', key: 'basicEarnings', width: 100, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 90 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.basicEarnings ?? v} onChange={(val) => handleBatchChange(r.id, 'basicEarnings', val ?? v)} /> : formatCurrency(v) },
    { title: 'Allow', dataIndex: 'allowancesTotal', key: 'allowancesTotal', width: 80, render: (v: number) => formatCurrency(v) },
    { title: 'OT Pay', dataIndex: 'overtimeAmount', key: 'overtimeAmount', width: 80, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 80 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.overtimeAmount ?? v} onChange={(val) => handleBatchChange(r.id, 'overtimeAmount', val ?? v)} /> : formatCurrency(v) },
    { title: 'Dedn', dataIndex: 'totalDeductions', key: 'totalDeductions', width: 80, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 80 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.totalDeductions ?? v} onChange={(val) => handleBatchChange(r.id, 'totalDeductions', val ?? v)} /> : formatCurrency(v) },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', width: 110, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 100, fontWeight: 600 }} prefix={getCurrencySymbol()} value={batchChanges[r.id]?.netPay ?? v} onChange={(val) => handleBatchChange(r.id, 'netPay', val ?? v)} /> : <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>{formatCurrency(v)}</span> },
    {
      title: 'Arrears', key: 'arrears', width: 100,
      render: (_: unknown, r: PayrollItem) => {
        if (!r.arrears || r.arrears.length === 0) return <span style={{ color: 'var(--hrms-border)' }}>—</span>;
        const totalArrear = r.arrears.reduce((sum, a) => sum + a.effectiveArrearAmount, 0);
        if (totalArrear === 0) return <span style={{ color: 'var(--hrms-border)' }}>—</span>;
        const tooltipContent = r.arrears.map((a) => `${a.component.name}: ${a.isPositive ? '+' : ''}${formatCurrency(a.effectiveArrearAmount)} (${a.applicableArrearDays}d)`).join('\n');
        return (
          <Tooltip title={<pre style={{ margin: 0, fontSize: 12 }}>{tooltipContent}</pre>}>
            <span style={{ color: totalArrear > 0 ? 'var(--hrms-success)' : 'var(--hrms-danger)', cursor: 'pointer' }}>
              {totalArrear > 0 ? '+' : ''}{formatCurrency(totalArrear)}
            </span>
          </Tooltip>
        );
      },
    },
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
      <PageContainer>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>Back to Payroll</Button>
        <Card style={{ marginTop: 20, textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 16, color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>Payroll run not found</div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)' }}>The payroll run may have been deleted or you don't have access.</div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>Back to Payroll</Button>
        <Space>
          {canProcessPayroll && run?.status === 'draft' && (
            <>
              <Button type="primary" icon={<SendOutlined />} onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>Submit</Button>
              <Button icon={<ExperimentOutlined />} onClick={() => setBatchEditMode(!batchEditMode)}>{batchEditMode ? 'Exit Batch' : 'Batch Edit'}</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportItems}>Export</Button>
            </>
          )}
          {canProcessPayroll && run?.status === 'submitted' && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>Approve</Button>
              <Button danger icon={<StopOutlined />} onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending}>Reject</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportItems}>Export</Button>
            </>
          )}
          {canProcessPayroll && run?.status === 'approved' && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => finalizeMutation.mutate(undefined)} loading={finalizeMutation.isPending}>Finalize</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportItems}>Export</Button>
            </>
          )}
          {canProcessPayroll && run?.status === 'finalized' && (
            <>
              <Tooltip title={run?.unfinalizeLocked ? `Unfinalize window of ${run.unfinalizeWindowDays} days has expired (finalized on ${dayjs(run.finalizedAt).format('DD-MMM-YYYY')})` : 'Revert payroll to draft for edits'}>
                <Button icon={<UndoOutlined />} disabled={run?.unfinalizeLocked} onClick={() => setIsUnfinalizeModalOpen(true)} loading={unfinalizeMutation.isPending}>Unfinalize</Button>
              </Tooltip>
              <Button icon={<DownloadOutlined />} onClick={handleExportItems}>Export</Button>
            </>
          )}
        </Space>
      </div>

      {batchEditMode && canEdit && (
        <Card size="small" style={{ marginBottom: 16, background: 'var(--hrms-warning-light)', borderColor: 'var(--hrms-warning)' }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Batch Edit Mode — Click into any editable cell to change values</span>
            {totalBatchChanges > 0 && <Tag color="blue">{totalBatchChanges} change{totalBatchChanges !== 1 ? 's' : ''} pending</Tag>}
            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={() => setIsBatchConfirmOpen(true)} loading={batchMutation.isPending} disabled={totalBatchChanges === 0}>Save All Changes</Button>
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
              <>
                <Input.Search
                  placeholder="Search by employee name or code"
                  allowClear
                  value={employeeSearch}
                  onChange={(e) => { setEmployeeSearch(e.target.value); setItemsPage(1); }}
                  style={{ marginBottom: 12, maxWidth: 300 }}
                />
                <DataTable
                  columns={detailColumns}
                  dataSource={filteredItems}
                  rowKey="id"
                  loading={isLoading}
                  page={itemsPage}
                  pageSize={itemsPageSize}
                  total={filteredItems.length}
                  onPaginationChange={(page, pageSize) => { setItemsPage(page); setItemsPageSize(pageSize); }}
                  pageSizeOptions={['10', '25', '50', '100']}
                  noCard
                  scroll={{ x: 1400 }}
                />
              </>
            ),
          },
          {
            key: 'revisions',
            label: <span><HistoryOutlined /> Revision History</span>,
            children: run?.revisions && run.revisions.length > 0 ? (
              <Timeline items={run.revisions.map((rev: PayrollRevision) => ({
                children: <div><strong>{rev.userName}</strong> — {rev.action} <span style={{ color: 'var(--hrms-text-muted)', fontSize: 12 }}>{dayjs(rev.timestamp).format('DD-MMM-YYYY HH:mm')}</span></div>,
              }))} />
            ) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--hrms-text-muted)' }}>No revisions yet</div>,
          },
          {
            key: 'approval',
            label: <span><CheckCircleOutlined /> Approval History</span>,
            children: run?.approvalHistory && run.approvalHistory.length > 0 ? (
              <Timeline items={run.approvalHistory.map((entry: ApprovalHistoryEntry) => ({
                color: entry.action === 'approved' ? 'green' : entry.action === 'rejected' ? 'red' : entry.action === 'finalized' ? 'blue' : 'gray',
                children: (
                  <div>
                    <strong>{entry.userName}</strong> <Tag color={entry.action === 'approved' ? 'green' : entry.action === 'rejected' ? 'red' : entry.action === 'finalized' ? 'blue' : 'default'}>{entry.action}</Tag>
                    <span style={{ color: 'var(--hrms-text-muted)', fontSize: 12 }}>as {entry.role}</span>
                    <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>{dayjs(entry.timestamp).format('DD-MMM-YYYY HH:mm')}{entry.ipAddress ? ` • IP: ${entry.ipAddress}` : ''}</div>
                    {entry.comments && <div style={{ marginTop: 4, padding: '4px 8px', background: 'var(--hrms-bg)', borderRadius: 4, fontSize: 13 }}>{entry.comments}</div>}
                  </div>
                ),
              }))} />
            ) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--hrms-text-muted)' }}>No approval history yet</div>,
          },
          {
            key: 'tax',
            label: 'Tax Breakdown',
            children: (() => {
              const itemsWithTax = (run?.items || []).filter((item: PayrollItem) => item.taxComputation);
              if (itemsWithTax.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--hrms-text-muted)' }}>No tax data available</div>;
              return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Employee</th>
                        <th style={{ padding: '8px 12px' }}>Regime</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Annual Gross</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Exemptions</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Taxable Income</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Surcharge</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cess</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rebate 87A</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monthly TDS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsWithTax.map((item: PayrollItem) => {
                        const t = item.taxComputation!;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px 12px' }}>{item.employee.name}<br/><span style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{item.employee.code}</span></td>
                            <td style={{ padding: '8px 12px' }}><Tag>{t.taxRegime}</Tag></td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(t.projectedAnnualGross)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(t.projectedAnnualDeductions)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(t.projectedTaxableIncome)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(t.annualTaxAmount)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(t.surcharge)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(t.educationCess)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{t.rebate87a > 0 ? formatCurrency(t.rebate87a) : '-'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(t.monthlyTds)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })(),
          },
          {
            key: 'mom',
            label: 'Month-over-Month',
            children: (() => {
              const itemsWithComparison = (run?.items || []).filter((item: PayrollItem) => item.previousMonthComparison);
              if (itemsWithComparison.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--hrms-text-muted)' }}>No previous month data available for comparison</div>;
              const prevMonthLabel = itemsWithComparison[0]?.previousMonthComparison?.previousMonth || '';
              const totalCurrentNet = itemsWithComparison.reduce((s: number, i: PayrollItem) => s + i.netPay, 0);
              const totalPrevNet = itemsWithComparison.reduce((s: number, i: PayrollItem) => s + (i.previousMonthComparison?.previousNetPay || 0), 0);
              const totalVariance = totalCurrentNet - totalPrevNet;
              const totalVariancePct = totalPrevNet !== 0 ? Math.round((totalVariance / totalPrevNet) * 100 * 100) / 100 : 0;
              return (
                <>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}><Card size="small"><Statistic title={`Net Pay (${dayjs(run?.month + '-01').format('MMM YYYY')})`} value={totalCurrentNet} prefix={getCurrencySymbol()} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title={`Net Pay (${prevMonthLabel})`} value={totalPrevNet} prefix={getCurrencySymbol()} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title="Variance" value={totalVariance} prefix={getCurrencySymbol()} suffix={totalVariancePct !== 0 ? `${totalVariancePct > 0 ? '+' : ''}${totalVariancePct}%` : ''} valueStyle={{ color: totalVariance > 0 ? 'var(--hrms-success)' : totalVariance < 0 ? 'var(--hrms-danger)' : undefined }} /></Card></Col>
                  </Row>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Employee</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Current Gross</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Prev Gross</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Gross Δ</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Current Net</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Prev Net</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Net Δ</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Net Δ%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsWithComparison.map((item: PayrollItem) => {
                          const c = item.previousMonthComparison!;
                          const grossDelta = c.grossPayVariance;
                          const netDelta = c.netPayVariance;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '8px 12px' }}>{item.employee.name}<br/><span style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{item.employee.code}</span></td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.grossEarnings)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(c.previousGrossPay)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: grossDelta > 0 ? 'var(--hrms-success)' : grossDelta < 0 ? 'var(--hrms-danger)' : undefined }}>{grossDelta !== 0 ? `${grossDelta > 0 ? '+' : ''}${formatCurrency(grossDelta)}` : '—'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.netPay)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(c.previousNetPay)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: netDelta > 0 ? 'var(--hrms-success)' : netDelta < 0 ? 'var(--hrms-danger)' : undefined, fontWeight: 600 }}>{netDelta !== 0 ? `${netDelta > 0 ? '+' : ''}${formatCurrency(netDelta)}` : '—'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: c.variancePercent > 0 ? 'var(--hrms-success)' : c.variancePercent < 0 ? 'var(--hrms-danger)' : undefined }}>{c.variancePercent !== 0 ? `${c.variancePercent > 0 ? '+' : ''}${c.variancePercent}%` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })(),
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

      <Modal
        title="Confirm Batch Update"
        open={isBatchConfirmOpen}
        onOk={() => { setIsBatchConfirmOpen(false); handleBatchSave(); }}
        onCancel={() => setIsBatchConfirmOpen(false)}
        confirmLoading={batchMutation.isPending}
        okText={`Save ${totalBatchChanges} Change${totalBatchChanges !== 1 ? 's' : ''}`}
      >
        <p>You are about to update <strong>{totalBatchChanges}</strong> field{totalBatchChanges !== 1 ? 's' : ''} across <strong>{Object.keys(batchChanges).filter((k) => Object.keys(batchChanges[k]).length > 0).length}</strong> employee(s).</p>
        <p style={{ color: 'var(--hrms-text-muted)', fontSize: 13 }}>This action will recalculate gross earnings and net pay for affected items.</p>
      </Modal>
    </PageContainer>
  );
}
