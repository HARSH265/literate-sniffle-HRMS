import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { Table, Button, Modal, Form, Input, message, Tag, Card, Row, Col, Statistic, Space, Timeline, Tabs, InputNumber, Tooltip } from 'antd';
import { CheckCircleOutlined, EditOutlined, UndoOutlined, ArrowLeftOutlined, SendOutlined, StopOutlined, HistoryOutlined, ExperimentOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { payrollService, PayrollItem } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  submitted: 'blue',
  approved: 'purple',
  finalized: 'green',
};

export function PayrollDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchChanges, setBatchChanges] = useState<Record<string, Record<string, number>>>({});
  const [editForm] = Form.useForm();

  const { data: runData, isLoading } = useQuery({
    queryKey: ['payroll-run-details', id],
    queryFn: () => payrollService.getRunDetails(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => payrollService.submitRun(id!),
    onSuccess: () => { message.success('Payroll submitted'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: () => payrollService.approveRun(id!),
    onSuccess: () => { message.success('Payroll approved'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => payrollService.rejectRun(id!),
    onSuccess: () => { message.success('Payroll rejected'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to reject'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (remarks?: string) => payrollService.finalizeRun(id!, remarks),
    onSuccess: () => { message.success('Payroll finalized'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to finalize'),
  });

  const unfinalizeMutation = useMutation({
    mutationFn: () => payrollService.unfinalizeRun(id!),
    onSuccess: () => { message.success('Payroll unfinalized'); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to unfinalize'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ runId, itemId, payload }: { runId: string; itemId: string; payload: any }) => payrollService.updatePayrollItem(runId, itemId, payload),
    onSuccess: () => { message.success('Payroll item updated'); setIsEditModalOpen(false); setEditingItem(null); editForm.resetFields(); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const batchMutation = useMutation({
    mutationFn: (items: Array<{ itemId: string; data: Record<string, unknown> }>) => payrollService.batchUpdateItems(id!, items),
    onSuccess: (res) => { message.success(`${res.data.updated} items updated`); setBatchEditMode(false); setBatchChanges({}); queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to batch update'),
  });

  const handleEditItem = (item: PayrollItem) => {
    setEditingItem(item);
    editForm.setFieldsValue({ basicEarnings: item.basicEarnings, netPay: item.netPay });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!id || !editingItem) return;
    editForm.validateFields().then((values) => {
      updateItemMutation.mutate({ runId: id, itemId: editingItem.id, payload: values });
    });
  };

  const handleBatchChange = (itemId: string, field: string, value: number) => {
    setBatchChanges(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [field]: value },
    }));
  };

  const handleBatchSave = () => {
    const items = Object.entries(batchChanges)
      .filter(([_, changes]) => Object.keys(changes).length > 0)
      .map(([itemId, data]) => ({ itemId, data }));
    if (items.length === 0) { message.warning('No changes to save'); return; }
    batchMutation.mutate(items);
  };

  const handleDownloadSlip = async (employeeId: string) => {
    try {
      if (!runData?.data) return;
      const response = await fetch(`/api/v1/salary-slips/${id}/pdf?employeeId=${employeeId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
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

  const detailColumns = [
    { title: 'Employee', key: 'employee', width: 180, render: (_: any, r: PayrollItem) => <div><div style={{ fontWeight: 500 }}>{r.employee.name}</div><div style={{ fontSize: 11, color: '#888' }}>{r.employee.code}</div></div> },
    { title: 'Present', dataIndex: 'presentDays', key: 'presentDays', width: 68, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.presentDays ?? v} onChange={(val) => handleBatchChange(r.id, 'presentDays', val ?? v)} /> : v },
    { title: 'Absent', dataIndex: 'absentDays', key: 'absentDays', width: 60, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.absentDays ?? v} onChange={(val) => handleBatchChange(r.id, 'absentDays', val ?? v)} /> : v },
    { title: 'Half', dataIndex: 'halfDays', key: 'halfDays', width: 50, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 60 }} value={batchChanges[r.id]?.halfDays ?? v} onChange={(val) => handleBatchChange(r.id, 'halfDays', val ?? v)} /> : v },
    { title: 'Paid Lv', dataIndex: 'paidLeaveDays', key: 'paidLeaveDays', width: 60, render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: 'Unpd Lv', dataIndex: 'unpaidLeaveDays', key: 'unpaidLeaveDays', width: 60, render: (v: number) => <Tag color="red">{v}</Tag> },
    { title: 'OT Hrs', dataIndex: 'overtimeHours', key: 'overtimeHours', width: 60 },
    { title: 'Basic', dataIndex: 'basicEarnings', key: 'basicEarnings', width: 100, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 90 }} prefix="₹" value={batchChanges[r.id]?.basicEarnings ?? v} onChange={(val) => handleBatchChange(r.id, 'basicEarnings', val ?? v)} /> : `₹${v.toLocaleString()}` },
    { title: 'Allow', dataIndex: 'allowancesTotal', key: 'allowancesTotal', width: 80, render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'OT Pay', dataIndex: 'overtimeAmount', key: 'overtimeAmount', width: 80, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 80 }} prefix="₹" value={batchChanges[r.id]?.overtimeAmount ?? v} onChange={(val) => handleBatchChange(r.id, 'overtimeAmount', val ?? v)} /> : `₹${v.toLocaleString()}` },
    { title: 'Dedn', dataIndex: 'totalDeductions', key: 'totalDeductions', width: 80, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 80 }} prefix="₹" value={batchChanges[r.id]?.totalDeductions ?? v} onChange={(val) => handleBatchChange(r.id, 'totalDeductions', val ?? v)} /> : `₹${v.toLocaleString()}` },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', width: 110, render: (v: number, r: PayrollItem) => batchEditMode && canEdit ? <InputNumber size="small" style={{ width: 100, fontWeight: 600 }} prefix="₹" value={batchChanges[r.id]?.netPay ?? v} onChange={(val) => handleBatchChange(r.id, 'netPay', val ?? v)} /> : <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>₹{v.toLocaleString()}</span> },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: any, r: PayrollItem) => (
        <Space size={4}>
          {canEdit && !batchEditMode && <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(r)}>Edit</Button>}
          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleDownloadSlip(r.employee.id)}>Slip</Button>
        </Space>
      ),
    },
  ];

  if (!run && !isLoading) {
    return (
      <div style={{ padding: '0 4px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>Back to Payroll</Button>
        <div style={{ marginTop: 20 }}>Payroll run not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>Back to Payroll</Button>
        <Space>
          {run?.status === 'draft' && (
            <>
              <Button type="primary" icon={<SendOutlined />} onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>Submit</Button>
              <Button icon={<ExperimentOutlined />} onClick={() => setBatchEditMode(!batchEditMode)}>{batchEditMode ? 'Exit Batch' : 'Batch Edit'}</Button>
            </>
          )}
          {run?.status === 'submitted' && (
            <>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>Approve</Button>
              <Button danger icon={<StopOutlined />} onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending}>Reject</Button>
            </>
          )}
          {run?.status === 'approved' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => finalizeMutation.mutate(undefined)} loading={finalizeMutation.isPending}>Finalize</Button>
          )}
          {run?.status === 'finalized' && (
            <Tooltip title={run?.unfinalizeLocked ? `Unfinalize window of ${run.unfinalizeWindowDays} days has expired (finalized on ${dayjs(run.finalizedAt).format('DD-MMM-YYYY')})` : 'Revert payroll to draft for edits'}>
              <Button icon={<UndoOutlined />} disabled={run?.unfinalizeLocked} onClick={() => unfinalizeMutation.mutate()} loading={unfinalizeMutation.isPending}>Unfinalize</Button>
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
        <Col span={6}><Card><Statistic title="Total Net Pay" value={run?.totalNetPay || 0} prefix="₹" /></Card></Col>
        <Col span={6}><Card><div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Status</div><Tag color={STATUS_COLORS[run?.status || 'draft']} style={{ fontSize: 13, padding: '2px 12px' }}>{run?.status}</Tag></Card></Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Tabs defaultActiveKey="items" items={[
          {
            key: 'items',
            label: 'Payroll Items',
            children: (
              <Table
                columns={detailColumns}
                dataSource={run?.items || []}
                rowKey="id"
                loading={isLoading}
                size="small"
                pagination={false}
                scroll={{ x: 1400 }}
              />
            ),
          },
          {
            key: 'revisions',
            label: <span><HistoryOutlined /> Revision History</span>,
            children: run?.revisions?.length > 0 ? (
              <Timeline items={run.revisions.map((rev: any) => ({
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
                <Input type="number" prefix="₹" />
              </Form.Item>
              <Form.Item name="netPay" label="Net Pay" rules={[{ required: true }]}>
                <Input type="number" prefix="₹" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
