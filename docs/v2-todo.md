# Orian HRMS — V2 Development Todo

**Last Updated:** May 25, 2026

## Current Work
- Phase 3: QR + TOTP Biometric Attendance System — In progress

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

## Phase 3: QR + TOTP Biometric Attendance System

### Architecture Overview

```
Kiosk QR (15s TTL) → proves PHYSICAL PRESENCE at the gate
     +
Worker TOTP (authenticator app) → proves IDENTITY
     =
True 2-Factor Authentication — stops proxy attendance
```

**Authentication Model:** Kiosk QR (15-second expiry) + Employee TOTP (Google Authenticator / Authy / MS Authenticator)

**Kiosk Hardware:** Any Android tablet with browser in kiosk mode — displays clock + animated QR code

**Worker Phone:** PWA installed to home screen — scan QR, enter TOTP, confirm

**Fallback:** Existing manual attendance entry (supervisor marks via admin panel)

### Part A: Dependencies
- [ ] `server/package.json` → add `socket.io`, `otplib`, `qrcode`
- [ ] `client/package.json` → add `html5-qrcode`, `@zxing/browser`

### Part B: Model & Schema Changes
- [ ] `Employee.model.ts` — add `totpSecret`, `totpEnabled`, `registeredDeviceId`
- [ ] `AttendanceEntry.model.ts` — add `checkInMethod`, `checkOutMethod`, `checkInDeviceId`, `checkInTokenNonce`, `checkInGPS`, `totpVerified`, `isLatePresent`, `supervisorOverride`
- [ ] Create `KioskDevice.model.ts` — `{ name, location: { lat, lng }, isActive, lastSeenAt }`
- [ ] `CompanySettings.model.ts` — expand `attendanceConfig` (see Part C); add OT trick fields to `payrollConfig`

### Part C: New Config Fields

#### `attendanceConfig` additions:
```
qrKioskEnabled (bool, default false)
qrRefreshIntervalSeconds (15)
qrTokenExpirySeconds (15)
geofencingEnabled (bool, false)
geofenceLatitude, geofenceLongitude, geofenceRadiusMeters (50)
totpEnabled (bool, false)
shiftStartTime ('09:00'), shiftEndTime ('18:00')
gracePeriodMinutes (5)
lateMarkAsAbsent (true)
lateTreatWorkAsOT (true)
supervisorOverrideEnabled (true)
deviceBindingEnabled (false), maxDevicesPerEmployee (1)
```

#### `payrollConfig` additions:
```
otTricksEnabled (bool, false) — master switch
otRoundingMinutes (60)
otRoundingMethod ('floor' | 'ceil', default 'floor')
otMultiplierBasicOnly (bool, false)
```

### Part D: New Backend Modules
- [ ] Create `server/src/core/socket/socket.ts` — Socket.io init, kiosk room, QR broadcast
- [ ] Create `server/src/modules/kiosk/kiosk.service.ts` — QR token generate/validate, push via socket
- [ ] Create `server/src/modules/kiosk/kiosk.controller.ts` — `GET /kiosk/qr`, `GET /kiosk/status`
- [ ] Create `server/src/modules/kiosk/kiosk.routes.ts`
- [ ] Create `server/src/modules/totp/totp.service.ts` — generate secret, verify, enroll
- [ ] Create `server/src/modules/totp/totp.controller.ts` — `POST /totp/enroll`, `POST /totp/verify`
- [ ] Create `server/src/modules/totp/totp.routes.ts`
- [ ] Create `server/src/modules/attendance-qr/attendanceQR.service.ts` — full check-in/out flow
- [ ] Create `server/src/modules/attendance-qr/attendanceQR.controller.ts` — `POST /attendance/qr/check-in`, `POST /attendance/qr/check-out`
- [ ] Create `server/src/modules/attendance-qr/attendanceQR.routes.ts`
- [ ] Create `server/src/modules/attendance-qr/attendanceQR.validation.ts`

### Part E: Modified Backend Files
- [ ] `attendance.service.ts` — add `bulkUpdateEntries()`; geo-handling; OT auto-calc in create/update
- [ ] `attendance.controller.ts` — add `bulkUpdateEntries` handler
- [ ] `attendance.routes.ts` — add `PATCH /bulk-update` route
- [ ] `attendance.validation.ts` — add bulk-update schema, optional geo fields
- [ ] `payroll.service.ts` — `calculatePayrollForEmployee`: apply `otTricksEnabled` (floor rounding, basic-only multiplier); handle `isLatePresent` → absent + all hours as OT
- [ ] `server/src/app.ts` — mount kiosk, totp, new attendance routes; init Socket.io

