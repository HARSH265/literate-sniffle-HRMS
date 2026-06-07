# Orian HRMS

A full-stack Human Resource Management System purpose-built for **manufacturing companies in India**. Orian digitizes the entire employee lifecycle — from onboarding and attendance to payroll processing and statutory compliance — so HR teams can stop juggling spreadsheets and start making decisions.

---

## What is Orian?

Orian is not a generic HR tool. It is designed ground-up for the realities of factory-floor workforce management: multiple shifts, QR-based kiosk attendance, overtime multipliers, weekly-off rules, and Indian statutory compliance (PF, ESI, TDS, Factories Act). Whether you run a 50-person shop or a 2,000-employee plant, Orian scales with you.

---

## What Orian Does

### Employee Management

- Complete employee profiles: personal details, employment history, bank information, documents, and emergency contacts
- Bulk employee import with auto-generated employee codes
- Department, designation, and shift assignment with reporting hierarchies
- Employee document repository with categories, tags, and access control
- Sensitive data masking (Aadhaar, PAN, PF/ESI numbers) based on user role

### Attendance & Time Tracking

- Daily check-in/check-out with late marking, early exit detection, and half-day deductions
- QR code kiosk attendance for shop-floor workers using dynamically generated codes with TOTP verification
- Shift management with multiple shift definitions and employee assignments
- Geofencing support for location-based attendance restriction
- Overtime tracking with configurable rules and approval workflows
- Attendance calendar with monthly, weekly, and daily views

### Payroll Processing

- Automated salary calculation incorporating base pay, allowances, deductions, overtime, and loss of pay
- Batch payroll processing with preview mode before finalization
- Salary slips generated as PDF documents with company branding
- Bank file generation for direct salary transfers
- Salary register and MIS reports for management review
- Transaction-safe batch operations with database-level consistency

### Leave Management

- Custom leave types with accrual policies and carry-forward rules
- Multi-level approval workflows with configurable approval chains
- Real-time leave balance tracking with pro-rata calculation for mid-year joiners
- Leave calendar showing team availability at a glance
- Employee self-service for applying and tracking leave applications

### Statutory Compliance (India)

- **Provident Fund (PF):** Auto-calculate employer and employee contributions, generate monthly PF challans
- **Employee State Insurance (ESI):** Automatic ESI computation based on state-specific wage ceilings
- **Professional Tax (PT):** State-wise PT slab application
- **TDS / Income Tax:** Tax deducted at source calculated per income slab, TDS return generation
- **Factories Act 1948:** Shift management, overtime rules, spread-over limits, and weekly-off compliance
- **Payment of Wages Act:** Minimum wage enforcement, timely salary disbursement, and wage slip generation
- Compliance dashboard with gap analysis and statutory report generation

### Loan & Advance Management

- Multiple loan types with configurable interest rates and repayment periods
- Loan application and approval workflow
- Automatic EMI deduction from salary during payroll processing
- Repayment tracking with complete audit trail

### Performance Management

- Configurable performance review cycles (quarterly, half-yearly, yearly)
- Self-evaluation and manager evaluation workflows
- 360-degree multi-rater feedback with customizable rating scales
- Goal setting and tracking with deadline management
- Performance review dashboards and reports

### Training & Skill Development

- Training program creation with enrollment management
- Employee enrollment tracking with completion status
- Skill matrix and skill gap analysis
- Certification tracking with expiry reminders
- Training effectiveness reports

### Employee Self-Service Portal

A dedicated mobile-optimized portal where employees can:

- View and download salary slips
- Apply for leaves and track approval status
- Mark attendance via QR code scanning
- View attendance history and summary
- Apply for loans and track repayments
- View and request shift swaps
- Access allocated assets and training programs
- Update personal profile information
- View company announcements

### Help Desk & Support

- Ticket-based support system with categories and priority levels
- SLA tracking with escalation rules
- Auto-assignment of tickets to appropriate handlers
- Ticket history and resolution tracking

### Announcements & Communication

- Company-wide announcements with scheduling and auto-expiry
- Department-specific or role-based targeting
- Real-time in-app notifications for key events (leave approvals, payroll processing, etc.)
- Email notifications for critical updates

### Asset Management

- Track company assets assigned to employees (laptops, tools, ID cards, etc.)
- Asset allocation and return workflows
- Asset history timeline per employee
- Category and condition tracking
- Maintenance scheduling and reminders

### Reports & Analytics

- Attendance summary and detailed reports
- Payroll breakdowns by department, designation, and individual
- Employee headcount and demographic reports
- Leave utilization and balance reports
- Statutory compliance reports (PF, ESI, PT)
- Custom report builder with Excel export
- Drill-down views for deeper analysis

### Kiosk Management

- Register and manage attendance kiosk devices
- Generate time-limited QR codes for attendance marking
- Track kiosk usage and device health
- Support for multiple kiosk locations

### Security & Access Control

- Role-based access with 6 predefined roles: Super Admin, HR Admin, HR Staff, Accounts, Manager, and Employee
- 56+ granular permissions controlling access at the module and action level
- JWT authentication with access and refresh token rotation
- Optional two-factor authentication (TOTP) for sensitive operations
- Complete audit logging of every system action with user, IP, timestamp, and response time
- CSRF protection, rate limiting, and input validation on all endpoints
- Encrypted storage of sensitive data (bank details, passwords) using AES-256-GCM

---

## Who Is It For?

- **Manufacturing companies** managing shop-floor workers with shift-based attendance
- **HR teams** tired of managing attendance and payroll across spreadsheets
- **Finance departments** needing automated statutory compliance (PF, ESI, TDS)
- **IT administrators** looking for a self-hosted, auditable workforce management system
- **Organizations** with 50 to 5,000+ employees across multiple locations

---

## License

This project is proprietary software. All rights reserved.
