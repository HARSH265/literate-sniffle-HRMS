<div align="center">

# ⚡ Orion HRMS

### Human Resource Management System — Version 1.0

**A complete, production-grade HRMS built for manufacturing companies.**

*Manage your entire workforce — from attendance and payroll to performance and compliance — all in one place.*

---

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?style=flat&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)

</div>

---

## What is Orion HRMS?

Orion HRMS is a full-featured Human Resource Management System designed for **manufacturing companies**. It handles everything — employee lifecycle, attendance tracking with QR kiosk, payroll processing with statutory compliance, performance management, and a complete Employee Self-Service portal.

**Version 1** ships with **20+ modules**, **5 user roles**, and **51 granular permissions** — ready to deploy and scale.

---

## Modules & Features

### 🔐 Authentication & User Management

| Feature | Description |
|---------|-------------|
| JWT Login/Logout | Secure access + refresh token rotation with blacklist |
| Role-Based Access | 5 roles: Super Admin, HR Admin, HR Staff, Accounts, Manager |
| Password Security | bcrypt hashing, complexity rules, history enforcement, lockout after 5 failed attempts |
| Password Reset | Email-based token reset |
| Bulk Import/Export | Onboard multiple users at once via spreadsheet |

---

### 👥 Employee Management

| Feature | Description |
|---------|-------------|
| Full Employee Profiles | Personal info, employment details, emergency contacts |
| Auto-Generated Codes | Unique employee codes with collision retry |
| Photo Upload | Employee profile photos via Cloudinary |
| Bank Details | AES-256 encrypted at rest, masked by role |
| Archive/Restore | Soft-delete with restore capability |
| Bulk Shift Assignment | Assign shifts to multiple employees at once |
| Redis Caching | Role+query-based caching with 5-min TTL |

---

### 🏢 Organization Structure

| Feature | Description |
|---------|-------------|
| Departments | CRUD with auto-generated codes, referential integrity |
| Designations | Linked to departments, caching, referential integrity |

---

### 🕐 Shift Management

| Feature | Description |
|---------|-------------|
| Shift CRUD | Define work shifts with overlap detection (including night-shift wrapping) |
| Shift Swap | Request → Approve → Reject → Cancel workflow with deadline enforcement |
| Max Swaps Limit | Configurable monthly swap limit per employee |
| Shift Preferences | Employees can set preferred shifts |
| Weekly Off Rules | Configurable per employee category (worker/office-staff/all) |

---

### ✅ Attendance & Time Tracking

| Feature | Description |
|---------|-------------|
| Manual Entry | Bulk create/update attendance records |
| QR + TOTP Kiosk | Check-in/check-out with dynamic QR codes and TOTP verification |
| Geofencing | Location-based attendance within configurable radius |
| Device Binding | Kiosk tied to specific devices |
| Admin Force Checkout | With reason logging |
| Auto-Checkout Cron | Runs every 15 min — `shiftEndTime + maxOTHours + graceMinutes` |
| Overtime Calculation | Late = all hours OT; On-time = hours after shift end (capped) |
| Monthly Grid View | Paginated attendance grid |
| Late Detection | Half-day threshold and late marking |
| Holiday/Weekly-Off Aware | Skips holidays and weekly offs in calculations |

---

### 📅 Leave Management

| Feature | Description |
|---------|-------------|
| Leave Types | Custom types with annual quota, max concurrent, advance notice |
| Multi-Level Approval | Configurable approval chain |
| Leave Balance | Accrual, pro-rata, carry-forward, encashment |
| Calendar View | Visual team leave calendar |
| Bulk Accrual | Accrue leaves for all employees at once |
| Auto Attendance | Creates attendance entries on leave approval |
| Cancellation | Reverse attendance on leave cancellation |

---

### ⏰ Overtime Management

| Feature | Description |
|---------|-------------|
| Overtime Rules | Multiplier, max hours/day, max hours/month, applicable-to category |
| Manual Entry | Admin can create OT entries with rule-based max enforcement |
| Auto-Calculation | OT calculated during QR checkout |
| Payroll Integration | OT hours flow into payroll calculation |

---

### 💰 Payroll Processing

| Feature | Description |
|---------|-------------|
| Full Payroll Engine | Run → Preview → Submit → Approve → Reject → Finalize |
| Per-Employee Calc | Basic, allowances, deductions, OT, statutory (PF/ESI/PT), loan EMI |
| Weekly-Off Pay | Configurable weekly-off compensation |
| Holiday Pay | Holiday compensation logic |
| Late/Half-Day Deductions | Automatic deduction rules |
| Revision Tracking | Batch item editing with history |
| Lock-Window | Cannot modify payroll after lock date |
| MongoDB Transactions | Atomic operations for data integrity |

