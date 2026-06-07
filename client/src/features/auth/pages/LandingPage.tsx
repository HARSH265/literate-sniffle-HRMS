import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import './LandingPage.css';
import {
  TeamOutlined, DollarOutlined, FieldTimeOutlined,
  SafetyCertificateOutlined, BarChartOutlined, ArrowRightOutlined,
  StarOutlined, CalendarOutlined, UserOutlined, TrophyOutlined,
  WalletOutlined, DesktopOutlined, FileTextOutlined, FallOutlined,
  BankOutlined, CustomerServiceOutlined, AuditOutlined,
  NotificationOutlined, ClockCircleOutlined, FileProtectOutlined,
  CalculatorOutlined, GiftOutlined, BellOutlined,
  ArrowUpOutlined, UserAddOutlined, SafetyOutlined, RightOutlined,
  DashboardOutlined, AppstoreOutlined, PlayCircleOutlined,
  CreditCardOutlined, FileDoneOutlined, MessageOutlined,
  LockOutlined, EyeOutlined, KeyOutlined,
  RocketOutlined, ShopOutlined, ToolOutlined, ExperimentOutlined,
  LaptopOutlined, CloudServerOutlined,
} from '@ant-design/icons';

const CATEGORIES = [
  {
    title: 'Core HR',
    features: [
      { icon: <TeamOutlined />, title: 'Employee Management' },
      { icon: <FieldTimeOutlined />, title: 'Attendance & Shifts' },
      { icon: <BankOutlined />, title: 'Organization Setup' },
      { icon: <BarChartOutlined />, title: 'Reports & Analytics' },
    ],
  },
  {
    title: 'Compliance & Finance',
    features: [
      { icon: <DollarOutlined />, title: 'Payroll Processing' },
      { icon: <SafetyCertificateOutlined />, title: 'Statutory Compliance' },
      { icon: <WalletOutlined />, title: 'Loan Management' },
      { icon: <AuditOutlined />, title: 'Audit Logging' },
    ],
  },
  {
    title: 'Employee Experience',
    features: [
      { icon: <UserOutlined />, title: 'Self-Service Portal' },
      { icon: <CalendarOutlined />, title: 'Leave Management' },
      { icon: <TrophyOutlined />, title: 'Training & Skills' },
      { icon: <FallOutlined />, title: 'Performance Reviews' },
    ],
  },
  {
    title: 'Operations',
    features: [
      { icon: <FileTextOutlined />, title: 'Documents' },
      { icon: <DesktopOutlined />, title: 'Asset Tracking' },
      { icon: <CustomerServiceOutlined />, title: 'Helpdesk' },
      { icon: <NotificationOutlined />, title: 'Announcements' },
    ],
  },
];

const STATS = [
  { label: 'Happy Clients', value: '2,500+' },
  { label: 'Employees Managed', value: '1.2L+' },
  { label: 'Payrolls Processed', value: '50K+' },
  { label: 'Companies Trust Us', value: '350+' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: <BankOutlined />, title: 'Set Up Organization', desc: 'Create departments, designations, shifts, and holidays. Configure weekly-off rules and overtime policies.' },
  { step: '2', icon: <TeamOutlined />, title: 'Add Your Employees', desc: 'Bulk import or add employees one by one. Auto-generate employee codes and upload documents.' },
  { step: '3', icon: <DollarOutlined />, title: 'Configure Payroll', desc: 'Define salary structures, allowances, deductions, and loan types. Set up statutory components (PF, ESI, TDS).' },
  { step: '4', icon: <RocketOutlined />, title: 'Go Live', desc: 'Start marking attendance, processing payrolls, and running compliance checks. Your workforce is managed.' },
];

const COMPLIANCE_ITEMS = [
  { icon: <SafetyCertificateOutlined />, title: 'Factories Act 1948', desc: 'Shift management, overtime rules, spread-over limits, and weekly-off compliance built in.' },
  { icon: <DollarOutlined />, title: 'PF & ESI', desc: 'Auto-calculate Provident Fund and Employee State Insurance contributions with monthly returns.' },
  { icon: <FileTextOutlined />, title: 'TDS / Income Tax', desc: 'Tax deducted at source calculated per slab. Generate TDS returns and employee tax statements.' },
  { icon: <BankOutlined />, title: 'Payment of Wages Act', desc: 'Minimum wage enforcement, timely salary disbursement, and wage slip generation.' },
];

