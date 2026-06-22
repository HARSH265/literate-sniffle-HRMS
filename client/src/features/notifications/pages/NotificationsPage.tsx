import { useState } from 'react';
import { Button, Select, message, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { notificationService, Notification } from '../services/notificationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const moduleIcons: Record<string, string> = {
  payroll: 'Payroll',
  employees: 'Employee',
  users: 'User',
  attendance: 'Attendance',
};

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [moduleFilter, setModuleFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page, limit, moduleFilter, readFilter],
    queryFn: () => notificationService.list({
      page,
      limit,
      ...(moduleFilter ? { module: moduleFilter } : {}),
      ...(readFilter ? { isRead: readFilter } : {}),
    }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      message.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => message.error('Failed to mark all as read'),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => message.error('Failed to mark as read'),
  });

  const columns = [
    {
      title: '',
      key: 'type',
      width: 50,
      render: (_: unknown, r: Notification) => (
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: r.type === 'info' ? '#1890ff' : r.type === 'success' ? '#52c41a' : r.type === 'warning' ? '#fa8c16' : '#ff4d4f',
        }} />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, r: Notification) => (
        <span style={{ fontWeight: r.isRead ? 400 : 600 }}>{title}</span>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (msg: string) => (
        <span style={{ color: 'var(--hrms-text-secondary)', fontSize: 13 }}>{msg}</span>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (mod: string) => <Tag color="default">{moduleIcons[mod] || mod}</Tag>,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <span style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>
          {dayjs(date).format('DD MMM YY, HH:mm')}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 100,
      render: (isRead: boolean) => (
        isRead
          ? <Tag color="default">Read</Tag>
          : <Tag color="blue">New</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, r: Notification) => (
        !r.isRead && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => markOneMutation.mutate(r.id || r._id || '')}
          >
            Read
          </Button>
        )
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Notifications"
        subtitle="View all your notifications"
        actions={
          <Button
            icon={<CheckOutlined />}
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
          >
            Mark All Read
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.data?.notifications}
        rowKey={(r) => r.id || r._id || ''}
        loading={isLoading}
        total={data?.data?.pagination?.total ?? 0}
        page={page}
        onPaginationChange={(p, size) => { setPage(p); setLimit(size ?? 20); }}
        pageSizeOptions={['10', '20', '50', '100']}
        disableRowClick
        toolbarLeft={
          <>
            <Select
              placeholder="Filter by module"
              allowClear
              style={{ width: 150 }}
              value={moduleFilter || undefined}
              onChange={(val) => { setModuleFilter(val || ''); setPage(1); }}
              options={[
                { label: 'Payroll', value: 'payroll' },
                { label: 'Employees', value: 'employees' },
                { label: 'Users', value: 'users' },
                { label: 'Attendance', value: 'attendance' },
              ]}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 130 }}
              value={readFilter || undefined}
              onChange={(val) => { setReadFilter(val || ''); setPage(1); }}
              options={[
                { label: 'Unread', value: 'false' },
                { label: 'Read', value: 'true' },
              ]}
            />
          </>
        }
        toolbarRight={
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            {data?.data?.pagination?.total ?? 0} notifications
          </span>
        }
      />
    </div>
  );
}