---

### 📋 Statutory Compliance (India)

| Feature | Description |
|---------|-------------|
| PF Calculation | Employee + employer share |
| ESI Calculation | Based on configurable thresholds |
| Professional Tax | State-specific slabs |
| PF Challan | Generate PF challan for submission |
| Statutory Reports | PF-ECR, ESI return, PF Form 5/10, PT return |
| Dashboard Summary | Compliance status at a glance |

---

### 🏦 Loan Management

| Feature | Description |
|---------|-------------|
| Loan Types | Interest rate, max amount, min balance, eligibility criteria |
| Full Lifecycle | Apply → Approve → Disburse → Repay → Close |
| EMI Schedule | Auto-generated repayment schedule |
| Repayment Tracking | Track each payment |
| Payroll Integration | Automatic EMI deduction from salary |
| Overdue Tracking | Flag and track overdue loans |

---

### 📊 Performance Management

| Feature | Description |
|---------|-------------|
| Performance Cycles | Quarterly reviews with configurable timelines |
| Goal Setting | 100% weight enforcement, employee + manager goals |
| Self-Review | Employee self-assessment |
| Manager Review | Manager evaluation |
| 360° Feedback | Multi-rater feedback system |
| Appeals Process | Employee can appeal review outcomes |
| Cycle Progress | Track cycle completion status |

---

### 🎓 Training & Skills

| Feature | Description |
|---------|-------------|
| Training Programs | Create and manage training sessions |
| Enrollment | Single + batch enrollment, drop/completion |
| Attendance | Track training attendance |
| Certifications | Manage certifications with expiry reminders |
| Skills Catalog | Define skills and map to employees |
| Skill Gap Analysis | Required vs. possessed skill comparison |

---

### 🎫 Helpdesk

| Feature | Description |
|---------|-------------|
| Ticket Lifecycle | Create → Update → Close |
| SLA Tracking | Deadline per priority level |
| Comments | Threaded comments with attachments |
| SLA Breach Detection | Automatic alerts for breached SLAs |
| Dashboard | Ticket stats and overview |

---

### 📢 Announcements

| Feature | Description |
|---------|-------------|
| Create/Schedule/Expire | Full lifecycle with priority levels |
| Audience Targeting | All / Department / Designation / Specific employees |
| Read Tracking | Know who has read each announcement |
| Notification Dispatch | Auto-notify on publish |

---

### 🖥️ Asset Management

| Feature | Description |
|---------|-------------|
| Asset CRUD | Auto-generated asset codes |
| Full Lifecycle | Allocate → Return → Maintain → Retire |
| History Tracking | Complete asset history |
| Employee View | Employees can see their assigned assets |
| Dashboard | Asset stats and overview |

---

### 📁 Document Management

| Feature | Description |
|---------|-------------|
| Upload with Versioning | Track document versions |
| Category-Based Storage | Organize by categories |
| File Validation | Type and size validation |
| Expiry Reminders | Alert before document expiry |
| Download Tracking | Know who downloaded what |
| Access Control | Role-based document access |

---

### 🔔 Notifications

| Feature | Description |
|---------|-------------|
| In-App Notifications | List, unread count, mark-as-read |
| Mark All as Read | Bulk action |
| Module Integration | Used across all modules for events |

---

### 📈 Reports & Analytics

| Feature | Description |
|---------|-------------|
| Excel Export | Employees, attendance, payroll, overtime |
| Attendance Summary | Department-wise and overall |
| Payroll Summary | Salary breakdown reports |
| Custom Reports | Field-selectable report builder |
| Chart Data | Attendance, payroll, department, leave charts |
| Drill-Down | Click-through to details |
| Scheduled Export | Configurable report scheduling |

---

### ⚙️ Settings

| Feature | Description |
|---------|-------------|
| Company Info | Name, logo, details |
| Payroll Config | Salary structure, components |
| Attendance Config | Geofencing, auto-checkout, grace period |
| Leave Config | Quotas, approval chains, carry-forward |
| Loan Config | Interest rates, eligibility |
| Statutory Config | PF/ESI/PT slabs and rules |
| Allowances/Deductions | Define salary components |
| Email Config | SMTP settings with test |

---

### 📝 Audit Trail

| Feature | Description |
|---------|-------------|
| Auto-Logging | Every mutation logged (user, IP, user-agent, response time) |
| Query & Export | Filter by module, action, user, date |
| Stats | Module and action-wise breakdown |
| Retention Management | Configurable log cleanup |

---

### 🔑 API Key Management

