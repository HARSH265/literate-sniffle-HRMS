# Payroll Module - Complete Audit Report

**Date:** May 30, 2026  
**Module:** Payroll  
**Audit status:** Current-state audit completed against repository code; implementation in progress  
**Overall status:** Improved after first fix batch, but still not production-ready until remaining P1/P2 calculation and access-control risks are closed

---

## 1. Scope Reviewed

### Server

- `server/src/modules/payroll/payroll.service.ts`
- `server/src/modules/payroll/payroll.controller.ts`
- `server/src/modules/payroll/payroll.routes.ts`
- `server/src/modules/payroll/payroll.validation.ts`
- `server/src/models/PayrollRun.model.ts`
- `server/src/models/PayrollItem.model.ts`
- Related models: `AttendanceEntry`, `OvertimeEntry`, `LoanRepayment`
- Cross-module readers: `salary-slips`, `ess`

### Client

- `client/src/features/payroll/services/payrollService.ts`
- `client/src/features/payroll/pages/PayrollPage.tsx`
- `client/src/features/payroll/pages/PayrollDetailsPage.tsx`
- `client/src/core/constants/api.endpoints.ts`
- Payroll tests under `client/src/features/payroll/**/__tests__`

---

## 2. Verification Results

| Check | Result | Notes |
|---|---:|---|
| Server build: `npm run build` | Failed | Payroll has TypeScript errors around `PayrollRun.create(..., { session })`; unrelated department errors also exist. |
| Client build: `npm run build` | Passed | Production client build completed. |
| Server payroll tests | Failed | `unfinalizeRunSchema` test expects reason to be required, schema allows empty body. |
| Client payroll tests | Passed with warnings | Tests pass, but jsdom reports `getComputedStyle` gaps and unmocked XHR noise. |

---

## Implementation Progress

### Fixed in first implementation batch

- Payroll server TypeScript errors from `PayrollRun.create(..., { session })` were fixed.
- Payroll item edit and batch edit validation now matches the actual client/service payload shape.
- `itemId` and `employeeId` route params now receive ObjectId validation.
- Payroll item edits and batch edits are restricted to draft runs and scoped to the target payroll run.
- Finalization now requires approved status.
- Unfinalization now requires a reason, and the payroll UI collects that reason.
- Statutory calculation failures now fail payroll calculation instead of silently omitting deductions.
- Loan repayments are linked to payroll items and marked deducted on finalization, not draft creation; unfinalize/delete restores deducted repayments to pending.
- Payroll run list filters for `status`, `year`, and `month` are now applied.
- Focused payroll server tests pass: 41 tests.
- Focused payroll client tests pass: 21 tests.
- Client production build passes.

### Still open

- Overall server build still fails because of existing `departments.service.ts` TypeScript errors outside payroll.
- Calculation consistency, source snapshot/session coverage, salary-slip hardening, preview scaling, and payroll UI/test cleanup remain open.

---

## 3. Critical Findings

### P0 - Server build is broken in payroll

**Files:** `server/src/modules/payroll/payroll.service.ts:381`, `:392`, `:427`, `:437`, `:445`, `:459`

`PayrollRun.create(document, { session })` is typed by Mongoose as returning an array overload in this usage, so TypeScript treats `run` as an array and rejects `run._id`. The catch block also reads `err?.message` when `err` is `unknown`.

**Impact:** The server cannot compile. Payroll cannot be safely released.

**Recommendation:** Use the single-document array form with destructuring:

```ts
const [run] = await PayrollRun.create([{ ...payload }], { session });
```

or instantiate and `save({ session })`. Also narrow `err instanceof Error` before reading `message`.

### P0 - Payroll item edit APIs are effectively broken by validation mismatch

**Files:** `server/src/modules/payroll/payroll.validation.ts:16`, `:22`; `server/src/modules/payroll/payroll.service.ts:673`, `:724`; `client/src/features/payroll/pages/PayrollDetailsPage.tsx:80`, `:96`; `client/src/features/payroll/services/payrollService.ts:80`, `:85`

The UI sends fields like `basicEarnings`, `netPay`, `presentDays`, `totalDeductions`, and batch entries shaped as `{ itemId, data }`. The server validation schema allows `earnings`, `deductions`, and `remarks`, while batch validation requires `{ itemId, updates }`.

Because the validation middleware replaces `req.body` with parsed data, most client edit fields are stripped or rejected before reaching the service.

