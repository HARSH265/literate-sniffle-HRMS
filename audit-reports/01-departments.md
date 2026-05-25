# Audit Report: Departments Module

**Date:** May 25, 2026
**Files audited:** 7 (3 server, 2 client, 1 model, 1 frontend page)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/departments/next-code` | ✅ `authenticate` | ❌ **MISSING** | none |
| GET | `/api/v1/departments` | ✅ `authenticate` | ✅ `view-departments` | none |
| GET | `/api/v1/departments/:id` | ✅ `authenticate` | ✅ `view-departments` | none |
| POST | `/api/v1/departments` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `createDepartmentSchema` |
| PATCH | `/api/v1/departments/:id` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `updateDepartmentSchema` |
| DELETE | `/api/v1/departments/:id` | ✅ `authenticate` | ✅ `manage-departments` | none |

---

## Issues Found

### 🔴 Critical
1. **PATCH vs PUT mismatch** — Server route is `PATCH /:id` but client calls `apiClient.put(...)`. This will 404 on update operations. Fix client to use `PATCH` or server to use `PUT`.

### 🟡 Medium
2. **`/next-code` missing authorization** — No `authorize()` call. Any authenticated user can generate department codes. Should at minimum require `view-departments`.
3. **Missing `updatedBy` tracking** — Model has `createdBy` but no `updatedBy` field. `update()` service method doesn't track who updated the record.
4. **Client pagination mismatch** — `defaultPageSize: 10` in pagination config but `limit` defaults to 20. First load shows page 1 with 20 items but pagination UI shows "1-10 of X".

### 🟢 Minor
5. **No cache invalidation on code generation** — `generateNextDepartmentCode()` doesn't invalidate department cache (minor, since it's just code generation).
6. **`isActive` not filterable on list** — Query param `status` maps to `isActive` but there's no UI filter for active/inactive departments.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate name on create | ✅ Handled (400 error) |
| Duplicate code on create | ✅ Handled (400 error) |
| Duplicate code on update (same ID) | ✅ Handled with `$ne` |
| Delete department with employees | ✅ Blocked with employee count check |
| Non-existent ID on get/update/delete | ✅ 404 error |
| Empty name | ✅ Zod validates min 2 chars |
| Code with lowercase letters | ✅ Auto-uppercased in service |
| Search with special regex chars | ⚠️ No escaping — `$regex` with user input can cause ReDoS or unexpected matches |
| Code generation race condition | ⚠️ Not atomic — two concurrent requests could get same code |
| Pagination overflow (page > total) | ✅ Returns empty data array |

---

## Fixes Applied

| # | Issue | Status | Commit |
|---|-------|--------|--------|
| 1 | PUT → PATCH on client | ✅ Fixed | |
| 2 | Missing `authorize()` on `/next-code` | ✅ Fixed — changed to `manage-departments` | |
| 3 | Missing `updatedBy` in model + service | ✅ Fixed — added to model schema + set on update | |
| 4 | ReDoS via search regex | ✅ Fixed — escaped special chars | |
| 5 | Client pagination defaults mismatch | ✅ Fixed — `defaultPageSize: 20` (matches API) | |

## Remaining (Non-Blocking)

6. **Active/inactive filter on UI** — nice-to-have, low priority
7. **Atomic code generation** — would need a separate counter collection; low risk for single-server

