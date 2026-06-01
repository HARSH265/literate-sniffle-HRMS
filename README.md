# HRMS — Human Resource Management System

A full-featured, modular Human Resource Management System built with **Node.js**, **Express**, **TypeScript**, **MongoDB**, and **React**.

---

## Overview

HRMS is a comprehensive platform for managing all aspects of human resources — from employee onboarding and attendance tracking to payroll processing, leave management, and performance reviews. The system supports multiple user roles with fine-grained permissions, real-time notifications via Socket.io, and a responsive React frontend.

---

## Key Features

### Core HR

| Module | Description |
|--------|-------------|
| **Employee Management** | Complete employee profiles with personal info, employment details, documents, bank details, and emergency contacts |
| **Department & Designation** | Organizational hierarchy with custom departments, designations, and reporting structures |
| **Shift Management** | Define work shifts, assign employees, and manage shift swaps with approval workflows |
| **Holiday Management** | Company-wide and department-specific holiday calendars with financial year support |
| **Weekly Off Rules** | Configurable weekly off policies per department/category |

### Attendance & Time

| Module | Description |
|--------|-------------|
| **Attendance Tracking** | Daily attendance with check-in/check-out, late marking, half-day deductions, and overtime calculation |
| **QR Code Attendance** | Kiosk-based attendance using dynamically generated QR codes with TOTP verification |
| **Geofencing** | Location-based attendance restriction within configurable radius |
| **Overtime Management** | Overtime rules, entry tracking, and approval workflows |
| **Totp (2FA)** | Time-based one-time password for attendance verification |

### Payroll & Finance

| Module | Description |
|--------|-------------|
| **Payroll Processing** | Automated salary calculation with allowances, deductions, OT, and LOP |
| **Salary Slips** | PDF-generated salary slips with company branding |
| **Loan Management** | Loan application, approval, and repayment tracking |
| **Statutory Compliance** | PF, ESI, and Professional Tax calculations with state-specific slabs |
| **Employee Self-Service** | Employees can update personal details, view payslips, and apply for leaves |

### Leave Management

| Module | Description |
|--------|-------------|
| **Leave Applications** | Multi-level approval workflows with configurable approval chains |
| **Leave Types** | Custom leave types with accrual policies |
| **Leave Balances** | Real-time leave balance tracking with pro-rata calculation |
| **Leave Calendar** | Visual calendar view of team leaves |

### Performance & Growth

| Module | Description |
|--------|-------------|
| **Performance Reviews** | Quarterly/half-yearly/yearly reviews with self and manager evaluations |
| **360° Feedback** | Multi-rater feedback with customizable rating scales |
| **Goal Setting** | Employee and manager goal creation with deadline tracking |
| **Training & Skills** | Training programs, enrollment, certification tracking, and skill management |

### Communication & Collaboration

| Module | Description |
|--------|-------------|
| **Announcements** | Company-wide announcements with scheduling and auto-expiry |
| **Notifications** | Real-time in-app and email notifications for key events |
| **Help Desk** | Ticket-based support system with SLA tracking and auto-assignment |
| **Document Repository** | Centralized document storage with categories, tags, versioning, and access control |

### Asset Management

| Module | Description |
|--------|-------------|
| **Asset Allocation** | Track company assets assigned to employees |
| **Asset Categories** | Define asset types, conditions, and maintenance schedules |
| **Maintenance Reminders** | Automated reminders for asset maintenance |

### Reporting & Analytics

| Module | Description |
|--------|-------------|
| **Attendance Reports** | Summary and detailed attendance reports with export |
| **Payroll Reports** | Salary, PF, ESI, and tax reports |
| **Employee Reports** | Headcount, department-wise, and custom reports |
| **Audit Logs** | Complete audit trail of all system actions with IP and user-agent tracking |
| **Excel Export** | All reports exportable to Excel format |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20+ (ESM modules) |
| **Language** | TypeScript 5.4 (strict mode) |
| **Backend Framework** | Express 4.19 |
| **Database** | MongoDB 6+ via Mongoose 8.4 |
| **Caching** | Redis 7 (token blacklist, master data cache) |
| **Secrets** | HashiCorp Vault (local dev) / Production Vault |
| **Real-time** | Socket.io 4.8 with optional Redis adapter |
| **Authentication** | JWT (access + refresh tokens), bcrypt, TOTP |
| **Validation** | Zod schemas on all endpoints |
| **File Storage** | Cloudinary (documents, photos) + local disk (logos) |
| **Email** | Nodemailer with SMTP |
| **PDF Generation** | PDFKit (salary slips) |
| **Excel Generation** | ExcelJS (reports) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Testing** | Vitest + Supertest (MongoDB Memory Server) |
| **Load Testing** | Artillery |
| **Containerization** | Docker + Docker Compose |

