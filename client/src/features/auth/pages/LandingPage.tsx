import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  { icon: 'fa-users', title: 'Employee Management', desc: 'Centralized employee database with profiles, documents, org hierarchy, and role assignments.' },
  { icon: 'fa-clock', title: 'Attendance & Shifts', desc: 'QR-code kiosk, shift scheduling, overtime tracking, and weekly off rules built for factory floors.' },
  { icon: 'fa-wallet', title: 'Payroll Processing', desc: 'Automated salary computation with arrears, loans, and multi-bank splits. One-click disbursal.' },
  { icon: 'fa-shield-halved', title: 'Statutory Compliance', desc: 'PF, ESI, TDS, PT auto-calculation with one-click challan and return generation.' },
  { icon: 'fa-calendar-check', title: 'Leave Management', desc: 'Configurable leave types, approval workflows, balance tracking, and encashment rules.' },
  { icon: 'fa-hand-holding-dollar', title: 'Loan & Advances', desc: 'Loan creation, EMI deduction, outstanding tracking, and automatic reconciliation.' },
  { icon: 'fa-chart-column', title: 'Reports & Analytics', desc: 'Headcount cost, MoM variance, YTD analysis, and budget vs actual reports in real-time.' },
  { icon: 'fa-mobile-screen', title: 'Self-Service Portal', desc: 'Employees view payslips, apply leave, track attendance, and manage assets independently.' },
];

const STEPS = [
  { num: 1, icon: 'fa-building', title: 'Set Up', desc: 'Create departments, shifts, holidays, and salary structures in minutes.' },
  { num: 2, icon: 'fa-user-plus', title: 'Add Employees', desc: 'Bulk import or add one by one. Auto-generate employee codes instantly.' },
  { num: 3, icon: 'fa-gear', title: 'Configure Payroll', desc: 'Define components, allowances, deductions, and statutory rules effortlessly.' },
  { num: 4, icon: 'fa-rocket', title: 'Go Live', desc: 'Mark attendance, run payroll, and generate compliance reports on day one.' },
];

const SECURITY = [
  { icon: 'fa-user-shield', title: 'Role-Based Access', desc: '6 roles, 56+ granular permissions across every module. Least-privilege by default.' },
  { icon: 'fa-clock-rotate-left', title: 'Audit Logging', desc: 'Every action logged with user, timestamp, and IP address. Tamper-proof trail.' },
  { icon: 'fa-lock', title: 'Secure Auth', desc: 'JWT with refresh rotation, bcrypt hashing, optional 2FA for all accounts.' },
  { icon: 'fa-database', title: 'Encrypted Data', desc: 'TLS in transit, AES-256 at rest, automated backups with point-in-time recovery.' },
];

const STATS = [
  { target: 2500, suffix: '+', label: 'Happy Clients' },
  { target: 12, suffix: 'L+', label: 'Employees Managed' },
  { target: 50, suffix: 'K+', label: 'Payrolls Processed' },
  { target: 350, suffix: '+', label: 'Companies Trust Us' },
];

