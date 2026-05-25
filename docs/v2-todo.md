# Orian HRMS — V2 Development Todo

**Last Updated:** May 25, 2026

## Current Work
- Phase 4: Reports Enhancements — Not started

## Workflow Rules

1. **One module at a time** — Only work on one module per phase
2. **Audit before next phase** — After completing a module:
   - Verify all planned changes/improvements are made
   - Verify changes are made correctly (no bugs)
   - Verify server and client are properly aligned
   - Verify audit rules are followed
   - If audit fails, fix issues and re-audit before moving on
3. **Document everything** — Update this doc as phases complete
4. **Every rule must be configurable** — no hardcoded values. Everything comes from `CompanySettings`.

---

## Phase 1: Leave Management Module ✅

**Completed:** May 25, 2026

### Backend Changes
#### Models & Schema
- [x] Create `LeaveType` model — fully configurable per-type fields
- [x] Create `LeaveApplication` model — employee, leaveType, date range, status, approval
- [x] Create `LeaveBalance` model — employee, year, per-leave-type balance tracking

#### Configuration — Extend CompanySettings
- [x] Add `leaveConfig` to CompanySettings singleton
- [x] Extend `payrollConfig` with leave-deduction fields
- [x] Extend each item in `allowanceConfig` and `deductionConfig` arrays

#### Leave Module (4 files)
- [x] Create `server/src/modules/leaves/leaves.controller.ts` — 14 endpoints
- [x] Create `server/src/modules/leaves/leaves.service.ts` — CRUD, balance, approval, integration
- [x] Create `server/src/modules/leaves/leaves.validation.ts` — Zod schemas
- [x] Create `server/src/modules/leaves/leaves.routes.ts` — auth + authorize middleware

#### Payroll Integration
- [x] Update `PayrollService.runPayroll()` — fetch approved leave data
- [x] Implement leave deduction via configurable formula
- [x] Implement allowance/deduction pro-ration on leave
- [x] Add `leaveDays`, `paidLeaveDays`, `unpaidLeaveDays` to PayrollItem
- [x] Distinguish leaveDays from absentDays in payroll calculator

#### Permissions, Audit, Notifications, Seed Data
- [x] Add leave permissions to permission configs (server + client)
- [x] Add leave audit actions and middleware detection
- [x] Add leave notification events
- [x] Add default leave types and leaveConfig to seed

### Frontend Changes
- [x] Create Leave Types page with all config fields
- [x] Create Leave Application page with balance-aware form
- [x] Create My Leaves page with filters and cancel
- [x] Create Leave Approvals page with inline approve/reject
- [x] Create Leave Balance dashboard with visual bars
- [x] Add Leave Configuration section in Settings
- [x] Add sidebar submenu under Leave Management
- [x] Add routes and ProtectedRoute integration

### Audit Checklist
- [x] Server builds without errors
- [x] Client builds without errors
- [x] All rules configurable — no hardcoded values

---

## Phase 2: Payroll Enhancements ✅

**Completed:** May 25, 2026

### Backend Changes
- [x] Add payroll approval workflow (`draft → submitted → approved → finalized`)
- [x] Add payroll revision history (embedded sub-docs with diff)
- [x] Add what-if preview endpoint (`previewRun`)
- [x] Add batch edit payroll items endpoint (`PATCH /run/:id/items/batch`)
- [x] Add unfinalize window lock (configurable days from finalization)

### Frontend Changes
- [x] Add approval workflow buttons in PayrollPage + PayrollDetailsPage
- [x] Add revision history timeline in PayrollDetailsPage
- [x] Add what-if preview modal with employee breakdown
- [x] Add batch edit mode with inline editable cells

### Audit Checklist
- [x] Payroll approval workflow works end-to-end
- [x] Revision history captures all changes with user + timestamp
- [x] What-if preview matches final calculation
- [x] Batch edit saves all items correctly
- [x] Unfinalize locked after configurable window
- [x] Server builds without errors
- [x] Client builds without errors

---

## Phase 3: QR + TOTP Biometric Attendance System ✅

**Completed:** May 25, 2026  
**Commit:** `5498753`

### Architecture
- **Kiosk QR** (15s TTL JWT) → proves physical presence at gate
- **TOTP Authenticator** (6-digit, 30s rotation) → proves identity
- **True 2FA** — proxy attendance prevented without storing biometric data

### What Was Built

#### Models (4)
- [x] `Employee` — `totpSecret` (encrypted), `totpEnabled`, `registeredDeviceId`
- [x] `AttendanceEntry` — checkIn/OutMethod, GPS, deviceId, tokenNonce, isLatePresent, supervisorOverride, totpVerified; source enum extended
- [x] `KioskDevice` (new) — name, location, isActive, lastSeenAt, registeredBy
- [x] `CompanySettings` — expanded `attendanceConfig` (18 fields), `payrollConfig` (4 OT trick fields)

#### Server Modules (3 new modules, 12 new files)
- [x] **Socket.io** (`core/socket/socket.ts`) — kiosk rooms, QR broadcast
- [x] **TOTP** — enroll/verify/disable with `otplib` provisioning QR
- [x] **Kiosk** — device register, QR generate (HS256 JWT), validate, HTTP + Socket broadcast
- [x] **Attendance QR** — full check-in/out flow with 2FA, geofencing, device binding, 9:05 rule

