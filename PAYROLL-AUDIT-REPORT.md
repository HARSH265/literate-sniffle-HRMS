# Payroll Module — Final Audit Report

**Date:** June 7, 2026
**Scope:** Full payroll module audit — client & server
**Total Issues Found:** 79

---

## Summary

| Severity | Server | Client | Total |
|----------|--------|--------|-------|
| Critical | 6 | 3 | **9** |
| High | 8 | 5 | **13** |
| Medium | 20 | 11 | **31** |
| Low | 10 | 11 | **21** |
| **Total** | **49** | **30** | **79** |

---

## SERVER SIDE

### CRITICAL

#### S1. `finalizeRun()` lacks transaction safety — partial failure corrupts data
**File:** `server/src/modules/payroll/payroll.service.ts:1326-1395`

Performs multiple writes (updating PayrollRun status, PayrollItem statuses, LoanRepayment records, audit logging, notifications) without a MongoDB session/transaction. If the process crashes after `run.save()` but before the `updateMany`, the run shows `finalized` while items remain `approved`. Compare with `unfinalizeRun` which correctly uses `session.startTransaction()`.

#### S2. `submitRun()` / `approveRun()` lack transaction safety
**File:** `server/src/modules/payroll/payroll.service.ts:1256-1298`

Both perform multiple DB writes (`run.save()` + `PayrollItem.updateMany()` + `AuditService.log()`) without a transaction. Partial failure leaves statuses out of sync.

#### S3. `supplementaryRun()` lacks transaction safety
**File:** `server/src/modules/payroll/payroll.service.ts:1485-1594`

Creates a `PayrollRun` and then `insertMany` for `PayrollItem` docs without a session. If `insertMany` fails, a PayrollRun with no items will exist.

#### S4. `deleteRun()` lacks transaction safety
**File:** `server/src/modules/payroll/payroll.service.ts:1774-1793`

Three operations without a transaction: `LoanRepayment.updateMany`, `PayrollItem.deleteMany`, and `PayrollRun.findByIdAndDelete`. Partial failure leaves inconsistent state.

#### S5. `updatePayrollItem()` recalculates aggregates outside a transaction
**File:** `server/src/modules/payroll/payroll.service.ts:1651-1704`

After `item.save()`, it runs an aggregation and updates the PayrollRun. If the aggregation or update fails, PayrollRun totals become stale. Also a race condition under concurrent edits.

#### S6. Overtime entry creation race condition (double-booking)
**File:** `server/src/modules/overtime-entries/overtimeEntries.service.ts:68-149`

The overtime hours check reads existing hours via `aggregate()`, then creates the entry. This read-then-write is not atomic. Two concurrent requests can both pass the `maxHoursPerMonth` check, exceeding statutory limits.

---

### HIGH

#### S7. Hardcoded `15000` PF wage ceiling ignores settings
**File:** `server/src/modules/statutory/statutory.service.ts:88,156,385`

EPS calculation uses hardcoded `15000` (`Math.min(pfApplicableWages, 15000)`) instead of `defaults.pfWageCeiling`. Changing the PF ceiling in settings has no effect on EPS.

#### S8. `supplementaryPayroll` bypasses `validateMonthYear`
**File:** `server/src/modules/payroll/payroll.controller.ts:52-56`

No validation on `month`, `year`, `employeeIds`, or `reason` from the request body.

#### S9. XSS in salary slip HTML generation
**File:** `server/src/modules/salary-slips/salarySlips.service.ts:70-76`

User-controlled data (allowance/deduction names, employee names) interpolated directly into HTML without escaping. A component name like `<script>alert(1)</script>` would be injected.

#### S10. N+1 query pattern in `runPayroll`
**File:** `server/src/modules/payroll/payroll.service.ts:527-1012`

Each employee triggers 10+ DB queries (attendance, overtime, leave, salary structure, statutory, YTD items, loan repayments, minimum wage, arrears). For 500 employees, this is thousands of DB queries. `BATCH_SIZE = 50` only parallelizes; it doesn't reduce total count.

