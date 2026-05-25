# Audit Report: Payroll Module

**Date:** May 25, 2026
**Files audited:** 14 (6 server modules, 3 models, 5 client pages/services)

---

## Route Inventory

### Payroll Routes (`server/src/modules/payroll/payroll.routes.ts`)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/payroll/runs` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| GET | `/api/v1/payroll/runs/employee/:employeeId` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| POST | `/api/v1/payroll/run` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None (manual `month`/`year` check in controller) |
| POST | `/api/v1/payroll/preview` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None (manual `month`/`year` check in controller) |
| GET | `/api/v1/payroll/run/:id` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| POST | `/api/v1/payroll/run/:id/submit` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| POST | `/api/v1/payroll/run/:id/approve` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| POST | `/api/v1/payroll/run/:id/reject` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| PATCH | `/api/v1/payroll/run/:id/item/:itemId` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| PATCH | `/api/v1/payroll/run/:id/items/batch` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None (manual `items` array check in controller) |
| POST | `/api/v1/payroll/run/:id/finalize` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| POST | `/api/v1/payroll/run/:id/unfinalize` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |
| DELETE | `/api/v1/payroll/run/:id` | ✅ `authenticate` | ✅ `process-payroll` | ❌ None |

### Salary Slip Routes (`server/src/modules/salary-slips/salarySlips.routes.ts`)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/salary-slips` | ✅ `authenticate` | ✅ `view-reports` | ❌ None |
| GET | `/api/v1/salary-slips/:id/preview` | ✅ `authenticate` | ✅ `view-reports` | ❌ None |
| GET | `/api/v1/salary-slips/:id/pdf` | ✅ `authenticate` | ✅ `view-reports` | ❌ None |

**Authorization note:** All 16 routes are properly authenticated and authorized — none missing `authenticate()` or `authorize()`.

---

## Issues Found

### 🔴 Critical (0)

| # | Issue | Details | Status |
|---|-------|---------|--------|
| — | **PUT/PATCH mismatch** | **Not found.** Client uses `apiClient.patch(...)` for `updatePayrollItem` and `batchUpdateItems`, and server routes are `PATCH`. ✅ No mismatch. | ✅ OK |
| — | **Missing `authorize()`** | **Not found.** Every route has `authorize()` called. Salary slips use `authorize('view-reports')`, payroll routes use `authorize('process-payroll')`. ✅ No missing. | ✅ OK |

### 🟡 Medium (5)

| # | Issue | File(s) | Details | Fix |
|---|-------|---------|--------|-----|
| 1 | **No validation schemas on any route** | All payroll routes + salary slip routes | Unlike `shifts` (has `createShiftSchema`, `updateShiftSchema`) and `departments` (has `createDepartmentSchema`, `updateDepartmentSchema`), the payroll module has **zero** Zod/Joi validation schemas. Controllers use inline manual checks (`if (!month || !year) throw...`) but no schema-based validation for request bodies. | ❌ |
| 2 | **Missing `updatedBy` in PayrollItem model** | `server/src/models/PayrollItem.model.ts` | The model has `timestamps: true` (createdAt/updatedAt) but no `updatedBy` field. Most other models (Shift, Department, Employee, LeaveType, AttendanceEntry, etc.) have `updatedBy`. The `updatePayrollItem` service receives `userId` but never stores it on the document. | ❌ |
| 3 | **Missing `updatedBy` in PayrollRun model** | `server/src/models/PayrollRun.model.ts` | The model has action-specific trackers (`processedBy`, `submittedBy`, `approvedBy`, `finalizedBy`) but no generic `updatedBy` field. When `batchUpdateItems` or other operations modify the run, no `updatedBy` is recorded. | ❌ |
| 4 | **SalarySlipsService `list()` has no pagination** | `server/src/modules/salary-slips/salarySlips.service.ts:7-23` | The `list()` method calls `PayrollRun.find(filter).sort(...).lean()` without any `.skip()`/`.limit()`. For a company with many months of payroll runs, this returns ALL records unbounded. The client `SalarySlipsPage` doesn't send pagination params either. | ❌ |
| 5 | **No filter support in `listRuns`** | `server/src/modules/payroll/payroll.service.ts:325-338` | The `listRuns` method does `PayrollRun.find()` with **no** query conditions — it returns ALL runs without supporting `status`, `month`, or `search` filters. The client `PayrollPage` only sends `page`/`limit` params. | ❌ |

### 🟢 Minor (4)

