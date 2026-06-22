import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Row, Col, Tag, Typography, Statistic, Spin } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { userService } from '../services/userService';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as XLSX from 'xlsx';

dayjs.extend(relativeTime);

const { Text } = Typography;

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
  export: 'volcano',
  deactivate: 'red',
  activate: 'green',
};

const moduleIcons: Record<string, string> = {
  employees: 'Employees',
  payroll: 'Payroll',
  attendance: 'Attendance',
  reports: 'Reports',
  settings: 'Settings',
  auth: 'Auth',
  users: 'Users',
  shifts: 'Shifts',
  designations: 'Designations',
  departments: 'Departments',
  holidays: 'Holidays',
  notifications: 'Notifications',
};

export function UserActivityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['user-activity', id, page, limit],
    queryFn: () => userService.getUserActivity(id!, page, limit),
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ['user-stats', id],
    queryFn: () => userService.getUserStats(id!),
    enabled: !!id,
  });

  if (userLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!userData?.data) {
    return null;
  }

  const user = userData.data;

  const handleExportActivity = () => {
    if (!activityData?.data) return;
    const ws = XLSX.utils.json_to_sheet(activityData.data.map((log: any) => ({
      'Date & Time': new Date(log.createdAt).toLocaleString(),
      'Action': log.action,
      'Module': log.module,
      'Target': log.targetName || log.targetId || '-',
      'Details': log.details ? JSON.stringify(log.details) : '-',
      'IP Address': log.ipAddress || '-',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Activity');
    XLSX.writeFile(wb, `user-activity-${user.name.replace(' ', '-')}-${dayjs().format('YYYY-MM-DD')}.xlsx`);
  };

  const activityColumns = [
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <div>
          <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YY, HH:mm')}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(date).fromNow()}</Text>
        </div>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color={actionColors[action] || 'default'} style={{ fontSize: 10, padding: '0 6px' }}>
          {action}
        </Tag>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 130,
      render: (mod: string) => <Text style={{ fontSize: 12 }}>{moduleIcons[mod] || mod}</Text>,
    },
    {
      title: 'Target',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 140,
      render: (name: string, record: any) => name ? (
        <Text style={{ fontSize: 12 }}>{name}</Text>
      ) : (
        <Text type="secondary" style={{ fontSize: 11 }}>{record.targetId?.slice(-8) || '-'}</Text>
      ),
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
        <Text style={{ fontSize: 11, color: 'var(--hrms-text-secondary)' }}>
          {JSON.stringify(details).slice(0, 60)}...
        </Text>
      ) : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>,
    },
  ];

  return (
    <PageContainer>
    <div>
      <PageHeader
        title={`Activity: ${user.name}`}
        subtitle={user.email}
        actions={
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
            Back to Users
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Actions"
              value={statsData?.data?.totalActions || 0}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Last 24h"
              value={statsData?.data?.last24h || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Last 7 Days"
              value={statsData?.data?.last7d || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Last 30 Days"
              value={statsData?.data?.last30d || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small" title="Activity by Module" style={{ borderRadius: 10 }}>
            {statsData?.data?.byModule?.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--hrms-border-light)' }}>
                <Text style={{ fontSize: 13 }}>{item._id}</Text>
                <Tag>{item.count}</Tag>
              </div>
            ))}
            {!statsData?.data?.byModule?.length && <Text type="secondary">No data</Text>}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Activity by Action" style={{ borderRadius: 10 }}>
            {statsData?.data?.byAction?.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--hrms-border-light)' }}>
                <Tag color={actionColors[item._id] || 'default'} style={{ fontSize: 10 }}>{item._id}</Tag>
                <Tag>{item.count}</Tag>
              </div>
            ))}
            {!statsData?.data?.byAction?.length && <Text type="secondary">No data</Text>}
          </Card>
        </Col>
      </Row>

      <DataTable
        columns={activityColumns}
        dataSource={activityData?.data || []}
        rowKey="id"
        loading={activityLoading}
        total={activityData?.meta?.total || 0}
        page={page}
        onPaginationChange={(p, l) => { setPage(p); setLimit(l || 20); }}
        pageSizeOptions={['10', '20', '50', '100']}
        disableRowClick
        toolbarLeft={
          <Text strong style={{ fontSize: 14 }}>Activity Log</Text>
        }
        toolbarRight={
          <Button size="small" onClick={handleExportActivity}>Export Activity</Button>
        }
      />
    </div>
    </PageContainer>
  );
}