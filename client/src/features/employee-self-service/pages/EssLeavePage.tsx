import { Card, Row, Col, Statistic, Tag, Spin, Button, Progress } from 'antd';
import { EmptyState } from '../../../core/components/EmptyState';
import { useLeaveBalances, useLeaveApplications } from '../hooks/useEssLeave';
import { DataTable } from '../../../core/components/DataTable';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssLeavePage() {
  const { data: balancesData, isLoading: balancesLoading } = useLeaveBalances();
  const { data: applicationsData, isLoading: applicationsLoading } = useLeaveApplications();

  const balances = balancesData?.data || [];
  const applications = applicationsData?.data || [];

  const totalBalance = balances.reduce((sum: number, b: any) => sum + (b.remaining || 0), 0);
  const pendingCount = applications.filter((a: any) => a.status === 'pending').length;
  const approvedThisMonth = applications.filter(
    (a: any) => a.status === 'approved',
  ).length;

  const leaveColumns = [
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 120,
      render: (name: string) => <Tag color="blue" style={{ fontSize: 11 }}>{name}</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 60,
      align: 'center' as const,
    },
    {
      title: 'Availed',
      dataIndex: 'availed',
      key: 'availed',
      width: 70,
      align: 'center' as const,
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      width: 120,
      render: (remaining: number, record: any) => (
        <Progress
          percent={record.total > 0 ? Math.round((remaining / record.total) * 100) : 0}
          size="small"
          format={() => `${remaining}`}
          strokeColor={remaining > 0 ? 'var(--hrms-success)' : 'var(--hrms-danger)'}
          style={{ minWidth: 80 }}
        />
      ),
    },
  ];

  const applicationColumns = [
    { title: 'Type', dataIndex: 'leaveType', key: 'leaveType', width: 100 },
    { title: 'From', dataIndex: 'fromDate', key: 'fromDate', width: 110 },
    { title: 'To', dataIndex: 'toDate', key: 'toDate', width: 110 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'green', rejected: 'red' };
        return <Tag color={colors[status] || 'default'} style={{ fontSize: 11 }}>{status?.toUpperCase()}</Tag>;
      },
    },
  ];

  if (balancesLoading && applicationsLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div>
      <Row gutter={[12, 12]}>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Total Balance</span>}
              value={totalBalance}
              suffix="days"
              valueStyle={{ fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Pending</span>}
              value={pendingCount}
              valueStyle={{ color: 'var(--hrms-warning)', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Approved</span>}
              value={approvedThisMonth}
              valueStyle={{ color: 'var(--hrms-success)', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Leave Types</span>}
              value={balances.length}
              valueStyle={{ fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ fontSize: 15 }}>Leave Balances</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={{ ...cardStyle, marginTop: 12 }}
      >
        {balances.length === 0 ? (
          <EmptyState description="No leave balances found" />
        ) : (
          <DataTable
            dataSource={balances}
            columns={leaveColumns}
            rowKey="id"
            hidePagination
            noCard
            disableRowClick
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <Card
        title={<span style={{ fontSize: 15 }}>Recent Applications</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={{ ...cardStyle, marginTop: 12 }}
        extra={<Button type="primary" size="small">Apply Leave</Button>}
      >
        {applications.length === 0 ? (
          <EmptyState description="No leave applications" />
        ) : (
          <DataTable
            dataSource={applications}
            columns={applicationColumns}
            rowKey="id"
            hidePagination
            noCard
            disableRowClick
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </div>
  );
}