import { useNavigate } from 'react-router-dom';
import { Row, Col, Tag } from 'antd';
import {
  TeamOutlined,
  BankOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserAddOutlined,
  DollarOutlined,
  BarChartOutlined,
  AuditOutlined,
  UserOutlined,
  SafetyOutlined,
  FieldTimeOutlined,
  FileProtectOutlined,
  GiftOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PageHeader } from '../../../core/components/PageHeader';
import { AnnouncementWidget } from '../../announcements/components/AnnouncementWidget';
import apiClient from '../../../core/api/apiClient';

const STAT_ICONS: Record<string, { bg: string; color: string }> = {
  employees: { bg: '#eef2ff', color: '#4f46e5' },
  departments: { bg: '#f0f9ff', color: '#0284c7' },
  designations: { bg: '#faf5ff', color: '#7c3aed' },
  shifts: { bg: '#ecfdf5', color: '#059669' },
};

const QUICK_ACTIONS = [
  { label: 'Add New Employee', icon: <UserAddOutlined />, path: '/employees/new', color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Mark Attendance', icon: <UserOutlined />, path: '/attendance', color: '#059669', bg: '#ecfdf5' },
  { label: 'Process Payroll', icon: <DollarOutlined />, path: '/payroll', color: '#d97706', bg: '#fffbeb' },
  { label: 'Generate Reports', icon: <BarChartOutlined />, path: '/reports', color: '#0284c7', bg: '#f0f9ff' },
  { label: 'View Audit Logs', icon: <AuditOutlined />, path: '/audit-logs', color: '#7c3aed', bg: '#faf5ff' },
  { label: 'Manage Users', icon: <SafetyOutlined />, path: '/users', color: '#0891b2', bg: '#ecfeff' },
] as const;

function StatCard({
  title,
  value,
  icon,
  sub,
  trend,
  iconKey,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  trend?: 'up' | 'down';
  iconKey: string;
}) {
  const s = STAT_ICONS[iconKey] || STAT_ICONS.employees;

  return (
    <div className="hrms-stat-card">
      <div className="stat-top">
        <div>
          <div className="stat-label">{title}</div>
          <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
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

function MetricCard({
  title,
  onClick,
  icon,
  accent,
  children,
}: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  accent: { bg: string; color: string };
  children: React.ReactNode;
}) {
  return (
    <div className="hrms-stat-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="stat-top">
        <div>
          <div className="stat-label">{title}</div>
          {children}
        </div>
        <div className="stat-icon" style={{ background: accent.bg, color: accent.color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ children, minHeight }: { children: React.ReactNode; minHeight?: number }) {
  return (
    <div className="hrms-table-card" style={{ padding: 24, minHeight }}>
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
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
  const today = dayjs().format('YYYY-MM-DD');
  const thisMonth = dayjs().month() + 1;
  const thisYear = dayjs().year();

  const { data: empData } = useQuery({
    queryKey: ['employees-dash'],
    queryFn: () => import('../../employees/services/employeeService').then((m) => m.employeeService.list({ limit: 1 })),
    staleTime: 5 * 60 * 1000,
  });
  const { data: deptData } = useQuery({
    queryKey: ['departments-dash'],
    queryFn: () => import('../../departments/services/departmentService').then((m) => m.departmentService.list({ limit: 1 })),
    staleTime: 5 * 60 * 1000,
  });
  const { data: desigData } = useQuery({
    queryKey: ['designations-dash'],
    queryFn: () => import('../../designations/services/designationService').then((m) => m.designationService.list({ limit: 1 })),
    staleTime: 5 * 60 * 1000,
  });
  const { data: shiftData } = useQuery({
    queryKey: ['shifts-dash'],
    queryFn: () => import('../../shifts/services/shiftService').then((m) => m.shiftService.list({ limit: 1 })),
    staleTime: 5 * 60 * 1000,
  });
  const { data: auditData } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => import('../../audit/services/auditService').then((m) => m.auditService.list({ limit: 10 })),
    staleTime: 30 * 1000,
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['dash-attendance-summary', today],
    queryFn: () => apiClient.get('/reports/attendance/summary', { params: { startDate: today, endDate: today } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const { data: pendingLeaves } = useQuery({
    queryKey: ['dash-pending-leaves'],
    queryFn: () => apiClient.get('/leave/applications', { params: { status: 'pending', limit: 1 } }).then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const { data: pendingLoans } = useQuery({
    queryKey: ['dash-pending-loans'],
    queryFn: () => apiClient.get('/loans', { params: { status: 'applied', limit: 1 } }).then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const { data: payrollRuns } = useQuery({
    queryKey: ['dash-payroll-status'],
    queryFn: () => apiClient.get('/payroll/runs', { params: { limit: 1, sort: 'createdAt', order: 'desc' } }).then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const { data: otSummary } = useQuery({
    queryKey: ['dash-ot-summary', thisMonth, thisYear],
    queryFn: () => apiClient.get('/reports/overtime/summary', { params: { month: thisMonth, year: thisYear } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: holidays } = useQuery({
    queryKey: ['dash-upcoming-holidays', thisYear],
    queryFn: () => apiClient.get('/holidays', { params: { year: thisYear, limit: 50 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const totalEmployees = empData?.meta?.total ?? 0;
  const totalDepartments = deptData?.meta?.total ?? 0;
  const totalDesignations = desigData?.meta?.total ?? 0;
  const totalShifts = shiftData?.meta?.total ?? 0;

  const attStats = attendanceSummary?.data?.stats;
  const pendingLeaveTotal = pendingLeaves?.meta?.total ?? 0;
  const pendingLoanTotal = pendingLoans?.total ?? 0;
  const latestRun = payrollRuns?.data?.[0];
  const otStats = otSummary?.data?.stats;
  const holidayList = holidays?.data || [];

  const upcomingHolidays = holidayList
    .filter((h: any) => h.date >= today)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const getActivityColor = (action: string) => {
    const upper = action?.toUpperCase();
    if (['CREATE', 'ADD', 'INSERT'].includes(upper)) return '#4f46e5';
    if (['DELETE', 'REMOVE'].includes(upper)) return '#dc2626';
    if (['PAYROLL', 'PROCESS', 'GENERATE'].includes(upper)) return '#059669';
    if (['UPDATE', 'EDIT', 'PATCH'].includes(upper)) return '#d97706';
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
  const payrollStatusColor: Record<string, string> = {
    draft: 'default',
    submitted: 'blue',
    approved: 'green',
    rejected: 'red',
    finalized: 'purple',
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title={`${getGreeting()}!`}
        subtitle="Here's what's happening across your organization today."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Employees" value={totalEmployees} icon={<TeamOutlined />} sub="Active workforce" trend="up" iconKey="employees" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Departments" value={totalDepartments} icon={<BankOutlined />} sub="Organization units" iconKey="departments" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Designations" value={totalDesignations} icon={<TrophyOutlined />} sub="Job roles defined" iconKey="designations" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Shifts" value={totalShifts} icon={<ClockCircleOutlined />} sub="Work schedules" iconKey="shifts" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Today's Attendance"
            onClick={() => navigate('/attendance')}
            icon={<FieldTimeOutlined />}
            accent={{ bg: '#f0f9ff', color: '#0284c7' }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>
              <span style={{ color: '#22c55e' }}>{attStats?.totalPresent ?? '-'}</span>
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--hrms-text-muted)', margin: '0 4px' }}>/</span>
              <span style={{ color: '#ef4444' }}>{attStats?.totalAbsent ?? '-'}</span>
            </div>
            {attStats && (
              <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', marginTop: 2 }}>
                <span style={{ color: '#f59e0b' }}>{attStats.totalHalfDay} half-day</span>
                <span style={{ margin: '0 4px' }}>•</span>
                <span>{attStats.totalLeave} on leave</span>
              </div>
            )}
          </MetricCard>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Pending Approvals"
            onClick={() => navigate('/leave/approvals')}
            icon={<FileProtectOutlined />}
            accent={{ bg: '#fef2f2', color: '#dc2626' }}
          >
            <div className="stat-value">{pendingLeaveTotal + pendingLoanTotal}</div>
            <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', marginTop: 2 }}>
              <span style={{ color: '#1890ff' }}>{pendingLeaveTotal} leave</span>
              <span style={{ margin: '0 4px' }}>•</span>
              <span style={{ color: '#722ed1' }}>{pendingLoanTotal} loans</span>
            </div>
          </MetricCard>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Payroll"
            onClick={() => navigate('/payroll')}
            icon={<DollarOutlined />}
            accent={{ bg: '#fffbeb', color: '#d97706' }}
          >
            {latestRun ? (
              <>
                <div className="stat-value" style={{ fontSize: 20 }}>{latestRun.month}/{latestRun.year}</div>
                <div style={{ marginTop: 2 }}>
                  <Tag color={payrollStatusColor[latestRun.status] || 'default'} style={{ fontSize: 11, margin: 0 }}>
                    {latestRun.status}
                  </Tag>
                  <span style={{ fontSize: 12, color: 'var(--hrms-text-muted)', marginLeft: 6 }}>
                    {latestRun.totalEmployees || '-'} employees
                  </span>
                </div>
              </>
            ) : (
              <div className="stat-value" style={{ fontSize: 16, color: 'var(--hrms-text-muted)' }}>No runs yet</div>
            )}
          </MetricCard>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Overtime (This Month)"
            onClick={() => navigate('/overtime')}
            icon={<CalculatorOutlined />}
            accent={{ bg: '#faf5ff', color: '#7c3aed' }}
          >
            <div className="stat-value">{otStats?.totalEmployeesWithOT ?? '-'}</div>
            <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', marginTop: 2 }}>
              {otStats?.totalOvertimeHours != null
                ? `${otStats.totalOvertimeHours.toFixed(1)} total hours`
                : 'employees with OT'}
            </div>
          </MetricCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={10}>
          <SectionCard minHeight={420}>
            <SectionHeader
              title="Recent Activity"
              subtitle="Latest events across all modules"
              action={(
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
              )}
            />

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
                        {item.targetName && <span style={{ color: 'var(--hrms-text-secondary)' }}> - {item.targetName}</span>}
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
          </SectionCard>
        </Col>

        <Col xs={24} md={12} xl={7}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <SectionCard>
                <SectionHeader
                  title={<><GiftOutlined style={{ marginRight: 8, color: '#d97706' }} />Upcoming Holidays</>}
                  subtitle="Next calendar events for the team"
                />

                {upcomingHolidays.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {upcomingHolidays.map((holiday: any) => (
                      <div
                        key={holiday._id || holiday.date}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          padding: '8px 0',
                          borderBottom: '1px solid var(--hrms-border-light)',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{holiday.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)' }}>
                            {dayjs(holiday.date).format('DD MMMM YYYY')}
                            {holiday.type && <Tag style={{ marginLeft: 8, fontSize: 10 }}>{holiday.type}</Tag>}
                          </div>
                        </div>
                        {holiday.isPaid && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Paid</Tag>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--hrms-text-muted)', fontSize: 13 }}>
                    No upcoming holidays
                  </div>
                )}
              </SectionCard>
            </Col>

            <Col span={24}>
              <AnnouncementWidget />
            </Col>
          </Row>
        </Col>

        <Col xs={24} md={12} xl={7}>
          <SectionCard minHeight={420}>
            <SectionHeader
              title={<><SafetyOutlined style={{ marginRight: 8, color: '#059669' }} />Quick Actions</>}
              subtitle="Common operational shortcuts"
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {QUICK_ACTIONS.map((action, index) => (
                <div
                  key={index}
                  className="hrms-quick-action"
                  onClick={() => navigate(action.path)}
                  style={{
                    minHeight: 88,
                    padding: '14px 12px',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div
                    className="hrms-quick-action-icon"
                    style={{
                      background: action.bg,
                      color: action.color,
                      width: 36,
                      height: 36,
                      fontSize: 15,
                    }}
                  >
                    {action.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--hrms-text-primary)',
                        lineHeight: 1.35,
                      }}
                    >
                      {action.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--hrms-text-secondary)',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {action.path.replace('/', '').split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
