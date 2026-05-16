import { useState } from 'react';
import { Table, Select, DatePicker, Space, Tag, Typography } from 'antd';
import { PageHeader } from '../../../core/components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const actionColors: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  finalize: 'purple',
  login: 'cyan',
  logout: 'orange',
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<{ module?: string; action?: string; startDate?: string; endDate?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, limit, filters],
    queryFn: () => auditService.list({ page, limit, ...filters }),
  });

  const { data: modules } = useQuery({
    queryKey: ['audit-modules'],
    queryFn: auditService.getModules,
    staleTime: 10 * 60 * 1000,
  });

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD-MM-YYYY HH:mm'),
      width: 150,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color={actionColors[action] || 'default'}>{action.toUpperCase()}</Tag>,
      width: 100,
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => <Text strong>{module}</Text>,
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (user: { name: string; email: string }) => (
        <div>
          <div>{user?.name || 'Unknown'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details: Record<string, unknown>) => (
        <span style={{ fontSize: 12 }}>
          {details ? JSON.stringify(details).slice(0, 100) : '-'}
        </span>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip: string) => ip || '-',
      width: 120,
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
    <div>
      <PageHeader title="Audit Logs" subtitle="Track all system activities and changes" />

      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Module"
            allowClear
            style={{ width: 150 }}
            value={filters.module}
            onChange={(val) => handleFilterChange('module', val)}
            options={modules?.map((m: string) => ({ label: m, value: m }))}
          />
          <Select
            placeholder="Action"
            allowClear
            style={{ width: 120 }}
            value={filters.action}
            onChange={(val) => handleFilterChange('action', val)}
            options={[
              { label: 'Create', value: 'create' },
              { label: 'Update', value: 'update' },
              { label: 'Delete', value: 'delete' },
              { label: 'Finalize', value: 'finalize' },
              { label: 'Login', value: 'login' },
              { label: 'Logout', value: 'logout' },
            ]}
          />
          <RangePicker onChange={handleDateChange} format="YYYY-MM-DD" />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="_id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.meta?.total || 0,
          onChange: (p, l) => {
            setPage(p);
            setLimit(l);
          },
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
          showTotal: (total) => `Total ${total} logs`,
        }}
        scroll={{ x: 800 }}
      />
    </div>
  );
}