const USE_CASES = [
  { icon: <ShopOutlined />, title: 'Shop Floor Attendance', desc: 'QR-code kiosk scanning for shift workers. Track late marks, early exits, and overtime automatically.', tags: ['QR Kiosk', 'Shift Mgmt'] },
  { icon: <ToolOutlined />, title: 'Multi-Shift Payroll', desc: 'Different pay rules for day/night shifts. Auto-apply overtime multipliers and shift allowances.', tags: ['Overtime', 'Allowances'] },
  { icon: <ExperimentOutlined />, title: 'Factory Inspections', desc: 'Generate statutory reports for labor inspectors. Compliance dashboard with gap analysis.', tags: ['Reports', 'Compliance'] },
];

const ESS_ITEMS = [
  { icon: <FileTextOutlined />, label: 'View Payslips' },
  { icon: <CalendarOutlined />, label: 'Apply Leave' },
  { icon: <FieldTimeOutlined />, label: 'Track Attendance' },
  { icon: <SwapOutlined />, label: 'Swap Shifts' },
  { icon: <LaptopOutlined />, label: 'My Assets' },
  { icon: <DollarOutlined />, label: 'Apply Loan' },
];

const SECURITY_ITEMS = [
  { icon: <LockOutlined />, title: 'Role-Based Access', desc: '6 predefined roles with 56+ granular permissions. Control who sees what across every module.' },
  { icon: <EyeOutlined />, title: 'Audit Logging', desc: 'Every action logged with user, timestamp, and IP. Full traceability for compliance and security reviews.' },
  { icon: <KeyOutlined />, title: 'Secure Authentication', desc: 'JWT tokens with refresh rotation, bcrypt password hashing, and optional 2FA via TOTP.' },
  { icon: <CloudServerOutlined />, title: 'Data Encryption', desc: 'All data encrypted in transit (TLS) and at rest. MongoDB Atlas with automated backups.' },
];

function SwapOutlined() {
  return <RightOutlined style={{ transform: 'rotate(90deg)' }} />;
}

const SIDEBAR_ITEMS = [
  { icon: <DashboardOutlined />, label: 'Dashboard', active: true },
  { icon: <TeamOutlined />, label: 'Employees' },
  { icon: <AppstoreOutlined />, label: 'Organization' },
  { icon: <FieldTimeOutlined />, label: 'Attendance' },
  { icon: <CalendarOutlined />, label: 'Leave' },
  { icon: <DollarOutlined />, label: 'Payroll' },
  { icon: <PlayCircleOutlined />, label: 'Overtime' },
  { icon: <CreditCardOutlined />, label: 'Loans' },
  { icon: <BarChartOutlined />, label: 'Analytics' },
  { icon: <SafetyCertificateOutlined />, label: 'Training' },
  { icon: <StarOutlined />, label: 'Performance' },
  { icon: <MessageOutlined />, label: 'Communication' },
  { icon: <FileDoneOutlined />, label: 'Administration' },
];

const MOCK_STAT_CARDS = [
  { title: 'Total Employees', value: '247', sub: 'Active workforce', trend: true, iconBg: '#eef2ff', iconColor: '#4f46e5', icon: <TeamOutlined /> },
  { title: 'Departments', value: '8', sub: 'Organization units', trend: false, iconBg: '#f0f9ff', iconColor: '#0284c7', icon: <BankOutlined /> },
  { title: 'Designations', value: '12', sub: 'Job roles defined', trend: false, iconBg: '#faf5ff', iconColor: '#7c3aed', icon: <TrophyOutlined /> },
  { title: 'Shifts', value: '3', sub: 'Work schedules', trend: false, iconBg: '#ecfdf5', iconColor: '#059669', icon: <ClockCircleOutlined /> },
];

