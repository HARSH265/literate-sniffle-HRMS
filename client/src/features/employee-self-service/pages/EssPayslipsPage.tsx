import { Card, Table, Tag, Button, Space, Spin, Empty } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useEssPayslips } from '../hooks/useEssPayslips';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssPayslipsPage() {
  const { data, isLoading } = useEssPayslips();
  const payslips = data?.data || [];

  const columns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 130,
      render: (_: any, record: any) => {
        const month = record.month || record.payrollRun?.month || '';
        const year = record.year || record.payrollRun?.year || '';
        return <span style={{ fontSize: 13 }}>{`${month} ${year}`}</span>;
      },
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      width: 110,
      render: (amount: number) => amount ? <span style={{ fontWeight: 600 }}>₹{amount.toLocaleString()}</span> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = { generated: 'green', draft: 'default', submitted: 'blue', finalized: 'green' };
        const s = status || 'draft';
        return <Tag color={colors[s] || 'default'} style={{ fontSize: 11 }}>{s?.toUpperCase()}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, _record: any) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} size="small" style={{ padding: 0 }} />
          <Button type="link" icon={<DownloadOutlined />} size="small" style={{ padding: 0 }} />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ fontSize: 15 }}>My Payslips</span>}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
      style={cardStyle}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : payslips.length === 0 ? (
        <Empty description="No payslips available yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={payslips}
            columns={columns}
            rowKey={(r: any) => r._id || r.id}
            size="small"
            scroll={{ x: 'max-content' }}
            bordered
          />
        </div>
      )}
    </Card>
  );
}