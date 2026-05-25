import { useNavigate } from 'react-router-dom';
import { Button, Row, Col } from 'antd';
import {
  TeamOutlined, BankOutlined, DollarOutlined, FieldTimeOutlined,
  SafetyCertificateOutlined, BarChartOutlined, ArrowRightOutlined,
  StarOutlined, SettingOutlined, FileTextOutlined,
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
      <style>{`
        .landing-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #f1f5f9;
          padding: 0 40px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .landing-logo-mark {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 800;
        }
        .landing-hero {
          padding: 140px 40px 80px;
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .landing-hero h1 {
          font-size: 52px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .landing-hero h1 span {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .landing-hero p {
          font-size: 18px;
          color: #64748b;
          max-width: 640px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .landing-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #eef2ff;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #4f46e5;
          margin-bottom: 24px;
        }
        .landing-features {
          padding: 80px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .landing-features h2 {
          text-align: center;
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .landing-features-sub {
          text-align: center;
          font-size: 15px;
          color: #64748b;
          margin-bottom: 48px;
        }
        .landing-feature-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          border: 1px solid #f1f5f9;
          transition: all 0.25s ease;
          height: 100%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .landing-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #e2e8f0;
        }
        .landing-feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 16px;
        }
        .landing-feature-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .landing-feature-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }
        .landing-stats {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 60px 40px;
        }
        .landing-stats-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .landing-stat-item {
          text-align: center;
        }
        .landing-stat-value {
          font-size: 36px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }
        .landing-stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin-top: 6px;
          font-weight: 500;
        }
        .landing-cta {
          padding: 80px 40px;
          text-align: center;
          background: white;
        }
        .landing-cta h2 {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .landing-cta p {
          font-size: 15px;
          color: #64748b;
          margin-bottom: 28px;
        }
        .landing-footer {
          padding: 24px 40px;
          text-align: center;
          border-top: 1px solid #f1f5f9;
          font-size: 12px;
          color: #94a3b8;
          background: white;
        }
      `}</style>

      <header className="landing-header">
        <div className="landing-logo">
          <div className="landing-logo-mark">H</div>
          HRMS
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
          <StarOutlined style={{ fontSize: 11 }} /> Manufacturing HRMS v1.0
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
        <p>Join 500+ manufacturing companies already using HRMS.</p>
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
        &copy; {new Date().getFullYear()} HRMS. All rights reserved. Built for manufacturing workforce management.
      </footer>
    </div>
  );
}
