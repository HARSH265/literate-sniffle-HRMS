# Audit Report: Attendance Module

**Date:** May 25, 2026
**Files audited:** 12 (4 server, 1 model, 2 client, 5 QR sub-module)

---

## Files Examined

| Layer | File |
|-------|------|
| Server Route | `server/src/modules/attendance/attendance.routes.ts` |
| Server Controller | `server/src/modules/attendance/attendance.controller.ts` |
| Server Service | `server/src/modules/attendance/attendance.service.ts` |
| Server Validation | `server/src/modules/attendance/attendance.validation.ts` |
| Model | `server/src/models/AttendanceEntry.model.ts` |
| Client Service | `client/src/features/attendance/services/attendanceService.ts` |
| Client Page | `client/src/features/attendance/pages/AttendancePage.tsx` |
| QR Routes | `server/src/modules/attendance-qr/attendanceQR.routes.ts` |
| QR Controller | `server/src/modules/attendance-qr/attendanceQR.controller.ts` |
| QR Service | `server/src/modules/attendance-qr/attendanceQR.service.ts` |
| QR Validation | `server/src/modules/attendance-qr/attendanceQR.validation.ts` |
| QR Client Service | `client/src/features/attendance-qr/services/attendanceQRService.ts` |

---

## Route Inventory — Attendance Module

