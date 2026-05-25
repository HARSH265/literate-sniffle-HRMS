# Audit Report: Employees Module

**Date:** May 25, 2026
**Files audited:** 9 (4 server, 1 model, 4 client)

| Layer | Files |
|-------|-------|
| Server routes | `server/src/modules/employees/employees.routes.ts` |
| Server controller | `server/src/modules/employees/employees.controller.ts` |
| Server service | `server/src/modules/employees/employees.service.ts` |
| Server validation | `server/src/modules/employees/employees.validation.ts` |
| Model | `server/src/models/Employee.model.ts` |
| Client service | `client/src/features/employees/services/employeeService.ts` |
| Client pages | `EmployeesPage.tsx`, `EmployeeNewPage.tsx`, `EmployeeEditPage.tsx`, `EmployeeDetailPage.tsx` |

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/employees/next-code` | ✅ `authenticate` | ❌ **MISSING** | none |
| GET | `/api/v1/employees` | ✅ `authenticate` | ✅ `view-employees` | none (unused schema exists) |
| GET | `/api/v1/employees/export` | ✅ `authenticate` | ✅ `view-employees` | none |
| GET | `/api/v1/employees/template` | ✅ `authenticate` | ✅ `view-employees` | none |
| POST | `/api/v1/employees/import` | ✅ `authenticate` | ✅ `manage-employees` | none (file upload) |
| GET | `/api/v1/employees/:id` | ✅ `authenticate` | ✅ `view-employees` | none |
| POST | `/api/v1/employees` | ✅ `authenticate` | ✅ `manage-employees` | ✅ `createEmployeeSchema` |
| PUT | `/api/v1/employees/:id` | ✅ `authenticate` | ✅ `manage-employees` | ✅ `updateEmployeeSchema` |
| DELETE | `/api/v1/employees/:id` | ✅ `authenticate` | ✅ `manage-employees` | none |
| POST | `/api/v1/employees/:id/documents` | ✅ `authenticate` | ✅ `manage-employees` | none (file upload) |
| GET | `/api/v1/employees/:id/documents/:docId` | ✅ `authenticate` | ✅ `view-employees` | none |
| DELETE | `/api/v1/employees/:id/documents/:docId` | ✅ `authenticate` | ✅ `manage-employees` | none |

---

## Issues Found

### 🔴 Critical

1. **Missing authorization on `/next-code`** — `GET /next-code` has no `authorize()` middleware. Any authenticated user (regardless of role) can generate employee codes. Should at minimum require `view-employees`.
   - File: `server/src/modules/employees/employees.routes.ts` line 13
   - Impact: Any logged-in user can enumerate or predict employee codes.

### 🟡 Medium

2. **Search regex unescaped (ReDoS vulnerability)** — The `list` service method uses raw user input in `$regex` without escaping special regex characters:
   ```typescript
   { employeeCode: { $regex: search, $options: 'i' } },
   { fullName: { $regex: search, $options: 'i' } },
   { fatherName: { $regex: search, $options: 'i' } },
   ```
   An attacker could input `.*` or `(?:.*){100000}` to cause catastrophic backtracking.
   - File: `server/src/modules/employees/employees.service.ts` lines 43–47

3. **Pagination defaults mismatch** — Multiple sources define different default `limit` values:
   - `PaginationUtil.parseFromObject()` defaults to **20** (used when no query params sent)
   - `listEmployeesSchema` validation schema defaults to **10** (unused — never applied as middleware)
   - Frontend `EmployeesPage.tsx` defaults to **10** (state + `defaultPageSize`)
   - Since the validation schema is never used, the effective default is 20 only when no `limit` param is sent. The frontend always sends `limit=10`, so in practice it works, but the inconsistency is confusing.
   - Files: `server/src/core/utils/PaginationUtil.ts` line 24, `server/src/modules/employees/employees.validation.ts` line 55, `client/src/features/employees/pages/EmployeesPage.tsx` lines 41, 289

4. **Unused validation schema `listEmployeesSchema`** — `listEmployeesSchema` is defined in `employees.validation.ts` (with defaults for page, limit, sort, order, search, and field filters) but is **never imported or applied** as middleware on `GET /`. The route relies solely on `PaginationUtil.parseFromObject()` for parsing, which has different defaults.
   - File: `server/src/modules/employees/employees.validation.ts` lines 53–62
   - File: `server/src/modules/employees/employees.routes.ts` line 14 (no `validate()` call)

### 🟢 Minor

5. **PUT used with PATCH semantics** — Server route `PUT /:id` uses `updateEmployeeSchema` where **all fields are optional**, making it semantically a PATCH operation. REST convention dictates PUT for full replacement and PATCH for partial updates. No functional mismatch since both client (`apiClient.put`) and server (`router.put`) agree on PUT.
   - File: `server/src/modules/employees/employees.routes.ts` line 20
   - File: `client/src/features/employees/services/employeeService.ts` line 105

6. **No cache invalidation on create / update** — When creating (`EmployeeNewPage`) or updating (`EmployeeEditPage`) an employee, the frontend navigates away without invalidating the `['employees']` query cache. This means the list page can show stale data for up to 5 minutes (the `staleTime`). Delete and import do invalidate correctly.
   - File: `client/src/features/employees/pages/EmployeeNewPage.tsx` line 120 (no `queryClient.invalidateQueries(...)`)
   - File: `client/src/features/employees/pages/EmployeeEditPage.tsx` line 113 (no `queryClient.invalidateQueries(...)`)

7. **Race condition in code generation** — `generateNextEmployeeCode()` finds the last employee by code prefix and increments the number, but this is **not atomic**. Two concurrent requests can get the same next code, resulting in a duplicate key error at the database level.
   - File: `server/src/modules/employees/employees.service.ts` lines 123–143

8. **Duplicate employee code not checked on update** — The `update()` method does not check if a changed `employeeCode` conflicts with another existing employee. The database `unique: true` constraint will catch it, but the error surfaces as a MongoDB duplicate key error (500) instead of a proper 400 validation error.
   - File: `server/src/modules/employees/employees.service.ts` lines 195–218

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate employeeCode on create | ✅ Handled (400 error via `findOne` check) |
| Duplicate employeeCode on update | ❌ **Not handled** — no pre-check before save; would get a 500 duplicate key error |
| Non-existent ID on get | ✅ 404 error |
| Non-existent ID on update | ✅ 404 error |
| Non-existent ID on delete | ✅ 404 error |
| Empty required fields (create) | ✅ Zod validates required fields |
| Invalid department/designation/shift ID (not a valid ObjectId) | ✅ Zod `refine` validates ObjectId format |
| Invalid department/designation/shift ID (valid ObjectId but non-existent doc) | ⚠️ Not validated — would create employee with null ref |
| Search with special regex chars (`.`, `*`, `?`, etc.) | ⚠️ **No escaping** — ReDoS risk |
| Salary access for non-privileged roles | ✅ Masked via `sanitizeEmployee()` |
| Bank details encryption | ✅ Encrypted on write, decrypted on read, masked for non-privileged roles |
| Import malformed Excel | ✅ Caught at row level with per-row error messages |
| Import duplicate employeeCode | ✅ Handled — skips with error message |
| Code generation race condition | ⚠️ **Not atomic** — concurrent requests could get same code |
| Pagination overflow (page > total) | ✅ Returns empty data array |
| Export with archived employees | ✅ Filtered out (`status: { $ne: 'archived' }`) |
| Delete (archives, doesn't hard-delete) | ✅ Sets `status = 'archived'` |
| Document upload to non-existent employee | ✅ 404 error |
| Document download for non-existent doc | ✅ 404 error |

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|--------------|
| 1 | Missing `authorize()` on `/next-code` | ❌ Not applied | `server/src/modules/employees/employees.routes.ts` |
| 2 | ReDoS via search regex | ✅ Fixed — escaped | `server/src/modules/employees/employees.service.ts` |
| 3 | Pagination defaults mismatch | ❌ Not applied | `server/src/modules/employees/employees.validation.ts` or `PaginationUtil.ts` |
| 4 | Unused `listEmployeesSchema` | ❌ Not applied | `server/src/modules/employees/employees.routes.ts` |
| 5 | PUT vs PATCH semantics (minor) | ❌ Not applied | `server/src/modules/employees/employees.routes.ts` + client |
| 6 | Cache invalidation on create/update | ❌ Not applied | `client/src/features/employees/pages/EmployeeNewPage.tsx`, `EmployeeEditPage.tsx` |
| 7 | Code generation race condition | ❌ Not applied | `server/src/modules/employees/employees.service.ts` |
| 8 | Duplicate code check on update | ❌ Not applied | `server/src/modules/employees/employees.service.ts` |

---

## Summary of Findings

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 Critical | 1 | Missing `authorize()` on `/next-code` |
| 🟡 Medium | 3 | ReDoS in search regex, pagination defaults mismatch, unused validation schema |
| 🟢 Minor | 4 | PUT vs PATCH semantics, missing cache invalidation, code gen race condition, missing duplicate check on update |

**Good:** Unlike the departments module, there is no PUT vs PATCH HTTP method mismatch between client and server (both use `PUT`). The model has `updatedBy` field and the service correctly sets it on all mutations. No `new Promise(async ...)` anti-patterns were found. Bank details are properly encrypted at rest and masked for unauthorized roles.
