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

  const totalEmployees = empData?.meta?.total ?? 0;
  const totalDepartments = deptData?.meta?.total ?? 0;
  const totalDesignations = desigData?.meta?.total ?? 0;
  const totalShifts = shiftData?.meta?.total ?? 0;

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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { time: 'Today, 10:30 AM', text: 'New employee Rahul Kumar added to Production department', type: 'create' },
                { time: 'Today, 09:15 AM', text: 'Shift timing updated for Night Shift', type: 'update' },
                { time: 'Yesterday, 4:45 PM', text: 'Payroll for April 2024 generated successfully', type: 'payroll' },
                { time: 'Yesterday, 2:00 PM', text: 'New department "Quality Control" created', type: 'create' },
                { time: '2 days ago', text: 'Attendance marked for 45 workers', type: 'attendance' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.type === 'create' ? 'var(--hrms-primary)' : item.type === 'payroll' ? 'var(--hrms-success)' : 'var(--hrms-warning)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--hrms-text-primary)', fontWeight: 500 }}>{item.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)', marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              ))}
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