const MOCK_METRIC_CARDS = [
  { title: "Today's Attendance", icon: <FieldTimeOutlined />, iconBg: '#f0f9ff', iconColor: '#0284c7', type: 'att' as const },
  { title: 'Pending Approvals', icon: <FileProtectOutlined />, iconBg: '#fef2f2', iconColor: '#dc2626', type: 'approvals' as const },
  { title: 'Payroll', icon: <DollarOutlined />, iconBg: '#fffbeb', iconColor: '#d97706', type: 'payroll' as const },
  { title: 'Overtime (This Month)', icon: <CalculatorOutlined />, iconBg: '#faf5ff', iconColor: '#7c3aed', type: 'overtime' as const },
];

const MOCK_ACTIVITIES = [
  { action: 'CREATE', module: 'Employee', target: 'Rahul Sharma', user: 'Priya Verma', time: '12m ago', color: '#4f46e5' },
  { action: 'UPDATE', module: 'Attendance', target: 'Shift A', user: 'System', time: '1h ago', color: '#d97706' },
  { action: 'PROCESS', module: 'Payroll', target: 'June 2026', user: 'Amit Patel', time: '3h ago', color: '#059669' },
  { action: 'CREATE', module: 'Leave', target: 'Neha Gupta', user: 'Neha Gupta', time: '5h ago', color: '#4f46e5' },
  { action: 'DELETE', module: 'Document', target: 'Expired ID', user: 'Rajesh Kumar', time: 'Yesterday', color: '#dc2626' },
];

const MOCK_HOLIDAYS = [
  { name: 'Independence Day', date: '15 Aug 2026', paid: true },
  { name: 'Ganesh Chaturthi', date: '26 Aug 2026', paid: true },
];

const MOCK_ANNOUNCEMENTS = [
  { title: 'Annual Safety Training', priority: 'high', date: '03 Jun 2026' },
  { title: 'Office Timings Update', priority: 'normal', date: '01 Jun 2026' },
];

