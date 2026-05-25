import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  FileDoneOutlined,
  BookOutlined,
  BellOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  GiftOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { usePermission } from '../core/hooks/usePermission';
import { useUIStore } from '../core/stores/uiStore';

const { Sider } = Layout;
const { SubMenu } = Menu;

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/dashboard') return '/dashboard';
    if (path === '/employees/new') return '/employees/new';
    if (path.includes('/employees')) return '/employees';
    if (path.includes('/departments')) return '/departments';
    if (path.includes('/designations')) return '/designations';
    if (path.includes('/shifts')) return '/shifts';
    if (path.includes('/holidays')) return '/holidays';
    if (path.includes('/weekly-off-rules')) return '/weekly-off-rules';
    if (path.includes('/attendance')) return '/attendance';
    if (path.includes('/leave')) {
      if (path.includes('/leave/types')) return '/leave/types';
      if (path.includes('/leave/my-applications')) return '/leave/my-applications';
      if (path.includes('/leave/approvals')) return '/leave/approvals';
      if (path.includes('/leave/balances')) return '/leave/balances';
      return '/leave';
    }
    if (path.includes('/overtime')) {
    if (path.includes('/overtime-rules')) return '/overtime-rules';
    return '/overtime';
  }
    if (path.includes('/payroll') || path.includes('/salary-slips')) return '/payroll';
    if (path.includes('/reports')) return '/reports';
    if (path.includes('/users')) return '/users';
    if (path.includes('/audit-logs')) return '/audit-logs';
    if (path.includes('/settings')) return '/settings';
    if (path.includes('/rule-book')) return '/rule-book';
    return path;
  };

  const openKeys = () => {
    const path = location.pathname;
    if (path === '/employees' || path === '/employees/new') return ['employees'];
    if (path.includes('/departments') || path.includes('/designations') || path.includes('/shifts') || path.includes('/holidays')) return ['organization'];
    if (path.includes('/leave')) return ['leave'];
    if (path.includes('/overtime')) return ['overtime'];
    if (path.includes('/payroll') || path.includes('/salary-slips')) return ['payroll'];
    return [];
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', permission: undefined },
    { 
      key: 'employees', 
      icon: <TeamOutlined />, 
      label: 'Employees', 
      permission: 'view-employees',
      children: [
        { key: '/employees', icon: <UnorderedListOutlined />, label: 'Employee List' },
        { key: '/employees/new', icon: <PlusOutlined />, label: 'Add Employee' },
      ]
    },
{
      key: 'organization',
      icon: <AppstoreOutlined />,
      label: 'Organization',
      children: [
        { key: '/departments', icon: <BankOutlined />, label: 'Departments' },
        { key: '/designations', icon: <TrophyOutlined />, label: 'Designations' },
        { key: '/shifts', icon: <ClockCircleOutlined />, label: 'Shifts' },
        { key: '/holidays', icon: <GiftOutlined />, label: 'Holidays' },
      ]
    },
    { key: '/attendance', icon: <FieldTimeOutlined />, label: 'Attendance', permission: 'manage-attendance' },
    {
      key: 'leave',
      icon: <CalendarOutlined />,
      label: 'Leave',
      permission: 'view-leave',
      children: [
        { key: '/leave/my-applications', icon: <PlusOutlined />, label: 'Apply Leave' },
        { key: '/leave/applications', icon: <UnorderedListOutlined />, label: 'Applications' },
        { key: '/leave/approvals', icon: <CheckSquareOutlined />, label: 'Approvals' },
        { key: '/leave/balances', icon: <BarChartOutlined />, label: 'Balances' },
        { key: '/leave/types', icon: <SettingOutlined />, label: 'Leave Types' },
      ]
    },
    { key: '/overtime', icon: <PlayCircleOutlined />, label: 'Overtime', permission: 'manage-overtime' },
    { 
      key: 'payroll', 
      icon: <DollarOutlined />, 
      label: 'Payroll', 
      permission: 'process-payroll',
      children: [
        { key: '/payroll', icon: <DollarOutlined />, label: 'Process Payroll' },
        { key: '/salary-slips', icon: <FileTextOutlined />, label: 'Salary Slips' },
      ]
    },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', permission: 'view-reports' },
    { key: '/users', icon: <UserOutlined />, label: 'Users', permission: 'manage-users' },
    { key: '/audit-logs', icon: <FileDoneOutlined />, label: 'Audit Logs', permission: 'view-audit' },
    { key: '/notifications', icon: <BellOutlined />, label: 'Notifications', permission: undefined },
    { key: '/rule-book', icon: <BookOutlined />, label: 'User Guide' },
    {
      key: 'settings-menu',
      icon: <SettingOutlined />,
      label: 'Settings',
      permission: 'manage-settings',
      children: [
        { key: '/settings', icon: <SettingOutlined />, label: 'General Settings' },
        { key: '/settings/totp', icon: <SafetyCertificateOutlined />, label: 'TOTP Enrollment' },
      ]
    },
  ];

  const renderMenuItems = (items: typeof menuItems) => {
    return items.map((item) => {
      if (item.permission && !hasPermission(item.permission)) return null;
      
      if (item.children) {
        return (
          <SubMenu key={item.key} icon={item.icon} title={item.label}>
            {item.children.map((child) => (
              <Menu.Item key={child.key} icon={child.icon}>{child.label}</Menu.Item>
            ))}
          </SubMenu>
        );
      }
      return <Menu.Item key={item.key} icon={item.icon}>{item.label}</Menu.Item>;
    });
  };

  return (
    <Sider
      collapsed={collapsed}
      onCollapse={toggleSidebar}
      collapsible
      trigger={null}
      width={260}
      collapsedWidth={80}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        height: '100vh',
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        overflow: 'hidden',
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
        flexShrink: 0,
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
          O
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Orian</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Management System</div>
          </div>
        )}
      </div>

      <div style={{ 
        height: 'calc(100vh - 64px)', 
        overflowY: 'auto', 
        overflowX: 'hidden',
      }} className="sidebar-scroll">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={openKeys()}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 0 }}
          inlineCollapsed={collapsed}
        >
          {renderMenuItems(menuItems)}
        </Menu>
      </div>
    </Sider>
  );
}