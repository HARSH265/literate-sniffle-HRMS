import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { usePermission } from '../core/hooks/usePermission';
import { useUIStore } from '../core/stores/uiStore';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/employees', icon: <TeamOutlined />, label: 'Employees', permission: 'view-employees' },
  { key: '/departments', icon: <BankOutlined />, label: 'Departments' },
  { key: '/designations', icon: <TrophyOutlined />, label: 'Designations' },
  { key: '/shifts', icon: <ClockCircleOutlined />, label: 'Shifts' },
  { key: '/holidays', icon: <CalendarOutlined />, label: 'Holidays' },
  { key: '/attendance', icon: <FieldTimeOutlined />, label: 'Attendance', permission: 'manage-attendance' },
  { key: '/overtime', icon: <ClockCircleOutlined />, label: 'Overtime', permission: 'manage-overtime' },
  { key: '/payroll', icon: <DollarOutlined />, label: 'Payroll', permission: 'process-payroll' },
  { key: '/salary-slips', icon: <FileTextOutlined />, label: 'Salary Slips', permission: 'process-payroll' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', permission: 'view-reports' },
  { key: '/users', icon: <UserOutlined />, label: 'Users', permission: 'manage-users' },
  { key: '/audit-logs', icon: <FileDoneOutlined />, label: 'Audit Logs', permission: 'view-audit' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', permission: 'manage-settings' },
];

export function Sidebar({ collapsed: _collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const collapsed = _collapsed;

  const filteredItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Sider
      onCollapse={toggleSidebar}
      collapsible
      trigger={null}
      width={260}
      collapsedWidth={72}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        overflow: 'hidden',
        height: '100vh',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: collapsed ? '0 8px' : '0 24px',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 800,
          color: 'white',
          flexShrink: 0,
        }}>
          H
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>HRMS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Management System</div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 0', overflowY: 'auto', height: 'calc(100vh - 64px)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 20px', marginBottom: 4, whiteSpace: 'nowrap' }}>
          {!collapsed && 'Navigation'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 0 }}
          inlineCollapsed={false}
        />
      </div>

      <div
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: '0 16px',
        }}
      >
        <div style={{
          width: 'calc(100% - 32px)',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          transition: 'all 0.15s ease',
        }}>
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
          {!collapsed && <span>Collapse</span>}
        </div>
      </div>
    </Sider>
  );
}