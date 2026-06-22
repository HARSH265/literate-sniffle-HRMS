import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Select, Space, Row, Col, Statistic, Typography, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { usePerformanceCycles, usePerformanceReviews } from '../hooks/usePerformance';
import { ReviewStatusBadge } from '../components/ReviewStatusBadge';
import { CreateCycleModal } from '../components/CreateCycleModal';
import { DataTable } from '../../../core/components/DataTable';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';
import { useDebounce } from '../../../core/hooks/useDebounce';

const { Text } = Typography;

export function PerformancePage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-performance');
  const [tab, setTab] = useState('cycles');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState<string | undefined>();
  const [cycleModalOpen, setCycleModalOpen] = useState(false);

  const cycleId: string | undefined = undefined;

  const { data: cyclesData, isLoading: cyclesLoading } = usePerformanceCycles({ page, limit: 20, search: debouncedSearch });
  const { data: reviewsData, isLoading: reviewsLoading } = usePerformanceReviews({ page, limit: 20, status, cycleId, search: debouncedSearch });

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
    <PageContainer>
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
            <Statistic title="Active Cycles" value={cyclesData?.data?.filter((c: any) => c.status === 'active').length || 0} valueStyle={{ color: 'var(--hrms-primary)' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Completed Reviews" value={reviewsData?.data?.filter((r: any) => r.status === 'completed').length || 0} valueStyle={{ color: 'var(--hrms-success)' }} prefix={<CheckCircleOutlined />} />
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
                <DataTable
                  columns={cycleColumns}
                  dataSource={cyclesData?.data || []}
                  rowKey="id"
                  loading={cyclesLoading}
                  total={cyclesData?.meta?.total}
                  page={page}
                  onPaginationChange={(p) => setPage(p)}
                  toolbarLeft={
                    <Input
                      placeholder="Search cycles..."
                      prefix={<SearchOutlined />}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      style={{ width: 280 }}
                      allowClear
                    />
                  }
                />
              </>
            ),
          },
          {
            key: 'reviews',
            label: 'Reviews',
            children: (
              <>
                <DataTable
                  columns={reviewColumns}
                  dataSource={reviewsData?.data || []}
                  rowKey="id"
                  loading={reviewsLoading}
                  total={reviewsData?.meta?.total}
                  page={page}
                  onPaginationChange={(p) => setPage(p)}
                  onRowClick={(record) => navigate(`/performance/reviews/${record._id}`)}
                  toolbarLeft={
                    <>
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
                    </>
                  }
                />
              </>
            ),
          },
        ]} />
      </Card>

      <CreateCycleModal open={cycleModalOpen} onClose={() => setCycleModalOpen(false)} />
    </PageContainer>
  );
}
