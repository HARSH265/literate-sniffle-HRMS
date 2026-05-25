# Audit Report: Leave Module

**Date:** May 25, 2026
**Files audited:** 12 (4 server, 5 client pages, 3 models)

---

## Route Inventory

Base path: `/api/v1/leave`

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/types` | ✅ `authenticate` | ✅ `view-leave` | none |
| POST | `/types` | ✅ `authenticate` | ✅ `manage-leave-types` | ✅ `createLeaveTypeSchema` |
| PATCH | `/types/:id` | ✅ `authenticate` | ✅ `manage-leave-types` | ✅ `updateLeaveTypeSchema` |
| DELETE | `/types/:id` | ✅ `authenticate` | ✅ `manage-leave-types` | none |
| GET | `/applications` | ✅ `authenticate` | ✅ `view-leave` | none |
| GET | `/applications/my` | ✅ `authenticate` | ❌ **MISSING** | none |
| POST | `/applications` | ✅ `authenticate` | ✅ `manage-leave-applications` | ✅ `createLeaveApplicationSchema` |
| PATCH | `/applications/:id/cancel` | ✅ `authenticate` | ✅ `manage-leave-applications` | none |
| POST | `/applications/approve` | ✅ `authenticate` | ✅ `approve-leave` | ✅ `approveLeaveSchema` |
| GET | `/approvals/pending` | ✅ `authenticate` | ✅ `approve-leave` | none |
| GET | `/balances/:employeeId` | ✅ `authenticate` | ✅ `view-leave` | none |
| GET | `/balances/my` | ✅ `authenticate` | ❌ **MISSING** | none |
| POST | `/accrue` | ✅ `authenticate` | ✅ `manage-leave-types` | ✅ `bulkAccrueSchema` |
| GET | `/calendar` | ✅ `authenticate` | ✅ `view-leave` | none |
| GET | `/summary` | ✅ `authenticate` | ✅ `view-leave` | none |

---

## Issues Found

### 🔴 Critical

1. **Missing `authorize()` on `/leave/applications/my`** — The route has `authenticate` but no `authorize()` middleware. The controller (`getMyApplications`) accepts an optional `?employee` query parameter, defaulting to `req.user!.id`. An authenticated user can pass any employee ID to view that employee\'s leave applications. This is a broken access control vulnerability.

2. **Missing `authorize()` on `/leave/balances/my`** — Same pattern as above. The controller (`getMyBalances`) accepts `?employee` as a query parameter. An authenticated user can view any employee\'s leave balances without permission.

### 🟡 Medium

3. **Search regex unescaped (ReDoS)** — In `leave.service.ts` `createLeaveType()`, line 89:
   ```ts
   { name: { $regex: new RegExp(\`^\${data.name}$\`, \'i\') } }
   ```
   User-controlled `data.name` is interpolated into a regex without escaping. Although Zod validates min/max length, a crafted string with repeated `.*` or `(?:.*)+` patterns could cause catastrophic backtracking. Use `escapeStringRegexp` or `_.escapeRegExp`.

4. **`bulkAccrue` doesn\'t set `updatedBy` on existing records** — The `LeaveBalance` model defines both `createdBy` and `updatedBy` fields. When `bulkAccrue()` updates an existing balance record (line 567-571 of `leave.service.ts`), it modifies `totalEntitled`, `carryForwardFromPrev`, `balance`, and `lastAccruedAt` but does **not** set `updatedBy`. Only new records get `createdBy` (line 583).

5. **`getMyApplications` uses User ID as Employee ID** — The controller falls back to `req.user!.id` when no `?employee` query param is provided. However, `req.user!.id` is a **User** document ID, while the `employee` field on `LeaveApplication` references the **Employee** collection. These are separate collections — querying with a User ID will almost certainly return zero results for legitimate users accessing their own applications.

6. **`getMyBalances` uses User ID as Employee ID** — Same issue as #5: `req.user!.id` (User ID) is used as the `employeeId` parameter for `LeaveBalance.find()`, which stores Employee references. Self-service balance lookup will fail for users whose User ID differs from their Employee ID.

7. **Missing `updatedBy` in `createLeaveType`** — While `updateLeaveType` correctly sets `updatedBy`, the `createLeaveType` method does not. Although less critical (create usually just sets `createdBy`), for audit trail consistency the `updatedBy` field should be set on creation as well.

### 🟢 Minor

8. **No balance cache invalidation after approval/rejection** — The `LeaveApprovalsPage` invalidates `QUERY_KEYS.leaveApplications` and `QUERY_KEYS.leaveApprovalsPending` after processing an application, but does not invalidate `QUERY_KEYS.leaveBalances(...)` or `QUERY_KEYS.leaveBalancesMy`. If an admin is viewing the approvals page and approves a leave, the balance displayed on the balances page (cached in React Query) will be stale until a manual refresh.

9. **Duplicate code check missing on update** — The `updateLeaveType` service method (line 105-116) does not check for duplicate name/code against **other** leave types. While the model has `unique: true` on both `name` and `code` fields (which will throw a MongoDB `E11000` error), the resulting error is a raw 500 instead of a user-friendly 400. The `createLeaveType` method properly checks for duplicates with a 400 response.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate leave type name on create | ✅ Handled (400 error with regex check) |
| Duplicate code on create | ✅ Handled (same check, code uppercased) |
| Duplicate name/code on update (different ID) | ⚠️ Not handled — would get raw MongoDB E11000 (500) instead of friendly 400 |
| Delete leave type with active applications | ✅ Blocked (count check on pending/approved apps) |
| Non-existent ID on update/delete | ✅ 404 error |
| Non-existent ID on list/calendar/summary | ✅ Returns empty data (no error) |
| End date before start date | ✅ 400 error |
| Exceeding max days per application | ✅ 400 error |
| Insufficient balance (allowNegative=false) | ✅ 400 error with details |
| Overlapping leave applications | ✅ Blocked (same employee, same date range, pending/approved status) |
| Cancel already cancelled application | ✅ 400 error |
| Cancel approved outside allowed period | ✅ 400 error (settings-based) |
| Approve non-pending application | ✅ 400 error |
| Unauthorized approver (wrong level or user) | ✅ 403 error |
| Empty name | ✅ Zod validates min 1 char |
| Code with lowercase letters | ✅ Auto-uppercased via Zod transform |
| Search with special regex chars | ⚠️ ReDoS vulnerability — `data.name` not escaped |
| Missing `updatedBy` on bulk accrual update | ⚠️ Field exists on model but not set on update path |
| User ID vs Employee ID mismatch on "my" endpoints | ⚠️ Self-service endpoints use User ID to query Employee-referenced collections |

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|--------------|
| 1 | Missing `authorize()` on `/applications/my` | ❌ Not yet | `server/src/modules/leave/leave.routes.ts` |
| 2 | Missing `authorize()` on `/balances/my` | ❌ Not yet | `server/src/modules/leave/leave.routes.ts` |
| 3 | ReDoS via search regex in `createLeaveType` | ✅ Fixed — escaped | `server/src/modules/leave/leave.service.ts` |
| 4 | `bulkAccrue` missing `updatedBy` on update | ❌ Not yet | `server/src/modules/leave/leave.service.ts` |
| 5 | `getMyApplications` uses User ID instead of Employee ID | ❌ Not yet | `server/src/modules/leave/leave.controller.ts` |
| 6 | `getMyBalances` uses User ID instead of Employee ID | ❌ Not yet | `server/src/modules/leave/leave.controller.ts` |
| 7 | `createLeaveType` missing `updatedBy` | ❌ Not yet | `server/src/modules/leave/leave.service.ts` |
| 8 | Balance cache not invalidated after approval | ❌ Not yet | `client/src/features/leave/pages/LeaveApprovalsPage.tsx` |
| 9 | Duplicate check missing on update (raw 500) | ❌ Not yet | `server/src/modules/leave/leave.service.ts` |

---

## Notes

- **HTTP method alignment**: All client-to-server HTTP methods match correctly. Client uses `apiClient.patch()` for `PATCH` server routes — no PUT vs PATCH mismatch found in this module.
- **`updatedBy` fields**: Unlike the Shifts and Departments modules, the Leave models (`LeaveType`, `LeaveBalance`, `LeaveApplication`) already define `updatedBy` in both their interfaces and schemas. The gaps are in service methods that don\'t consistently populate it.
- **Pagination defaults**: Server defaults to `limit: 20` (PaginationUtil). Client `usePagination` hook defaults to `defaultLimit: 20` — consistent. Client pages use `pageSize: 20` — consistent.
- **`new Promise(async...)` anti-pattern**: Not found in this module. None of the service methods use this anti-pattern.
