import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'antd';
import { TeamOutlined, BankOutlined, TrophyOutlined, ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined, UserAddOutlined, DollarOutlined, BarChartOutlined, AuditOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { useQuery } from '@tanstack/react-query';

function StatCard({ title, value, icon, sub, trend }: { title: string; value: number; icon: React.ReactNode; sub?: string; trend?: 'up' | 'down' }) {
  return (
    <div className="hrms-stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{value.toLocaleString()}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'var(--hrms-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--hrms-primary)',
          fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: trend === 'up' ? 'var(--hrms-success)' : 'var(--hrms-danger)' }}>
          {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          <span>vs last month</span>
        </div>
      )}
    </div>
  );
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
    if (['CREATE', 'ADD', 'INSERT'].includes(action?.toUpperCase())) return 'var(--hrms-primary)';
    if (['DELETE', 'REMOVE'].includes(action?.toUpperCase())) return 'var(--hrms-danger)';
    if (['PAYROLL', 'PROCESS', 'GENERATE'].includes(action?.toUpperCase())) return 'var(--hrms-success)';
    return 'var(--hrms-warning)';
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
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const recentActivities = auditData?.data || [];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's what's happening today." />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Employees" value={totalEmployees} icon={<TeamOutlined />} sub="Active workforce" trend="up" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Departments" value={totalDepartments} icon={<BankOutlined />} sub="Organization units" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Designations" value={totalDesignations} icon={<TrophyOutlined />} sub="Job roles defined" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Shifts" value={totalShifts} icon={<ClockCircleOutlined />} sub="Work schedules" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className="hrms-table-card" style={{ padding: 24 }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>Recent Activity</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--hrms-text-muted)' }}>Latest system events and updates</p>
              </div>
              <span 
                onClick={() => navigate('/audit-logs')}
                style={{ fontSize: 12, color: 'var(--hrms-primary)', cursor: 'pointer', fontWeight: 500 }}
              >
                View All →
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentActivities.slice(0, 5).map((item: any) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: getActivityColor(item.action), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--hrms-text-primary)', fontWeight: 500 }}>
                      {item.actionLabel || item.action} {item.moduleLabel || item.module}
                      {item.targetName && ` - ${item.targetName}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)', marginTop: 2 }}>
                      {item.userId?.name || 'System'} · {formatActivityTime(item.createdAt)}
                    </div>
                  </div>
                </div>
))}
              {recentActivities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--hrms-text-muted)', fontSize: 13 }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="hrms-table-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>Quick Actions</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--hrms-text-muted)' }}>Common tasks at your fingertips</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Add New Employee', color: '#4f46e5', bg: '#eef2ff', icon: <UserAddOutlined />, path: '/employees/new' },
                { label: 'Mark Attendance', color: '#059669', bg: '#ecfdf5', icon: <TeamOutlined />, path: '/attendance' },
                { label: 'Process Payroll', color: '#d97706', bg: '#fffbeb', icon: <DollarOutlined />, path: '/payroll' },
                { label: 'Generate Reports', color: '#0284c7', bg: '#f0f9ff', icon: <BarChartOutlined />, path: '/reports' },
                { label: 'View Audit Logs', color: '#7c3aed', bg: '#faf5ff', icon: <AuditOutlined />, path: '/audit-logs' },
              ].map((action, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate(action.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--hrms-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    background: action.bg, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: action.color,
                    flexShrink: 0,
                  }}>
                    {action.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--hrms-text-primary)' }}>{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}