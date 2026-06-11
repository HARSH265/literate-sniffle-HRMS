import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import './LandingPage.css';
import {
  TeamOutlined, DollarOutlined, FieldTimeOutlined,
  SafetyCertificateOutlined, BarChartOutlined, ArrowRightOutlined,
  CalendarOutlined, BankOutlined, AuditOutlined,
  FileProtectOutlined,
  RocketOutlined, LockOutlined, EyeOutlined, KeyOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

const FEATURES = [
  { icon: <TeamOutlined />, title: 'Employee Management', desc: 'Centralized employee database with profiles, documents, and org hierarchy.' },
  { icon: <FieldTimeOutlined />, title: 'Attendance & Shifts', desc: 'QR-code kiosk, shift scheduling, overtime tracking, and weekly-off rules.' },
  { icon: <DollarOutlined />, title: 'Payroll Processing', desc: 'Automated salary computation with arrears, loans, and multi-bank splits.' },
  { icon: <SafetyCertificateOutlined />, title: 'Statutory Compliance', desc: 'PF, ESI, TDS, PT auto-calculation with one-click challan and return generation.' },
  { icon: <CalendarOutlined />, title: 'Leave Management', desc: 'Configurable leave types, approval workflows, and balance tracking.' },
  { icon: <AuditOutlined />, title: 'Loan & Advances', desc: 'Loan creation, EMI deduction, outstanding tracking, and reconciliation.' },
  { icon: <BarChartOutlined />, title: 'Reports & Analytics', desc: 'Headcount cost, MoM variance, YTD analysis, and budget vs actual reports.' },
  { icon: <FileProtectOutlined />, title: 'Self-Service Portal', desc: 'Employees view payslips, apply leave, track attendance, and manage assets.' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: <BankOutlined />, title: 'Set Up', desc: 'Create departments, shifts, holidays, and salary structures.' },
  { step: '2', icon: <TeamOutlined />, title: 'Add Employees', desc: 'Bulk import or add one by one. Auto-generate codes.' },
  { step: '3', icon: <DollarOutlined />, title: 'Configure Payroll', desc: 'Define components, allowances, deductions, and statutory rules.' },
  { step: '4', icon: <RocketOutlined />, title: 'Go Live', desc: 'Mark attendance, run payroll, generate compliance reports.' },
];

const SECURITY = [
  { icon: <LockOutlined />, title: 'Role-Based Access', desc: '6 roles, 56+ granular permissions across every module.' },
  { icon: <EyeOutlined />, title: 'Audit Logging', desc: 'Every action logged with user, timestamp, and IP address.' },
  { icon: <KeyOutlined />, title: 'Secure Auth', desc: 'JWT with refresh rotation, bcrypt hashing, optional 2FA.' },
  { icon: <CloudServerOutlined />, title: 'Encrypted Data', desc: 'TLS in transit, encrypted at rest, automated backups.' },
];

const STATS = [
  { label: 'Happy Clients', value: '2,500+' },
  { label: 'Employees Managed', value: '1.2L+' },
  { label: 'Payrolls Processed', value: '50K+' },
  { label: 'Companies Trust Us', value: '350+' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp">

      {/* Header */}
      <header className="lp-header">
        <div className="lp-logo">
          <div className="lp-logo-mark">O</div>
          Orian
        </div>
        <Button type="primary" size="large" className="lp-header-btn" onClick={() => navigate('/login')}>
          Sign In <ArrowRightOutlined style={{ marginLeft: 6, fontSize: 13 }} />
        </Button>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-badge">HRMS built for manufacturing</div>
        <h1>
          Manage your entire<br />
          <span>workforce in one place</span>
        </h1>
        <p>
          Attendance, payroll, compliance, leave, loans, training, and self-service —
          everything your HR team needs, designed for Indian factories.
        </p>
        <div className="lp-hero-actions">
          <Button type="primary" size="large" className="lp-hero-btn-primary" onClick={() => navigate('/login')}>
            Get Started <ArrowRightOutlined style={{ marginLeft: 6 }} />
          </Button>
          <Button size="large" className="lp-hero-btn-secondary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section">
        <h2>Everything you need</h2>
        <p className="lp-section-sub">One platform to replace spreadsheets, WhatsApp groups, and disconnected tools.</p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className="lp-feature-card" key={i}>
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="lp-section lp-section-alt">
        <h2>See your workforce at a glance</h2>
        <p className="lp-section-sub">Real-time dashboard with attendance, payroll status, and organizational health.</p>
        <div className="lp-dashboard-preview">
          <div className="lp-dash-top">
            <div className="lp-dash-card">
              <div className="lp-dash-card-label">Total Employees</div>
              <div className="lp-dash-card-value">247</div>
              <div className="lp-dash-card-sub">Active workforce</div>
            </div>
            <div className="lp-dash-card">
              <div className="lp-dash-card-label">Today's Attendance</div>
              <div className="lp-dash-card-attendance">
                <span className="lp-att-present">214</span>
                <span className="lp-att-sep">/</span>
                <span className="lp-att-absent">23</span>
              </div>
              <div className="lp-dash-card-sub">5 half-day &middot; 5 on leave</div>
            </div>
            <div className="lp-dash-card">
              <div className="lp-dash-card-label">Payroll</div>
              <div className="lp-dash-card-value" style={{ fontSize: 20 }}>06/2026</div>
              <div className="lp-dash-card-sub">Finalized &middot; 247 employees</div>
            </div>
            <div className="lp-dash-card">
              <div className="lp-dash-card-label">Pending Approvals</div>
              <div className="lp-dash-card-value" style={{ color: '#dc2626' }}>8</div>
              <div className="lp-dash-card-sub">5 leave &middot; 3 loans</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="lp-section">
        <h2>Up and running in 4 steps</h2>
        <p className="lp-section-sub">From signup to your first payroll run — hours, not weeks.</p>
        <div className="lp-how-grid">
          {HOW_IT_WORKS.map((s, i) => (
            <div className="lp-how-card" key={i}>
              <div className="lp-how-num">{s.step}</div>
              <div className="lp-how-icon">{s.icon}</div>
              <div className="lp-how-title">{s.title}</div>
              <div className="lp-how-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="lp-section lp-section-alt">
        <h2>Enterprise-grade security</h2>
        <p className="lp-section-sub">Your workforce data is protected by industry-standard practices.</p>
        <div className="lp-security-grid">
          {SECURITY.map((s, i) => (
            <div className="lp-security-card" key={i}>
              <div className="lp-security-icon">{s.icon}</div>
              <div className="lp-security-title">{s.title}</div>
              <div className="lp-security-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Ready to streamline your HR?</h2>
        <p>Join manufacturing companies already using Orian.</p>
        <Button type="primary" size="large" className="lp-hero-btn-primary" onClick={() => navigate('/login')}>
          Get Started <ArrowRightOutlined style={{ marginLeft: 6 }} />
        </Button>
        <div className="lp-stats-row">
          {STATS.map((s, i) => (
            <div className="lp-stat" key={i}>
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">O</div>
            <div>
              <div className="lp-footer-name">Orian</div>
              <div className="lp-footer-sub">Workforce Management</div>
            </div>
          </div>
          <div className="lp-footer-links">
            <span>Features</span>
            <span>Compliance</span>
            <span>Self-Service</span>
            <span>Contact</span>
          </div>
          <div className="lp-footer-tech">
            <span>React</span>
            <span>Node.js</span>
            <span>MongoDB</span>
            <span>TypeScript</span>
          </div>
        </div>
        <div className="lp-footer-bottom">
          &copy; {new Date().getFullYear()} Orian. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