**Impact:** Single-item edits and batch edits either no-op, fail validation, or silently lose data. This is a direct payroll correction workflow failure.

**Recommendation:** Align schema, service, and UI on one payload contract. Add route tests for:

- `PATCH /payroll/run/:id/item/:itemId` with `basicEarnings` and `netPay`
- `PATCH /payroll/run/:id/items/batch` with `{ itemId, data }`
- invalid negative amounts and invalid item ids

### P0 - Employee payroll owner check is incorrect and currently unreachable for employees

**Files:** `server/src/modules/payroll/payroll.routes.ts:17`; `server/src/modules/payroll/payroll.controller.ts:73-81`; `server/src/modules/ess/ess.service.ts:317-322`

The route requires `authorize('process-payroll')`, so ordinary employees cannot call it. The controller then compares `req.user.id` to `employeeId`, but `req.user.id` is a user id and `employeeId` is an employee document id. That owner check will not work unless user ids and employee ids happen to match.

**Impact:** Employees cannot reliably view their own payroll history through this route, and any future relaxation of the route permission would still have a broken ownership check.

**Recommendation:** Either keep the route admin-only and remove the misleading owner logic, or allow an own-payslip permission and compare `req.user.employeeId` to `employeeId`.

### P0 - Payroll calculations can silently omit statutory deductions

**File:** `server/src/modules/payroll/payroll.service.ts:269-288`

If `calculateStatutoryForEmployee` throws, payroll continues without PF, ESI, or professional tax. The catch block is empty.

**Impact:** Payroll can be finalized with missing statutory deductions and no visible failure.

**Recommendation:** Fail the payroll run by default. If the business requires statutory-optional payroll, record an explicit warning per employee and block finalization until acknowledged.

---

## 4. High Findings

### P1 - Transaction does not cover calculation reads or statutory/loan lookups

**Files:** `server/src/modules/payroll/payroll.service.ts:343-459`, `:128-320`

`runPayroll` starts a session, but `calculatePayrollForEmployee` does not receive or use the session. Attendance, overtime, leave, statutory, and loan repayment reads happen outside the transaction.

**Impact:** A payroll run can combine one snapshot for employees/settings with different snapshots for attendance, overtime, leave, loans, and statutory configuration.

**Recommendation:** Pass session into calculation reads, or define payroll as a snapshot process and persist the source snapshot/timestamp used.

### P1 - Loan repayment status is mutated during payroll creation and not restored on delete/unfinalize

**Files:** `server/src/modules/payroll/payroll.service.ts:294-315`, `:425-429`, `:588-627`, `:774-787`

Loan repayments are marked `deducted` when a draft payroll is created. If the run is deleted, rejected, unfinalized, or item deductions are edited, the repayment status is not reverted or recalculated.

**Impact:** Loan data can show a repayment as deducted even when the payroll run was deleted or changed.

**Recommendation:** Mark loan repayment as deducted only on finalization, or implement full rollback/reconciliation on delete, reject, unfinalize, and item edits.

### P1 - Finalize is allowed from draft

**File:** `server/src/modules/payroll/payroll.service.ts:548-552`

`finalizeRun` only blocks already-finalized runs. It does not require `approved` status.

**Impact:** A draft or submitted payroll can bypass the intended submit/approve workflow.

**Recommendation:** Require `run.status === 'approved'` before finalization.

### P1 - Payroll edits allow direct net pay overrides without recalculating gross/deductions/totals consistently

**Files:** `server/src/modules/payroll/payroll.service.ts:673-722`, `:724-772`

Single and batch item edits can change `basicEarnings`, `netPay`, attendance counts, overtime, and deductions independently. The service recalculates only `PayrollRun.totalNetPay`; it does not recompute gross earnings, allowance totals, statutory deductions, loan deductions, or audit-grade change details for batch edits.

**Impact:** Payroll item data can become internally inconsistent: `netPay` may no longer equal `grossEarnings - totalDeductions`.

**Recommendation:** Use a recalculation path for editable source fields, or restrict manual edits to explicit adjustment lines that preserve formulas.

### P1 - Route parameter validation does not validate `itemId` or `employeeId`

**Files:** `server/src/modules/payroll/payroll.routes.ts:17`, `:24`; `server/src/modules/payroll/payroll.validation.ts:37`

