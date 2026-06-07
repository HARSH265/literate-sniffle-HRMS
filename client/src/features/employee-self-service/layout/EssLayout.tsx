import { Suspense, useCallback, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Spin, Button, Typography, Badge, List, Empty, Space, Drawer } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, CheckOutlined } from '@ant-design/icons';
import { EssBottomNav } from './EssBottomNav';
import { useAuthStore } from '../../../core/stores/authStore';
import apiClient from '../../../core/api/apiClient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Content } = Layout;
const { Text } = Typography;

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);

export function EssLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [{ data: notifs }, { data: count }] = await Promise.all([
        apiClient.get('/notifications?limit=20'),
        apiClient.get('/notifications/unread-count'),
      ]);
      setNotifications(notifs.data);
      setUnreadCount(count.data.count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = useCallback(() => {
    apiClient.post('/auth/logout').finally(() => {
      logout();
      navigate('/login', { replace: true });
    });
  }, [logout, navigate]);

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

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--hrms-bg, #f5f5f5)' }}>
      <Content
        style={{
          padding: '16px 16px 72px',
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
        }}
      >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, padding: '10px 14px', background: '#fff',
            borderRadius: 12, border: '1px solid #f0f0f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UserOutlined style={{ color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ lineHeight: 1 }}>
                <Text strong style={{ fontSize: 13, lineHeight: '20px', display: 'block' }}>{user?.name || 'User'}</Text>
                <Text style={{ fontSize: 11, color: '#999', lineHeight: '16px', display: 'block' }}>{user?.role}</Text>
              </div>
            </div>
            <Space size={8}>
              <Badge count={unreadCount} size="small" offset={[2, -2]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 16, color: '#666' }} />}
                  style={{ borderRadius: 8, width: 34, height: 34 }}
                  onClick={() => setNotifDrawerOpen(true)}
                />
              </Badge>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  borderRadius: 8, height: 34, fontSize: 13,
                  borderColor: '#f0f0f0', color: '#888',
                }}
              >
                Logout
              </Button>
            </Space>
          </div>

        <Drawer
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button size="small" type="link" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
                  Mark all read ({unreadCount})
                </Button>
              )}
            </div>
          }
          placement="bottom"
          height="auto"
          open={notifDrawerOpen}
          onClose={() => setNotifDrawerOpen(false)}
          style={{ borderRadius: '16px 16px 0 0' }}
        >
          {notifications.length === 0 ? (
            <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />
          ) : (
            <List
              dataSource={notifications}
              renderItem={(item: any) => (
                <List.Item
                  style={{ padding: '12px 16px', cursor: 'pointer', background: item.isRead ? 'transparent' : '#f0f7ff', borderRadius: 8 }}
                  onClick={() => {
                    if (!item.isRead) handleMarkAsRead(item.id || item._id);
                    setNotifDrawerOpen(false);
                    if (item.link) navigate(item.link);
                  }}
                >
                  <List.Item.Meta
                    title={<Text strong={!item.isRead} style={{ fontSize: 13 }}>{item.title}</Text>}
                    description={<div><Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text><div><Text type="secondary" style={{ fontSize: 10 }}>{dayjs(item.createdAt).fromNow()}</Text></div></div>}
                  />
                </List.Item>
              )}
            />
          )}
        </Drawer>

        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </Content>
      <EssBottomNav />
    </Layout>
  );
}