#### Modified Server Files (8)
- [x] `attendance.service.ts` — `bulkUpdateEntries()` for batch edit
- [x] `attendance.controller.ts` + `routes.ts` — `PATCH /bulk-update`
- [x] `payroll.service.ts` — `isLatePresent` handling + OT tricks (floor/ceil rounding, basic-only multiplier)
- [x] `app.ts` — mounted new routes
- [x] `server.ts` — Socket.io init
- [x] `AuditService.ts` + `AuditLog.model.ts` — 5 new audit actions

#### Frontend Pages (4 new pages, 7 new files)
- [x] **KioskPage** (`/kiosk`) — full-screen clock + QR (HTTP polling, qrcode-generator canvas)
- [x] **ScanPage** (`/m/scan`) — mobile PWA QR scanner + TOTP input + confirmation
- [x] **TOTPEnrollPage** (`/settings/totp`) — admin TOTP enrollment with authenticator QR
- [x] **KioskQR** — reusable QR canvas component
- [x] PWA manifest + service worker

#### Modified Frontend Files (5)
- [x] `SettingsPage.tsx` — expanded Attendance Section + OT Tricks in Payroll
- [x] `Sidebar.tsx` — Settings submenu with TOTP Enrollment
- [x] `App.tsx` — new routes for kiosk, scan, totp

#### Documentation
- [x] `docs/phase3-qr-totp-attendance.md` — comprehensive Phase 3 document

### Key Design Decisions
- Kiosk uses **HTTP polling** (not WebSocket) to avoid client-side `socket.io-client` dependency
- QR tokens are **HS256 JWTs** with crypto-random nonces for single-use verification
- All config fields **default to disabled** — admin must explicitly opt in
- Supervisor override preserves **full audit trail** (who, when, why)
- `@types/qrcode` removed; uses `qrcode-generator` (pure browser canvas) instead

### Audit Checklist
- [x] All 17 audit items passed
- [x] Server builds clean
- [x] Client builds clean

---

## Phase 4: Reports Enhancements

### Backend Changes
- [ ] Add custom report builder endpoint (select fields, filters, group by)
- [ ] Add chart data endpoints (aggregated by month, department, category)
- [ ] Add scheduled report export config in CompanySettings
- [ ] Add drill-down endpoint (click on summary → see detail)

### Frontend Changes
- [ ] Add custom report builder UI (field selector, filter builder, preview)
- [ ] Add chart visualizations (bar, line, pie) using chart library
- [ ] Add scheduled exports section in Settings
- [ ] Add drill-down interaction on summary charts

### Audit Checklist
- [ ] Custom report builder generates correct data
- [ ] Chart visualizations render correctly
- [ ] Scheduled exports run on time
- [ ] Drill-down shows correct detail records
- [ ] Server builds without errors
- [ ] Client builds without errors

**Status:** 🔲 Not Started

---

## Phase 5: Loan & Advance Management

### Backend Changes
- [ ] Create `Loan` model (employee, type, amount, EMI, tenure, status)
- [ ] Create `LoanRepayment` model (loan ref, month, amount, status)
- [ ] Create `LoanType` config model (maxAmount, interestRate, maxTenure, applicableTo)
- [ ] Create loan module (controller, service, routes, validation)
- [ ] Integrate with payroll — auto-deduct EMI from netPay
- [ ] Add loan config to CompanySettings

### Frontend Changes
- [ ] Create loan application page
- [ ] Create loan approval page
- [ ] Create loan repayment tracking page
- [ ] Add loan section in employee detail
- [ ] Add loan configuration in Settings

### Audit Checklist
- [ ] Loan application validates against LoanType rules
- [ ] EMI calculated correctly with interest
- [ ] Payroll auto-deducts EMI
- [ ] Loan balance updates on each repayment
- [ ] Notifications sent on key events
- [ ] Audit logs created
- [ ] Server builds without errors
- [ ] Client builds without errors

**Status:** 🔲 Not Started

---

## Phase 6: Statutory Compliance Automation

### Backend Changes
- [ ] Implement slab-based PF calculation (employee 12%, employer 3.67% + 8.33% EPS)
- [ ] Implement slab-based ESI calculation (employee 0.75%, employer 3.25%, <21k salary)
- [ ] Implement slab-based PT calculation (state-wise slabs)
- [ ] Create statutory report generator (Form 5, Form 10, ESI Return, PF ECR)
- [ ] Create challan generator for payment deposit
- [ ] Add statutory config to CompanySettings

### Frontend Changes
- [ ] Create statutory compliance dashboard
- [ ] Create statutory report viewer with download
- [ ] Create challan view page
- [ ] Add statutory settings page (PF/ESI/PT slab configuration, state selection)

### Audit Checklist
- [ ] PF calculated correctly per slab rules
- [ ] ESI calculated correctly per slab rules
- [ ] PT calculated correctly per state rules
- [ ] Statutory reports match expected formats
- [ ] Challan shows correct amounts
- [ ] Server builds without errors
- [ ] Client builds without errors

**Status:** 🔲 Not Started

---

## Completed Phases

| Phase | Module | Completed Date |
|-------|--------|----------------|
| 1 | Leave Management | May 25, 2026 |
| 2 | Payroll Enhancements | May 25, 2026 |
| 3 | QR + TOTP Biometric Attendance System | May 25, 2026 |

---

## Notes

- Each phase must pass audit before moving to next
- If audit fails, fix issues in same phase and re-audit
- All rules must be configurable — no hardcoded values
- Update this document as phases complete
