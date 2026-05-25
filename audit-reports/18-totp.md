# Audit Report: TOTP Module

**Date:** May 25, 2026
**Files audited:** 5 (3 server, 1 client, 1 model)

---

## Files Examined

| Layer | File | Status |
|-------|------|--------|
| Server Route | `server/src/modules/totp/totp.routes.ts` | ✅ |
| Server Controller | `server/src/modules/totp/totp.controller.ts` | ✅ |
| Server Service | `server/src/modules/totp/totp.service.ts` | ✅ |
| Server Model (TOTP fields) | `server/src/models/Employee.model.ts` | ✅ |
| Client Page | `client/src/features/totp/pages/TOTPEnrollPage.tsx` | ✅ |
| Client Service (co-located) | `client/src/features/attendance-qr/services/attendanceQRService.ts` (lines 35-49) | ✅ |

> **Note:** There is no separate `totp.validation.ts` file. No Zod validation schemas exist for TOTP routes. There is no separate TOTP model — TOTP fields (`totpSecret`, `totpEnabled`) live on `Employee.model.ts`.

---

## Route Inventory

Routes are mounted at `/api/v1/totp` (from `app.ts` line 116). All routes use `router.use(authenticate)` at the router level (line 8).

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| POST | `/api/v1/totp/enroll` | ✅ `authenticate` | ✅ `manage-employees` | ❌ **MISSING** (no Zod schema) |
| POST | `/api/v1/totp/verify` | ✅ `authenticate` | ✅ `view-employees` | ❌ **MISSING** (no Zod schema) |
| POST | `/api/v1/totp/disable` | ✅ `authenticate` | ✅ `manage-employees` | ❌ **MISSING** (no Zod schema) |

---

## Issues Found

### 🔴 Critical

1. **No validation middleware on any TOTP route** — All three routes (`/enroll`, `/verify`, `/disable`) lack Zod validation middleware. This is inconsistent with every other module in the application. The controller compensates with manual `if (!employeeId)` checks (totp.controller.ts lines 8, 18, 32), but this provides no type coercion, no structured error messages, and no schema documentation.
   - **Files:** `totp.routes.ts` lines 10-12
   - **Fix:** Create `totp.validation.ts` with Zod schemas for enroll, verify, and disable, and wire them via `validate()` middleware.

2. **No `totp.validation.ts` file exists** — Unlike every other module (shifts, departments, attendance-qr, etc.), the TOTP module has zero validation schemas.
   - **Fix:** Create `server/src/modules/totp/totp.validation.ts`.

3. **Controller uses manual validation instead of middleware pattern** — The controller (totp.controller.ts) manually checks for missing fields and returns `ResponseHandler.error()` directly. This duplicates logic, bypasses the standard validation pipeline, and produces inconsistent error responses.
   - **Files:** `totp.controller.ts` lines 8-11, 18-21, 32-35
   - **Fix:** Remove manual checks; delegate to Zod validation middleware.

### 🟡 Medium

4. **`generateSecret()` called directly from otplib instead of using `TOTPService.generateSecret()`** — In `enrollEmployee` (totp.service.ts line 27), `generateSecret()` is imported directly from `otplib` and called, rather than using `this.generateSecret()` or `TOTPService.generateSecret()`. This bypasses the class method and makes future changes harder.
   - **Files:** `totp.service.ts` lines 1, 27
   - **Fix:** Replace with `TOTPService.generateSecret()` or `this.generateSecret()`.

5. **`generateQRUrl` and `generateTOTPQRUrl` are duplicate methods** — Lines 11-13 and 51-53 are functionally identical methods (`generateURI({ issuer: 'OrianHRMS', label: ..., secret: ... })`). `generateTOTPQRUrl` is never called anywhere in the codebase. Dead code.
   - **Files:** `totp.service.ts` lines 11-13, 51-53
   - **Fix:** Remove `generateTOTPQRUrl` (dead code) and rename `generateQRUrl` to a clearer name or consolidate.

6. **Verify endpoint does not log audit events** — `verifyEmployeeCode` (totp.service.ts line 45-49) does not call `AuditService.log()`. Failed and successful verification attempts are not recorded, making security monitoring impossible.
   - **Files:** `totp.service.ts` lines 45-49
   - **Fix:** Add audit logging for both successful and failed TOTP verification attempts.

