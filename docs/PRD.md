# PRD — Manufacturing HRMS V1

## 1. Overview

Production-grade HRMS for manufacturing companies. Digitizes and automates attendance tracking (manual register), overtime management, salary calculation, and payroll processing for manufacturing workers and office staff.

## 2. Users & Roles

| Role | Access Level |
|------|-------------|
| Super Admin | Full system access |
| HR Admin | Primary HR operations |
| HR Staff | Daily attendance entry |
| Accounts | Payroll and salary operations |
| Manager | View only access |

## 3. Employee Categories

- **Manufacturing workers** (floor staff) — daily wage, shift-based
- **Office staff** — monthly salary, standard hours

Both have distinct attendance and payroll rules.

## 4. V1 Modules (Fixed Scope)

1. Authentication & session management
2. User management with role-based access
3. Employee master
4. Department master
5. Designation master
6. Shift master
7. Holiday and weekly off configuration
8. Attendance entry (manual from physical register)
9. Overtime entry and rules
10. Payroll processing
11. Salary slip generation
12. Reports
13. Company settings
14. Audit log

### Not in V1
Biometric integration, ERP integration, mobile app, document management, statutory compliance automation, leave management, loan/advance management.

## 5. Employee Classification

**Categories:** worker, office-staff
**Employment Types:** permanent, contract, temporary, trainee
**Salary Types:** monthly (fixed), daily (wage rate)

## 6. Tech Stack

- **Backend:** Node.js, Express, TypeScript strict, Mongoose, JWT, Zod, bcrypt, Winston, node-cache, multer + Cloudinary, nodemailer, puppeteer, exceljs
- **Frontend:** React 18, Vite, TypeScript strict, Ant Design, TanStack Query v5, React Hook Form, Zustand, Axios, dayjs
- **Database:** MongoDB Atlas with Mongoose

## 7. Payroll Rules (Configurable)

All payroll rules read from `CompanySettings.payrollConfig`:
- Overtime multiplier
- Half-day deduction percentage
- Late deduction per day
- Paid/unpaid weekly offs and holidays
- Allowances and deductions

**Never hardcode any payroll value.**

## 8. Non-Functional Requirements

- All APIs paginated, validated with Zod
- JWT in httpOnly cookies (never localStorage)
- Rate limiting on auth routes
- MongoDB indexes on all queried fields
- Master data cached with node-cache
- Salary slips and reports generated on-demand (PDF/Excel), streamed to browser
- Files stored on Cloudinary only (logo, employee photos)
- Graceful shutdown configured
- Health check endpoint at `GET /api/v1/health`

## 9. Out of Scope (Confirmed)

- Leave management
- Loan and advance management
- Biometric integration
- ERP integration
- Mobile app
- Document management
- Statutory compliance automation