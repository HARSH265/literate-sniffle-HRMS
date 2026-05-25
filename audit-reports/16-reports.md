# Audit Report: Reports Module

**Date:** May 25, 2026
**Files audited:** 5 (3 server, 1 model, 1 client)

| File | Lines |
|------|-------|
| `server/src/modules/reports/reports.routes.ts` | 25 |
| `server/src/modules/reports/reports.controller.ts` | 81 |
| `server/src/modules/reports/reports.service.ts` | 995 |
| `server/src/models/StatutoryReport.model.ts` | 48 |
| `client/src/features/reports/pages/ReportsPage.tsx` | 774 |

**Empty directories (client-side stubs):** `components/`, `hooks/`, `services/`

---

## Route Inventory

All routes are mounted at `/api/v1/reports` (see `server/src/app.ts` line 123: `app.use('/api/v1/reports', auditMiddleware, reportsRoutes)`).

The `authenticate` middleware is applied globally via `router.use(authenticate)` at the top of the routes file.

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/reports/employees` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/attendance` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/attendance/summary` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/payroll` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/payroll/summary` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/departments` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/overtime` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/overtime/summary` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| POST | `/api/v1/reports/custom` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/chart-data` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/drill-down` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| GET | `/api/v1/reports/scheduled-export-config` | ✅ `authenticate` | ✅ `view-reports` | ❌ **NONE** |
| PATCH | `/api/v1/reports/scheduled-export-config` | ✅ `authenticate` | ✅ `manage-settings` | ❌ **NONE** |

**Key observation: Zero routes use `validate()` middleware.** This is the most pervasive issue in this module. Every other audited module (departments, shifts) applies Zod validation via `validate()` on POST/PATCH routes. The reports module has no validation layer whatsoever.

---

## Issues Found

### 🔴 Critical

1. **No input validation on any route** — All 13 routes accept user-supplied query parameters (dates, months, years, statuses, departments, etc.) and body data (POST `/custom`) without any Zod schema validation. Invalid/malicious input reaches the service layer unchecked.