| Feature | Description |
|---------|-------------|
| Generate | Create API keys with permissions |
| Revoke | Instantly revoke compromised keys |
| Validate | Hash-based validation |
| Rate Limits | Per-key rate limiting |
| Expiration | Time-limited keys |

---

## 👤 Employee Self-Service (ESS)

> The ESS portal lets employees handle their own HR tasks — no need to go through HR for every request.

| Feature | What Employees Can Do |
|---------|----------------------|
| **Profile** | View and edit personal details (with approval workflow) |
| **Attendance** | Check their attendance history and status |
| **Leave Balance** | View available leaves across all types |
| **Leave Application** | Apply for leaves directly from ESS |
| **Payslip View** | Download and view salary slips |
| **Documents** | Upload and manage personal documents |
| **Assets** | See assets assigned to them |
| **Loan Application** | Apply for loans and track status |
| **Shift Preferences** | Set preferred work shifts |
| **Shift Swap** | Request shift swaps with colleagues |

---

## 💵 Salary Slips

| Feature | Description |
|---------|-------------|
| HTML Template | Company-branded salary slip generation |
| Company Info | Auto-includes company details |
| Allowances Breakdown | Itemized allowance display |
| Deductions Breakdown | Itemized deduction display |
| Attendance Summary | Days present, absent, leaves, holidays |

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| JWT Authentication | HS256-signed access + refresh tokens, httpOnly cookies |
| Password Security | bcrypt (cost 10), complexity rules, history, lockout |
| Rate Limiting | Auth: 10/min, General: 100/min, TOTP: 5/min |
| Input Validation | Zod schemas on all mutation endpoints |
| NoSQL Injection Protection | `express-mongo-sanitize` |
| HTTP Security Headers | Helmet.js (HSTS, CSP, X-Frame-Options) |
| CORS | Environment-aware origin whitelist |
| Encryption at Rest | AES-256-GCM for sensitive data |
| Secrets Management | HashiCorp Vault |
| Audit Trail | Every mutation logged |
| File Upload Security | Strict MIME type and size validation |

---

## 👥 User Roles

| Role | Access Level |
|------|-------------|
| **Super Admin** | Full system access — bypasses all permission checks |
| **HR Admin** | Nearly full access (excludes audit log management) |
| **HR Staff** | View-heavy with limited management capabilities |
| **Accounts** | Payroll, loans, statutory, and financial reports |
| **Manager** | Approve leaves, manage team performance, view employees |

**51 granular permissions** enforced at the route level.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript + Ant Design |
| **State Management** | TanStack Query + Zustand |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MongoDB 6+ (Mongoose 8) |
| **Cache** | Redis 7 |
| **Real-time** | Socket.io |
| **Auth** | JWT + bcrypt + TOTP |
| **Validation** | Zod |
| **File Storage** | Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **PDF** | PDFKit |
| **Excel** | ExcelJS |
| **Containerization** | Docker + Docker Compose |
| **Testing** | Vitest + Supertest |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js v20+**
- **Docker Desktop**
- **MongoDB** (local or Atlas)
- **Redis**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/HARSH265/literate-sniffle-HRMS.git
cd literate-sniffle-HRMS

# Start infrastructure (Redis + Vault + MongoDB)
docker compose up -d

# Seed Vault with secrets (run once)
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  MONGODB_URI="mongodb://localhost:27017/hrms" \
  JWT_SECRET="your-secret" \
  JWT_REFRESH_SECRET="your-refresh-secret" \
  ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# Setup server
cd server && npm install && npm run seed && npm run dev

# Setup client (new terminal)
cd client && npm install && npm run dev
```

### Default Login

| | |
|---|---|
| **Email** | `admin@hrms.com` |
| **Password** | `admin123` |

---

## 📂 Project Structure

```
orion-hrms/
├── client/                 # React frontend (Vite + TypeScript)
│   └── src/
│       ├── features/       # Feature-based modules
│       ├── components/     # Shared UI components
│       ├── hooks/          # Custom React hooks
│       └── services/       # API service layer
│
├── server/                 # Express backend (TypeScript)
│   └── src/
│       ├── config/         # Environment, database, constants
│       ├── core/           # Auth, cache, email, errors, validation
│       ├── models/         # 42 Mongoose models
│       ├── modules/        # 20+ feature modules
│       └── seeds/          # Database seeding
│
├── docker-compose.yml      # Infrastructure containers
└── scripts/                # Vault setup, utilities
```

---

## 📄 License

Proprietary software. All rights reserved.

---

<div align="center">

**Orion HRMS v1.0** — Built for manufacturing. Built to scale.

</div>
