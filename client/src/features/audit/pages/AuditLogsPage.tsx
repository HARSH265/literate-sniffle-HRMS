import { useState } from 'react';
import { Table, Select, DatePicker, Space, Tag, Typography, Card, Row, Col, Button, Modal, message, Statistic, Tooltip } from 'antd';
import { DownloadOutlined, DeleteOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const actionColors: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  finalize: 'purple',
  unfinalize: 'orange',
  login: 'cyan',
  logout: 'gold',
  'logout-all-devices': 'magenta',
  import: 'geekblue',
  export: ' volcano',
  archive: 'lime',
  'bulk-create': 'green',
  'bulk-update': 'blue',
  'mark-read': 'cyan',
  'mark-all-read': 'cyan',
  'upload-logo': 'purple',
  'test-email': 'orange',
  'change-password': 'blue',
  'reset-password': 'orange',
  'update-settings': 'geekblue',
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<{ module?: string; action?: string; startDate?: string; endDate?: string }>({});
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(90);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, limit, filters],
    queryFn: () => auditService.list({ page, limit, ...filters }),
  });

  const { data: modules } = useQuery({
    queryKey: ['audit-modules'],
    queryFn: auditService.getModules,
    staleTime: 10 * 60 * 1000,
  });

  const { data: actions } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: auditService.getActions,
    staleTime: 10 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: auditService.getStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: retention } = useQuery({
    queryKey: ['audit-retention'],
    queryFn: auditService.getRetentionInfo,
    staleTime: 1 * 60 * 1000,
  });

  const handleExport = async () => {
    const result = await queryClient.fetchQuery({
      queryKey: ['audit-export', filters],
      queryFn: () => auditService.exportLogs(filters),
    });

    if (result.data?.length) {
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
      XLSX.writeFile(wb, `audit-logs-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success(`Exported ${result.data.length} logs`);
    } else {
      message.warning('No logs to export');
    }
  };

  const handleCleanup = async () => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['audit-cleanup'],
        queryFn: () => auditService.cleanupLogs(cleanupDays),
      });
      message.success(`Deleted ${result.data.deletedCount} old logs`);
      setCleanupModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['audit-retention'] });
    } catch {
      message.error('Failed to cleanup logs');
    }
  };

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YY, HH:mm:ss')}</Text>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'actionLabel',
      key: 'actionLabel',
      width: 110,
      render: (label: string, record: any) => (
        <Tag color={actionColors[record.action] || 'default'} style={{ fontSize: 11, padding: '0 6px' }}>
          {label}
        </Tag>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'moduleLabel',
      key: 'moduleLabel',
      width: 140,
      render: (label: string) => <Text strong style={{ fontSize: 12 }}>{label}</Text>,
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      width: 160,
      render: (user: { name: string; email: string }) => (
        <div>
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{user?.name || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Target',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 140,
      render: (name: string, record: any) => name ? (
        <Tooltip title={`ID: ${record.targetId}`}>
          <Text style={{ fontSize: 12 }}>{name}</Text>
        </Tooltip>
      ) : <Text type="secondary" style={{ fontSize: 12 }}>-</Text>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => ip ? (
        <Tag style={{ fontSize: 10, padding: '0 4px' }}>{ip}</Tag>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details: Record<string, unknown>) => details ? (
        <Tooltip title={<pre style={{ margin: 0, fontSize: 10 }}>{JSON.stringify(details, null, 2)}</pre>}>
          <Text style={{ fontSize: 11, cursor: 'pointer', color: 'var(--hrms-text-secondary)' }}>
            {JSON.stringify(details).slice(0, 50)}...
          </Text>
        </Tooltip>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
  ];

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0]?.format('YYYY-MM-DD'),
        endDate: dates[1]?.format('YYYY-MM-DD'),
      }));
    } else {
      setFilters((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
    }
    setPage(1);
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activities and changes"
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button icon={<DeleteOutlined />} danger onClick={() => setCleanupModalOpen(true)}>
              Cleanup
            </Button>
          </Space>
        }
      />

      {stats?.data && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic title="Total Logs" value={stats.data.total || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic title="Last 24h" value={stats.data.last24h || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic title="Last 7 Days" value={stats.data.last7d || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="Deletable Logs"
                value={retention?.data?.deletableCount || 0}
                suffix={<Tooltip title={retention?.data?.message}><InfoCircleOutlined /></Tooltip>}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            <Select
              placeholder="Module"
              allowClear
              style={{ width: 160 }}
              value={filters.module || undefined}
              onChange={(val) => handleFilterChange('module', val)}
              options={modules}
            />
            <Select
              placeholder="Action"
              allowClear
              style={{ width: 140 }}
              value={filters.action || undefined}
              onChange={(val) => handleFilterChange('action', val)}
              options={actions}
            />
            <RangePicker
              onChange={handleDateChange}
              format="YYYY-MM-DD"
              style={{ width: 260 }}
            />
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => { setFilters({}); setPage(1); }}
              style={{ color: 'var(--hrms-text-muted)' }}
            >
              Clear
            </Button>
          </div>
          <div className="hrms-table-toolbar-right">
            <Text style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>
              {data?.meta?.total ?? 0} entries
            </Text>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="_id"
          loading={isLoading}
          size="small"
          style={{ fontSize: 12 }}
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.meta?.total || 0,
            onChange: (p, l) => { setPage(p); setLimit(l || 20); },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t) => `Total ${t} logs`,
          }}
          scroll={{ x: 1100 }}
        />
      </div>

      <Modal
        title="Cleanup Old Audit Logs"
        open={cleanupModalOpen}
        onCancel={() => setCleanupModalOpen(false)}
        onOk={handleCleanup}
        okText="Delete Old Logs"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '16px 0' }}>
          {retention?.data?.deletableCount ? (
            <div style={{ background: '#fff7e6', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text>{retention.data.message}</Text>
            </div>
          ) : (
            <div style={{ background: '#f6ffed', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text>All logs are within the retention period. No cleanup needed.</Text>
            </div>
          )}
          <Text strong>Delete logs older than:</Text>
          <Select
            value={cleanupDays}
            onChange={setCleanupDays}
            style={{ width: '100%', marginTop: 8 }}
            options={[
              { label: '30 days', value: 30 },
              { label: '60 days', value: 60 },
              { label: '90 days', value: 90 },
              { label: '180 days', value: 180 },
              { label: '365 days', value: 365 },
            ]}
          />
          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Before deletion, you can export all logs as Excel for backup. The exported file will include all filtered logs with complete details.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
}