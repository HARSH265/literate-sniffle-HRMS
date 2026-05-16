import { Layout, Dropdown, Badge, Button, Space } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../core/stores/authStore';
import apiClient from '../core/api/apiClient';
import { useUIStore } from '../core/stores/uiStore';

const { Header: AntHeader } = Layout;

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const handleLogout = () => {
    apiClient.post('/auth/logout').finally(() => {
      logout();
      navigate('/login');
    });
  };

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
        style={{ color: 'var(--hrms-text-secondary)' }}
      />

      <Space size={16}>
        <Badge count={0} size="small" offset={[2, -2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18, color: 'var(--hrms-text-secondary)' }} />}
            style={{ borderRadius: 8 }}
          />
        </Badge>

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