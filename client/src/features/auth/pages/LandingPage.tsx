import { useNavigate } from 'react-router-dom';
import { Button, Row, Col } from 'antd';
import './LandingPage.css';
import {
  TeamOutlined, BankOutlined, DollarOutlined, FieldTimeOutlined,
  SafetyCertificateOutlined, BarChartOutlined, ArrowRightOutlined,
  StarOutlined,
} from '@ant-design/icons';

const FEATURES = [
  { icon: <TeamOutlined />, title: 'Employee Management', desc: 'Complete employee lifecycle with auto-generated codes, document management, and bulk import/export.' },
  { icon: <FieldTimeOutlined />, title: 'Attendance Tracking', desc: 'Daily attendance entry with shift management, overtime tracking, and configurable late-mark policies.' },
  { icon: <DollarOutlined />, title: 'Payroll Processing', desc: 'Full payroll cycle with configurable allowances, deductions, and compliance with Factories Act 1948.' },
  { icon: <BarChartOutlined />, title: 'Reports & Analytics', desc: 'Interactive reports for attendance, payroll, and workforce analytics with Excel export.' },
  { icon: <BankOutlined />, title: 'Organization Setup', desc: 'Departments, designations, shifts, holidays, and weekly-off rules — fully configurable.' },
  { icon: <SafetyCertificateOutlined />, title: 'Role-Based Access', desc: 'Granular permissions with Super Admin, HR Admin, HR Staff, Accounts, and Manager roles.' },
];

const STATS = [
  { label: 'Employees Managed', value: '10,000+' },
  { label: 'Payroll Runs', value: '50,000+' },
  { label: 'Companies Trusted', value: '500+' },
  { label: 'Uptime', value: '99.9%' },
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
          <StarOutlined style={{ fontSize: 11 }} /> Manufacturing Orian v1.0
        </div>
        <h1>
          Workforce Management<br />
          <span>Built for Manufacturing</span>
        </h1>
        <p>
          Digitize attendance, automate payroll, and manage your entire workforce 
          with a system designed for manufacturing companies. Compliant with 
          Factories Act 1948 and Payment of Wages Act.
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

      <section className="landing-features">
        <h2>Everything you need to run your workforce</h2>
        <p className="landing-features-sub">
          From employee onboarding to payroll — one platform, zero spreadsheets.
        </p>
        <Row gutter={[20, 20]}>
          {FEATURES.map((f, i) => (
            <Col xs={24} sm={12} md={8} key={i}>
              <div className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <div className="landing-feature-title">{f.title}</div>
                <div className="landing-feature-desc">{f.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      <section className="landing-stats">
        <div className="landing-stats-inner">
          <Row gutter={[32, 32]}>
            {STATS.map((s, i) => (
              <Col xs={12} md={6} key={i}>
                <div className="landing-stat-item">
                  <div className="landing-stat-value">{s.value}</div>
                  <div className="landing-stat-label">{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to streamline your HR operations?</h2>
        <p>Join 500+ manufacturing companies already using Orian.</p>
        <Button
          type="primary"
          size="large"
          style={{ borderRadius: 10, height: 48, padding: '0 36px', fontWeight: 600, fontSize: 15 }}
          onClick={() => navigate('/login')}
        >
          Get Started <ArrowRightOutlined style={{ marginLeft: 6 }} />
        </Button>
      </section>

      <footer className="landing-footer">
        &copy; {new Date().getFullYear()} Orian. All rights reserved. Built for manufacturing workforce management.
      </footer>
    </div>
  );
}