#### S11. `updateMany` without session in submit/approve/reject/finalize
**Files:** `server/src/modules/payroll/payroll.service.ts:1268,1294,1320,1352`

These `updateMany` calls are outside any session and cannot be rolled back if a subsequent operation fails.

#### S12. Compliance flag assignment uses hardcoded 8 checks per item
**File:** `server/src/modules/compliance/compliance.service.ts:342-348`

Slicing assumes exactly 8 checks per item. If a different number of checks is produced, compliance flags will be misaligned between items.

#### S13. Loan repayment creates in loop without transaction
**File:** `server/src/modules/loans/loans.service.ts:105-129`

Creates a `Loan` document, then creates `LoanRepayment` documents one at a time in a `for` loop. Failure mid-loop leaves partial repayment schedules.

#### S14. `req.user!._id` vs `req.user!.id` mismatch in payroll-reports
**File:** `server/src/modules/payroll-reports/payroll-reports.controller.ts:16,27,38,49`

Uses `(req as any).user?._id?.toString()` while payroll controller uses `req.user!.id`. These may resolve differently, breaking audit trail for reports.

---

### MEDIUM

#### S15. `isLatePresent` treated as full absent
**File:** `server/src/modules/payroll/payroll.service.ts:571-576`

An employee marked `present` but late is counted as fully `absent`, getting zero pay for that day instead of a partial deduction.

#### S16. Pro-rata factor wrong for same-month joiner + leaver
**File:** `server/src/modules/payroll/payroll.service.ts:641-661`

If an employee joins and leaves in the same month, the pro-rata factor is overwritten instead of combining both calculations.

#### S17. `getWorkingDaysInMonth` hardcodes Sunday exclusion
**File:** `server/src/modules/payroll/payroll.service.ts:631-638`

Excludes only Sundays, ignoring company-specific weekly off rules, Saturday holidays, and regional variations.

#### S18. Race condition on `PayrollRun.month` unique index
**File:** `server/src/modules/payroll/payroll.service.ts:1047-1054`

Two concurrent requests can both pass the `findOne` check. The duplicate key error becomes a generic 500 instead of a 400.

#### S19. Only first pending loan repayment linked
**File:** `server/src/modules/payroll/payroll.service.ts:876-877`

Only `loanRepayments[0]._id` is stored. Multiple repayments are deducted but only one is linked to the payroll item.

#### S20. `previewRun()` lacks per-employee error handling
**File:** `server/src/modules/payroll/payroll.service.ts:1230-1244`

Unlike `runPayroll()` which wraps each employee in `.catch()`, `previewRun` fails entirely if one employee's calculation errors.

#### S21. `CompanySettings.findOne()` inside per-employee loop
**File:** `server/src/modules/payroll/payroll.service.ts:899`

Singleton document fetched once per employee instead of once before the loop. Redundant DB queries.

#### S22. `previewRun` accessible with no extra rate limiting
**File:** `server/src/modules/payroll/payroll.controller.ts:29-35`

Triggers full payroll calculations for all active employees. Could be used as a DoS vector.

#### S23. CSV injection in bank file
**File:** `server/src/modules/payroll-reports/bankfile.service.ts:121`

Employee names not sanitized for CSV injection (e.g., `=CMD("calc")` in Excel).

#### S24. `numberToWords` only supports values up to crore
**File:** `server/src/modules/payroll-reports/payslip.service.ts:208-239`

No support for `Arab` (10^9) or higher. Very large payrolls produce incorrect amounts in words.

#### S25. Missing index for `listRuns` year-only filter
**File:** `server/src/models/PayrollRun.model.ts:77,110`

`$regex` on `month` for year-only filters cannot use the unique index efficiently.

#### S26. `maxHoursPerMonth` not enforced in `applyOvertimeRules`
**File:** `server/src/modules/payroll/payroll.service.ts:200-207`

Only `maxHoursPerDay` is enforced. Monthly OT cap is ignored during payroll calculation.

#### S27. Statutory report stores full data in single document
**File:** `server/src/modules/statutory/statutory.service.ts:320-331`

For large organizations, storing all employee records in a single `data` field can exceed MongoDB's 16MB limit.

