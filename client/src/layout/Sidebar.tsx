import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  QrcodeOutlined,
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  FileDoneOutlined,
  BellOutlined,
  MessageOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  GiftOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  LaptopOutlined,
  FolderOutlined,
  SwapOutlined,
  StarOutlined,
  ReadOutlined,
  ApartmentOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { usePermission } from '../core/hooks/usePermission';
import { useUIStore } from '../core/stores/uiStore';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

export function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/employees' || path === '/employees/new') { setOpenKeys(['employees']); }
    else if (path.includes('/departments') || path.includes('/designations') || path.includes('/shifts') || path.includes('/holidays')) { setOpenKeys(['organization']); }
    else if (path.includes('/leave')) { setOpenKeys(['leave']); }
    else if (path.includes('/attendance') || path.includes('/kiosk')) { setOpenKeys(['attendance']); }
    else if (path.includes('/overtime')) { setOpenKeys(['overtime']); }
    else if (path.includes('/shift-swaps')) { setOpenKeys(['shiftSwap']); }
    else if (path.includes('/payroll-reports')) { setOpenKeys(['analytics']); }
    else if (path.includes('/payroll') || path.includes('/salary-slips')) { setOpenKeys(['payroll']); }
    else if (path.includes('/performance')) { setOpenKeys(['performance']); }
    else if (path.includes('/training')) { setOpenKeys(['training']); }
    else if (path.includes('/assets') || path.includes('/documents')) { setOpenKeys(['resources']); }
    else if (path.includes('/reports') || path.includes('/statutory')) { setOpenKeys(['analytics']); }
    else if (path.includes('/users') || path.includes('/audit-logs') || path.includes('/settings')) { setOpenKeys(['administration']); }
    else if (path.includes('/announcements') || path.includes('/helpdesk') || path.includes('/notifications')) { setOpenKeys(['communication']); }
    else { setOpenKeys([]); }
  }, [location.pathname]);

  const getSelectedKey = () => {
    const path = location.pathname;
    const state = location.state as Record<string, unknown> | null;
    if (path === '/dashboard') return '/dashboard';
    if (path === '/employees/new') return '/employees/new';
    if (path.includes('/employees')) return '/employees';
    if (path.includes('/departments')) return '/departments';
    if (path.includes('/designations')) return '/designations';
    if (path.includes('/shifts')) return '/shifts';
    if (path.includes('/holidays')) return '/holidays';
    if (path.includes('/weekly-off-rules')) return '/weekly-off-rules';
    if (path.includes('/attendance')) return '/attendance';
    if (path.includes('/kiosk')) return '/kiosk/devices';
    if (path.includes('/leave')) {
      if (path.includes('/leave/types')) return '/leave/types';
      if (path.includes('/leave/my-applications')) return '/leave/my-applications';
      if (path.includes('/leave/approvals')) return '/leave/approvals';
      if (path.includes('/leave/balances')) return '/leave/balances';
      return '/leave';
    }
    if (path.includes('/overtime')) {
    if (path.includes('/overtime/rules')) return '/overtime/rules';
    return '/overtime';
  }
    if (path.includes('/payroll-reports')) return '/payroll-reports';
    if (path.includes('/salary-slips')) return '/salary-slips';
    if (path.includes('/payroll')) return '/payroll';
    if (path.includes('/loans')) return '/loans';
    if (path.includes('/statutory')) return '/statutory';
    if (path.includes('/reports')) return '/reports';
    if (path.includes('/users')) return '/users';
    if (path.includes('/audit-logs')) return '/audit-logs';
    if (path.includes('/settings')) {
      if (state?.section === 'totp') return '/settings/totp';
      return '/settings';
    }
    if (path.includes('/announcements')) return '/announcements';
    if (path.includes('/helpdesk')) return '/helpdesk';
    if (path.includes('/assets')) return '/assets';
    if (path.includes('/documents')) return '/documents';
    if (path.includes('/shift-swaps')) {
      if (path.includes('/shift-swaps/approvals')) return '/shift-swaps/approvals';
      if (path.includes('/shift-swaps/preferences')) return '/shift-swaps/preferences';
      return '/shift-swaps';
    }
    if (path.includes('/performance')) {
      return '/performance';
    }
    if (path.includes('/training')) {
      if (path.includes('/training/enrollments')) return '/training/enrollments';
      if (path.includes('/training/skills')) return '/training/skills';
      if (path.includes('/training/skill-gap')) return '/training/skill-gap';
      if (path.includes('/training/certifications')) return '/training/certifications';
      return '/training';
    }
    return path;
  };

  const menuItems: MenuItem[] = useMemo(() => {
    const rawItems: Array<{
      key: string;
      icon: React.ReactNode;
      label: string;
      permission?: string | string[];
      children?: Array<{ key: string; icon: React.ReactNode; label: string; permission?: string | string[] }>;
    }> = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', permission: undefined },
      { 
        key: 'employees', 
        icon: <TeamOutlined />, 
        label: 'Employees', 
        permission: 'view-employees',
        children: [
          { key: '/employees', icon: <UnorderedListOutlined />, label: 'Employee List' },
          { key: '/employees/new', icon: <PlusOutlined />, label: 'Add Employee', permission: 'manage-employees' },
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
          { key: '/weekly-off-rules', icon: <CalendarOutlined />, label: 'Weekly Off Rules' },
        ]
      },
      {
        key: 'attendance',
        icon: <FieldTimeOutlined />,
        label: 'Attendance',
        permission: 'manage-attendance',
        children: [
          { key: '/attendance', icon: <FieldTimeOutlined />, label: 'Attendance' },
          { key: '/kiosk/devices', icon: <QrcodeOutlined />, label: 'Kiosk' },
        ]
      },
      {
        key: 'resources',
        icon: <FolderOutlined />,
        label: 'Resources',
        permission: 'view-assets',
        children: [
          { key: '/assets', icon: <LaptopOutlined />, label: 'Assets', permission: 'view-assets' },
          { key: '/documents', icon: <FileTextOutlined />, label: 'Documents', permission: 'view-documents' },
        ]
      },
      {
        key: 'performance', icon: <StarOutlined />, label: 'Performance', permission: 'view-performance',
        children: [
          { key: '/performance', icon: <StarOutlined />, label: 'Reviews' },
        ]
      },
      {
        key: 'training', icon: <ReadOutlined />, label: 'Training', permission: 'view-training',
        children: [
          { key: '/training', icon: <ReadOutlined />, label: 'Programs' },
          { key: '/training/enrollments', icon: <CheckSquareOutlined />, label: 'Enrollments' },
          { key: '/training/skills', icon: <ApartmentOutlined />, label: 'Skill Matrix' },
          { key: '/training/skill-gap', icon: <AuditOutlined />, label: 'Skill Gap' },
          { key: '/training/certifications', icon: <SafetyCertificateOutlined />, label: 'Certifications' },
        ]
      },
      {
        key: 'shiftSwap',
        icon: <SwapOutlined />,
        label: 'Shift Swaps',
        permission: ['view-shift-swaps', 'request-shift-swap'],
        children: [
          { key: '/shift-swaps', icon: <SwapOutlined />, label: 'All Swaps' },
          { key: '/shift-swaps/approvals', icon: <CheckSquareOutlined />, label: 'Approvals', permission: 'manage-shift-swaps' },
          { key: '/shift-swaps/preferences', icon: <SettingOutlined />, label: 'Preferences' },
        ]
      },
      {
        key: 'leave',
        icon: <CalendarOutlined />,
        label: 'Leave',
        permission: 'view-leave',
        children: [
          { key: '/leave/applications', icon: <CalendarOutlined />, label: 'Applications' },
          { key: '/leave/approvals', icon: <CheckSquareOutlined />, label: 'Approvals' },
          { key: '/leave/balances', icon: <FileDoneOutlined />, label: 'Balances' },
        ]
      },
      {
        key: 'overtime',
        icon: <PlayCircleOutlined />,
        label: 'Overtime',
        permission: 'manage-overtime',
        children: [
          { key: '/overtime', icon: <FieldTimeOutlined />, label: 'Entries' },
          { key: '/overtime/rules', icon: <SettingOutlined />, label: 'Rules' },
        ]
      },
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
      { 
        key: '/loans', 
        icon: <CreditCardOutlined />, 
        label: 'Loans', 
        permission: 'view-loans',
      },
      {
        key: 'analytics',
        icon: <BarChartOutlined />,
        label: 'Analytics',
        permission: 'view-reports',
        children: [
          { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', permission: 'view-reports' },
          { key: '/payroll-reports', icon: <DollarOutlined />, label: 'Payroll Reports', permission: 'view-payroll' },
          { key: '/statutory', icon: <SafetyCertificateOutlined />, label: 'Statutory', permission: 'view-statutory' },
        ]
      },
      {
        key: 'administration',
        icon: <ApartmentOutlined />,
        label: 'Administration',
        children: [
          { key: '/users', icon: <UserOutlined />, label: 'Users', permission: 'manage-users' },
          { key: '/audit-logs', icon: <FileDoneOutlined />, label: 'Audit Logs', permission: 'view-audit' },
          { key: '/settings', icon: <SettingOutlined />, label: 'Settings', permission: 'manage-settings' },
        ]
      },
      {
        key: 'communication',
        icon: <MessageOutlined />,
        label: 'Communication',
        children: [
          { key: '/announcements', icon: <BellOutlined />, label: 'Announcements', permission: 'view-announcements' },
          { key: '/helpdesk', icon: <MessageOutlined />, label: 'Help Desk', permission: 'view-tickets' },
          { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
        ]
      },
    ];

    const hasAccess = (perm: string | string[] | undefined) => {
      if (!perm) return true;
      const perms = Array.isArray(perm) ? perm : [perm];
      return perms.some((p) => hasPermission(p));
    };

    return rawItems
      .filter((item) => hasAccess(item.permission))
      .map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child) => hasAccess(child.permission));
          return {
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: filteredChildren.map((child) => ({
              key: child.key,
              icon: child.icon,
              label: child.label,
            })),
          } as MenuItem;
        }
        return { key: item.key, icon: item.icon, label: item.label } as MenuItem;
      });
  }, [hasPermission]);

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
          openKeys={openKeys}
          onOpenChange={(keys) => {
            if (keys.length > openKeys.length) {
              const newKey = keys.find(k => !openKeys.includes(k));
              setOpenKeys(newKey ? [newKey] : keys);
            } else {
              setOpenKeys(keys);
            }
          }}
          onClick={({ key }) => {
            if (key === '/settings/totp') {
              navigate('/settings', { state: { section: 'totp' } });
            } else {
              navigate(key);
            }
          }}
          style={{ background: 'transparent', borderRight: 0 }}
          inlineCollapsed={collapsed}
          items={menuItems}
        />
      </div>
    </Sider>
  );
}