import { Suspense, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Spin, Button, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { EssBottomNav } from './EssBottomNav';
import { useAuthStore } from '../../../core/stores/authStore';

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

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

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
          </div>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </Content>
      <EssBottomNav />
    </Layout>
  );
}