### Part F: New Frontend Files
- [ ] `client/src/features/kiosk/pages/KioskPage.tsx` — full-screen kiosk QR display with Socket.io
- [ ] `client/src/features/attendance-qr/pages/ScanPage.tsx` — mobile PWA: camera QR scanner → TOTP input → confirmation
- [ ] `client/src/features/attendance-qr/pages/CheckInConfirm.tsx` — success/failure screen
- [ ] `client/src/features/totp/pages/TOTPEnrollPage.tsx` — HR admin: generate TOTP secret QR for employee enrollment
- [ ] `client/src/features/attendance-qr/components/KioskQR.tsx` — reusable QR component with auto-refresh
- [ ] `client/src/features/attendance-qr/services/attendanceQRService.ts` — API calls for QR check-in/out

### Part G: Modified Frontend Files
- [ ] `AttendancePage.tsx` — add geo fields in Mark modal; selectable rows + Bulk Edit in Records tab; clickable cells in Monthly View
- [ ] `attendanceService.ts` — add `bulkUpdate()` method
- [ ] `SettingsPage.tsx` — expand Attendance Section with QR Kiosk, TOTP, Geofencing, Shift Rules, Supervisor Override; add OT Tricks section to Payroll config
- [ ] `Sidebar.tsx` — add Kiosk link (admin); add TOTP Enroll link under Settings
- [ ] `App.tsx` — add routes for `/kiosk`, `/m/scan`, `/m/confirm`, `/settings/totp`
- [ ] `client/public/manifest.json` (new) — PWA manifest for mobile install
- [ ] `client/public/sw.js` (new) — service worker for offline scanner cache + install prompt

### Part H: Check-in/out End-to-End Flow

#### Check-In:
1. Kiosk connects via Socket.io → joins room `kiosk:{deviceId}`
2. Server generates QR token (JWT: `{ kioskId, nonce, exp }`) every 15s → emits to room
3. Kiosk renders QR as canvas
4. Worker opens phone → `/m/scan` → scans QR
5. Phone calls `GET /api/v1/kiosk/qr/validate?token=xxx`
6. Server returns kiosk info + prompts for TOTP
7. Worker enters 6-digit code from authenticator app
8. Phone calls `POST /api/v1/attendance/qr/check-in` with `{ token, totpCode, employeeId, deviceId }`
9. Server: validates token (expiry + reuse), verifies TOTP, checks geofence (if enabled), records `AttendanceEntry`
10. If `inTime > 09:05` → status = `absent`, `isLatePresent = true`
11. Phone shows confirmation

#### Check-Out:
- Same flow but `POST /api/v1/attendance/qr/check-out`
- Server finds today's open entry, records `outTime`
- If `isLatePresent` → all hours between inTime-outTime treated as OT
- Auto-creates `OvertimeEntry` record

### Part I: 9:05 Rule + OT Tricks in Payroll

In `calculatePayrollForEmployee()`:
- `isLatePresent = true` → `absentDays++`, `presentDays` unchanged, all worked hours = OT
- `otTricksEnabled` = true → OT rounded down to nearest `otRoundingMinutes` (floor), multiplier applies to basic salary only
- `otTricksEnabled` = false → standard OT calculation (full hours, gross rate)

### Part J: Supervisor Override
- HR/manager can mark attendance manually from admin panel (existing flow kept as-is)
- Supervisor override creates entry with `checkInMethod: 'supervisor'`
- All override attempts logged in audit trail

### Audit Checklist
- [ ] QR token validates expiry (15s TTL) and single-use (nonce dedup)
- [ ] TOTP verification works (provision → enroll → verify cycle)
- [ ] Geofencing rejects entries outside configured radius
- [ ] Check-in marks correct status based on grace period rule
- [ ] Check-out auto-calculates OT for late-present workers
- [ ] OT rounding (floor to 60min) works correctly
- [ ] OT basic-only multiplier works correctly
- [ ] Bulk edit updates multiple existing entries
- [ ] Supervisor override stores override trail
- [ ] Old manual attendance remains fully functional
- [ ] Mobile PWA scans QR + enters TOTP end-to-end
- [ ] Kiosk display refreshes QR every 15s via Socket.io
- [ ] Settings page exposes all new config fields
- [ ] TOTP enrollment page generates scannable QR for authenticator app
- [ ] All configs default to disabled — admin must opt-in
- [ ] Server builds without errors
- [ ] Client builds without errors

**Status:** 🔲 Not Started

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

---

## Notes

- Each phase must pass audit before moving to next
- If audit fails, fix issues in same phase and re-audit
- All rules must be configurable — no hardcoded values
- Update this document as phases complete
