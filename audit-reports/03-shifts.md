# Audit Report: Shifts Module

**Date:** May 25, 2026
**Files audited:** 6 (3 server, 2 client, 1 model)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/shifts` | ✅ `authenticate` | ✅ `view-departments` | none |
| GET | `/api/v1/shifts/:id` | ✅ `authenticate` | ✅ `view-departments` | none |
| POST | `/api/v1/shifts` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `createShiftSchema` |
| PATCH | `/api/v1/shifts/:id` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `updateShiftSchema` |
| DELETE | `/api/v1/shifts/:id` | ✅ `authenticate` | ✅ `manage-departments` | none |

---

## Issues Found

### 🔴 Critical
1. **PUT vs PATCH** — Client uses `put(...)` for updates, server uses `PATCH /:id`

### 🟡 Medium
2. **Missing `updatedBy`** — Model has `createdBy` only. Service update doesn't track who updated.
3. **Search regex unescaped** — `{ $regex: search, $options: 'i' }` — ReDoS vulnerability.
4. **`checkShiftOverlap` Promise anti-pattern** — Uses `new Promise(async (resolve) => { ... })` which is an antipattern. Should be `async function checkShiftOverlap(...)` directly.

### 🟢 Minor
5. **Overlap check doesn't filter by `applicableTo`** — If both shifts apply to different categories (worker vs office-staff), overlap might be acceptable but is still blocked.

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|--------------|
| 1 | PUT → PATCH on client | ✅ | `client/src/features/shifts/services/shiftService.ts` |
| 2 | Missing `updatedBy` in model + service | ✅ | `server/src/models/Shift.model.ts`, `server/src/modules/shifts/shifts.service.ts` |
| 3 | ReDoS via search regex | ✅ Escaped | `server/src/modules/shifts/shifts.service.ts` |
| 4 | Promise anti-pattern in overlap check | ✅ Refactored to async | `server/src/modules/shifts/shifts.service.ts` |