`payrollIdParamSchema` validates only `id`. Routes with `:itemId` and `:employeeId` do not validate those params.

**Impact:** Invalid ids can reach service/database code, causing cast errors and inconsistent error responses.

**Recommendation:** Add param schemas for `{ id, itemId }` and `{ employeeId }`.

### P1 - Salary slip generation can expose all employee payslips to whoever can access a finalized run

**Files:** `server/src/modules/salary-slips/salarySlips.service.ts:26-43`

`generatePdf` accepts an optional `employeeId`. If omitted, it returns all payroll items for the run. This may be correct for payroll admins, but it requires strict route authorization and separate ESS-safe routes.

**Impact:** A route-level permission mistake would expose all salary data.

**Recommendation:** Keep admin bulk generation separate from employee self-service single-slip access. Add service-level ownership checks for employee mode.

---

## 5. Medium Findings

### P2 - Working-day and standard-hour config lacks explicit safety guards

**File:** `server/src/modules/payroll/payroll.service.ts:217-247`, `:365-366`, `:474-475`

Defaults use `|| 26` and `|| 8`, which avoids zero for some cases, but there is no schema-level/settings-level validation for invalid payroll config. Negative or unexpected values can still produce invalid earnings.

**Recommendation:** Validate payroll settings on save and assert `workingDays > 0`, `standardHours > 0`, percentage ranges, and non-negative money values inside payroll calculation.

### P2 - Leave deduction method is selected from the first unpaid leave type only

**File:** `server/src/modules/payroll/payroll.service.ts:250-263`

When multiple unpaid leave types exist in one month, the calculation finds a single unpaid leave application and applies its deduction method to all unpaid leave days.

**Impact:** Employees with mixed unpaid leave types can be over- or under-deducted.

**Recommendation:** Track deduction method per day in `leaveDayMap` and sum deductions per method.

### P2 - Daily-wage employees ignore half-days, leave, weekly offs, and holidays in base earnings

**File:** `server/src/modules/payroll/payroll.service.ts:219-222`

Monthly salary uses `effectiveWorkingDays`; daily wage uses only `presentDays`.

**Impact:** Daily-wage payroll can underpay paid holidays/weekly offs/paid leave and mishandle half days.

**Recommendation:** Define daily-wage policy explicitly and calculate from `effectiveWorkingDays` when paid non-present days should count.

### P2 - Late-present attendance is treated as full absence

**File:** `server/src/modules/payroll/payroll.service.ts:166-172`

For `present` records with `isLatePresent`, the code increments `absentDays`, then applies `lateDeductionPerDay`.

**Impact:** Naming suggests a late present, but payroll treats it as absent for present-day count and deduction purposes.

**Recommendation:** Clarify the attendance rule. If late-present means present with penalty, keep present day and apply late count/deduction separately.

### P2 - Preview can be expensive and is not cached or limited

**Files:** `server/src/modules/payroll/payroll.service.ts:463-494`; `client/src/features/payroll/pages/PayrollPage.tsx:47-54`

Preview recalculates payroll for all active employees and returns all items. The UI displays only the first 10, but the full payload still travels over the network.

**Impact:** Large organizations can hit slow response times and large payloads.

**Recommendation:** Return summary plus paginated preview items, or make preview an async job.

### P2 - List filters are validated but not applied

**Files:** `server/src/modules/payroll/payroll.validation.ts:8-14`; `server/src/modules/payroll/payroll.service.ts:324-340`

The list schema accepts `status`, `month`, and `year`, but `listRuns` ignores them.

**Impact:** API callers cannot filter runs despite the API contract implying support.

**Recommendation:** Apply filters or remove them from the schema.

### P2 - API endpoint constants contain payroll item routes that do not exist

**File:** `client/src/core/constants/api.endpoints.ts:113-117`

Constants define `/payroll/items` and `/payroll/items/:id`, but server routes do not expose those endpoints.

**Impact:** Future code using these constants will call dead endpoints.

**Recommendation:** Remove dead constants or add matching server routes.

### P2 - Payroll list/detail queries have no stale time

**Files:** `client/src/features/payroll/pages/PayrollPage.tsx:29-33`; `client/src/features/payroll/pages/PayrollDetailsPage.tsx:28-32`

React Query uses default stale behavior, so pages may refetch more often than necessary.

**Recommendation:** Add appropriate `staleTime` for payroll runs/details, while invalidating after mutations.

---

