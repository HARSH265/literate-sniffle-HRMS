# Audit Report: QR Attendance Module

**Date:** May 25, 2026
**Files audited:** 8 (4 server, 2 client, 1 related kiosk module, 1 model)

---

## Files Examined

| Layer | File | Status |
|-------|------|--------|
| Server Route | `server/src/modules/attendance-qr/attendanceQR.routes.ts` | ✅ |
| Server Controller | `server/src/modules/attendance-qr/attendanceQR.controller.ts` | ✅ |
| Server Service | `server/src/modules/attendance-qr/attendanceQR.service.ts` | ✅ |
| Server Validation | `server/src/modules/attendance-qr/attendanceQR.validation.ts` | ✅ |
| Server Model | `server/src/models/AttendanceEntry.model.ts` | ✅ |
| Server (related) | `server/src/modules/kiosk/kiosk.service.ts` | ✅ |
| Client Service | `client/src/features/attendance-qr/services/attendanceQRService.ts` | ✅ |
| Client Component | `client/src/features/attendance-qr/components/KioskQR.tsx` | ✅ |

---

## Route Inventory

Routes are mounted at `/api/v1/attendance/qr` (from `app.ts` line 114).

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| POST | `/api/v1/attendance/qr/check-in` | ❌ **MISSING** | ❌ **MISSING** | ✅ `checkInSchema` |
| POST | `/api/v1/attendance/qr/check-out` | ❌ **MISSING** | ❌ **MISSING** | ✅ `checkOutSchema` |

> **Note on Auth/Authorize:** These routes intentionally omit the `authenticate` middleware because kiosk employees do not have a JWT session cookie. Authentication is handled at the application level via QR token (JWT signed with `QR_SECRET`) + TOTP 6-digit code verification in the service layer. This is an acceptable architectural choice but deviates from the standard middleware pattern used across all other modules.

---

## Issues Found

### 🔴 Critical

1. **No `authenticate` / `authorize` middleware on QR routes** — Unlike every other route in the application, QR check-in/check-out endpoints have zero middleware-level authentication. While QR token + TOTP validation occurs in the service, if either mechanism has a bypass vulnerability, the endpoint is completely exposed. No middleware defense-in-depth.
   - **Files:** `attendanceQR.routes.ts` lines 8-9
   - **Fix:** Consider adding an optional lightweight auth layer, or at minimum rate-limiting middleware.

### 🟡 Medium

2. **No rate limiting / brute-force protection** — The check-in and check-out endpoints accept TOTP codes (6 digits = 1M combinations) with no rate limiting. An attacker could brute-force the TOTP if they obtain a valid QR token (which expires in ~15 seconds but is renewable).
   - **Files:** `attendanceQR.routes.ts`, `attendanceQR.service.ts`
   - **Fix:** Add `express-rate-limit` on these routes (e.g., 5 attempts per minute per IP).

3. **Missing `updatedBy` on check-out** — The `AttendanceEntry` model has an `updatedBy` field (line 15 of model), but the `checkOut` service method (line 157-164) does NOT set `entry.updatedBy` before calling `entry.save()`. Whoever performs the check-out is not tracked.
   - **Files:** `attendanceQR.service.ts` line 157-164
   - **Fix:** Set `entry.updatedBy = employee._id` (or the user conducting the checkout).

4. **`isLatePresent` field name is misleading** — When `lateMarkAsAbsent` is enabled and the employee is late, the status is set to `'absent'` (line 79) but `isLatePresent` is set to `true` (line 96). The field name implies "late but present" but the actual status is "absent". This creates confusion for reporting.
   - **Files:** `attendanceQR.service.ts` lines 79, 96
   - **Fix:** Rename to `autoOTCalculated` or add a comment explaining the semantics, or wrap in a getter.

5. **TOTP code validation accepts non-digit characters** — Zod schema `z.string().length(6)` only validates length, not that all characters are digits. `"abcdef"` passes validation but will fail at `TOTPService.verifyCode`.
   - **Files:** `attendanceQR.validation.ts` lines 5, 16
   - **Fix:** Use `z.string().length(6).regex(/^\d{6}$/)`.

6. **`getDistanceFromLatLng` is defined locally** — The Haversine distance function is defined in `attendanceQR.service.ts` (lines 224-233). If other modules (kiosk, supervisor-override) need GPS distance, this code is duplicated. It should be extracted to a shared utility.
   - **Files:** `attendanceQR.service.ts` lines 224-233
   - **Fix:** Move to `server/src/core/utils/geo.ts`.

7. **`setInterval` in `startQRBroadcast` has no cleanup** — `KioskService.startQRBroadcast` (kiosk.service.ts line 97) uses `setInterval` without returning a cleanup/dispose mechanism. If called multiple times, multiple intervals accumulate.
   - **Files:** `server/src/modules/kiosk/kiosk.service.ts` line 97
   - **Fix:** Return a disposer function, clear previous interval if called again.

### 🟢 Minor

8. **`selfieUrl` not validated as URL** — `z.string().optional()` accepts any string including malicious payloads.
   - **Files:** `attendanceQR.validation.ts` line 11
   - **Fix:** Use `z.string().url().optional()`.