2. **ReDoS via unescaped regex in custom report search** — `reports.service.ts` line 658-661:
   ```ts
   if (filters.search) {
     query.$or = [
       { fullName: { $regex: filters.search, $options: 'i' } },
       { employeeCode: { $regex: filters.search, $options: 'i' } },
     ];
   }
   ```
   User-supplied search string is passed directly into MongoDB `$regex` without escaping special regex characters (`.`, `*`, `+`, `?`, `[`, `]`, `(`, `)`, `{`, `}`, `^`, `$`, `|`, `\`). This enables ReDoS attacks and unexpected pattern matching.

3. **`as any` casts defeat all type safety** — The controller casts `req.query as Record<string, unknown>` passing untyped data to the service. Worse, `getChartData` and `getDrillDown` use `as Record<string, unknown> as any` (controller lines 48, 53), completely bypassing TypeScript. The service then accesses arbitrary properties on these unvalidated objects.

4. **`saveScheduledExportConfig` explicitly clears `updatedBy`** — Line 991 of `reports.service.ts`:
   ```ts
   settings.updatedBy = undefined as any;
   ```
   Instead of setting `updatedBy` to the current user from `req.user`, the method intentionally wipes it. This means there is no audit trail for who changed the scheduled export configuration.

5. **No request body validation on `POST /custom`** — This is the most dangerous route. It accepts `fields`, `filters`, `groupBy`, `sortBy`, `sortOrder`, `limit` from the request body with zero validation. A malicious user could inject arbitrary MongoDB field names or injection payloads.

### 🟡 Medium

6. **Missing `updatedBy` in service context** — The `saveScheduledExportConfig` method signature does not receive the authenticated user. The controller passes only `req.body` (line 63: `ReportsService.saveScheduledExportConfig(req.body)`), so there is no way to know who made the change even if the `undefined` bug is fixed.

7. **Incomplete audit coverage** — The `AuditMiddleware` only maps a subset of report paths to audit actions:
   - `/reports/employees` → `export-employees` (line 63)
   - `/reports/attendance`, `/reports/payroll`, `/reports/overtime` → `export-report` (line 64)
   - **Missed routes with no audit trail:** `/reports/custom`, `/reports/chart-data`, `/reports/drill-down`, `/reports/departments`, `/reports/attendance/summary`, `/reports/payroll/summary`, `/reports/overtime/summary`, `/reports/scheduled-export-config`

8. **Date parsing without validation** — Multiple methods parse dates from query strings with `new Date(startDate)` (e.g., lines 77-78, 255-256, etc.) without checking if the result is `Invalid Date`. If invalid date strings are passed, they produce `NaN` timestamps and cause MongoDB query failures or incorrect results.

9. **No pagination on memory-heavy exports** — `exportEmployees` (line 22-26) loads ALL matching employees into memory with `.lean()` in a single query. For companies with 10,000+ employees, this will cause high memory pressure. No server-side pagination or streaming is implemented.

10. **`exportPayroll` month matching is fragile** — Line 189 uses `PayrollRun.findOne({ month: String(month) })`. The `month` field in the model is stored as a full string like `"2026-05"`. If the client passes a numeric month (e.g., `5`) or partial date, the lookup silently returns no results.

11. **No `limit` cap on drill-down or custom report** — `getDrillDown` defaults `limit` to 50 but accepts user-supplied values with no maximum ceiling. `getCustomReport` only applies `limit` if provided and defaults to no limit. This could be exploited for resource exhaustion.

12. **`getChartData` returns raw leave documents** — Line 862: `data: leaves` — the `leave` chart type returns the full `LeaveApplication` documents (including potentially sensitive data) in the `data` field, instead of just aggregated chart values.

13. **`getDepartmentWiseSummary` ignores filters** — The method accepts no parameters and returns data for all active employees. There is no way to filter by department or other criteria.

### 🟢 Minor

14. **Empty client stubs** — `client/src/features/reports/components/`, `hooks/`, and `services/` are all empty directories. The monolithic 774-line `ReportsPage.tsx` is the only client file.

15. **Direct `fetch()` bypassing apiClient** — The page uses `fetch(apiClient.getUri() + url, { credentials: 'include' })` instead of `apiClient.get()`/`apiClient.post()`. This bypasses any auth token refresh, request/response interceptors, and error handling that `apiClient` provides.

16. **Inconsistent API call patterns** — Some data fetching uses `useQuery` with raw `fetch()` (lines 70-81, 88-95, etc.), others use `apiClient` for department data (line 62). This inconsistency makes the code harder to maintain.

17. **`category` filter mismatch** — The client sends `category: 'office-staff'` for the custom report (line 629: `{ label: 'Office Staff', value: 'office-staff' }`) but the Employee model likely uses `'staff'` as the value (based on other module conventions). This would silently filter out all results.

18. **No server-side rate limiting** — Export endpoints generate potentially large Excel files but have no rate limiting or concurrency controls. Multiple rapid requests could overwhelm the server.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| No date range provided (attendance/overtime) | ⚠️ Throws generic `Error` with message (not `AppError`) |
| Invalid date string in query | ❌ No validation — `Invalid Date` propagates to MongoDB |
| Empty employee list with department filter | ✅ Returns empty data array |
| No payroll runs found | ⚠️ Throws `Error('No payroll runs found')` instead of returning empty array |
| Missing `month` and `year` in attendance export | ✅ Falls back to current month |
| Missing `year` in payroll summary | ✅ Falls back to last 12 finalized runs |
| Custom report with no fields selected | ✅ Defaults to all available fields |
| Custom report `groupBy` on non-existent field | ✅ No-ops — group is ignored |
| Empty scheduled export config | ✅ Returns `{}` from `CompanySettings` |
| `saveScheduledExportConfig` on missing company settings | ⚠️ Throws generic `Error` (not `AppError`) |
| Regex special chars in custom search | ❌ **ReDoS vulnerability** — no escaping |
| Drill-down on non-existent entity type | ✅ Returns empty `{ entity, records: [], total: 0 }` |
| Category filter value `office-staff` vs `staff` | ❌ **Likely mismatch** — returns zero results |
| Pagination overflow | ✅ Returns empty records array |
| Concurrent export requests | ❌ No rate limiting or request queuing |
| Missing `req.user` in service methods | ❌ Controller never passes user context to service |
| Audit logging for custom report generation | ❌ Not tracked at all |
| Large datasets (10k+ employees) | ❌ No pagination in export; loads all into memory |

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|--------------|
| 1 | No input validation on any route | ❌ **NOT FIXED** | Add Zod schemas + `validate()` middleware to all 13 routes |
| 2 | ReDoS via unescaped regex | ❌ **NOT FIXED** | `reports.service.ts` — escape special regex chars in search filter |
| 3 | `as any` casts in controller | ❌ **NOT FIXED** | `reports.controller.ts` — define proper query param types |
| 4 | `saveScheduledExportConfig` clears `updatedBy` | ❌ **NOT FIXED** | `reports.service.ts` — remove `= undefined as any`; pass `req.user` |
| 5 | No body validation on POST `/custom` | ❌ **NOT FIXED** | Add Zod schema for custom report request body |
| 6 | Missing `updatedBy` — user not passed to service | ❌ **NOT FIXED** | `reports.controller.ts` + `reports.service.ts` — pass `req.user` |
| 7 | Incomplete audit coverage | ❌ **NOT FIXED** | `AuditMiddleware.ts` — add routes for custom, chart, drill-down, summary |
| 8 | Date parsing without validation | ❌ **NOT FIXED** | `reports.service.ts` — validate date strings before `new Date()` |
| 9 | No pagination on memory-heavy exports | ❌ **NOT FIXED** | `reports.service.ts` — add streaming or pagination for large exports |
| 10 | Fragile `month` matching in exportPayroll | ❌ **NOT FIXED** | `reports.service.ts` — normalize month format before lookup |
| 11 | No `limit` cap on drill-down / custom | ❌ **NOT FIXED** | `reports.service.ts` — enforce `Math.min(limit, 100)` |
| 12 | Chart data leaks full leave documents | ❌ **NOT FIXED** | `reports.service.ts` — return aggregated data only |
| 13 | Department summary ignores filters | ❌ **NOT FIXED** | `reports.service.ts` — add optional department filter |
| 14 | Empty client stubs | ❌ **NOT FIXED** | Populate or remove empty directories; refactor monolith |
| 15 | Direct `fetch()` bypassing apiClient | ❌ **NOT FIXED** | `ReportsPage.tsx` — use `apiClient.get()`/`post()` consistently |
| 16 | Inconsistent API patterns | ❌ **NOT FIXED** | `ReportsPage.tsx` — unify all data fetching patterns |
| 17 | Category filter value mismatch (`office-staff` vs `staff`) | ❌ **NOT FIXED** | `ReportsPage.tsx` — align filter values with model enum |
| 18 | Generic `Error` thrown instead of `AppError` | ❌ **NOT FIXED** | `reports.service.ts` — use `AppError` with proper status codes |

---

## Summary

The Reports module is the **largest** module in the application by server-side code (995 lines in the service) but has the **least** defensive programming. Key findings:

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Medium | 8 |
| 🟢 Minor | 5 |
| **Total** | **18** |

The single biggest concern is **zero input validation on all 13 routes** — every other audited module (departments, shifts, etc.) has Zod schemas and `validate()` middleware on creation/update routes. The reports module has none. Combined with the ReDoS vulnerability in custom report search, the lack of body validation on `POST /custom`, and the `as any` casts that bypass TypeScript guards, this module presents a significant security and reliability risk.

Fix #2 (ReDoS via search regex) applied. All other issues remain unfixed (❌).
