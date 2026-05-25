# Audit Report: Holidays Module

**Date:** May 25, 2026
**Files audited:** 8 (4 server, 3 client, 1 model)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/holidays` | ✅ `authenticate` | ✅ `view-departments` | none |
| GET | `/api/v1/holidays/:id` | ✅ `authenticate` | ✅ `view-departments` | none |
| POST | `/api/v1/holidays` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `createHolidaySchema` |
| PATCH | `/api/v1/holidays/:id` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `updateHolidaySchema` |
| DELETE | `/api/v1/holidays/:id` | ✅ `authenticate` | ✅ `manage-departments` | none |

---

## Issues Found

### 🔴 Critical

1. **PUT vs PATCH mismatch** — *Not applicable.* Client correctly uses `apiClient.patch(...)` in `holidayService.ts` (line 46), matching the server's `router.patch(...)` route. ✅ No issue.

2. **Missing authorization** — *Not applicable.* All 5 routes have `authorize()` calls. ✅ No issue.

### 🟡 Medium

3. **Missing `updatedBy`** — The `Holiday` model only has `createdBy` (line 10) but no `updatedBy` field. The service's `update()` method (line 101) receives `updatedById` as a parameter but never persists it on the document before saving. Every other audited model (Shift, Department, Designation, Employee, etc.) has `updatedBy`. This means there is no audit trail for who last modified a holiday record.

4. **Search regex unescaped** — At line 13 of `holidays.service.ts`:
   ```ts
   filter.name = { $regex: search, $options: 'i' };
   ```
   User-supplied `search` is interpolated directly into a `$regex` query with no escaping. A malicious search string like `.*` or `[a-z]*` can cause excessive backtracking (ReDoS), and special regex metacharacters (`.`, `*`, `?`, `+`, `[`, `]`, `(`, `)`, `{`, `}`, `^`, `$`, `|`, `\`) will produce unexpected match results. Use `escape-string-regexp` or similar.

5. **Pagination defaults mismatch** — Server-side `PaginationUtil` defaults `limit` to **20** (line 14/24 of `PaginationUtil.ts`). Client-side pagination config in `HolidaysPage.tsx` sets `defaultPageSize: 10` (line 236). While the `limit` state initializes to 20 (line 36), the API call on line 44 hardcodes `limit: 100`, completely bypassing the pagination size state:
   ```ts
   queryFn: () => holidayService.list({ page, limit: 100, search, year: yearFilter }),
   ```
   Changing page size in the UI has no effect on how many records are fetched. Combined with the `defaultPageSize: 10` mismatch, first-load UX shows "1-10 of X" while 20 or 100 items are actually returned.

### 🟢 Minor

6. **Calendar query cache not invalidated** — The calendar tab uses a separate React Query key `['holidays-calendar']` (line 49). The `onSuccess` handlers for create/update/delete mutations (lines 61, 74, 83) only invalidate `['holidays']`, not `['holidays-calendar']`. If a user creates or edits a holiday while on the list tab, then switches to the calendar tab, stale data is shown until the 5-minute `staleTime` expires or the page is refreshed.

7. **Date conflict check uses `findOne` — can miss duplicates** — Both `create()` (line 70) and `update()` (line 132) use `Holiday.findOne(...)` to check for date conflicts within a year. `findOne` returns only the **first** matching document. If multiple holidays exist in the same year, a conflict on a non-first date is silently missed, allowing duplicate dates.

8. **`isPaid` field not editable in modal form** — The create/edit modal form (`HolidaysPage.tsx` lines 299-323) does not render a Form.Item for `isPaid`. The `handleEdit` function (line 95) sets `isPaid: record.isPaid` via `form.setFieldsValue`, so the value is preserved on update, but users have no UI control to toggle paid/unpaid status. New holidays always default to `isPaid: true` (model default) with no way to change it.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate name in same year (create) | ✅ Handled (400 error) |
| Duplicate name in same year (update, same ID) | ✅ Handled with `$ne` |
| Duplicate date in same year (create) | ⚠️ `findOne` — may miss if the conflicting date is not the first result |
| Duplicate date in same year (update) | ⚠️ `findOne` — same issue as create |
| Delete holiday (no dependencies) | ✅ Always succeeds (no dependent entities checked) |
| Non-existent ID on get/update/delete | ✅ 404 error via `AppError` |
| Invalid date format | ✅ Zod validates `YYYY-MM-DD` regex; service also checks `isNaN(date.getTime())` |
| Empty name | ✅ Zod validates min 1 char |
| Name longer than 100 chars | ✅ Zod validates max 100 chars |
| Page beyond total results | ✅ MongoDB returns empty array; pagination meta computed correctly |
| Search with special regex chars | ❌ **No escaping** — `$regex` with user input can cause ReDoS or unexpected matches |
| Year outside 2000–2100 | ✅ Zod validates int between 2000 and 2100 |
| Type not in enum (`national`, `state`, `company`, `festival`) | ✅ Zod enum validation rejects invalid values |
| `applicableTo` not in enum | ✅ Zod enum validation rejects invalid values |

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|--------------|
| 1 | PUT vs PATCH mismatch | ❌ Not applicable — client already uses `patch` | N/A |
| 2 | Missing authorization on routes | ❌ Not applicable — all routes have `authorize()` | N/A |
| 3 | Missing `updatedBy` in model + service | ✅ Fixed | `server/src/models/Holiday.model.ts`, `server/src/modules/holidays/holidays.service.ts` |
| 4 | ReDoS via search regex | ✅ Fixed — escaped | `server/src/modules/holidays/holidays.service.ts` |
| 5 | Pagination defaults mismatch | ❌ Not yet fixed | `client/src/features/holidays/pages/HolidaysPage.tsx` |
| 6 | Calendar query cache not invalidated | ❌ Not yet fixed | `client/src/features/holidays/pages/HolidaysPage.tsx` |
| 7 | Date conflict `findOne` can miss duplicates | ❌ Not yet fixed | `server/src/modules/holidays/holidays.service.ts` |
| 8 | `isPaid` not editable in modal form | ❌ Not yet fixed | `client/src/features/holidays/pages/HolidaysPage.tsx` |

## Remaining (Non-Blocking)

- **Calendar query fetches all holidays (`limit: 100`)** — Hardcoded limit pagination bypass; works for typical company holiday counts (< 50/year), but misleads the pagination UI.
- **Date conflict granularity** — Using `findOne` rather than `findOne({ date: exactDate })` is an indirect approach that works for the common case (one holiday per day) but is fragile.
