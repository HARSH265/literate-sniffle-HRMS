# Payroll Fix Tracker

Use this file to track which issues have been fixed. Mark `[x]` when done.

---

## Phase 1 — Critical & High

- [x] **S1** Wrap `finalizeRun()` in transaction (`payroll.service.ts:1326`)
- [x] **S2** Wrap `submitRun()` / `approveRun()` in transactions (`payroll.service.ts:1256`)
- [x] **S3** Wrap `supplementaryRun()` in transaction (`payroll.service.ts:1485`)
- [x] **S4** Wrap `deleteRun()` in transaction (`payroll.service.ts:1774`)
- [x] **S5** Wrap `updatePayrollItem()` aggregate+save in transaction (`payroll.service.ts:1651`)
- [x] **S6** Fix overtime entry race condition with atomic operation (`overtimeEntries.service.ts:68`)
- [x] **S7** Fix hardcoded `15000` PF wage ceiling → use `defaults.pfWageCeiling` (`statutory.service.ts:88,156,385`)
- [x] **S8** Add `validateMonthYear` to `supplementaryPayroll` (`payroll.controller.ts:52`)
- [x] **S9** Add HTML escaping to salary slip generation (`salarySlips.service.ts:70`)
- [x] **S10** Batch employee queries instead of N+1 (`payroll.service.ts:527`)
- [x] **S11** Wrap `updateMany` calls in sessions (`payroll.service.ts:1268,1294,1320,1352`)
- [x] **S12** Fix compliance flag assignment — don't assume 8 checks per item (`compliance.service.ts:342`)
- [x] **S13** Wrap loan repayment creation in transaction (`loans.service.ts:105`)
- [x] **S14** Fix `req.user!._id` → `req.user!.id` in payroll-reports (`payroll-reports.controller.ts:16`)
- [x] **C1** Fix duplicated `/api/v1` prefix in PDF download (`PayrollDetailsPage.tsx:147`)
- [x] **C2** Fix `id!` non-null assertion — add null guard (`PayrollDetailsPage.tsx:41`)
- [x] **C3** Fix same `id!` issue in all 7 mutations (`PayrollDetailsPage.tsx`)
- [x] **C4** Update `PayrollRun` interface with missing fields (`payrollService.ts:12`)
- [x] **C5** Add confirmation dialog + reason prompt to `rejectRun` (`PayrollPage.tsx:151`)
- [x] **C6** Add role-based visibility to payroll action buttons (`PayrollPage.tsx:140`)
- [x] **C7** Add response validation to `salarySlipService` (`salarySlipService.ts:13`)
- [x] **C8** Fix `Math.random()` row key — use `employee.id || index` (`PayrollPage.tsx:224`)

## Phase 2 — Medium

- [x] **S15** Fix `isLatePresent` — don't treat as full absent (`payroll.service.ts:571`)
- [x] **S16** Fix pro-rata for same-month joiner + leaver (`payroll.service.ts:641`)
- [x] **S17** Fix `getWorkingDaysInMonth` to use company weekly-off rules (`payroll.service.ts:631`)
- [x] **S18** Handle duplicate month race condition with proper error code (`payroll.service.ts:1047`)
- [x] **S19** Link all pending loan repayments, not just first (`payroll.service.ts:876`)
- [x] **S20** Add per-employee error handling to `previewRun` (`payroll.service.ts:1230`)
- [x] **S21** Move `CompanySettings.findOne()` outside employee loop (`payroll.service.ts:899`)
- [x] **S22** Add rate limiting to `previewRun` endpoint (`payroll.controller.ts:29`)
- [x] **S23** Sanitize employee names for CSV injection (`bankfile.service.ts:121`)
- [x] **S24** Extend `numberToWords` to support Arab+ (`payslip.service.ts:208`)
- [x] **S25** Add compound index for `listRuns` year filter (`PayrollRun.model.ts`)
- [x] **S26** Enforce `maxHoursPerMonth` in `applyOvertimeRules` (`payroll.service.ts:200`)
- [x] **S27** Paginate statutory report data instead of single document (`statutory.service.ts:320`)
- [x] **S28** Add `effectiveFrom < effectiveTo` validation (`salaryStructure.service.ts:49`)
- [x] **S29** Whitelist allowed fields in `SalaryStructure.update()` (`salaryStructure.service.ts:84`)
- [x] **S30** Whitelist allowed fields in `SalaryStructureTemplate.update()` (`salaryStructureTemplate.service.ts:61`)
- [x] **S31** Fix overtime validation message to match code (`overtimeEntries.service.ts:82`)
- [x] **S32** Add `.lean()` to read-only `findById` (`payroll.service.ts:1655`)
- [x] **S33** Fix `getLoanOutstandingReport` — aggregate actual repayments (`mis-reports.service.ts:155`)
- [x] **S34** Filter active employees in `getBudgetVsActual` (`mis-reports.service.ts:183`)
- [x] **C9** Type `previewData` properly (`PayrollPage.tsx:22`)
- [x] **C10** Replace `any` annotations with proper types (15+ locations)
- [x] **C11** Clean up `batchTimeoutRef` on unmount (`PayrollDetailsPage.tsx:108`)
- [x] **C12** Add onClick handlers to EssPayslipsPage buttons (`EssPayslipsPage.tsx:47`)
- [x] **C13** Fix EssPayslipsPage period display format (`EssPayslipsPage.tsx:17`)
- [x] **C14** Add `handleBatchChange` to useMemo deps (`PayrollDetailsPage.tsx:165`)
- [x] **C15** Increase employee fetch limit or add pagination (`SalaryStructureSection.tsx:24`)
- [x] **C16** Add loading state to salary structure modal submit (`SalaryStructureSection.tsx:127`)
- [x] **C17** Populate employee name in salary structure table (`SalaryStructureSection.tsx:93`)
- [x] **C18** Type `PayrollSection` props properly (`PayrollSection.tsx:4`)
- [x] **C19** Make `refetchOnWindowFocus` consistent across pages

## Phase 3 — Low

- [x] **S35** Extract payroll config building to helper function (`payroll.service.ts:1057`)
- [x] **S36** Remove `void leaveDays` dead code (`payroll.service.ts:552`)
- [x] **S37** Use `asyncHandler` in statutory controller (`statutory.controller.ts`)
- [x] **S38** Move hardcoded min wage thresholds to config (`compliance.service.ts:71`)
- [x] **S39** Add sort to `getByEmployee` query (`payroll.service.ts:1795`)
- [x] **S41** Fix arrears type mismatch in PayrollItem model
- [x] **S42** Add rate limiting to statutory/compliance routes
- [x] **S43** Register missing report routes (`payroll-reports.routes.ts`)
- [x] **S44** Add `supplementaryPayroll` to routes with validation
- [x] **C20** Extract `₹` to shared currency constant
- [x] **C21** Extract magic numbers to constants
- [x] **C22** Extract `STATUS_COLORS` to shared constant
- [x] **C23** Extract PDF download to shared utility
- [x] **C24** Type `PayrollSection` props
- [x] **C25** Add cache config to `useEssPayslips`
- [x] **C26** Add empty state to PayrollDetailsPage
- [x] **C27** Type `runPayroll` return properly
- [x] **C28** Improve `validateResponse` to check required fields
- [x] **C29** Add mutation/interaction tests
- [x] **C30** Add fallback for invalid month format