#### S28. No `effectiveFrom < effectiveTo` validation on salary structure
**File:** `server/src/modules/salary-structures/salaryStructure.service.ts:49-74`

A structure could be created with `effectiveFrom` after `effectiveTo`, causing payroll calculation to find no applicable structure.

#### S29. Mass assignment in `SalaryStructure.update()`
**File:** `server/src/modules/salary-structures/salaryStructure.service.ts:84`

`Object.assign(structure, updateData, { updatedBy: userId })` allows overwriting arbitrary fields like `employee` or `createdBy`.

#### S30. Mass assignment in `SalaryStructureTemplate.update()`
**File:** `server/src/modules/salary-structure-templates/salaryStructureTemplate.service.ts:61`

Same pattern as S29.

#### S31. Overtime validation inconsistent
**File:** `server/src/modules/overtime-entries/overtimeEntries.service.ts:82-83`

Error message says "0.5 and 24" but code checks `hours <= 0` (allows 0.1). Different message in update path.

#### S32. Missing `.lean()` on read-only `findById`
**File:** `server/src/modules/payroll/payroll.service.ts:1655`

Full Mongoose document created just to check `status` — `.lean()` would be more efficient.

#### S33. `getLoanOutstandingReport` hardcoded `totalPaid = 0`
**File:** `server/src/modules/payroll-reports/mis-reports.service.ts:155`

Always shows full loan amount regardless of repayments made. Has a TODO comment but shipped as-is.

#### S34. `getBudgetVsActual` loads all employees including inactive
**File:** `server/src/modules/payroll-reports/mis-reports.service.ts:183`

No filter for `status: 'active'` — inactive/terminated employees inflate budget numbers.

---

### LOW

| # | Issue | File:Line |
|---|-------|-----------|
| S35 | Payroll config building duplicated 3 times | `payroll.service.ts:1057,1203,1489` |
| S36 | `void leaveDays` dead code | `payroll.service.ts:552` |
| S37 | Statutory controller uses manual try/catch instead of asyncHandler | `statutory.controller.ts` |
| S38 | Hardcoded minimum wage thresholds in compliance | `compliance.service.ts:71-77` |
| S39 | `getByEmployee` does not sort results | `payroll.service.ts:1795-1838` |
| S40 | Loan EMI data flow is confusing but functionally correct | `payroll.service.ts:864-873` |
| S41 | Arrears type mismatch `ArrearItem[]` vs `ArrearsDetails` in model | `payroll.service.ts:1159` vs model |
| S42 | Missing rate limiting on statutory/compliance endpoints | statutory/compliance routes |
| S43 | 10+ report endpoints have no routes registered | `payroll-reports.routes.ts` |
| S44 | `supplementaryPayroll` not in routes, no validation | `payroll.controller.ts:52-56` |

---

## CLIENT SIDE

### CRITICAL

#### C1. Duplicated `/api/v1` prefix — salary slip PDF download broken
**File:** `client/src/features/payroll/pages/PayrollDetailsPage.tsx:147`

```typescript
const response = await apiClient.get(`/api/v1/salary-slips/${id}/pdf`, {
```

`apiClient` already has `baseURL: '/api/v1'`, so the actual URL becomes `/api/v1/api/v1/salary-slips/{id}/pdf` — guaranteed 404. The salary slip download button on the most-used page is completely broken.

#### C2. `id!` non-null assertion on `useParams` — crash risk
**File:** `client/src/features/payroll/pages/PayrollDetailsPage.tsx:41,47,53,59,65,77,83`

Seven mutation functions use `id!` where `id` comes from `useParams` and can be `undefined`. The React Query `enabled` guard only protects queries, not mutations. If mutations fire before route param resolves, they crash with `TypeError`.

#### C3. Same `id!` issue in all 7 mutations — silent failures
**File:** `client/src/features/payroll/pages/PayrollDetailsPage.tsx`

All mutations will call the server with `undefined` embedded in URLs if the param is missing.

---

### HIGH

#### C4. `PayrollRun` interface missing critical fields
**File:** `client/src/features/payroll/services/payrollService.ts:12-21`

