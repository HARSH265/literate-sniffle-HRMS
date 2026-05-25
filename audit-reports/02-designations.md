# Audit Report: Designations Module

**Date:** May 25, 2026
**Files audited:** 6 (3 server, 2 client, 1 model)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/designations` | ✅ `authenticate` | ✅ `view-departments` | none |
| GET | `/api/v1/designations/:id` | ✅ `authenticate` | ✅ `view-departments` | none |
| POST | `/api/v1/designations` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `createDesignationSchema` |
| PATCH | `/api/v1/designations/:id` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `updateDesignationSchema` |
| DELETE | `/api/v1/designations/:id` | ✅ `authenticate` | ✅ `manage-departments` | none |

---

## Issues Found

### 🔴 Critical
1. **PUT vs PATCH mismatch** — Server `PATCH /:id`, client calls `apiClient.put(...)`. Same as Departments. Will 404 on update.

### 🟡 Medium
2. **Missing `updatedBy`** — Model has `createdBy` but no `updatedBy`. Service update doesn't track who updated.
3. **Search regex unescaped** — `filter.name = { $regex: search, $options: 'i' }` — vulnerable to ReDoS.

### 🟢 Minor
4. **No DB-level unique constraint** on `{name, department}` — service checks in code but race condition could create duplicates.
5. **No cache invalidation on update for stale department reference** — If a department name changes, cached designations still show old department name.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Invalid department ID on create | ✅ Handled with `Department.exists()` |
| Duplicate name+department on create | ✅ Handled (400) |
| Duplicate on update (same ID) | ✅ Handled with `$ne` |
| Delete designation with employees | ✅ Blocked with count check |
| Missing department field | ✅ Zod validates required |
| Non-existent ID on get/update/delete | ✅ 404 |

---

## Fixes Applied

| # | Issue | Status |
|---|-------|--------|
| 1 | PUT → PATCH on client | ✅ |
| 2 | Missing `updatedBy` in model + service | ✅ |
| 3 | ReDoS via search regex | ✅ Escaped |

## Remaining (Non-Blocking)
4. DB-level unique compound index — low priority, handled in code
5. Designation cache not invalidated on department name change — cross-module concern