9. **No notification on QR check-in/out** — No webhook, email, or in-app notification is sent to supervisors/managers when an employee marks attendance via QR.
   - **Files:** `attendanceQR.service.ts`
   - **Fix:** Add notification dispatch in the service layer (post-check-in/out).

10. **`isLateCount` never incremented** — The model has `isLateCount` (line 51) but the QR service never increments it when late check-in occurs.
    - **Files:** `attendanceQR.service.ts`
    - **Fix:** Increment `isLateCount` using `$inc` or set during entry creation.

11. **QR token nonce stored but not checked for replay** — The nonce from the QR token is stored in `checkInTokenNonce` / `checkOutTokenNonce`, but the service does not maintain a nonce cache to detect replay attacks within the token's validity window.
    - **Files:** `attendanceQR.service.ts` lines 94, 163
    - **Fix:** Implement a nonce cache (e.g., Redis or a Set with TTL) to reject reused tokens.

12. **No `trim()` on token validation** — `z.string().min(1)` doesn't trim whitespace. A token with leading/trailing whitespace would pass validation but fail at JWT verification.
    - **Files:** `attendanceQR.validation.ts` lines 4, 15
    - **Fix:** Use `z.string().trim().min(1)`.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate check-in on same day (already checked in) | ✅ Handled — 400 "Attendance already marked for today" |
| Check-out without prior check-in | ✅ Handled — 400 "No active check-in found for today" |
| Already checked out (double check-out) | ✅ Handled — filters `outTime: { $exists: false }` |
| Expired QR token | ✅ Handled — JWT expiry check, 401 "QR token expired" |
| Invalid QR token signature | ✅ Handled — JWT error caught, 401 "Invalid QR token" |
| Invalid TOTP code | ✅ Handled — 401 "Invalid TOTP code" |
| Employee not found | ✅ Handled — 400 "Employee not found" |
| TOTP not enrolled for employee | ✅ Handled — 400 "TOTP not enrolled for this employee" |
| QR kiosk disabled in settings | ✅ Handled — 400 "QR kiosk attendance is disabled" |
| Device binding enabled + unregistered device | ✅ Handled — 403 "Device not registered for this employee" |
| GPS outside geofence | ✅ Handled — 403 with distance in meters |
| Missing GPS coordinates (optional) | ✅ Handled — skip geofence check |
| Late arrival with `lateMarkAsAbsent` enabled | ✅ Handled — status set to 'absent', OT auto-calculated on checkout |
| Late arrival with `lateMarkAsAbsent` disabled | ✅ Handled — status set to 'present', isLate=true |
| OT calculation with rounding (floor/ceil/round) | ✅ Handled |
| OT hours = 0 (below minimum threshold) | ✅ Handled — no OT entry created |
| Existing OT entry for same day | ✅ Handled — updated instead of duplicated |
| Audit logging for check-in and check-out | ✅ Handled |
| Non-existent employee during check-in fetch | ✅ Handled — thrown as 400 error |
| Re-enrolling TOTP mid-session | ✅ Delegated to TOTP module |
| `lateTreatWorkAsOT` disabled | ✅ Handled — no OT created |
| Concurrent check-in requests | ⚠️ **NOT HANDLED** — No atomicity check; two simultaneous requests could both pass the `findOne` check and create duplicate entries (race condition) |

---

## Fixes Needed

| # | Issue | Severity | Fix Required |
|---|-------|----------|-------------|
| 1 | No middleware auth on QR routes | 🔴 | Add rate-limiting middleware; document auth-by-design pattern |
| 2 | No rate limiting on check-in/out | 🟡 | Add `express-rate-limit` |
| 3 | Missing `updatedBy` on check-out | 🟡 | Set `entry.updatedBy` before save |
| 4 | Misleading `isLatePresent` name | 🟡 | Rename or document field semantics |
| 5 | TOTP code Zod accepts non-digits | 🟡 | Add `regex(/^\d{6}$/)` |
| 6 | Duplicate distance function | 🟡 | Extract to shared util |
| 7 | `setInterval` leak in broadcast | 🟡 | Return disposer / clear previous interval |
| 8 | `selfieUrl` not validated as URL | 🟢 | Add `.url()` to Zod schema |
| 9 | No notification on QR attendance | 🟢 | Add notification dispatch |
| 10 | `isLateCount` never incremented | 🟢 | Increment on late check-in |
| 11 | No nonce replay protection | 🟢 | Implement nonce cache |
| 12 | No `trim()` on token validation | 🟢 | Add `.trim()` to Zod schema |

---

## Summary

**QR Attendance Module** handles check-in/check-out via QR kiosks with TOTP two-factor verification. The module is well-structured with proper service layer validation, Zod schemas, audit logging, and comprehensive edge-case handling for geofencing, device binding, late-mark-as-absent, and automatic OT calculation.

**Key concerns:**
- The absence of `authenticate` middleware is intentional (kiosk scenario) but leaves the routes without defense-in-depth. Rate limiting is essential.
- `updatedBy` is not set during check-out, breaking tracking of who performed the check-out.
- TOTP code validation in Zod is too permissive (accepts non-digits).
- `setInterval` in kiosk broadcast can leak if called multiple times.
- Concurrent check-in requests have a race condition (no atomic `findOneAndUpdate`).

**Overall rating: 6/10** — Functionally complete but has several security hardening and consistency issues.