The interface is missing `finalizedAt`, `unfinalizeLocked`, `unfinalizeWindowDays`, `approvalHistory`, `totalGrossPay`, `totalDeductions`, `totalEmployerContributions`, `isSupplementary`, `complianceStatus`, etc. These are accessed in `PayrollDetailsPage` but not typed, making refactoring fragile.

#### C5. `rejectRun` fires with no confirmation dialog
**File:** `client/src/features/payroll/pages/PayrollPage.tsx:151`

Destructive rejection action fires directly on button click with no prompt for reason. The unfinalize action correctly uses a modal with reason input — reject should do the same.

#### C6. No role-based visibility on payroll action buttons
**Files:** `PayrollPage.tsx:140-159`, `PayrollDetailsPage.tsx:203-222`

All users see Submit, Approve, Reject, Finalize, Unfinalize, Delete buttons regardless of role. Unauthorized users see buttons that just fail with 403 — poor UX and information leak.

#### C7. `salarySlipService` lacks response validation
**File:** `client/src/features/payroll/services/salarySlipService.ts:13-26`

Unlike `payrollService.ts` which has a `validateResponse<T>` helper, `salarySlipService` returns `data` directly without validation. Null/malformed responses propagate silently.

#### C8. Preview modal `rowKey` uses `Math.random()`
**File:** `client/src/features/payroll/pages/PayrollPage.tsx:224`

```typescript
rowKey={(r: any) => r.employee?.id || String(Math.random())}
```

Every re-render generates new keys, causing React to unmount/remount every table row — destroys table state and causes visual flickering.

---

### MEDIUM

#### C9. `previewData` typed as `any`
**File:** `client/src/features/payroll/pages/PayrollPage.tsx:22`

Preview response shape is used at lines 209-229 accessing multiple properties but the type is entirely untyped.

#### C10. Excessive `any` annotations — 15+ locations
**Files:** `PayrollPage.tsx:22,46,56,62,68,74,80,91,97`, `PayrollDetailsPage.tsx:43,49,55,61,73,79,85`, `SalarySlipDetailsPage.tsx:60-61,68`, `SalarySlipsPage.tsx:101`, `PayrollSection.tsx:4`, `SalaryStructureSection.tsx:84`

#### C11. `handleBatchChange` timeout not cleaned up on unmount
**File:** `client/src/features/payroll/pages/PayrollDetailsPage.tsx:108-120`

`batchTimeoutRef` is never cleaned up. If user navigates away during 150ms debounce window, state update fires on unmounted component.

#### C12. `EssPayslipsPage` View/Download buttons have no onClick
**File:** `client/src/features/employee-self-service/pages/EssPayslipsPage.tsx:47-48`

Both buttons render but do nothing on click — placeholder implementations.

#### C13. `EssPayslipsPage` period column renders broken format
**File:** `client/src/features/employee-self-service/pages/EssPayslipsPage.tsx:17-21`

Month is stored as "YYYY-MM" but display assumes separate `month`/`year` fields. Output becomes "2026-05 " (trailing space, no year).

#### C14. `detailColumns` useMemo missing dependency
**File:** `client/src/features/payroll/pages/PayrollDetailsPage.tsx:165-187`

Columns reference `handleBatchChange` but it's not in the dependency array. Works because of `useCallback` with empty deps, but violates exhaustive-deps rule.

#### C15. `SalaryStructureSection` hardcodes limit 1000 for employees
**File:** `client/src/features/settings/sections/SalaryStructureSection.tsx:24`

`employeeService.list({ limit: 1000 })` — not enough for large organizations, no pagination.

#### C16. `SalaryStructureSection` modal submit has no loading state
**File:** `client/src/features/settings/sections/SalaryStructureSection.tsx:127`

No loading spinner on submit button — user can double-click and fire duplicate requests.

#### C17. `SalaryStructureSection` table shows raw ObjectId for employee
**File:** `client/src/features/settings/sections/SalaryStructureSection.tsx:93`

`employee` field is an ID string — column displays raw MongoDB ObjectId instead of employee name.

