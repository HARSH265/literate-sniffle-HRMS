import { useState, useEffect } from 'react';
import { Layout, Dropdown, Badge, Button, Space, List, Typography, Empty } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, MenuOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../core/stores/authStore';
import apiClient from '../core/api/apiClient';
import { useUIStore } from '../core/stores/uiStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;
const { Header: AntHeader } = Layout;

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const [{ data: notifs }, { data: count }] = await Promise.all([
        apiClient.get('/notifications?limit=5'),
        apiClient.get('/notifications/unread-count'),
      ]);
      setNotifications(notifs.data.notifications);
      setUnreadCount(count.data.count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    apiClient.post('/auth/logout').finally(() => {
      logout();
      navigate('/login');
    });
  };

  const handleMarkAllRead = async () => {
    await apiClient.patch('/notifications/mark-all-read');
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
    setNotifications(notifications.map(n => n.id === notificationId || n._id === notificationId ? { ...n, isRead: true } : n));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const notificationContent = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'auto', background: 'var(--hrms-surface)', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hrms-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Notifications</Text>
        <Button size="small" type="link" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
          {unreadCount > 0 ? `Mark all read (${unreadCount})` : 'Mark all read'}
        </Button>
      </div>
      {notifications.length === 0 ? (
        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item
              style={{ padding: '12px 16px', cursor: 'pointer', background: item.isRead ? 'transparent' : '#f0f7ff' }}
              onClick={() => {
                if (!item.isRead) handleMarkAsRead(item.id || item._id);
                if (item.link) navigate(item.link);
              }}
            >
              <List.Item.Meta
                title={<Text strong={!item.isRead} style={{ fontSize: 13 }}>{item.title}</Text>}
                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.createdAt).fromNow()}</Text>
            </List.Item>
          )}
        />
      )}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--hrms-border-light)', textAlign: 'center' }}>
        <Button type="link" size="small" onClick={() => navigate('/notifications')} style={{ fontSize: 12 }}>
          View all notifications
        </Button>
      </div>
    </div>
  );

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.email, disabled: true },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true, onClick: handleLogout },
  ];

  return (
    <AntHeader style={{
      padding: '0 28px',
      background: 'var(--hrms-surface)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      width: '100%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      borderBottom: '1px solid var(--hrms-border-light)',
      height: 64,
    }}>
      <Button
        type="text"
        icon={<MenuOutlined style={{ fontSize: 18 }} />}
        onClick={toggleSidebar}
        style={{ color: 'var(--hrms-text-secondary)', padding: '4px 8px', marginLeft: 4 }}
      />

      <Space size={16}>
        <Dropdown dropdownRender={() => notificationContent} placement="bottomRight" trigger={['click']}>
          <Badge count={unreadCount} size="small" offset={[2, -2]}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18, color: 'var(--hrms-text-secondary)' }} />}
              style={{ borderRadius: 8 }}
            />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.15s' }}
            className="header-user-trigger">
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
            }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--hrms-text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)', textTransform: 'capitalize' }}>{user?.role?.replace('-', ' ')}</div>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}