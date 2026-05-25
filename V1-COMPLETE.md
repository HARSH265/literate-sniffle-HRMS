# Orian HRMS — V1 Complete

**Release Date:** May 25, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

---

## Overview

Orian HRMS is a production-grade workforce management system built for manufacturing companies. Designed for compliance with the **Factories Act 1948** and **Payment of Wages Act**, it digitizes and automates attendance tracking, overtime management, salary calculation, and payroll processing for both manufacturing workers and office staff.

---

## The Journey — 12 Phases

V1 was delivered across 12 sequential phases, each passing a strict audit before the next began.

| # | Phase | Key Deliverables |
|---|-------|-----------------|
| 1 | **Attendance Module** | Past entry limit enforcement, late mark auto-calculation, bulk insert, shift validation, monthly calendar view, department filter |
| 2 | **Payroll Module** | Separate PayrollItem collection, draft editing, unfinalize with audit, salary slip linkage, PF/ESI/PT deductions, allowance/deduction application |
| 3 | **Reports Module** | Department-wise grouping, date range filtering, payrollConfig-aware summaries, interactive charts, YTD summaries |
| 4 | **Settings Module** | Field-level audit trail, email test, logo optimization, sidebar navigation, save indicators |
| 5 | **Authentication Module** | Configurable token expiry, password history, password strength validation, token rotation, logout all devices |
| 6 | **Employee Management Module** | Multi-field search (fatherName, designation, shift), designation filter, document upload/download, bulk import, attendance & payroll history tabs |
| 7 | **Overtime Module** | Overtime reports, rule enforcement in payroll, rule-specific multipliers, summary views |
| 8 | **Master Data Module** | Unique designation-per-department, shift overlap detection, holiday validation, department filter, calendar view |
| 9 | **Notifications Module** | Auto-generated notifications for key events, email notifications, notification center UI |
| 10 | **Audit Logs Module** | Date range/module/action filters, Excel export, IP capture, stats dashboard, cleanup with admin confirmation |
| 11 | **Infrastructure & Performance** | gzip compression, rate limiting, health check endpoint, request logging, error boundary, code splitting |
| 12 | **User Management Module** | User deactivation, activity history, role editing, bulk import/export |

---

## Architecture

### Stack
- **Frontend:** React 18, Vite, TypeScript (strict), Ant Design, TanStack Query v5, React Hook Form, Zustand, Axios, dayjs
- **Backend:** Node.js, Express, TypeScript (strict), Mongoose, JWT, Zod, bcrypt, Winston, node-cache, multer + Cloudinary, nodemailer, Puppeteer, ExcelJS
- **Database:** MongoDB Atlas

### Backend Module Pattern
Each module follows a strict 4-file structure:
- `module.controller.ts` — HTTP handling
- `module.service.ts` — Business logic
- `module.routes.ts` — Route definitions with middleware
- `module.validation.ts` — Zod schemas

### Frontend Module Pattern
Each feature follows a 4-folder structure:
- `components/` — UI components
- `hooks/` — TanStack Query hooks and form hooks
- `services/` — API call functions
- `pages/` — Page-level components

### Centralized Systems
- **Errors** — AppError, errorHandler, asyncHandler
- **Audit** — Automatic logging on all CUD operations
- **Notifications** — In-app with auto-generation
- **Email** — SMTP with HTML templates
- **File Upload** — Multer + Cloudinary
- **PDF** — Puppeteer-based salary slip generation
- **Excel** — ExcelJS for reports export
- **Cache** — node-cache (1h TTL for master data)
- **Permissions** — Role-based access control (5 roles)
- **Validation** — Zod middleware on all inputs

---

## Schema (16 Collections)

| Collection | Key Indexes |
|------------|-------------|
| User | email (unique) |
| Employee | employeeCode (unique), department, status, category, shift |
| Department | name, code (unique) |
| Designation | name, department |
| Shift | — |
| Holiday | date, year, applicableTo |
| WeeklyOffRule | — |
| AttendanceEntry | employee + date (compound unique), date, status |
| OvertimeRule | — |
| OvertimeEntry | employee + date (compound) |
| PayrollRun | month (unique), status |
| PayrollItem | payrollRun + employee (compound unique), month, employee |
| SalarySlip | slipNumber (unique), employee, month |
| CompanySettings | Singleton |
| AuditLog | userId, module, createdAt |
| Notification | recipient + isRead (compound), recipient, createdAt |

---

## API Surface

All endpoints under `/api/v1/`:

| Module | Endpoints |
|--------|-----------|
| Auth | POST login/logout, GET me, POST change-password |
| Users | Full CRUD |
| Employees | Full CRUD with filters |
| Departments | Full CRUD (cached) |
| Designations | Full CRUD (cached) |
| Shifts | Full CRUD (cached) |
| Holidays | Full CRUD (cached) |
| Weekly Off Rules | Full CRUD (cached) |
| Attendance | List, bulk entry, monthly view, summary |
| Overtime Rules | Full CRUD |
| Overtime Entries | Full CRUD |
| Payroll Runs | CRUD, finalize |
| Payroll Items | List, update |
| Salary Slips | List, get, PDF download, generate |
| Reports | Employee, attendance, payroll (Excel export) |
| Settings | Get, update |
| Audit Logs | List with filters, export |
| Notifications | List, mark read, unread count |
| File Upload | Logo, employee photo |

---

## Security

- JWT in httpOnly cookies (never localStorage)
- bcrypt password hashing (salt rounds 10)
- express-mongo-sanitize (NoSQL injection prevention)
- helmet (secure HTTP headers)
- CORS (frontend origin only)
- Rate limiting (10/min auth, 100/min general)
- Zod validation on all inputs
- Sanitized error responses in production
- Password history (prevents reuse of last 5 passwords)
- Configurable token expiry
- Logout from all devices

---

## Performance

- Pagination on every list API (default 20, max 100)
- MongoDB indexes on all queried fields
- node-cache for master data (TTL 1 hour)
- lean() on all read-only Mongoose queries
- Select only required fields
- Lazy loading on frontend pages
- Skeleton loading on all data-fetching pages
- 300ms debounce on search/filter inputs
- MongoDB aggregation for reports
- gzip compression on all responses

---

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Super Admin** | Full system access |
| **HR Admin** | Employees, attendance, overtime, payroll, settings, users, reports, audit |
| **HR Staff** | View employees, manage attendance, overtime, reports |
| **Accounts** | Process payroll, view reports |
| **Manager** | View reports (read-only) |

---

## Compliance

| Rule | Act / Section |
|------|--------------|
| Overtime minimum 2x rate | Factories Act 1948, Section 59 |
| Weekly off mandatory (paid) | Factories Act 1948, Section 52 |
| 26-day wage calculation standard | Payment of Wages Act 1936 |
| 8-hour standard working day | Factories Act 1948, Section 51 |
| Max 48 hours/week work limit | Factories Act 1948, Section 51 |

---

## What's Not in V1

The following are explicitly out of scope for V1 (planned for future releases):
- Biometric integration
- ERP integration
- Mobile application
- Document management system
- Full statutory compliance automation (slab-based PF/ESI)
- Leave management
- Loan and advance management

---

## Key Metrics

- **12 phases** delivered sequentially with audit gates
- **16 MongoDB collections** with optimized indexes
- **50+ API endpoints** under `/api/v1/`
- **5 user roles** with granular permissions
- **2 employee categories** (worker daily-wage, office-staff monthly)
- **Configurable payroll** — all rules from settings, nothing hardcoded
- Built-in compliance with **Factories Act 1948** and **Payment of Wages Act**