#### C18. `PayrollSection` accepts `form` and `onSave` as `any`
**File:** `client/src/features/settings/sections/PayrollSection.tsx:4`

No type safety on the form instance or save handler values.

#### C19. `refetchOnWindowFocus` set inconsistently
**File:** `PayrollPage.tsx:34` (disabled) vs `PayrollDetailsPage.tsx` (default: enabled)

List page won't refetch on window focus; detail page will. Confusing behavior when navigating between them.

---

### LOW

| # | Issue | File:Line |
|---|-------|-----------|
| C20 | Hardcoded `₹` symbol in 10+ places | Multiple files |
| C21 | Magic numbers throughout (10, 150, 1000, 12, 480, etc.) | Multiple files |
| C22 | `STATUS_COLORS` duplicated in 3 files | `PayrollPage`, `PayrollDetailsPage`, `SalarySlipsPage` |
| C23 | PDF download logic duplicated in 3 places | 3 files |
| C24 | `PayrollSection` props typed as `any` | `PayrollSection.tsx:4` |
| C25 | `useEssPayslips` has no cache config | `useEssPayslips.ts:5-8` |
| C26 | No empty state when payroll items array is empty | `PayrollDetailsPage.tsx:250-262` |
| C27 | `runPayroll` return type is `any` | `payrollService.ts:60` |
| C28 | `validateResponse` only checks null/non-object — insufficient | `payrollService.ts:47-52` |
| C29 | Tests are render-only — no mutation/interaction tests | All payroll test files |
| C30 | Month column renders "Invalid Date" if format is wrong | `PayrollPage.tsx:124` |

---

## TOP 10 PRIORITIES

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Wrap all multi-step payroll writes in MongoDB transactions | Critical | Data corruption on partial failure |
| 2 | Fix hardcoded PF wage ceiling `15000` | High | Statutory non-compliance |
| 3 | Fix duplicated `/api/v1` prefix in PDF download | Critical | Salary slip download broken |
| 4 | Add HTML escaping to salary slip generation | High | XSS vulnerability |
| 5 | Fix `isLatePresent` treated as full absent | Medium | Incorrect salary calculation |
| 6 | Pre-fetch CompanySettings once outside employee loop | Medium | Performance degradation |
| 7 | Fix compliance flag assignment (hardcoded 8 checks) | High | Wrong flags on wrong employees |
| 8 | Add role-based button visibility on client | High | All users see admin actions |
| 9 | Fix `rejectRun` — add confirmation + reason prompt | High | Destructive action, no safeguard |
| 10 | Fix `getLoanOutstandingReport` hardcoded zero | Medium | Always shows full loan amount |

---

## RECOMMENDED FIX ORDER

### Phase 1 — Critical & High (Do First)
- Wrap `finalizeRun`, `submitRun`, `approveRun`, `rejectRun`, `deleteRun`, `supplementaryRun` in transactions
- Fix hardcoded PF wage ceiling
- Fix salary slip PDF URL duplication
- Add HTML escaping to salary slip generation
- Fix compliance flag assignment
- Add confirmation dialogs to reject/rejectRun
- Fix `isLatePresent` logic
- Pre-fetch CompanySettings and statutory defaults once
- Add role-based visibility to payroll action buttons

### Phase 2 — Medium (Next Sprint)
- Fix pro-rata factor for same-month joiner + leaver
- Fix `getWorkingDaysInMonth` to use company weekly-off rules
- Fix loan repayment linking for multiple repayments
- Add per-employee error handling to previewRun
- Enforce `maxHoursPerMonth` in `applyOvertimeRules`
- Fix `getLoanOutstandingReport` actual aggregation
- Fix `getBudgetVsActual` to filter active employees only
- Clean up `any` types across client components
- Fix `Math.random()` row key
- Add empty states to payroll pages
- Fix EssPayslipsPage period display

### Phase 3 — Low (Backlog)
- Extract shared constants (STATUS_COLORS, currency)
- Extract shared PDF download utility
- Add rate limiting to statutory/compliance endpoints
- Register missing report routes
- Improve test coverage for payroll calculations
- Add `.lean()` where appropriate
- Clean up dead code and duplicated config building
