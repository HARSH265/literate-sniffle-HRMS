import { useState } from 'react';
import { Card, Select, Row, Col, Tag, Space, Progress, Button, Modal, Typography, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, LeaveBalance } from '../services/leaveService';
import { employeeService } from '../../employees/services/employeeService';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

export function LeaveBalancesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [accrueModalOpen, setAccrueModalOpen] = useState(false);
  const [accrueLeaveType, setAccrueLeaveType] = useState<string>('');
  const [accrueYear, setAccrueYear] = useState(new Date().getFullYear());
  const [accrueEmployees, setAccrueEmployees] = useState<string[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: QUERY_KEYS.employees,
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const { data: balances, isLoading } = useQuery({
    queryKey: QUERY_KEYS.leaveBalances(selectedEmployee || 'none'),
    queryFn: () => leaveService.getBalances(selectedEmployee, year),
    enabled: !!selectedEmployee,
  });

  const { data: leaveTypes } = useQuery({
    queryKey: QUERY_KEYS.leaveTypes,
    queryFn: () => leaveService.listLeaveTypes(),
  });

  const accrueableTypes = leaveTypes?.data?.filter((lt: any) => lt.accrualMethod !== 'manual') || [];
  const selectedAccrueType = leaveTypes?.data?.find((lt: any) => lt.id === accrueLeaveType);

  const accrueMutation = useMutation({
    mutationFn: () => leaveService.accrueLeave({
      leaveTypeId: accrueLeaveType,
      year: accrueYear,
      employeeIds: accrueEmployees.length > 0 ? accrueEmployees : undefined,
    }),
    onSuccess: (result) => {
      message.success(`Leave accrued for ${result.data?.totalProcessed || 0} employees`);
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
      setConfirmModalOpen(false);
      setAccrueModalOpen(false);
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to accrue leave');
    },
  });

  const columns = [
    {
      title: 'Leave Type', key: 'leaveType',
      render: (_: any, r: LeaveBalance) => (
        <Space>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: r.leaveType.color }} />
          <span style={{ fontWeight: 500 }}>{r.leaveType.name}</span>
          <Tag>{r.leaveType.isPaid ? 'Paid' : 'Unpaid'}</Tag>
        </Space>
      ),
    },
    {
      title: 'Entitled', dataIndex: 'totalEntitled', key: 'entitled',
      render: (v: number) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: 'Carry Forward', dataIndex: 'carryForward', key: 'carryForward',
      render: (v: number) => v > 0 ? <Tag color="blue">{v}</Tag> : '-',
    },
    {
      title: 'Used', dataIndex: 'totalUsed', key: 'used',
      render: (v: number) => <span style={{ color: v > 0 ? 'var(--hrms-warning)' : undefined }}>{v}</span>,
    },
    {
      title: 'Pending', dataIndex: 'totalPending', key: 'pending',
      render: (v: number) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: 'Available Balance', dataIndex: 'balance', key: 'balance',
      render: (v: number, r: LeaveBalance) => {
        const pct = r.totalEntitled > 0 ? Math.round((v / r.totalEntitled) * 100) : 0;
        return (
          <Space>
            <span style={{ fontSize: 16, fontWeight: 700, color: v > 0 ? 'var(--hrms-success)' : 'var(--hrms-danger)' }}>{v}</span>
            <Progress percent={pct} size="small" style={{ width: 80 }} strokeColor={v > 0 ? '#52c41a' : '#ff4d4f'} />
          </Space>
        );
      },
    },
  ];

  const openAccrueModal = () => {
    setAccrueLeaveType('');
    setAccrueYear(new Date().getFullYear());
    setAccrueEmployees([]);
    setAccrueModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Leave Balances"
        subtitle="View employee leave balances"
        actions={<Button type="primary" icon={<ThunderboltOutlined />} onClick={openAccrueModal}>Accrue Leave</Button>}
      />

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Select
              showSearch
              placeholder="Select employee"
              style={{ width: '100%' }}
              optionFilterProp="label"
              value={selectedEmployee || undefined}
              onChange={setSelectedEmployee}
              options={employees?.data?.map((e: any) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.id }))}
            />
          </Col>
          <Col span={4}>
            <Select value={year} onChange={setYear} style={{ width: '100%' }} options={[2024, 2025, 2026, 2027, 2028].map(y => ({ label: String(y), value: y }))} />
          </Col>
        </Row>
      </Card>

      {selectedEmployee ? (
        <DataTable
          dataSource={balances?.data || []}
          columns={columns}
          rowKey={(r) => r.leaveType.id}
          loading={isLoading}
          hidePagination
        />
      ) : (
        <Card><div style={{ textAlign: 'center', padding: 40, color: 'var(--hrms-text-muted)' }}>Select an employee to view balances</div></Card>
      )}

      <Modal
        title="Accrue Leave"
        open={accrueModalOpen}
        onCancel={() => setAccrueModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAccrueModalOpen(false)}>Cancel</Button>,
          <Button key="accrue" type="primary" icon={<ThunderboltOutlined />} onClick={() => {
            if (!accrueLeaveType) { message.warning('Select a leave type'); return; }
            setConfirmModalOpen(true);
          }}>Accrue Leave</Button>,
        ]}
        width={520}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
          <div>
            <Typography.Text strong>Leave Type</Typography.Text>
            <Select
              showSearch
              placeholder="Select leave type"
              style={{ width: '100%', marginTop: 4 }}
              value={accrueLeaveType || undefined}
              onChange={setAccrueLeaveType}
              optionFilterProp="label"
              options={accrueableTypes.map((lt: any) => ({
                label: (
                  <span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: lt.color, marginRight: 8 }} />
                    {lt.name} ({lt.code}) — {lt.maxDaysPerYear} days/yr
                  </span>
                ),
                value: lt.id,
              }))}
            />
            {selectedAccrueType && (
              <div style={{ marginTop: 4 }}>
                <Tag>{selectedAccrueType.accrualMethod === 'yearly-lump' ? 'Yearly Lump' : 'Monthly Pro-rata'}</Tag>
                {selectedAccrueType.proRataOnJoin && <Tag>Pro-rata on Join</Tag>}
              </div>
            )}
          </div>

          <div>
            <Typography.Text strong>Financial Year</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={accrueYear}
              onChange={setAccrueYear}
              options={[2024, 2025, 2026, 2027, 2028].map(y => ({ label: String(y), value: y }))}
            />
          </div>

          <div>
            <Typography.Text strong>Employees <Typography.Text type="secondary">(leave blank for all active)</Typography.Text></Typography.Text>
            <Select
              mode="multiple"
              showSearch
              placeholder="All active employees"
              style={{ width: '100%', marginTop: 4 }}
              value={accrueEmployees}
              onChange={setAccrueEmployees}
              optionFilterProp="label"
              options={employees?.data?.map((e: any) => ({
                label: `${e.fullName} (${e.employeeCode})`,
                value: e.id,
              }))}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Confirm Accrual"
        open={confirmModalOpen}
        onOk={() => accrueMutation.mutate()}
        onCancel={() => setConfirmModalOpen(false)}
        confirmLoading={accrueMutation.isPending}
        okText="Accrue"
      >
        <p>
          This will accrue <strong>{selectedAccrueType?.name}</strong> for
          {' '}{accrueEmployees.length > 0 ? `${accrueEmployees.length} selected` : 'all active'} employees
          {' '}for financial year <strong>{accrueYear}</strong>.
        </p>
        {selectedAccrueType?.accrualMethod === 'yearly-lump' && (
          <p style={{ color: 'var(--hrms-text-muted)' }}>
            Each employee will receive {selectedAccrueType.maxDaysPerYear} days (pro-rated if joined mid-year).
          </p>
        )}
        {selectedAccrueType?.accrualMethod === 'monthly-pro-rata' && (
          <p style={{ color: 'var(--hrms-text-muted)' }}>
            Employees will receive {selectedAccrueType.maxDaysPerYear} days prorated by months since joining.
          </p>
        )}
      </Modal>
    </div>
  );
}