7. **No rate limiting on `/verify` — TOTP brute-force feasible** — The `/verify` endpoint accepts a 6-digit code with no rate limiting. An attacker with a valid `employeeId` could brute-force 1M combinations. With no rate limiting, this is a realistic attack vector.
   - **Files:** `totp.routes.ts`, `totp.service.ts`
   - **Fix:** Add `express-rate-limit` (e.g., 5 attempts per minute per employeeId or IP), or implement exponential backoff.

8. **TOTP secret exposed in API response** — `enrollEmployee` returns `{ qrUrl, secret }` (totp.service.ts line 42). The raw `secret` is sent to the client. If a malicious admin or MITM intercepts the response, they can clone the TOTP seed and generate valid codes.
   - **Files:** `totp.service.ts` line 42
   - **Fix:** Never return the plaintext secret in production responses. Return only the `qrUrl`. The secret should only be shown once in a controlled UI flow, not returned from the API.

9. **Client imports TOTP service from QR module** — `client/src/features/totp/pages/TOTPEnrollPage.tsx` line 5 imports `{ totpService }` from `'../../attendance-qr/services/attendanceQRService'`. The TOTP client service is co-located inside the QR module's service file. This creates an architectural smell where the TOTP module depends on the QR module for its client API.
   - **Files:** `client/src/features/totp/pages/TOTPEnrollPage.tsx` line 5
   - **Fix:** Move `totpService` to `client/src/features/totp/services/totpService.ts`.

### 🟢 Minor

10. **No employee status validation on enroll** — `enrollEmployee` (totp.service.ts line 23) does not check if the employee is active, terminated, or archived before enrolling TOTP. A terminated employee could still have TOTP enrolled.
    - **Files:** `totp.service.ts` line 23-27
    - **Fix:** Check `employee.status === 'active'` before enrolling.

11. **Re-enrollment silently overwrites existing TOTP secret** — Calling `/enroll` on an already-enrolled employee silently replaces the existing TOTP secret and re-enables TOTP. No confirmation, no warning, no invalidation of existing authenticator app registrations.
    - **Files:** `totp.service.ts` lines 27-31
    - **Fix:** Require explicit confirmation (query param `force=true`) or disable first.

12. **`disableTOTP` does not clear `registeredDeviceId`** — When TOTP is disabled (totp.service.ts lines 59-60), the `registeredDeviceId` field on the employee is not cleared. The device remains registered even though TOTP is disabled.
    - **Files:** `totp.service.ts` lines 59-60
    - **Fix:** Also set `employee.registeredDeviceId = undefined`.

13. **No `token` field validation in Zod (or anywhere)** — The verify endpoint accepts a `token` parameter with no validation whatsoever. Any string of any length is accepted. Zod would validate that it's a 6-digit string.
    - **Files:** `totp.controller.ts` line 17
    - **Fix:** Add validation schema with `z.string().length(6).regex(/^\d{6}$/)`.

14. **Missing method documentation / JSDoc** — The service class has no JSDoc comments on any method. The `verifyCode` method has a silent `catch` that returns `false` with no logging of failures.
    - **Files:** `totp.service.ts`
    - **Fix:** Add JSDoc and log failed verification attempts (at debug level).

15. **`qrUrl` uses `http://` protocol** — The `generateURI` from otplib generates an `otpauth://` URI, which when converted to a QR code image URL by the client, may use an HTTP image proxy. If the frontend converts this to an `<img>` tag, the URL format needs to be verified. (Verified: the API returns `qrUrl` which is the `otpauth://` URI, and the client renders it directly as an `img src` — this works because `otpauth://` is a registered URI scheme handled by authenticator apps on mobile, but on desktop browsers it may not render.)
    - **Files:** `client/src/features/totp/pages/TOTPEnrollPage.tsx` line 114
    - **Fix:** Use a QR code rendering library (like `qrcode-generator` used in KioskQR.tsx) to render the QR code on the page.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Employee not found on enroll | ✅ Handled — 404 "Employee not found" |