---

## Project Structure

```
HRMS/
├── client/                     # React frontend (Vite + TypeScript)
│   └── src/
│       ├── features/           # Feature-based modules
│       ├── components/         # Shared UI components
│       ├── hooks/              # Custom React hooks
│       ├── services/           # API service layer
│       └── types/              # TypeScript type definitions
│
├── server/                     # Express backend (TypeScript)
│   └── src/
│       ├── config/             # Environment, database, constants
│       ├── core/               # Shared infrastructure
│       │   ├── audit/          # Audit logging middleware
│       │   ├── auth/           # Token blacklist
│       │   ├── cache/          # Redis/NodeCache service
│       │   ├── email/          # Nodemailer service
│       │   ├── errors/         # Error handler, AppError
│       │   ├── file/           # Cloudinary upload service
│       │   ├── logger/         # Winston logger
│       │   ├── permissions/    # Auth & RBAC middleware
│       │   ├── redis/          # Redis client singleton
│       │   ├── socket/         # Socket.io setup
│       │   ├── utils/          # Encryption, date utils
│       │   ├── validation/     # Zod validation middleware
│       │   └── vault/          # Vault secret service
│       ├── models/             # 41 Mongoose models
│       ├── modules/            # 32 feature modules
│       │   └── <module>/
│       │       ├── <module>.controller.ts
│       │       ├── <module>.service.ts
│       │       ├── <module>.routes.ts
│       │       └── <module>.validation.ts
│       ├── seeds/              # Database seeding scripts
│       └── test/               # Test setup
│
├── docker-compose.yml          # Redis, Vault, MongoDB containers
├── scripts/                    # Vault setup, migrations
└── .env.example                # Environment variable template
```

---

## Getting Started

### Prerequisites