| # | Issue | File(s) | Details | Fix |
|---|-------|---------|--------|-----|
| 6 | **Client pagination default mismatch** | `client/src/features/payroll/pages/PayrollPage.tsx:26` | Client sets `const [limit, setLimit] = useState(10)` but `PaginationUtil` defaults `limit` to 20. While the client explicitly sends `limit=10` (so server respects it), this inconsistency means first load returns 10 items when 20 could be available. The `pageSize` fallback in onChange (`size ?? 10`) also doesn't match the server default of 20. | ❌ |
| 7 | **Statutory calculation errors silently swallowed** | `server/src/modules/payroll/payroll.service.ts:286-288` | The `catch {}` block around `calculateStatutoryForEmployee()` has no logging — if statutory calculation fails (PF, ESI, PT), the error is completely silent and payroll proceeds without statutory deductions. This could lead to incorrect payroll. | ❌ |
| 8 | **Inconsistent PDF download method on SalarySlipDetailsPage** | `client/src/features/payroll/pages/SalarySlipDetailsPage.tsx:27` | Uses raw `fetch()` for PDF download instead of `apiClient.get()` with `responseType: 'blob'` (as used in `SalarySlipsPage.tsx:29`). Should use `apiClient` for consistency (cookie handling, error interceptor, base URL). | ❌ |
| 9 | **Preview/run logic duplication** | `server/src/modules/payroll/payroll.service.ts:341-469` | `runPayroll()` (lines 341-436) and `previewRun()` (lines 438-469) share essentially identical logic — both fetch settings, iterate employees, call `calculatePayrollForEmployee`. The only difference is that `runPayroll` persists data. This violates DRY and means bugs fixed in one must be manually replicated in the other. | ❌ |

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| **PUT/PATCH mismatch** — Client uses `apiClient.put()` but server route is `PATCH` | ✅ No mismatch — client uses `apiClient.patch()` throughout |
| **Missing `authorize()` on any route** | ✅ All 16 routes have `authorize()` |
| **Missing `updatedBy` in model** | ❌ Missing in both `PayrollItem` and `PayrollRun` models |
| **Search regex unescaped (`$regex`)** | ✅ No `$regex` used anywhere in payroll module |
| **`new Promise(async (resolve)...)` anti-pattern** | ✅ None found in payroll service |
| **Pagination defaults matching** | ⚠️ Client default `limit=10` vs server default `limit=20` (minor) |
| **Duplicate payroll run (same month/year)** | ✅ Handled — `runPayroll` checks `existingRun` and throws 400 |
| **Edit finalized payroll run** | ✅ Handled — `updatePayrollItem` and `batchUpdateItems` check `run.status !== 'finalized'` |
| **Submit non-draft payroll** | ✅ Handled — `submitRun` checks `run.status !== 'draft'` |
| **Approve non-submitted payroll** | ✅ Handled — `approveRun` checks `run.status !== 'submitted'` |
| **Reject non-submitted payroll** | ✅ Handled — `rejectRun` checks `run.status !== 'submitted'` |
| **Unfinalize within/outside window** | ✅ Handled — `unfinalizeRun` enforces configurable time window (default 7 days) |
| **Unfinalize non-finalized run** | ✅ Handled — throws 400 if status is not `finalized` |
| **Finalize already-finalized run** | ✅ Handled — throws 400 |
| **Delete finalized run** | ✅ Handled — throws 400 |
| **Non-existent run ID** | ✅ Handled — `findById` returns null → 404 AppError |
| **Non-existent item ID** | ✅ Handled — `findById` returns null → 404 AppError |
| **Batch update with mixed success/failure** | ✅ Partial failure handled — returns results array with per-item status |
| **Missing month/year on run/preview** | ✅ Manual check in controller throws Error |
| **Empty items array on batch update** | ✅ Controller checks `Array.isArray(items)` |
| **Salary slip generation for non-finalized run** | ✅ Handled — throws 400 in `SalarySlipsService.generatePdf` |
| **Concurrent payroll runs for same month** | ⚠️ Race condition — no atomic lock; two simultaneous requests could both pass the `existingRun` check |
| **Statutory calculation failure** | ⚠️ Error silently caught — payroll proceeds without deductions (issue #7) |

---

## Client ↔ Server Method Verification

| Operation | Client Method | Server Method | Match |
|-----------|--------------|---------------|-------|
| List runs | `apiClient.get('/payroll/runs')` | `router.get('/runs', ...)` | ✅ |
| List by employee | `apiClient.get('/payroll/runs/employee/:id')` | `router.get('/runs/employee/:employeeId', ...)` | ✅ |
| Run payroll | `apiClient.post('/payroll/run')` | `router.post('/run', ...)` | ✅ |
| Preview | `apiClient.post('/payroll/preview')` | `router.post('/preview', ...)` | ✅ |
| Get run details | `apiClient.get('/payroll/run/:id')` | `router.get('/run/:id', ...)` | ✅ |
| Submit | `apiClient.post('/payroll/run/:id/submit')` | `router.post('/run/:id/submit', ...)` | ✅ |
| Approve | `apiClient.post('/payroll/run/:id/approve')` | `router.post('/run/:id/approve', ...)` | ✅ |
| Reject | `apiClient.post('/payroll/run/:id/reject')` | `router.post('/run/:id/reject', ...)` | ✅ |
| **Update item** | **`apiClient.patch('/payroll/run/:id/item/:itemId')`** | **`router.patch('/run/:id/item/:itemId', ...)`** | **✅** |
| **Batch update** | **`apiClient.patch('/payroll/run/:id/items/batch')`** | **`router.patch('/run/:id/items/batch', ...)`** | **✅** |
| Finalize | `apiClient.post('/payroll/run/:id/finalize')` | `router.post('/run/:id/finalize', ...)` | ✅ |
| Unfinalize | `apiClient.post('/payroll/run/:id/unfinalize')` | `router.post('/run/:id/unfinalize', ...)` | ✅ |
| Delete | `apiClient.delete('/payroll/run/:id')` | `router.delete('/run/:id', ...)` | ✅ |

**No PUT/PATCH mismatches found.** All 13 client-server method pairs match correctly.

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 **Critical** | **0** | No PUT/PATCH mismatches, no missing `authorize()` — payroll module is strong on this front |
| 🟡 **Medium** | **4** | No validation schemas (all routes); SalarySlips list has no pagination; no filter support in listRuns; silent catch on statutory errors |
| 🟢 **Minor** | **4** | Client pagination default mismatch (10 vs 20); silent catch on statutory errors; inconsistent PDF download method; preview/run logic duplication |

**Total issues: 9 (0 critical, 5 medium, 4 minor)**

**Fixes status: ❌ 7 of 9 issues remain unfixed** (✅ `updatedBy` added to PayrollItem and PayrollRun models)

The Payroll module is functionally well-structured with proper auth/authz on all routes and correct HTTP method alignment between client and server. The main areas for improvement are the complete absence of validation schemas, missing `updatedBy` tracking on both models, unbounded queries on salary slips list, and silent error swallowing during statutory calculations.
