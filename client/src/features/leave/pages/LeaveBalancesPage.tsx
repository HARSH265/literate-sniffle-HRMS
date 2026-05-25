import { useState } from 'react';
import { Table, Card, Select, Row, Col, Tag, Space, Progress } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { leaveService, LeaveBalance } from '../services/leaveService';
import { employeeService } from '../../employees/services/employeeService';
import { PageHeader } from '../../../core/components/PageHeader';
import { QUERY_KEYS } from '../../../core/constants/queryKeys';

export function LeaveBalancesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: employees } = useQuery({
    queryKey: QUERY_KEYS.employees,
    queryFn: () => employeeService.list({ limit: 500, status: 'active' }),
  });

  const { data: balances, isLoading } = useQuery({
    queryKey: QUERY_KEYS.leaveBalances(selectedEmployee || 'none'),
    queryFn: () => leaveService.getBalances(selectedEmployee, year),
    enabled: !!selectedEmployee,
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

  return (
    <div>
      <PageHeader title="Leave Balances" subtitle="View employee leave balances" />

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
        <div className="hrms-table-card">
          <Table
            dataSource={balances?.data || []}
            columns={columns}
            rowKey={(r) => r.leaveType.id}
            loading={isLoading}
            pagination={false}
          />
        </div>
      ) : (
        <Card><div style={{ textAlign: 'center', padding: 40, color: 'var(--hrms-text-muted)' }}>Select an employee to view balances</div></Card>
      )}
    </div>
  );
}