const CHART_DATA = [65, 78, 82, 70, 88, 92, 85];
const CHART_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            setVisibleItems((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const addRef = (el: HTMLElement | null, index: number) => {
    sectionRefs.current[index] = el;
  };

  return (
    <div className="lp">

      {/* NAVBAR */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-nav-logo" onClick={() => navigate('/')}>
            <div className="lp-nav-logo-icon">O</div>
            <span className="lp-nav-logo-text">Orian</span>
          </div>
          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it Works</a></li>
            <li><a href="#security">Security</a></li>
          </ul>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="lp-btn-primary" onClick={() => navigate('/login')}>
              Get Started <i className="fas fa-arrow-right" style={{ fontSize: 11 }} />
            </button>
            <button className="lp-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              <span className={mobileOpen ? 'open' : ''} />
              <span className={mobileOpen ? 'open' : ''} />
              <span className={mobileOpen ? 'open' : ''} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <div className={`lp-mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it Works</a>
        <a href="#security" onClick={() => setMobileOpen(false)}>Security</a>
        <div className="lp-mobile-nav-divider" />
        <a href="#" onClick={() => { setMobileOpen(false); navigate('/login'); }}>Sign In</a>
        <a href="#" className="lp-mobile-nav-cta" onClick={() => { setMobileOpen(false); navigate('/login'); }}>Get Started →</a>
      </div>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-badge">
          <span className="lp-hero-badge-dot" />
          HRMS Built for Manufacturing
        </div>
        <h1>Manage your entire<br /><span>workforce in one place</span></h1>
        <p className="lp-hero-desc">
          Attendance, payroll, compliance, leave, loans, training, and self-service —
          <strong> everything your HR team needs</strong>, designed for Indian factories.
        </p>
        <div className="lp-hero-cta">
          <button className="lp-btn-primary-lg" onClick={() => navigate('/login')}>
            Get Started Free <i className="fas fa-arrow-right" style={{ fontSize: 13 }} />
          </button>
          <button className="lp-btn-ghost-lg" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
        <div className="lp-hero-trust">
          <i className="fas fa-check-circle" /> No credit card required &nbsp;·&nbsp;
          <i className="fas fa-check-circle" /> Free 14-day trial &nbsp;·&nbsp;
          <i className="fas fa-check-circle" /> Setup in under an hour
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <div className="lp-dash-wrapper">
        <div className="lp-dash-card">
          <div className="lp-dash-chrome">
            <div className="lp-dash-dots">
              <span className="dot-red" /><span className="dot-yellow" /><span className="dot-green" />
            </div>
            <span className="lp-dash-chrome-title">Orian Dashboard — orian.app/dashboard</span>
          </div>
          <div className="lp-dash-body">
            <div className="lp-dash-stats">
              <div className="lp-dash-stat">
                <div className="lp-dash-stat-label">Total Employees</div>
                <div className="lp-dash-stat-value">247</div>
                <div className="lp-dash-stat-sub">Active workforce</div>
              </div>
              <div className="lp-dash-stat">
                <div className="lp-dash-stat-label">Today's Attendance</div>
                <div className="lp-dash-stat-attendance">
                  <span className="lp-att-green">214</span>
                  <span className="lp-att-red">23</span>
                </div>
                <div className="lp-dash-stat-sub">5 half-day · 3 on leave</div>
              </div>
              <div className="lp-dash-stat">
                <div className="lp-dash-stat-label">Payroll</div>
                <div className="lp-dash-stat-value lp-dash-stat-sm">06/2026</div>
                <div className="lp-dash-stat-sub">Finalised · 247 employees</div>
              </div>
              <div className="lp-dash-stat">
                <div className="lp-dash-stat-label">Pending Approvals</div>
                <div className="lp-dash-stat-value lp-dash-stat-purple">8</div>
                <div className="lp-dash-stat-sub">5 leave · 3 loans</div>
              </div>
            </div>
            <div className="lp-dash-grid">
              <div className="lp-dash-chart">
                <div className="lp-dash-chart-title">Attendance Trend — Last 7 Days</div>
                <div className="lp-dash-chart-bars">
                  {CHART_DATA.map((val, i) => (
                    <div key={i} className="lp-dash-chart-col">
                      <div className="lp-dash-chart-bar" style={{ height: `${val}%` }} />
                      <span className="lp-dash-chart-label">{CHART_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-dash-actions">
                <div className="lp-dash-actions-title">Pending Actions</div>
                <div className="lp-dash-action">
                  <span className="lp-dash-action-dot" style={{ background: '#f59e0b' }} />
                  <span className="lp-dash-action-text">Approve leave requests</span>
                  <span className="lp-dash-action-count">5</span>
                </div>
                <div className="lp-dash-action">
                  <span className="lp-dash-action-dot" style={{ background: '#6366f1' }} />
                  <span className="lp-dash-action-text">Loan approvals pending</span>
                  <span className="lp-dash-action-count">3</span>
                </div>
                <div className="lp-dash-action">
                  <span className="lp-dash-action-dot" style={{ background: '#10b981' }} />
                  <span className="lp-dash-action-text">Payroll finalize ready</span>
                  <span className="lp-dash-action-count">1</span>
                </div>
                <div className="lp-dash-action">
                  <span className="lp-dash-action-dot" style={{ background: '#ef4444' }} />
                  <span className="lp-dash-action-text">Compliance filings due</span>
                  <span className="lp-dash-action-count">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Features</div>
            <h2 className="lp-section-title">Everything you need</h2>
            <p className="lp-section-desc">One platform to replace spreadsheets, WhatsApp groups, and disconnected tools.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`lp-feature-card ${visibleItems.has(i) ? 'visible' : ''}`}
                ref={(el) => addRef(el, i)}
                data-index={i}
                style={{ transitionDelay: `${(i % 4) * 0.08}s` }}
              >
                <div className="lp-feature-icon"><i className={`fas ${f.icon}`} /></div>
                <div className="lp-feature-title">{f.title}</div>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="lp-stats-section">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-item">
                <div className="lp-stat-number">{s.target.toLocaleString()}{s.suffix}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Process</div>
            <h2 className="lp-section-title">Up and running in 4 steps</h2>
            <p className="lp-section-desc">From signup to your first payroll run — hours, not weeks.</p>
          </div>
          <div className="lp-steps-grid">
            <div className="lp-steps-connector" />
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`lp-step-card ${visibleItems.has(10 + i) ? 'visible' : ''}`}
                ref={(el) => addRef(el, 10 + i)}
                data-index={10 + i}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="lp-step-number">{s.num}</div>
                <div className="lp-step-icon"><i className={`fas ${s.icon}`} /></div>
                <div className="lp-step-title">{s.title}</div>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Security</div>
            <h2 className="lp-section-title">Enterprise-grade security</h2>
            <p className="lp-section-desc">Your workforce data is protected by industry-standard practices at every layer.</p>
          </div>
          <div className="lp-security-grid">
            {SECURITY.map((s, i) => (
              <div
                key={i}
                className={`lp-security-card ${visibleItems.has(20 + i) ? 'visible' : ''}`}
                ref={(el) => addRef(el, 20 + i)}
                data-index={20 + i}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="lp-security-icon"><i className={`fas ${s.icon}`} /></div>
                <div className="lp-security-title">{s.title}</div>
                <p className="lp-security-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-section">
        <div className="lp-cta-bg-circle lp-cta-bg-1" />
        <div className="lp-cta-bg-circle lp-cta-bg-2" />
        <div className="lp-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-cta-inner">
            <div className="lp-cta-badge">
              <i className="fas fa-star" style={{ color: '#fbbf24', fontSize: 10 }} />
              Trusted by 350+ manufacturing companies
            </div>
            <h2>Ready to streamline<br />your HR operations?</h2>
            <p className="lp-cta-desc">Join manufacturing companies already using Orian to manage their workforce.</p>
            <div className="lp-cta-btns">
              <button className="lp-btn-white" onClick={() => navigate('/login')}>
                <i className="fas fa-arrow-right" /> Get Started Free
              </button>
              <button className="lp-btn-outline-white">
                <i className="fas fa-play" style={{ fontSize: 11, marginRight: 6 }} /> Schedule a Demo
              </button>
            </div>
            <p className="lp-cta-note">No credit card required · Free 14-day trial · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-nav-logo">
                <div className="lp-nav-logo-icon">O</div>
                <span className="lp-nav-logo-text" style={{ color: '#fff' }}>Orian</span>
              </div>
              <p className="lp-footer-brand-desc">
                HRMS built for Indian manufacturing — Workforce Management made simple, compliant, and powerful.
              </p>
              <div className="lp-footer-social">
                <a href="#" className="lp-social-btn"><i className="fab fa-twitter" /></a>
                <a href="#" className="lp-social-btn"><i className="fab fa-linkedin-in" /></a>
                <a href="#" className="lp-social-btn"><i className="fab fa-github" /></a>
                <a href="#" className="lp-social-btn"><i className="fab fa-youtube" /></a>
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Features</div>
              <ul className="lp-footer-links">
                <li><a href="#">Employee Management</a></li>
                <li><a href="#">Attendance & Shifts</a></li>
                <li><a href="#">Payroll Processing</a></li>
                <li><a href="#">Leave Management</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Product</div>
              <ul className="lp-footer-links">
                <li><a href="#">Self-Service Portal</a></li>
                <li><a href="#">Reports & Analytics</a></li>
                <li><a href="#">Loan & Advances</a></li>
                <li><a href="#">Mobile App</a></li>
                <li><a href="#">Integrations</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Company</div>
              <ul className="lp-footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Legal</div>
              <ul className="lp-footer-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span className="lp-footer-copy">© {new Date().getFullYear()} Orian. All rights reserved.</span>
            <div className="lp-footer-tech">
              <span className="lp-tech-tag">Node.js</span>
              <span className="lp-tech-tag">React</span>
              <span className="lp-tech-tag">MongoDB</span>
              <span className="lp-tech-tag">TypeScript</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
