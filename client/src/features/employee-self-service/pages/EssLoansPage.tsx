import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Tag, Spin, Button, Empty, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMyLoans, useEssCancelLoan } from '../hooks/useEssLoans';
import { DataTable } from '../../../core/components/DataTable';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

const statusColors: Record<string, string> = {
  applied: 'orange',
  approved: 'blue',
  active: 'green',
  rejected: 'red',
  cancelled: 'default',
  closed: 'default',
};

export function EssLoansPage() {
  const navigate = useNavigate();
  const { data: loansData, isLoading } = useMyLoans();
  const cancelMutation = useEssCancelLoan();

  const loans = loansData?.data || [];

  const totalLoanAmount = loans.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
  const activeLoans = loans.filter((l: any) => l.status === 'active' || l.status === 'approved').length;
  const pendingLoans = loans.filter((l: any) => l.status === 'applied').length;

  const columns = [
    {
      title: 'Type',
      dataIndex: 'loanType',
      key: 'loanType',
      width: 110,
      render: (lt: any) => <Tag color="blue" style={{ fontSize: 11 }}>{lt?.name || '-'}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => `₹${v?.toLocaleString()}`,
    },
    {
      title: 'EMI',
      dataIndex: 'emiAmount',
      key: 'emiAmount',
      width: 90,
      render: (v: number) => `₹${v?.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'} style={{ fontSize: 11, textTransform: 'uppercase' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      render: (_: any, record: any) =>
        ['applied', 'approved'].includes(record.status) ? (
          <Popconfirm title="Cancel this loan?" onConfirm={() => cancelMutation.mutate(record.id)}>
            <Button type="link" danger size="small" style={{ fontSize: 12 }}>
              Cancel
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <div>
      <Row gutter={[12, 12]}>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Total Loans</span>}
              value={loans.length}
              valueStyle={{ fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Active</span>}
              value={activeLoans}
              valueStyle={{ color: '#52c41a', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Pending</span>}
              value={pendingLoans}
              valueStyle={{ color: '#faad14', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={cardStyle} bodyStyle={{ padding: '16px 12px' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}>Total Amount</span>}
              value={totalLoanAmount}
              prefix="₹"
              valueStyle={{ fontSize: 18, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ fontSize: 15 }}>My Loans</span>}
        headStyle={{ borderBottom: '1px solid #f0f0f0' }}
        style={{ ...cardStyle, marginTop: 12 }}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => navigate('/ess/loans/apply')}>
            Apply
          </Button>
        }
      >
        {loans.length === 0 ? (
          <Empty description="No loan applications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <DataTable
            dataSource={loans}
            columns={columns}
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
