# Payroll Reports Module — Audit Report

## Client Issues (C)

### 🔴 Critical
- C1: `r._id` → `r.id` (select never works)
- C2: CSV download calls XLSX endpoint (wrong format)
- C3: XLSX download bypasses service layer (raw apiClient)
- C4: Silent catch blocks (no error details)
- C5: Raw `<Table>` instead of core `<DataTable>`
- C6: Missing page padding wrapper
- C7: Tabs without Card wrapper, no defaultActiveKey
- C8: ExportButton uses client-side XLSX (should be server)

### 🟡 Medium
- C9: Shared loading state for XLSX/CSV buttons
- C10: Missing notFoundContent on Select
- C11: No page-level loading skeleton
- C12: No empty state when no runs exist
- C13: Bank file filename uses runId (not human-friendly)
- C14: YtdCostTab year offset fragile
- C15: No client-side route param validation

### 🟢 Low
- C16: No error boundary
- C17: Heavy `any` types
- C18: Statistic value misused (string instead of number)

## Server Issues (S)

### 🔴 Critical
- S1: `downloadRunPdf` returns JSON (route says `/pdf`)
- S2: CSV export not implemented (`_format` param ignored)
- S3: No client service method for CSV salary register

### 🟡 Medium
- S4: Dynamic `await import()` for Loan model
- S5: Financial year start hardcoded as April
- S6: No query param validation for year
- S7: No pagination on report endpoints
- S8: BaseSalary multiplication logic
- S9: Bank file silently skips employees
- S10: Inconsistent indentation in bankfile.service.ts

### 🟢 Low
- S11: Missing audit log for downloadRunPdf
- S12: Budget vs Actual compares net to base salary (misleading)
- S13: No error handling on PDF stream
- S14: Hardcoded ₹ symbol in payslip
- S15: Route ordering for salary-register/csv

---

## Phased Fix Plan

### Phase 1 — CRITICAL UX FIXES
- [ ] C1: `r._id` → `r.id` in PayrollReportsPage.tsx:408
- [ ] C2, S3: Add `downloadSalaryRegisterCsv` to client service + fix CSV button
- [ ] C3: Replace raw apiClient.get with service call for XLSX
- [ ] C6: Add page padding wrapper `<div style={{ padding: '0 4px' }}>`
- [ ] C7: Wrap Tabs in Card, add defaultActiveKey
- [ ] C10: Add notFoundContent on Select
- [ ] C11: Show loading skeleton when runsLoading
- [ ] C12: Show empty/disabled state when no runs
- [ ] C4: Improve catch blocks with server error message

### Phase 2 — UI CONSISTENCY
- [x] C5: Replace raw Table with DataTable (all 6 tabs)
- [x] C18: Fix Statistic value prop types
- [x] C9: Per-button loading state for SalaryRegisterTab
- [x] C13: Better filenames for exports (uses month label)
- [x] C8: ExportButton now uses server-side XLSX via POST /payroll-reports/export-table

### Phase 3 — SERVER FIXES
- [x] S2: Implement proper CSV format in salary-register.service.ts
- [x] S1: Fix downloadRunPdf (renamed to /data, added audit)
- [x] S6: Add Zod validation for year query param
- [x] S11: Add audit logging for downloadRunPdf
- [x] S4: Replace dynamic imports with static imports
- [x] S10: Fix indentation

### Phase 4 — CLEANUP
- [x] C14: YtdCostTab year offset uses configurable constant
- [x] S5: FY start month from env var `FY_START_MONTH`
- [x] S8: BaseSalary multiplication fix
- [x] S9: Bank file tracks skipped employees
- [x] S12: Budget vs actual uses proper per-dept budget
- [x] S13: PDF stream error handling
- [x] S14: Configurable currency in payslip from CompanySettings
- [x] C15: Client-side runId validation in service
- [x] S15: Route ordering fixed

### Phase 5
- [x] S7: Safety limits (MAX_REPORT_ITEMS, MAX_LOAN_ITEMS) on report queries
- [x] C16: ErrorBoundary component wrapping PayrollReportsPage
- [x] C17: Replaced `any` types with PayrollRun, PopulatedDept, PopulatedEmp interfaces
