import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { Table, Button, Modal, Form, Input, message, Tag, Card, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, EditOutlined, UndoOutlined, DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { payrollService, PayrollItem } from '../services/payrollService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  finalized: 'green',
};

export function PayrollDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const { data: runData, isLoading } = useQuery({
    queryKey: ['payroll-run-details', id],
    queryFn: () => payrollService.getRunDetails(id!),
    enabled: !!id,
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) => payrollService.finalizeRun(id, remarks),
    onSuccess: () => {
      message.success('Payroll finalized successfully');
      queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to finalize'),
  });

  const unfinalizeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => payrollService.unfinalizeRun(id, reason),
    onSuccess: () => {
      message.success('Payroll unfinalized successfully');
      queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to unfinalize'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ runId, itemId, payload }: { runId: string; itemId: string; payload: any }) => 
      payrollService.updatePayrollItem(runId, itemId, payload),
    onSuccess: () => {
      message.success('Payroll item updated');
      setIsEditModalOpen(false);
      setEditingItem(null);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payroll-run-details', id] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to update'),
  });

  const handleFinalize = () => {
    Modal.confirm({
      title: 'Finalize Payroll',
      content: 'Are you sure you want to finalize this payroll? This action cannot be undone.',
      okText: 'Finalize',
      onOk: () => finalizeMutation.mutate({ id: id!, remarks: 'Finalized via UI' }),
    });
  };

  const handleUnfinalize = () => {
    Modal.confirm({
      title: 'Unfinalize Payroll',
      content: 'Are you sure you want to unfinalize this payroll? This will allow editing again.',
      okText: 'Unfinalize',
      onOk: () => unfinalizeMutation.mutate({ id: id!, reason: 'Manual unfinalize via UI' }),
    });
  };

  const handleEditItem = (item: PayrollItem) => {
    setEditingItem(item);
    editForm.setFieldsValue({
      basicEarnings: item.basicEarnings,
      netPay: item.netPay,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!id || !editingItem) return;
    editForm.validateFields().then((values) => {
      updateItemMutation.mutate({
        runId: id,
        itemId: editingItem.id,
        payload: values,
      });
    });
  };

  const handleDownloadSlip = async (employeeId: string) => {
    try {
      if (!runData?.data) return;
      const response = await fetch(`/api/v1/salary-slips/${id}/pdf?employeeId=${employeeId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary_slip_${runData.data.month}_${employeeId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Salary slip downloaded');
    } catch (err) {
      message.error('Failed to download salary slip');
    }
  };

  const run = runData?.data;
  const detailColumns = [
    { title: 'Employee', key: 'employee', width: 180, render: (_: any, r: PayrollItem) => 
      <div><div style={{ fontWeight: 500 }}>{r.employee.name}</div><div style={{ fontSize: 11, color: '#888' }}>{r.employee.code}</div></div> 
    },
    { title: 'Present', dataIndex: 'presentDays', key: 'presentDays', width: 70 },
    { title: 'Absent', dataIndex: 'absentDays', key: 'absentDays', width: 70 },
    { title: 'Half Day', dataIndex: 'halfDays', key: 'halfDays', width: 70 },
    { title: 'WO', dataIndex: 'weeklyOffs', key: 'weeklyOffs', width: 50 },
    { title: 'Hol', dataIndex: 'holidays', key: 'holidays', width: 50 },
    { title: 'OT Hrs', dataIndex: 'overtimeHours', key: 'overtimeHours', width: 60 },
    { title: 'Basic', dataIndex: 'basicEarnings', key: 'basicEarnings', width: 90, render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Allow', dataIndex: 'allowancesTotal', key: 'allowancesTotal', width: 80, render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'OT Pay', dataIndex: 'overtimeAmount', key: 'overtimeAmount', width: 80, render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Dedn', dataIndex: 'totalDeductions', key: 'totalDeductions', width: 80, render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', width: 110, render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>₹{v.toLocaleString()}</span> },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_: any, r: PayrollItem) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {run?.status === 'draft' && (
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditItem(r)}>Edit</Button>
          )}
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadSlip(r.employee.id)}>Slip</Button>
        </div>
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll')}>
          Back to Payroll
        </Button>
        {run?.status === 'draft' ? (
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleFinalize} loading={finalizeMutation.isPending}>
            Finalize
          </Button>
        ) : (
          <Button icon={<UndoOutlined />} onClick={handleUnfinalize} loading={unfinalizeMutation.isPending}>
            Unfinalize
          </Button>
        )}
      </div>

      <PageHeader 
        title={`Payroll - ${run ? dayjs(run.month + '-01').format('MMMM YYYY') : ''}`}
        subtitle={run?.status === 'finalized' ? 'Finalized' : 'Draft'}
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="Employees" value={run?.totalEmployees || 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Total Net Pay" value={run?.totalNetPay || 0} prefix="₹" /></Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>Status</div>
            <Tag color={STATUS_COLORS[run?.status || 'draft']}>{run?.status}</Tag>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={detailColumns}
          dataSource={run?.items || []}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Edit Payroll Item"
        open={isEditModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => { setIsEditModalOpen(false); setEditingItem(null); editForm.resetFields(); }}
        confirmLoading={updateItemMutation.isPending}
        okText="Save Changes"
      >
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