| Employee not found on verify | ✅ Handled — returns `false` (401) |
| Employee not found on disable | ✅ Handled — 404 "Employee not found" |
| TOTP already enrolled (re-enroll) | ❌ **NOT HANDLED** — silently overwrites secret |
| Disable when not enrolled | ✅ Handled — still works (sets secret to undefined) |
| Invalid TOTP code during verify | ✅ Handled — returns false, returns 401 |
| Valid TOTP code during verify | ✅ Handled — returns valid: true |
| `totpSecret` not selected by default (select: false) | ✅ Handled — `.select('+totpSecret')` used in `verifyEmployeeCode` |
| Missing `totpSecret` on employee | ✅ Handled — returns false |
| TOTP disabled employee trying to verify | ✅ Handled — `totpSecret` is undefined → returns false |
| Secret generation failure | ⚠️ Handled by otplib — would throw, caught by asyncHandler |
| Audit logging on enroll | ✅ `AuditService.log` called with `totp-enroll` action |
| Audit logging on disable | ✅ `AuditService.log` called with `totp-disable` action |
| Audit logging on verify | ❌ **NOT HANDLED** — no audit log on verify |
| Unauthenticated access | ✅ Blocked by `authenticate` middleware |
| Unauthorized access (non-admin calling enroll) | ✅ Blocked by `authorize('manage-employees')` |
| Concurrent enrollment requests | ⚠️ No atomicity — two simultaneous requests could both succeed, second overwrites first |
| Rate limiting / brute-force protection | ❌ **NOT HANDLED** — no rate limiting on any route |
| Empty body on enroll | ❌ **NOT HANDLED** — controller checks `if (!employeeId)` but `req.body` could have extra fields, no Zod coercion |

---

## Fixes Needed

| # | Issue | Severity | Fix Required |
|---|-------|----------|-------------|
| 1 | No Zod validation on any route | 🔴 | Create `totp.validation.ts` with schemas |
| 2 | Missing `totp.validation.ts` file | 🔴 | Create file with enroll/verify/disable schemas |
| 3 | Controller manual validation | 🔴 | Remove manual checks, use `validate()` middleware |
| 4 | Direct `generateSecret()` call (not via class) | 🟡 | Use `TOTPService.generateSecret()` |
| 5 | Duplicate `generateQRUrl` / `generateTOTPQRUrl` | 🟡 | Remove dead code, consolidate |
| 6 | No audit logging on verify | 🟡 | Add `AuditService.log` for verify attempts |
| 7 | No rate limiting on `/verify` | 🟡 | Add `express-rate-limit` |
| 8 | Secret exposed in API response | 🟡 | Remove secret from response |
| 9 | TOTP client service in wrong module | 🟡 | Move to `features/totp/services/` |
| 10 | No employee status check on enroll | 🟢 | Validate `employee.status === 'active'` |
| 11 | Re-enrollment silently overwrites | 🟢 | Add force-confirm or disable-first |
| 12 | `registeredDeviceId` not cleared on disable | 🟢 | Clear during disable |
| 13 | No `token` field validation | 🟢 | Add Zod regex for 6 digits |
| 14 | No JSDoc / silent catch | 🟢 | Add docs and log failures |
| 15 | `otpauth://` rendered directly as img src | 🟢 | Use QR rendering library |

---

## Summary

**TOTP Module** provides Time-based One-Time Password enrollment, verification, and disable functionality. The server-side routes have proper authentication and authorization middleware, but the module is notably **missing Zod validation schemas entirely** — the only module in the application with this gap. The controller compensates with manual validation that bypasses the standard pipeline.

**Key concerns:**
- **No validation schemas** — All three routes lack Zod middleware; this is inconsistent with the entire codebase.
- **No audit logging on verify** — Failed and successful TOTP verification attempts are invisible in audit logs.
- **No rate limiting** — The verify endpoint is vulnerable to brute-force attacks on the 6-digit TOTP code.
- **TOTP secret exposed in API response** — The plaintext seed is returned to the client, which is a security risk.
- **Client-side architectural issue** — TOTP service co-located in the QR module creates a messy dependency.
- **Dead code** — `generateTOTPQRUrl` is defined but never called.

**Overall rating: 4/10** — Functional but has significant gaps in validation, security hardening, and architectural cleanliness. Requires immediate attention on validation middleware and rate limiting.
