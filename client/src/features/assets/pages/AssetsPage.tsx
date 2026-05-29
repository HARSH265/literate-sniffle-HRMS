import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Select, Space, Row, Col, Statistic, Typography, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, LaptopOutlined, SwapRightOutlined } from '@ant-design/icons';
import { useAssets, useAssetStats } from '../hooks/useAssets';
import { AssetStatusBadge } from '../components/AssetStatusBadge';
import { BulkAllocateModal } from '../components/BulkAllocateModal';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text } = Typography;

export function AssetsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-assets');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useAssets({ page, limit: 20, status, category, search });
  const { data: stats } = useAssetStats();
  const [bulkOpen, setBulkOpen] = useState(false);

  const columns = [
    {
      title: 'Asset Code',
      dataIndex: 'assetCode',
      key: 'assetCode',
      render: (code: string, record: any) => (
        <a onClick={() => navigate(`/assets/${record._id}`)}>
          <Text strong>{code}</Text>
        </a>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <AssetStatusBadge status={status} />,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: any) =>
        assignedTo ? `${assignedTo.fullName} (${assignedTo.employeeCode})` : '-',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Management"
        subtitle="Track and manage company assets"
        actions={
          canManage && (
            <Space>
              <Button icon={<SwapRightOutlined />} onClick={() => setBulkOpen(true)}>
                Bulk Allocate
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/assets/new')}>
                Add Asset
              </Button>
            </Space>
          )
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Assets"
              value={stats?.data?.total || 0}
              prefix={<LaptopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Available"
              value={stats?.data?.byStatus?.available || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Allocated"
              value={stats?.data?.byStatus?.allocated || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Maintenance"
              value={stats?.data?.byStatus?.maintenance || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name, code, or serial..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Status"
            value={status}
            onChange={(val) => { setStatus(val); setPage(1); }}
            allowClear
            style={{ width: 150 }}
            options={[
              { label: 'Available', value: 'available' },
              { label: 'Allocated', value: 'allocated' },
              { label: 'Maintenance', value: 'maintenance' },
              { label: 'Retired', value: 'retired' },
            ]}
          />
          <Select
            placeholder="Category"
            value={category}
            onChange={(val) => { setCategory(val); setPage(1); }}
            allowClear
            style={{ width: 150 }}
            options={[
              { label: 'Laptop', value: 'Laptop' },
              { label: 'Monitor', value: 'Monitor' },
              { label: 'Keyboard', value: 'Keyboard' },
              { label: 'Mobile', value: 'Mobile' },
              { label: 'Tool', value: 'Tool' },
              { label: 'Uniform', value: 'Uniform' },
              { label: 'Vehicle', value: 'Vehicle' },
              { label: 'Other', value: 'Other' },
            ]}
          />
        </Space>

        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <BulkAllocateModal
        open={bulkOpen}
        onCancel={() => setBulkOpen(false)}
        onDone={() => { setBulkOpen(false); refetch(); }}
      />
    </div>
  );
}