## 6. Low Findings

### P3 - Audit log is written inside the payroll transaction without guaranteed transactional participation

**File:** `server/src/modules/payroll/payroll.service.ts:433-438`

`AuditService.log` is called before commit but without passing the payroll transaction session.

**Impact:** Audit records and payroll writes can diverge if the audit write succeeds and the payroll transaction later aborts, depending on AuditService behavior.

**Recommendation:** Log after commit, or support session-aware audit logging.

### P3 - Preview table uses unstable random row keys

**File:** `client/src/features/payroll/pages/PayrollPage.tsx:209`

`rowKey={(r) => r.employee?.id || String(Math.random())}` can cause unstable rendering.

**Recommendation:** Require a stable employee id or derive a deterministic fallback.

### P3 - Reject/finalize/unfinalize actions do not collect reason/remarks in the UI

**Files:** `client/src/features/payroll/pages/PayrollPage.tsx:137-144`; `client/src/features/payroll/pages/PayrollDetailsPage.tsx:170-178`

The service supports reasons/remarks, but page actions call mutations without prompting for them.

**Recommendation:** Add confirmation modals with reason/remarks fields for auditable transitions.

### P3 - Salary slip HTML interpolates names directly

**File:** `server/src/modules/salary-slips/salarySlips.service.ts:68-76`

Allowance/deduction names are interpolated into HTML. If those names can be configured by users, HTML should be escaped before PDF rendering.

**Recommendation:** Escape all dynamic text before composing salary slip HTML.

### P3 - Client payroll tests pass but hide real network calls/warnings

**Files:** `client/src/features/payroll/pages/__tests__/PayrollPage.test.tsx`; `client/src/features/payroll/pages/__tests__/PayrollDetailsPage.test.tsx`

Tests pass, but output includes unimplemented `getComputedStyle`, act warnings, and XHR aggregate errors.

**Recommendation:** Mock payroll service/API calls and jsdom layout helpers in test setup to make failures meaningful.

---

## 7. Model and Index Review

| Model | Status |
|---|---|
| `PayrollRun.month` | Unique index exists. Good. |
| `PayrollRun.status` | Index exists. Good. |
| `PayrollItem(payrollRun, employee)` | Unique compound index exists. Good. |
| `PayrollItem.employee` | Index exists. Good. |
| `AttendanceEntry(employee, date)` | Unique compound index exists. Good. |
| `OvertimeEntry(employee, date)` | Compound index exists. Good. |
| `LoanRepayment(employee, month)` | Compound index exists. Good. |

---

## 8. Recommended Fix Order

1. Fix server build errors in `payroll.service.ts`.
2. Align payroll edit and batch validation schemas with service/client payloads.
3. Enforce lifecycle transitions: draft -> submitted -> approved -> finalized; block direct finalize.
4. Decide and implement correct owner/self-service payroll history authorization.
5. Stop silently swallowing statutory calculation failures.
6. Rework loan repayment lifecycle so draft payroll does not permanently mark repayments deducted.
7. Add session/snapshot consistency for calculation reads.
8. Add calculation invariant tests for net pay, statutory deductions, loans, mixed leave, daily wage, and late-present behavior.
9. Clean client endpoint constants, query stale times, and transition reason modals.
10. Harden salary slip service with service-level auth assumptions and HTML escaping.

---

## 9. Tests Needed

- Route-level integration tests for item edit and batch edit payloads.
- Concurrent payroll-run test for duplicate month protection.
- Payroll calculation tests for:
  - monthly employee with present/half/leave/holiday/weekly-off days
  - daily-wage employee
  - mixed paid and unpaid leave types
  - statutory calculation failure
  - loan repayment deduction and rollback/delete behavior
  - finalized payroll immutability
- Salary slip access tests:
  - admin all-employee generation
  - employee own slip only
  - finalized-only guard
- Client tests for edit modal, batch save payload, transition modals, and preview behavior.

---

## 10. Current Conclusion

The payroll module has useful foundations: routes are mostly protected, models have the important indexes, the client pages exist, and the client build succeeds. However, the current server build failure and validation contract mismatch make payroll unsafe for production. The calculation engine also has several payroll-domain risks: statutory failures are hidden, loans are marked deducted too early, finalization can bypass approval, and manual edits can break financial invariants.

This module should be treated as **not production-ready** until the P0 and P1 findings are fixed and covered with route/integration tests.
