# HRMS Module Audit & Improvement Roadmap

> Last updated: 2026-06-02
> Server modules: 32 (1 empty) | Models: 42 | Client features: 31

---

## Table of Contents
- [Core Infrastructure](#core-infrastructure)
- [Authentication & Users](#authentication--users)
- [Employee Management](#employee-management)
- [Organization Structure](#organization-structure)
- [Shift Management](#shift-management)
- [Attendance](#attendance)
- [Leave Management](#leave-management)
- [Overtime](#overtime)
- [Payroll](#payroll)
- [Statutory Compliance](#statutory-compliance)
- [Loans](#loans)
- [Performance Management](#performance-management)
- [Training & Skills](#training--skills)
- [Helpdesk](#helpdesk)
- [Announcements](#announcements)
- [Assets](#assets)
- [Documents](#documents)
- [Notifications](#notifications)
- [Reports & Analytics](#reports--analytics)
- [Settings](#settings)
- [Audit](#audit)
- [API Keys](#api-keys)
- [ESS (Employee Self-Service)](#ess-employee-self-service)
- [Salary Slips](#salary-slips)

---

## Core Infrastructure

### Current
- JWT auth with refresh-token rotation, token blacklist (Redis)
- Redis-backed caching with in-memory fallback
- Global error handler with typed AppError
- Structured logging
- Audit middleware (auto-logs create/update/delete)
- Email service (SMTP with config override)
- File upload (Multer)
- PDF & Excel generation services
- Socket.io (QR kiosk broadcast only)
- Rate limiting (dynamic, toggle-gated)
- Pagination utility, date utility, encryption utility
- Zod validation middleware

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **API documentation (OpenAPI/Swagger)** | No route docs exist; developers must read source to understand endpoints |
| 2 | High | **Database migration system** | Schema changes rely on Mongoose `strict: false` — no versioning or rollback |
| 3 | Medium | **Real-time WebSocket for notifications** | Socket.io exists but only for QR; notifications are poll-based |
| 4 | Medium | **Request-id middleware** | Tracing requests across services requires correlation IDs |
| 5 | Low | **Health check endpoint** | No `/health` route for load balancers / monitoring |

---

## Authentication & Users

### Current
- JWT login/logout with role-based access (super-admin, admin, hr, manager, employee)
- Password reset via email token
- Account lockout after 5 failed attempts
- Password history enforcement (last N passwords cannot be reused)
- Token blacklist on logout
- User CRUD, role assignment, activate/deactivate
- Bulk user import/export

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Session management** | No way to see active sessions or force-logout a user from admin |
| 2 | Medium | **OAuth/SSO support** | No Google/Microsoft login integration |
| 3 | Medium | **Login attempt analytics** | No dashboard showing failed login patterns by IP/user |
| 4 | Low | **MFA for admin accounts** | TOTP exists for kiosk but not for admin login |

---

## Employee Management

### Current
- Full CRUD with auto-generated employee codes (retry on collision)
- Photo upload
- Bank details encrypted at rest (AES-256)
- Salary fields sanitized by role (non-HR see masked values)
- Archive/restore with soft-delete
- Bulk shift assignment
- Redis caching with role+query-based keys (5-min TTL)
- Ownership checks on privileged operations

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **CSV/Excel bulk import** | No way to onboard 100+ employees at once from a spreadsheet |
| 2 | High | **Employee documents section** | Documents module exists but no link from employee profile |
| 3 | Medium | **Org chart visualization** | No reporting-chain or hierarchy view |
| 4 | Medium | **Employee history timeline** | No consolidated view of all changes (shifts, departments, salary) over time |
| 5 | Low | **Custom fields** | No way to add company-specific fields (blood group, emergency contact, etc.) |

---

## Organization Structure

### Current
- Departments: CRUD with auto-generated codes, caching, referential integrity (blocks delete if employees assigned)
- Designations: CRUD linked to departments, caching, referential integrity

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Department hierarchy** | Departments are flat; no parent-child for multi-level org |
| 2 | Medium | **Designation grades/bands** | No pay-band or grade linked to designation |
| 3 | Low | **Bulk department/designation import** | Only manual CRUD |

---

## Shift Management

### Current
- CRUD for work shifts with overlap detection (including night-shift wrapping)
- Caching
- Shift swap: request/approve/reject/cancel workflow with deadline enforcement, max-swaps-per-month limit
- Shift preferences: employees can set preferred shifts
- Weekly off rules: configurable per employee category (worker/office-staff/all)

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Shift assignment from employee profile** | Currently only bulk from attendance page; no per-employee shift management in employee profile |
| 2 | Medium | **Recurring shift templates** | No way to define "Monday=Shift A, Tuesday=Shift B" patterns |
| 3 | Medium | **Shift conflict detection on swap** | Swap checks overlap but doesn't verify the target shift has capacity |
| 4 | Low | **Shift swap history** | No audit of past swaps for reporting |

---

## Attendance

### Current
- Manual attendance entry (bulk create/update)
- QR + TOTP kiosk check-in/check-out with geofencing, device binding
- Admin force-checkout with reason
- Auto-checkout cron (every 15 min) — runs `shiftEndTime + maxOTHours + graceMinutes`
- OT calculation: late = all hours OT; on-time = hours after shift end (capped at maxOT)
- Monthly grid view with pagination
- Late detection, half-day threshold
- Holiday/weekly-off awareness

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Mobile app / PWA for self-service** | Employees can't mark attendance from phone |
| 2 | High | **Attendance regularization** | No employee-initiated request to fix missed/incorrect entries |
| 3 | Medium | **Shift-aware auto-checkout** | Currently uses global shift; should respect per-employee assigned shift |
| 4 | Medium | **Multi-punch support** | Only first-in/last-out; no lunch-break punches |
| 5 | Medium | **Attendance dashboard** | No real-time view of who's currently checked in |
| 6 | Low | **Bulk past-date attendance** | No way to backfill attendance for a date range |

---

## Leave Management

### Current
- Leave types with annual quota, max concurrent, advance notice, carry-forward config
- Multi-level approval workflow (configurable levels)
- Leave balance: accrual, pro-rata, carry-forward, encashment
- Calendar view, summary, bulk accrual
- Auto-creates attendance entries on leave approval
- Cancels leave and reverses attendance on cancellation

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Leave balance import** | No way to set initial balances from previous system |
| 2 | Medium | **Comp-off / earned leave** | No comp-off type that accrues from overtime or holidays |
| 3 | Medium | **Leave calendar sync (iCal)** | No export to Google/Outlook calendar |
| 4 | Medium | **Leave overlap validation** | No check that approved leave doesn't overlap with existing approved leave |
| 5 | Low | **Leave reports** | No department-wise leave utilization report |

---

## Overtime

### Current
- Overtime rules: multiplier, max hours/day, max hours/month, applicable-to category
- Overtime entries: manual entry with rule-based max enforcement
- Auto-calculated OT during QR checkout
- Admin checkout calculates OT using shared `calculateOTHours()` helper

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **OT approval workflow** | OT entries are auto-created; no manager approval step |
| 2 | Medium | **OT reports** | No department-wise OT summary report |
| 3 | Low | **OT carry-forward to next month** | No mechanism to use unused OT allowance |

---

## Payroll

### Current
- Full payroll engine: run → preview → submit → approve → reject → finalize/unfinalize
- Per-employee calculation: basic, allowances, deductions, OT, statutory (PF/ESI/PT), loan EMI
- Weekly-off pay, holiday pay, half-day/late deductions
- Revision tracking with batch item editing
- Lock-window enforcement (cannot modify payroll after lock date)
- MongoDB transactions for atomicity
- ~927 lines — most complex service in the system

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Payroll approval workflow** | Currently approve/reject is a single action; no multi-level approval |
| 2 | High | **Arrear calculation** | No way to handle back-pay when salary is revised mid-month |
| 3 | Medium | **Payroll comparison** | No month-over-month comparison view |
| 4 | Medium | **Gratuity calculation** | Not implemented |
| 5 | Medium | **Payroll bank file generation** | No CSV/NEFT file for bank transfer |
| 6 | Low | **Payroll email to employees** | No auto-email of payslips |

---

## Statutory Compliance

### Current
- PF calculation (employee + employer share)
- ESI calculation
- Professional Tax calculation
- PF challan generation
- Statutory reports: PF-ECR, ESI return, PF Form 5/10, PT return
- Dashboard summary

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **New PF rates update** | Need to verify compliance with latest EPFO circulars |
| 2 | Medium | **TDS/income tax integration** | Not implemented |
| 3 | Medium | **Statutory report PDF export** | Reports are data-only; no formatted PDF for submission |
| 4 | Low | **Multi-state statutory support** | Currently single-state; PF/PT varies by state |

---

## Loans

### Current
- Loan types: CRUD with interest rate, max amount, min balance, eligibility
- Loan lifecycle: apply → approve → disburse → repay → close
- EMI schedule generation
- Repayment tracking
- Payroll-linked automatic EMI deduction
- Overdue loan tracking

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Loan balance import** | No way to import existing loans from previous system |
| 2 | Medium | **Loan foreclosure** | No partial or full prepayment support |
| 3 | Low | **Loan statements** | No printable repayment statement for employees |

---

## Performance Management

### Current
- Performance cycles (quarterly reviews)
- Goal setting with 100% weight enforcement
- Self-review, manager review
- 360-degree feedback
- Appeals process
- Finalization and cycle progress tracking

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Rating calibration** | No manager calibration session support |
| 2 | Medium | **Performance improvement plan (PIP)** | Not implemented |
| 3 | Low | **Historical performance trends** | No chart of employee performance over multiple cycles |

---

## Training & Skills

### Current
- Training programs: CRUD
- Employee enrollment (single + batch), drop/completion
- Attendance tracking
- Certification management with expiry reminders
- Skills catalog with employee skill mapping
- Skill gap analysis (required vs. possessed)
- Expiring certifications alert

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Training feedback/survey** | No post-training feedback collection |
| 2 | Medium | **Training cost tracking** | No budget or cost per program |
| 3 | Low | **External training integration** | No link to external LMS or course platforms |

---

## Helpdesk

### Current
- Ticket lifecycle: create → update → close
- SLA tracking with deadline per priority
- Comments with attachments
- SLA breach detection
- Dashboard stats

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Email ticket creation** | Tickets only created via UI; no email-to-ticket |
| 2 | Medium | **Auto-assignment** | No rule-based ticket routing to departments |
| 3 | Low | **Ticket satisfaction survey** | No post-resolution feedback |

---

## Announcements

### Current
- Create/schedule/expire announcements with priority levels
- Audience targeting: all / department / designation / specific employees
- Read tracking
- Notification dispatch on publish

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Low | **Announcement templates** | No pre-built templates for common announcements |
| 2 | Low | **Analytics** | No read rate or reach statistics dashboard |

---

## Assets

### Current
- CRUD with auto-generated asset codes
- Allocate / return / maintenance / retire lifecycle
- History tracking
- Employee asset view
- Stats dashboard

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Asset barcode/QR tagging** | No QR code generation for physical assets |
| 2 | Low | **Warranty tracking** | No warranty expiry alerts |

---

## Documents

### Current
- Upload with versioning
- Category-based storage
- File type/size validation
- Expiry reminders
- Download tracking
- Access role control

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Document templates** | No reusable templates (offer letter, experience letter) |
| 2 | Low | **Digital signature** | No e-sign support |

---

## Notifications

### Current
- In-app: list, unread count, mark-as-read, mark-all-as-read
- Internal NotificationService used by many modules
- Poll-based (no real-time push)

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **WebSocket push** | Real-time notification delivery instead of polling |
| 2 | Medium | **Email notification preferences** | No per-module email toggle for users |
| 3 | Low | **Notification templates** | Hardcoded notification messages |

---

## Reports & Analytics

### Current
- Excel export: employees, attendance, payroll, overtime
- Attendance summary, payroll summary, department-wise summary
- Overtime summary
- Custom field-selectable reports
- Chart data: attendance, payroll, department, leave
- Drill-down views
- Scheduled export config
- ~1027 lines — second most complex service

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **PDF report export** | Only Excel; no PDF for sharing |
| 2 | Medium | **Custom report builder** | Current custom reports are limited to field selection |
| 3 | Medium | **Report scheduling (email)** | Config exists but no actual email delivery of scheduled reports |
| 4 | Low | **Report favorites** | No way to save frequently used report configurations |

---

## Settings

### Current
- Centralized CompanySettings model covering:
  - Company info, logo upload
  - Payroll config, attendance config, leave config, loan config, statutory config
  - Allowances/deductions
  - Email (SMTP) config with test
  - ESS config, announcements config, helpdesk config, assets config, documents config
  - Shift swap config, reports config

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Medium | **Settings audit trail** | No log of who changed what setting and when |
| 2 | Medium | **Settings version/rollback** | No way to revert to previous settings |
| 3 | Low | **Environment-specific overrides** | Settings are DB-only; no env-file fallback for critical values |

---

## Audit

### Current
- Query/export audit logs with filtering by module, action, user, date
- Stats by module and action
- Retention management and log cleanup
- Compound indexes on common query patterns

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Low | **Audit log archive** | No cold-storage or archival for old logs |
| 2 | Low | **Audit search** | No full-text search across audit log details |

---

## API Keys

### Current
- Generate, list, revoke, validate API keys
- Hash-based storage
- Per-key permissions and rate limits
- Expiration support

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | Low | **API key usage dashboard** | No visibility into which keys are being used and how often |
| 2 | Low | **Webhook support** | No way to trigger webhooks on events |

---

## ESS (Employee Self-Service)

### Current
- Profile viewing/editing with approval workflow
- Attendance view
- Leave balance view
- Document management
- Payslip view
- Asset view
- Loan application

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Mobile-responsive PWA** | No dedicated mobile experience |
| 2 | Medium | **Expense claims** | Not implemented |
| 3 | Medium | **Travel requests** | Not implemented |
| 4 | Low | **Ticket creation from ESS** | Helpdesk exists but no ESS-integrated ticket creation |

---

## Salary Slips

### Current
- Generates HTML-templated salary slip data from finalized payroll runs
- Includes company info, allowances, deductions, attendance summary

### Improvements Needed
| # | Priority | Item | Why |
|---|----------|------|-----|
| 1 | High | **Actual PDF generation** | HTML template exists; `PDFGeneratorService` exists in core but is not wired in |
| 2 | Medium | **Bulk PDF download** | No batch download of all payslips for a month |
| 3 | Medium | **Employee self-download** | No ESS-integrated payslip download |

---

## Cross-Cutting Concerns

| # | Priority | Item | Affected Modules |
|---|----------|------|-----------------|
| 1 | High | **No API documentation** | All modules |
| 2 | High | **No real-time notifications** | Attendance, Leave, Helpdesk, Announcements |
| 3 | High | **No mobile app/PWA** | Attendance, Leave, ESS, Helpdesk |
| 4 | Medium | **Tight payroll-statutory coupling** | Payroll, Statutory |
| 5 | Medium | **No database migrations** | All models |
| 6 | Medium | **Missing validation files** | Salary slips, Settings, API keys |
| 7 | Low | **Empty `overtime/` module** | Dead code — should be removed |
| 8 | Low | **Rule book is client-only** | No server backing; static content |

---

## Recommended Priority Order

### Phase 1: Stability (Weeks 1-2)
1. Remove empty `overtime/` module
2. Add missing validation files (salary-slips, settings, api-keys)
3. Add API documentation (OpenAPI/Swagger)
4. Add database migration system
5. Fix QR secret regeneration on restart

### Phase 2: Core Gaps (Weeks 3-4)
6. Employee CSV/Excel bulk import
7. Attendance regularization (employee-initiated)
8. Payroll multi-level approval
9. WebSocket real-time notifications
10. Salary slip PDF generation

### Phase 3: Mobile & UX (Weeks 5-6)
11. PWA / mobile-responsive design
12. Attendance self-check-in from mobile
13. Leave balance import
14. Employee profile enhancements (org chart, history)

### Phase 4: Advanced Features (Weeks 7-8)
15. Expense claims & travel requests
16. Report PDF export
17. OAuth/SSO integration
18. Comp-off / earned leave