- **Docker Desktop** ([Install](https://www.docker.com/products/docker-desktop))
- **Node.js v20+** ([Install](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** ([Install](https://git-scm.com))

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hrms.git
cd hrms

# 2. Start infrastructure containers (Redis + Vault + MongoDB)
docker compose up -d

# 3. Seed Vault with secrets (run once)
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 hrms-vault vault kv put secret/hrms \
  MONGODB_URI="mongodb://localhost:27017/hrms" \
  JWT_SECRET="dev-jwt-secret-change-in-production" \
  JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production" \
  ENCRYPTION_KEY="0123456789abcdef0123456789abcdef" \
  CLOUDINARY_CLOUD_NAME="demo" \
  CLOUDINARY_API_KEY="demo" \
  CLOUDINARY_API_SECRET="demo" \
  EMAIL_HOST="smtp.example.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="user" \
  EMAIL_PASSWORD="pass" \
  EMAIL_FROM="no-reply@example.com"

# 4. Create server/.env
echo "VAULT_TOKEN=root-token" > server/.env

# 5. Install server dependencies
cd server
npm install

# 6. Seed the database with default data
npm run seed

# 7. Start the backend
npm run dev

# 8. In a separate terminal — start the frontend
cd ../client
npm install
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Backend API | http://localhost:5000 |
| Frontend | http://localhost:5173 |
| Health Check | http://localhost:5000/api/v1/health |
| Vault UI | http://localhost:8200/ui |
| Redis | localhost:6379 |
| MongoDB | localhost:27017 |

---

## API Endpoints

All endpoints are versioned under `/api/v1/`.

| Prefix | Auth Required | Module |
|--------|--------------|--------|
| `/auth` | Partial (login/refresh are public) | Authentication & JWT management |
| `/users` | `manage-users` | User CRUD and role assignment |
| `/employees` | `view/manage-employees` | Employee profiles and details |
| `/departments` | `manage-departments` | Department management |
| `/designations` | `manage-departments` | Designation management |
| `/shifts` | `manage-departments` | Shift definitions |
| `/attendance` | `view/manage-attendance` | Daily attendance tracking |
| `/attendance/qr` | Public (QR code) | QR-based kiosk check-in/out |
| `/holidays` | `manage-departments` | Holiday calendar |
| `/leave` | Leave permissions | Leave applications and approvals |
| `/payroll` | `process-payroll` | Payroll run and processing |
| `/salary-slips` | `view-reports` | PDF salary slip generation |
| `/reports` | `view-reports` | Analytics and Excel exports |
| `/loans` | Loan permissions | Loan applications |
| `/statutory` | Statutory permissions | PF/ESI/PT management |
| `/notifications` | Auth required | In-app notifications |
| `/settings` | `manage-settings` | Company configuration |
| `/audit-logs` | `view-audit` | Audit trail viewer |
| `/documents` | `view-documents` | Document repository |
| `/assets` | Auth required | Asset management |
| `/helpdesk` | Auth required | Support tickets |
| `/announcements` | Auth required | Company announcements |
| `/performance` | Auth required | Performance reviews |
| `/training` | Auth required | Training and skills |
| `/ess` | Auth required | Employee self-service |

---

## User Roles & Permissions

| Role | Access Level |
|------|-------------|
| **super-admin** | Full system access — bypasses all permission checks |
| **hr-admin** | Nearly full access (excludes audit log management) |
| **hr-staff** | View-heavy with limited management capabilities |
| **accounts** | Payroll, loans, statutory, and financial reports |
| **manager** | Approve leaves, manage team performance, view employees |

51 granular permissions are enforced at the route level via `authorize('permission-name')` middleware.

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **JWT Authentication** | HS256-signed access + refresh tokens, httpOnly cookies, token blacklist |
| **Password Security** | bcrypt (cost 10), complexity rules, history enforcement, lockout after 5 failures |
| **Rate Limiting** | Per-route rate limiters (auth: 10/min, general: 100/min, TOTP: 5/min) |
| **Input Validation** | Zod schemas on all mutation endpoints |
| **NoSQL Injection** | `express-mongo-sanitize` strips `$` and `.` from request bodies |
| **HTTP Security Headers** | Helmet.js (HSTS, CSP, X-Frame-Options, etc.) |
| **CORS** | Environment-aware origin whitelist |
| **Encryption at Rest** | AES-256-GCM for sensitive data (bank details, email passwords) |
| **Secrets Management** | HashiCorp Vault (dev) / Production Vault (prod) |
| **Audit Trail** | Every mutation logged with user, IP, user-agent, response time |
| **File Upload Security** | Strict MIME type and size validation per upload type |
| **Request Tracing** | UUID-based X-Request-Id header on every request |
| **Graceful Error Handling** | Custom AppError class, global error handler, no stack traces in production |

---

## Docker & Infrastructure

For complete Docker setup, container management, and production deployment guide, see:

**[DOCKER.md](./DOCKER.md)** — Covers:
- Why Docker is used
- Container architecture and networking
- Step-by-step initialization
- Secret management with Vault
- Production deployment checklist
- Troubleshooting guide
- Command reference

---

## Testing

```bash
# Run all tests
cd server
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run load tests
npm run loadtest
```

Tests use **MongoDB Memory Server** for isolation — no external database required.

---

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run seed` | Populate database with initial data |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run test suite |
| `npm run loadtest` | Run Artillery load tests |
| `npm run check` | Lint + build + test (CI pipeline) |

---

## Environment Variables

### Non-Secret (in `.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `VAULT_ADDR` | `http://127.0.0.1:8200` | Vault server address |
| `VAULT_TOKEN` | `root-token` | Vault authentication token |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `RATE_LIMIT_ENABLED` | `true` | Enable/disable rate limiting |

### Secrets (in Vault at `secret/hrms`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `ENCRYPTION_KEY` | 32-char key for AES-256-GCM encryption |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_HOST` | SMTP server host |
| `EMAIL_PORT` | SMTP server port |
| `EMAIL_USER` | SMTP authentication user |
| `EMAIL_PASSWORD` | SMTP authentication password |
| `EMAIL_FROM` | Sender email address |

---

## License

This project is proprietary software. All rights reserved.
