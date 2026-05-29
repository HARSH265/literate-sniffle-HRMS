import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Select, Space, Row, Col, Statistic, Typography, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { usePerformanceCycles, usePerformanceReviews } from '../hooks/usePerformance';
import { ReviewStatusBadge } from '../components/ReviewStatusBadge';
import { CreateCycleModal } from '../components/CreateCycleModal';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text } = Typography;

export function PerformancePage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-performance');
  const [tab, setTab] = useState('cycles');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [cycleModalOpen, setCycleModalOpen] = useState(false);

  const cycleId: string | undefined = undefined;

  const { data: cyclesData, isLoading: cyclesLoading } = usePerformanceCycles({ page, limit: 20, search });
  const { data: reviewsData, isLoading: reviewsLoading } = usePerformanceReviews({ page, limit: 20, status, cycleId, search });

  const cycleColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <a onClick={() => navigate(`/performance/reviews?cycleId=${record._id}`)}>
          <Text strong>{title}</Text>
        </a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = { upcoming: 'default', active: 'processing', completed: 'success', cancelled: 'error' };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: any, record: any) =>
        `${new Date(record.startDate).toLocaleDateString('en-IN')} - ${new Date(record.endDate).toLocaleDateString('en-IN')}`,
    },
    {
      title: 'Participants',
      dataIndex: 'participants',
      key: 'participants',
      render: (p: any[]) => p?.length || 0,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString('en-IN'),
    },
  ];

  const reviewColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: any) =>
        record.employee ? `${record.employee.fullName} (${record.employee.employeeCode})` : '-',
    },
    {
      title: 'Cycle',
      key: 'cycle',
      render: (_: any, record: any) => record.cycle?.title || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <ReviewStatusBadge status={s} />,
    },
    {
      title: 'Self Rating',
      dataIndex: 'selfRating',
      key: 'selfRating',
      render: (r: number | undefined) => (r != null ? `${r}/5` : '-'),
    },
    {
      title: 'Manager Rating',
      dataIndex: 'managerRating',
      key: 'managerRating',
      render: (r: number | undefined) => (r != null ? `${r}/5` : '-'),
    },
    {
      title: 'Final Rating',
      dataIndex: 'finalRating',
      key: 'finalRating',
      render: (r: number | undefined) => (r != null ? <Text strong>{r.toFixed(1)}/5</Text> : '-'),
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (d: string) => (d ? new Date(d).toLocaleDateString('en-IN') : '-'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Performance Management"
        subtitle="Manage performance cycles, reviews, and appraisals"
        actions={
          canManage && (
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCycleModalOpen(true)}>
                New Cycle
              </Button>
            </Space>
          )
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Cycles" value={cyclesData?.meta?.total || 0} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Active Cycles" value={cyclesData?.data?.filter((c: any) => c.status === 'active').length || 0} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Completed Reviews" value={reviewsData?.data?.filter((r: any) => r.status === 'completed').length || 0} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Tabs activeKey={tab} onChange={(k) => { setTab(k); setPage(1); }} items={[
          {
            key: 'cycles',
            label: 'Performance Cycles',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="Search cycles..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ width: 280 }}
                    allowClear
                  />
                </Space>
                <Table
                  dataSource={cyclesData?.data || []}
                  columns={cycleColumns}
                  rowKey="_id"
                  loading={cyclesLoading}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: cyclesData?.meta?.total || 0,
                    onChange: setPage,
                    showSizeChanger: false,
                  }}
                />
              </>
            ),
          },
          {
            key: 'reviews',
            label: 'Reviews',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="Search employee..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ width: 250 }}
                    allowClear
                  />
                  <Select
                    placeholder="Status"
                    value={status}
                    onChange={(val) => { setStatus(val); setPage(1); }}
                    allowClear
                    style={{ width: 150 }}
                    options={[
                      { label: 'Draft', value: 'draft' },
                      { label: 'Self Review', value: 'self-review' },
                      { label: 'Manager Review', value: 'manager-review' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Appealed', value: 'appealed' },
                    ]}
                  />
                </Space>
                <Table
                  dataSource={reviewsData?.data || []}
                  columns={reviewColumns}
                  rowKey="_id"
                  loading={reviewsLoading}
                  onRow={(record) => ({
                    onClick: () => navigate(`/performance/reviews/${record._id}`),
                    style: { cursor: 'pointer' },
                  })}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: reviewsData?.meta?.total || 0,
                    onChange: setPage,
                    showSizeChanger: false,
                  }}
                />
              </>
            ),
          },
        ]} />
      </Card>

      <CreateCycleModal open={cycleModalOpen} onClose={() => setCycleModalOpen(false)} />
    </div>
  );
}