All routes mounted under `/api/v1/attendance` with `router.use(authenticate)` at top.

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/attendance` | ✅ `authenticate` | ✅ `view-employees` | none |
| GET | `/api/v1/attendance/employee/:employeeId` | ✅ `authenticate` | ✅ `view-employees` | none |
| GET | `/api/v1/attendance/monthly-view` | ✅ `authenticate` | ✅ `view-employees` | none |
| POST | `/api/v1/attendance/bulk` | ✅ `authenticate` | ✅ `manage-attendance` | ✅ `bulkAttendanceSchema` |
| PATCH | `/api/v1/attendance/bulk-update` | ✅ `authenticate` | ✅ `manage-attendance` | ❌ none |
| POST | `/api/v1/attendance` | ✅ `authenticate` | ✅ `manage-attendance` | ✅ `createAttendanceEntrySchema` |
| PATCH | `/api/v1/attendance/:id` | ✅ `authenticate` | ✅ `manage-attendance` | ❌ none |
| DELETE | `/api/v1/attendance/:id` | ✅ `authenticate` | ✅ `manage-attendance` | none |

## Route Inventory — Attendance QR Sub-Module (Kiosk)

No `authenticate` or `authorize` middleware — uses QR token + TOTP validation in service layer.

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| POST | `/attendance/qr/check-in` | ❌ none (QR+TOTP) | ❌ none | ✅ `checkInSchema` |
| POST | `/attendance/qr/check-out` | ❌ none (QR+TOTP) | ❌ none | ✅ `checkOutSchema` |

---

## Specific Checks

### 1. PUT/PATCH Mismatch (Client vs Server)
- **Client** (`attendanceService.ts:80`): `apiClient.patch(\`/attendance/${id}\`, payload)` ✅ uses `PATCH`
- **Server** (`attendance.routes.ts:18`): `router.patch('/:id', ...)` ✅ uses `PATCH`
- **Verdict:** ✅ No mismatch.

### 2. `updatedBy` in Model
- **Model** (`AttendanceEntry.model.ts:15`): `updatedBy?: mongoose.Types.ObjectId` ✅ Present in schema
- **Model** (`AttendanceEntry.model.ts:55`): Defined in schema as `{ type: Schema.Types.ObjectId, ref: 'User' }` ✅
- **Service `update()`** (`attendance.service.ts:404`): `const updateData = { ...data, updatedBy: userId }` ✅ Set on update
- **Service `bulkCreate()`** (`attendance.service.ts:284`): `updatedBy: userId` ✅ Set on bulk upsert
- **Service `bulkUpdateEntries()`** (`attendance.service.ts:448`): `existing.updatedBy = userId` ✅ Set on bulk update
- **Service `create()`**: Not set on create (fine — `enteredBy` is used for creation tracking)
- **Verdict:** ✅ `updatedBy` present and correctly used.

### 3. Unescaped Search Regex
- No `$regex` usage exists anywhere in `attendance.service.ts`.
- The `list` method does not implement text search.
- **Verdict:** ✅ No issue.

### 4. `new Promise(async (resolve)...)` Anti-patterns
- Grep across all attendance + QR service files: **No matches found.**
- All methods use clean `static async` functions with direct `await`.
- **Verdict:** ✅ No anti-patterns.

### 5. Pagination Defaults Matching
- **Server** (`PaginationUtil.ts:24`): default limit = `'20'`
- **Client** (`AttendancePage.tsx:33`): `const [limit, setLimit] = useState(20)`
- **Client** (`AttendancePage.tsx:292`): `defaultPageSize: 20`
- **Verdict:** ✅ Match (both default to 20).

### 6. Missing `authorize()` on Routes
- All 8 attendance routes have `authorize()` middleware ✅
- QR routes intentionally bypass standard auth (QR token + TOTP in service) — noted but non-blocking
- **Verdict:** ✅ No missing `authorize()` on attendance routes.

---

## Issues Found

### 🔴 Critical

**1. Missing validation on `PATCH /attendance/:id`**
- **File:** `server/src/modules/attendance/attendance.routes.ts:18`
- **Detail:** The `PATCH /:id` route has no `validate()` middleware. The `createAttendanceEntrySchema` exists but there is no `updateAttendanceEntrySchema`. The service spreads `req.body` directly into the update via `Object.assign(entry, updateData)`. A malicious or buggy client could send arbitrary fields (`employee`, `date`, etc.) that shouldn't be changeable post-creation.
- **Fix:** Create an `updateAttendanceEntrySchema` (e.g., all fields optional except at least one required) and add `validate(updateAttendanceEntrySchema)` to the route.

| # | Issue | Status |
|---|-------|--------|
| 1 | `PATCH /:id` missing validation middleware | ❌ Unfixed |

**2. Missing validation on `PATCH /attendance/bulk-update`**
- **File:** `server/src/modules/attendance/attendance.routes.ts:16`
- **Detail:** The `PATCH /bulk-update` route has no `validate()` middleware. Controller does a manual `if (!entries || !Array.isArray(entries))` check but does not validate individual entry shapes (id, status, inTime, outTime, remarks). No Zod schema exists for this operation.
- **Fix:** Create a `bulkUpdateAttendanceSchema` and add `validate(bulkUpdateAttendanceSchema)` to the route.

| # | Issue | Status |
|---|-------|--------|
| 2 | `PATCH /bulk-update` missing validation middleware | ❌ Unfixed |

### 🟡 Medium

**3. `monthlyView` returns all active employees without pagination**
- **File:** `server/src/modules/attendance/attendance.service.ts:133-201`
- **Detail:** The `monthlyView()` method queries ALL active employees without pagination or limiting. For companies with 500+ employees, this returns a massive payload. The `GET /monthly-view` route also has no pagination query params. Additionally, it queries `Employees` and `AttendanceEntry` separately instead of using an aggregation pipeline — an N+1-ish pattern that loads all employees then looks up attendance by employee ID.
- **Fix:** Add pagination support or at minimum enforce a `maxLimit` cap. Consider using MongoDB aggregation pipeline for efficiency.

**4. `list` method silently ignores `search` query parameter**
- **File:** `server/src/modules/attendance/attendance.service.ts:32`
- **Detail:** `PaginationUtil.parseFromObject()` returns a `search` property, but the `list()` method destructures only `{ page, limit, sort, order }`, ignoring `search`. Callers passing `?search=John` will get no error and no search filtering — the parameter is silently dropped.
- **Fix:** Implement search filtering (e.g., by employee name) or at minimum return a warning/error that search is not supported on this endpoint.

**5. `monthlyView` query lacks sort order**
- **File:** `server/src/modules/attendance/attendance.service.ts:148`
- **Detail:** The `AttendanceEntry.find(attendanceFilter)` call has no `.sort()`. The order of records within the monthly view is undefined and database-dependent, which could cause UI flickering or inconsistent display on re-render.
- **Fix:** Add a deterministic `.sort({ date: 1, employee: 1 })` or similar.

**6. Bulk create has race condition on create-vs-update decision**
- **File:** `server/src/modules/attendance/attendance.service.ts:238-303`
- **Detail:** In `bulkCreate()`, the code first reads existing entries (`existingEntries`), then decides create vs. update based on that snapshot. Two concurrent requests for the same employee+date could both see "no existing entry" and both attempt `insertMany`, causing a duplicate key error (or first wins). The unique compound index `{ employee: 1, date: 1 }` prevents corruption but the operation is not atomic.
- **Fix:** Use `bulkWrite` with `updateOne({ upsert: true })` for all entries to make the create-vs-update atomic.

### 🟢 Minor

**7. QR routes lack standard auth middleware**
- **File:** `server/src/modules/attendance-qr/attendanceQR.routes.ts:1-11`
- **Detail:** QR check-in/out routes have no `authenticate` or `authorize` middleware. The service layer does validate via QR token + TOTP, which provides equivalent security for kiosk use-cases. However, the inconsistency with the rest of the codebase could cause confusion during code reviews or future maintenance. Documentation note: these routes are intentionally unauthenticated because employees use QR tokens + TOTP instead of JWT sessions.
- **Fix:** Add inline documentation explaining the alternative auth mechanism. Consider adding a rate-limiter middleware to these routes.

**8. `updatedBy` not set on single `create()` but `enteredBy` is**
- **File:** `server/src/modules/attendance/attendance.service.ts:368-375`
- **Detail:** The `create()` method does not set `updatedBy` (only `enteredBy`). This is logically correct (creation isn't an update) and matches the intended design pattern. Noted for consistency — other modules in this codebase (e.g., departments) were found to lack `updatedBy` entirely, but this model has it correctly.

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | `PATCH /:id` missing validation | 🔴 Critical | ❌ Unfixed |
| 2 | `PATCH /bulk-update` missing validation | 🔴 Critical | ❌ Unfixed |
| 3 | `monthlyView` no pagination — large payload risk | 🟡 Medium | ❌ Unfixed |
| 4 | `search` param silently ignored in `list` | 🟡 Medium | ❌ Unfixed |
| 5 | `monthlyView` missing sort order | 🟡 Medium | ❌ Unfixed |
| 6 | Bulk create race condition (non-atomic upsert) | 🟡 Medium | ❌ Unfixed |
| 7 | QR routes lack standard auth middleware | 🟢 Minor | ❌ Unfixed |
| 8 | `updatedBy` vs `enteredBy` consistency (info only) | 🟢 Minor | ✅ By design |

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate attendance for same employee+date | ✅ Handled (unique compound index `{ employee, date }`) |
| Future date attendance | ✅ Blocked (400 error in service) |
| Past date beyond configurable limit | ✅ Blocked (400 error, respects `pastEntryLimitDays`) |
| Out time before/equal to in time | ✅ Blocked (400 error) |
| Non-existent employee on create | ✅ 400 error from `Employee.findById()` |
| Non-existent ID on update/delete | ✅ 404 error (caught by service) |
| Empty/malformed date string | ✅ Zod `^\d{4}-\d{2}-\d{2}$` regex validation |
| Invalid status value | ✅ Zod enum validation (`present`, `absent`, `half-day`, `leave`, `weekly-off`, `holiday`) |
| Time format invalid | ✅ Zod `HH:MM` regex validation |
| Bulk create with 0 entries | ✅ Zod `.min(1)` constraint |
| Bulk create with >500 entries | ✅ Zod `.max(500)` constraint |
| Monthly view with no department filter | ✅ Returns all active employees |
| Pagination overflow (page > total) | ✅ Returns empty `data` array with correct meta |
| Search param passed but not implemented | ⚠️ Silently ignored — no error, no filtering |
| Concurrent bulk create same employee+date | ⚠️ Race condition — non-atomic create-vs-update decision |
| QR check-in with invalid/expired token | ✅ `KioskService.validateQRToken` throws |
| QR check-in with wrong TOTP code | ✅ 401 error |
| QR check-out with no active check-in | ✅ 400 error ("No active check-in found for today") |
| QR check-in when attendance already marked | ✅ 400 error ("Attendance already marked for today") |
| Geofencing breach on QR check-in | ✅ 403 error with distance info |
| Device binding mismatch on QR check-in | ✅ 403 error |
| Late mark with `lateMarkAsAbsent` enabled | ✅ Status set to `absent`, hours treated as OT |
| Large monthly view (500+ employees) | ⚠️ No pagination — could cause memory/slowdown issues |

---

## Summary

The Attendance module is the most well-structured module audited so far. All core concerns from previous audits (PUT/PATCH mismatch, missing `updatedBy`, unescaped regex, Promise anti-patterns, pagination mismatch) are **clean** in this module.

The **two critical issues** are both about **missing validation middleware**:
- `PATCH /:id` and `PATCH /bulk-update` have no `validate()` call, unlike their `POST` counterparts which use Zod schemas.
- This means arbitrary/malformed fields can be sent to update endpoints.

Medium-severity concerns center on **scalability** (`monthlyView` lacks pagination and sort order) and a **race condition** in bulk create's create-vs-update logic.

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | ❌ Both unfixed |
| 🟡 Medium | 4 | ❌ All unfixed |
| 🟢 Minor | 2 | ❌ 1 unfixed, 1 by design |
| **Total** | **8** | |

