import { Card, Table, Tag, Spin, Empty } from 'antd';
import { LaptopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEssAssets } from '../hooks/useEssAssets';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

const statusColors: Record<string, string> = {
  available: 'blue',
  allocated: 'green',
  maintenance: 'orange',
  retired: 'red',
};

export function EssAssetsPage() {
  const { data, isLoading } = useEssAssets();
  const assets = data?.data || [];

  const columns = [
    {
      title: 'Asset Code',
      dataIndex: 'assetCode',
      key: 'assetCode',
      width: 120,
      render: (code: string) => <Tag style={{ fontSize: 11 }}>{code}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: string) => <Tag style={{ fontSize: 11 }}>{cat}</Tag>,
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'} style={{ fontSize: 11 }}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Allocated At',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <Card
      title={<span style={{ fontSize: 15 }}><LaptopOutlined style={{ marginRight: 8 }} />My Assets</span>}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
      style={cardStyle}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : assets.length === 0 ? (
        <Empty description="No assets allocated to you" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={assets}
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
