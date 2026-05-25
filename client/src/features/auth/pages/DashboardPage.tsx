import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'antd';
import {
  TeamOutlined, BankOutlined, TrophyOutlined, ClockCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, UserAddOutlined, DollarOutlined,
  BarChartOutlined, AuditOutlined, UserOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { useQuery } from '@tanstack/react-query';

const STAT_ICONS: Record<string, { bg: string; color: string }> = {
  employees: { bg: '#eef2ff', color: '#4f46e5' },
  departments: { bg: '#f0f9ff', color: '#0284c7' },
  designations: { bg: '#faf5ff', color: '#7c3aed' },
  shifts: { bg: '#ecfdf5', color: '#059669' },
};

function StatCard({ title, value, icon, sub, trend, iconKey }: { title: string; value: number; icon: React.ReactNode; sub?: string; trend?: 'up' | 'down'; iconKey: string }) {
  const s = STAT_ICONS[iconKey] || STAT_ICONS.employees;
  return (
    <div className="hrms-stat-card">
      <div className="stat-top">
        <div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{value.toLocaleString()}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="stat-trend" style={{ color: trend === 'up' ? 'var(--hrms-success)' : 'var(--hrms-danger)' }}>
          {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          <span>vs last month</span>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: empData } = useQuery({
    queryKey: ['employees-dash'],
    queryFn: () => import('../../employees/services/employeeService').then(m => m.employeeService.list({ limit: 1 })),
  });
  const { data: deptData } = useQuery({
    queryKey: ['departments-dash'],
    queryFn: () => import('../../departments/services/departmentService').then(m => m.departmentService.list({ limit: 1 })),
  });
  const { data: desigData } = useQuery({
    queryKey: ['designations-dash'],
    queryFn: () => import('../../designations/services/designationService').then(m => m.designationService.list({ limit: 1 })),
  });
  const { data: shiftData } = useQuery({
    queryKey: ['shifts-dash'],
    queryFn: () => import('../../shifts/services/shiftService').then(m => m.shiftService.list({ limit: 1 })),
  });
  const { data: auditData } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => import('../../audit/services/auditService').then(m => m.auditService.list({ limit: 10 })),
    refetchInterval: 30000,
  });

  const totalEmployees = empData?.meta?.total ?? 0;
  const totalDepartments = deptData?.meta?.total ?? 0;
  const totalDesignations = desigData?.meta?.total ?? 0;
  const totalShifts = shiftData?.meta?.total ?? 0;

  const getActivityColor = (action: string) => {
    const a = action?.toUpperCase();
    if (['CREATE', 'ADD', 'INSERT'].includes(a)) return '#4f46e5';
    if (['DELETE', 'REMOVE'].includes(a)) return '#dc2626';
    if (['PAYROLL', 'PROCESS', 'GENERATE'].includes(a)) return '#059669';
    if (['UPDATE', 'EDIT', 'PATCH'].includes(a)) return '#d97706';
    return '#94a3b8';
  };

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const recentActivities = auditData?.data || [];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title={`${getGreeting()}!`}
        subtitle="Here's what's happening across your organization today."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={<TeamOutlined />}
            sub="Active workforce"
            trend="up"
            iconKey="employees"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Departments"
            value={totalDepartments}
            icon={<BankOutlined />}
            sub="Organization units"
            iconKey="departments"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Designations"
            value={totalDesignations}
            icon={<TrophyOutlined />}
            sub="Job roles defined"
            iconKey="designations"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Shifts"
            value={totalShifts}
            icon={<ClockCircleOutlined />}
            sub="Work schedules"
            iconKey="shifts"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className="hrms-table-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>
                  Recent Activity
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--hrms-text-muted)' }}>
                  Latest events across all modules
                </p>
              </div>
              <span
                onClick={() => navigate('/audit-logs')}
                style={{
                  fontSize: 12,
                  color: 'var(--hrms-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  marginTop: 2,
                }}
              >
                View All →
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentActivities.slice(0, 5).map((item: any) => (
                <div key={item._id} className="hrms-activity-item">
                  <div
                    className="hrms-activity-dot"
                    style={{ background: getActivityColor(item.action), borderColor: getActivityColor(item.action) }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--hrms-text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 7px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: getActivityColor(item.action),
                            background: `${getActivityColor(item.action)}14`,
                            marginRight: 6,
                          }}
                        >
                          {item.actionLabel || item.action}
                        </span>
                        {item.moduleLabel || item.module}
                        {item.targetName && (
                          <span style={{ color: 'var(--hrms-text-secondary)' }}> — {item.targetName}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', marginTop: 4 }}>
                        {item.userId?.name || 'System'}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
                      {formatActivityTime(item.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--hrms-text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 12, color: '#cbd5e1' }}>
                    <AuditOutlined />
                  </div>
                  No recent activity to display
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="hrms-table-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>
                Quick Actions
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--hrms-text-muted)' }}>
                Frequently used tasks
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Add New Employee', icon: <UserAddOutlined />, path: '/employees/new', color: '#4f46e5', bg: '#eef2ff' },
                { label: 'Mark Attendance', icon: <UserOutlined />, path: '/attendance', color: '#059669', bg: '#ecfdf5' },
                { label: 'Process Payroll', icon: <DollarOutlined />, path: '/payroll', color: '#d97706', bg: '#fffbeb' },
                { label: 'Generate Reports', icon: <BarChartOutlined />, path: '/reports', color: '#0284c7', bg: '#f0f9ff' },
                { label: 'View Audit Logs', icon: <AuditOutlined />, path: '/audit-logs', color: '#7c3aed', bg: '#faf5ff' },
                { label: 'Manage Users', icon: <SafetyOutlined />, path: '/users', color: '#0891b2', bg: '#ecfeff' },
              ].map((action, i) => (
                <div
                  key={i}
                  className="hrms-quick-action"
                  onClick={() => navigate(action.path)}
                >
                  <div
                    className="hrms-quick-action-icon"
                    style={{ background: action.bg, color: action.color }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--hrms-text-primary)' }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--hrms-text-secondary)', marginTop: 2 }}>
                      {action.path.replace('/', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