const MOCK_QUICK_ACTIONS = [
  { label: 'Add Employee', icon: <UserAddOutlined />, color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Mark Attendance', icon: <SafetyOutlined />, color: '#059669', bg: '#ecfdf5' },
  { label: 'Process Payroll', icon: <DollarOutlined />, color: '#d97706', bg: '#fffbeb' },
  { label: 'Generate Reports', icon: <BarChartOutlined />, color: '#0284c7', bg: '#f0f9ff' },
  { label: 'View Audit Logs', icon: <AuditOutlined />, color: '#7c3aed', bg: '#faf5ff' },
  { label: 'Manage Users', icon: <SafetyOutlined />, color: '#0891b2', bg: '#ecfeff' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      <header className="landing-header">
        <div className="landing-logo">
          <div className="landing-logo-mark">O</div>
          Orian
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            type="primary"
            size="large"
            style={{ borderRadius: 10, height: 42, padding: '0 24px', fontWeight: 600, fontSize: 14 }}
            onClick={() => navigate('/login')}
          >
            Sign In <ArrowRightOutlined style={{ marginLeft: 6, fontSize: 13 }} />
          </Button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-badge">
          <StarOutlined style={{ fontSize: 11 }} /> Orian HRMS v1.0
        </div>
        <h1>
          Workforce Management<br />
          <span>Built for Manufacturing</span>
        </h1>
        <p>
          Digitize attendance, automate payroll, and manage your entire workforce
          with a system designed for manufacturing companies. Compliant with
          Factories Act 1948, Payment of Wages Act, PF, ESI, and TDS regulations.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            style={{ borderRadius: 10, height: 48, padding: '0 32px', fontWeight: 600, fontSize: 15 }}
            onClick={() => navigate('/login')}
          >
            Get Started <ArrowRightOutlined style={{ marginLeft: 6 }} />
          </Button>
          <Button
            size="large"
            style={{ borderRadius: 10, height: 48, padding: '0 32px', fontWeight: 500, fontSize: 15, borderColor: '#e2e8f0' }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </div>
      </section>

      {/* ── Dashboard Snapshot ── */}
      <section className="landing-snapshot">
        <h2>See your workforce at a glance</h2>
        <p className="landing-snapshot-sub">
          A real-time dashboard that gives HR and management instant visibility
          into attendance, payroll, and organizational health.
        </p>

        <div className="landing-dashboard-mockup">
          <div className="mock-sidebar">
            <div className="mock-sidebar-logo">
              <div className="mock-sidebar-logo-icon">O</div>
              <div>
                <div className="mock-sidebar-brand">Orian</div>
                <div className="mock-sidebar-sub">Management System</div>
              </div>
            </div>
            <div className="mock-sidebar-menu">
              {SIDEBAR_ITEMS.map((item, i) => (
                <div className={`mock-sidebar-item ${item.active ? 'mock-sidebar-active' : ''}`} key={i}>
                  <span className="mock-sidebar-icon">{item.icon}</span>
                  <span className="mock-sidebar-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mock-main">
            <div className="mock-topnav">
              <div className="mock-topnav-left">
                <div className="mock-topnav-hamburger">☰</div>
              </div>
              <div className="mock-topnav-right">
                <div className="mock-topnav-bell">🔔</div>
                <div className="mock-topnav-user">
                  <div className="mock-topnav-avatar">H</div>
                  <div>
                    <div className="mock-topnav-name">Harshit</div>
                    <div className="mock-topnav-role">Super Admin</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mock-main-header">
              <h2>Good morning!</h2>
              <p>Here's what's happening across your organization today.</p>
            </div>

            <div className="dash-row">
              {MOCK_STAT_CARDS.map((s, i) => (
                <div className="dash-stat-card" key={i}>
                  <div className="dash-stat-top">
                    <div>
                      <div className="dash-stat-label">{s.title}</div>
                      <div className="dash-stat-value">{s.value}</div>
                      <div className="dash-stat-sub">{s.sub}</div>
                    </div>
                    <div className="dash-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                  </div>
                  {s.trend && (
                    <div className="dash-stat-trend"><ArrowUpOutlined /> <span>vs last month</span></div>
                  )}
                </div>
              ))}
            </div>

            <div className="dash-row">
              {MOCK_METRIC_CARDS.map((m, i) => (
                <div className="dash-stat-card" key={i}>
                  <div className="dash-stat-top">
                    <div>
                      <div className="dash-stat-label">{m.title}</div>
                      {m.type === 'att' && (
                        <>
                          <div className="dash-metric-main">
                            <span style={{ color: '#22c55e' }}>214</span>
                            <span className="dash-metric-sep">/</span>
                            <span style={{ color: '#ef4444' }}>23</span>
                          </div>
                          <div className="dash-stat-sub">
                            <span style={{ color: '#f59e0b' }}>5 half-day</span>
                            <span className="dash-metric-dot">·</span>
                            <span>5 on leave</span>
                          </div>
                        </>
                      )}
                      {m.type === 'approvals' && (
                        <>
                          <div className="dash-stat-value">8</div>
                          <div className="dash-stat-sub">
                            <span style={{ color: '#1890ff' }}>5 leave</span>
                            <span className="dash-metric-dot">·</span>
                            <span style={{ color: '#722ed1' }}>3 loans</span>
                          </div>
                        </>
                      )}
                      {m.type === 'payroll' && (
                        <>
                          <div className="dash-stat-value" style={{ fontSize: 18 }}>06/2026</div>
                          <div className="dash-stat-sub" style={{ marginTop: 2 }}>
                            <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>finalized</Tag>
                            <span style={{ marginLeft: 6 }}>247 employees</span>
                          </div>
                        </>
                      )}
                      {m.type === 'overtime' && (
                        <>
                          <div className="dash-stat-value">18</div>
                          <div className="dash-stat-sub">142.5 total hours</div>
                        </>
                      )}
                    </div>
                    <div className="dash-stat-icon" style={{ background: m.iconBg, color: m.iconColor }}>{m.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dash-row-3">
              <div className="dash-section-card">
                <div className="dash-section-header">
                  <div>
                    <h3>Recent Activity</h3>
                    <p>Latest events across all modules</p>
                  </div>
                  <span className="dash-view-all">View All →</span>
                </div>
                <div className="dash-activity-list">
                  {MOCK_ACTIVITIES.map((item, i) => (
                    <div className="dash-activity-item" key={i}>
                      <div className="dash-activity-dot" style={{ background: item.color, borderColor: item.color }} />
                      <div className="dash-activity-content">
                        <div className="dash-activity-main">
                          <span className="dash-activity-badge" style={{ color: item.color, background: `${item.color}14` }}>{item.action}</span>
                          {item.module} <span style={{ color: '#64748b' }}>- {item.target}</span>
                        </div>
                        <div className="dash-activity-user">{item.user}</div>
                      </div>
                      <div className="dash-activity-time">{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-col-stack">
                <div className="dash-section-card">
                  <div className="dash-section-header">
                    <div>
                      <h3><GiftOutlined style={{ marginRight: 8, color: '#d97706' }} />Upcoming Holidays</h3>
                    </div>
                  </div>
                  <div className="dash-holiday-list">
                    {MOCK_HOLIDAYS.map((h, i) => (
                      <div className="dash-holiday-item" key={i}>
                        <div>
                          <div className="dash-holiday-name">{h.name}</div>
                          <div className="dash-holiday-date">{h.date} <Tag style={{ fontSize: 10, marginLeft: 6 }}>{h.date.includes('Aug') ? 'Public' : 'Festival'}</Tag></div>
                        </div>
                        {h.paid && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Paid</Tag>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dash-section-card">
                  <div className="dash-section-header">
                    <div>
                      <h3><BellOutlined style={{ marginRight: 8, color: '#4f46e5' }} />Announcements</h3>
                    </div>
                    <span className="dash-view-all">View All <RightOutlined style={{ fontSize: 10 }} /></span>
                  </div>
                  <div className="dash-announcement-list">
                    {MOCK_ANNOUNCEMENTS.map((a, i) => (
                      <div className="dash-announcement-item" key={i}>
                        <div className="dash-announcement-top">
                          <span className="dash-announcement-title">{a.title}</span>
                          <Tag color={a.priority === 'high' ? 'orange' : 'blue'} style={{ fontSize: 10, margin: 0 }}>{a.priority.toUpperCase()}</Tag>
                        </div>
                        <div className="dash-announcement-date">{a.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dash-section-card">
                <div className="dash-section-header">
                  <div>
                    <h3><SafetyOutlined style={{ marginRight: 8, color: '#059669' }} />Quick Actions</h3>
                    <p>Common operational shortcuts</p>
                  </div>
                </div>
                <div className="dash-quick-grid">
                  {MOCK_QUICK_ACTIONS.map((a, i) => (
                    <div className="dash-quick-action" key={i}>
                      <div className="dash-quick-icon" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                      <div>
                        <div className="dash-quick-label">{a.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-how">
        <h2>Up and running in 4 steps</h2>
        <p className="landing-how-sub">From signup to your first payroll run — the entire setup takes hours, not weeks.</p>
        <div className="how-grid">
          {HOW_IT_WORKS.map((s, i) => (
            <div className="how-card" key={i}>
              <div className="how-step-num">{s.step}</div>
              <div className="how-icon">{s.icon}</div>
              <div className="how-title">{s.title}</div>
              <div className="how-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Compliance Highlight ── */}
      <section className="landing-compliance">
        <div className="compliance-inner">
          <div className="compliance-text">
            <h2>Built for Indian factory compliance</h2>
            <p>Stop worrying about labor law changes. Orian keeps your payroll compliant with automated statutory calculations and one-click report generation.</p>
          </div>
          <div className="compliance-grid">
            {COMPLIANCE_ITEMS.map((c, i) => (
              <div className="compliance-card" key={i}>
                <div className="compliance-icon">{c.icon}</div>
                <div className="compliance-title">{c.title}</div>
                <div className="compliance-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industry Use Cases ── */}
      <section className="landing-usecases">
        <h2>Designed for how factories actually work</h2>
        <p className="landing-usecases-sub">Generic HR tools don't understand manufacturing. Orian does.</p>
        <div className="usecases-grid">
          {USE_CASES.map((u, i) => (
            <div className="usecase-card" key={i}>
              <div className="usecase-icon">{u.icon}</div>
              <div className="usecase-title">{u.title}</div>
              <div className="usecase-desc">{u.desc}</div>
              <div className="usecase-tags">
                {u.tags.map((t, ti) => <span className="usecase-tag" key={ti}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ESS Portal Preview ── */}
      <section className="landing-ess">
        <div className="ess-inner">
          <div className="ess-text">
            <h2>Your employees deserve better than WhatsApp</h2>
            <p>A dedicated self-service portal where employees can view payslips, apply for leave, track attendance, swap shifts, and manage their assets — all in one place.</p>
          </div>
          <div className="ess-mockup">
            <div className="ess-mockup-header">
              <div className="ess-mockup-avatar">RS</div>
              <div>
                <div className="ess-mockup-name">Rahul Sharma</div>
                <div className="ess-mockup-role">Machine Operator — Shift A</div>
              </div>
            </div>
            <div className="ess-grid">
              {ESS_ITEMS.map((item, i) => (
                <div className="ess-item" key={i}>
                  <div className="ess-item-icon">{item.icon}</div>
                  <div className="ess-item-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features (Mega Menu) ── */}
      <section className="landing-features">
        <h2>Everything you need to run your workforce</h2>
        <p className="landing-features-sub">
          From employee onboarding to payroll compliance — one platform, zero spreadsheets.
        </p>
        <div className="mega-grid">
          {CATEGORIES.map((cat, ci) => (
            <div className="mega-column" key={ci}>
              <div className="mega-heading">{cat.title}</div>
              {cat.features.map((f, fi) => (
                <div className="mega-item" key={fi}>
                  <span className="mega-icon">{f.icon}</span>
                  <span className="mega-label">{f.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Security & Trust ── */}
      <section className="landing-security">
        <h2>Enterprise-grade security</h2>
        <p className="landing-security-sub">Your workforce data is protected by industry-standard security practices.</p>
        <div className="security-grid">
          {SECURITY_ITEMS.map((s, i) => (
            <div className="security-card" key={i}>
              <div className="security-icon">{s.icon}</div>
              <div className="security-title">{s.title}</div>
              <div className="security-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats + CTA Combined ── */}
      <section className="landing-stats-cta">
        <div className="stats-cta-inner">
          {/* Left: ESS Phone Mockup */}
          <div className="stats-cta-left">
            <div className="ess-phone-frame">
              {/* Status Bar */}
              <div className="ess-status-bar">
                <span>15:30</span>
                <span className="ess-status-icons">●●●●○</span>
              </div>
              {/* Top Header */}
              <div className="ess-top-bar">
                <div className="ess-avatar"><UserOutlined style={{ fontSize: 18, color: 'white' }} /></div>
                <div className="ess-user-info">
                  <div className="ess-user-name">Harshit</div>
                  <div className="ess-user-role">super-admin</div>
                </div>
                <BellOutlined className="ess-bell" />
                <div className="ess-logout-btn">
                  <span>Logout</span>
                </div>
              </div>
              {/* Scrollable Content */}
              <div className="ess-scroll-content">
              {/* Welcome Banner */}
              <div className="ess-welcome-banner">
                <div className="ess-welcome-sub">Welcome back,</div>
                <div className="ess-welcome-name">Employee</div>
                <div className="ess-welcome-dashboard">
                  <AppstoreOutlined /> Employee Dashboard
                </div>
              </div>
              {/* Info Cards */}
              <div className="ess-info-grid">
                <div className="ess-info-card">
                  <div className="ess-info-label">Employee Code</div>
                  <div className="ess-info-value">EMP-0247</div>
                </div>
                <div className="ess-info-card">
                  <div className="ess-info-label">Department</div>
                  <div className="ess-info-value">Production</div>
                </div>
                <div className="ess-info-card">
                  <div className="ess-info-label">Designation</div>
                  <div className="ess-info-value">Operator</div>
                </div>
                <div className="ess-info-card">
                  <div className="ess-info-label">Shift</div>
                  <div className="ess-info-value">Shift A</div>
                </div>
              </div>
              {/* Quick Links */}
              <div className="ess-section-card">
                <div className="ess-section-title">Quick Links</div>
                <div className="ess-quick-grid">
                  <div className="ess-quick-item">
                    <UserOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                    <div className="ess-quick-label">Profile</div>
                    <div className="ess-quick-sub">View & Edit</div>
                  </div>
                  <div className="ess-quick-item">
                    <AppstoreOutlined style={{ fontSize: 20, color: '#0891b2' }} />
                    <div className="ess-quick-label">Check In / Out</div>
                    <div className="ess-quick-sub">Scan QR</div>
                  </div>
                  <div className="ess-quick-item">
                    <CalendarOutlined style={{ fontSize: 20, color: '#059669' }} />
                    <div className="ess-quick-label">Leave</div>
                    <div className="ess-quick-sub">Apply / View</div>
                  </div>
                  <div className="ess-quick-item">
                    <FileTextOutlined style={{ fontSize: 20, color: '#d97706' }} />
                    <div className="ess-quick-label">Payslips</div>
                    <div className="ess-quick-sub">Download</div>
                  </div>
                  <div className="ess-quick-item">
                    <LaptopOutlined style={{ fontSize: 20, color: '#059669' }} />
                    <div className="ess-quick-label">Assets</div>
                    <div className="ess-quick-sub">View Allocated</div>
                  </div>
                  <div className="ess-quick-item">
                    <FieldTimeOutlined style={{ fontSize: 20, color: '#7c3aed' }} />
                    <div className="ess-quick-label">Shift Swap</div>
                    <div className="ess-quick-sub">Request / View</div>
                  </div>
                  <div className="ess-quick-item">
                    <FileProtectOutlined style={{ fontSize: 20, color: '#0891b2' }} />
                    <div className="ess-quick-label">Training</div>
                    <div className="ess-quick-sub">View Programs</div>
                  </div>
                </div>
              </div>
              {/* Announcements */}
              <div className="ess-section-card">
                <div className="ess-section-row">
                  <span className="ess-section-title" style={{ marginBottom: 0 }}><BellOutlined style={{ marginRight: 6 }} />Announcements</span>
                  <span className="ess-view-all">View All {'>'}</span>
                </div>
                <div className="ess-empty-state">No announcements</div>
              </div>
              {/* Pending Change Requests */}
              <div className="ess-section-card">
                <div className="ess-section-title">Pending Change Requests</div>
                <div className="ess-empty-state">No pending requests</div>
              </div>
              </div>{/* end ess-scroll-content */}
              {/* Bottom Nav */}
              <div className="ess-bottom-nav">
                <div className="ess-nav-item active"><DashboardOutlined /><span>Home</span></div>
                <div className="ess-nav-item"><ClockCircleOutlined /><span>Attendance</span></div>
                <div className="ess-nav-item"><CalendarOutlined /><span>Leave</span></div>
                <div className="ess-nav-item"><UserOutlined /><span>Profile</span></div>
                <div className="ess-nav-item"><AppstoreOutlined /><span>More</span></div>
              </div>
            </div>
          </div>

          {/* Right: Stats + CTA */}
          <div className="stats-cta-right">
            <h2>Ready to streamline your HR operations?</h2>
            <p>Join manufacturing companies already using Orian to manage their workforce.</p>
            <Button
              type="primary"
              size="large"
              style={{ borderRadius: 10, height: 48, padding: '0 36px', fontWeight: 600, fontSize: 15, marginBottom: 40 }}
              onClick={() => navigate('/login')}
            >
              Get Started <ArrowRightOutlined style={{ marginLeft: 6 }} />
            </Button>
            <div className="stats-cta-stats-grid">
              {STATS.map((s, i) => (
                <div className="stats-cta-stat" key={i}>
                  <div className="stats-cta-stat-value">{s.value}</div>
                  <div className="stats-cta-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-logo-mark">O</div>
              <div>
                <div className="footer-brand-name">Orian</div>
                <div className="footer-brand-sub">Workforce Management</div>
              </div>
            </div>
            <p className="footer-desc">Built for manufacturing companies. Digitize attendance, automate payroll, and manage your workforce.</p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Product</div>
            <div className="footer-link">Features</div>
            <div className="footer-link">Compliance</div>
            <div className="footer-link">Self-Service Portal</div>
            <div className="footer-link">Reports & Analytics</div>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Company</div>
            <div className="footer-link">About</div>
            <div className="footer-link">Contact</div>
            <div className="footer-link">Privacy Policy</div>
            <div className="footer-link">Terms of Service</div>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Built with</div>
            <div className="footer-tech">
              <span className="footer-tech-badge">React</span>
              <span className="footer-tech-badge">Node.js</span>
              <span className="footer-tech-badge">MongoDB</span>
              <span className="footer-tech-badge">TypeScript</span>
            </div>
            <div className="footer-india">Made in India for Indian manufacturers</div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Orian. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
