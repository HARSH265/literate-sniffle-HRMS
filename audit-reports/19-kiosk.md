# Audit Report: Kiosk Module

**Date:** May 25, 2026
**Files audited:** 6 (3 server, 2 client, 1 model)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | /api/v1/kiosk/devices | ``authenticate`` | ``manage-attendance`` | **none** |
| POST | /api/v1/kiosk/devices | ``authenticate`` | ``manage-attendance`` | **none** |
| GET | /api/v1/kiosk/qr/validate | **none** | **none** | **none** |
| GET | /api/v1/kiosk/:kioskId/qr/public | **none** | **none** | **none** |
| GET | /api/v1/kiosk/:kioskId/qr | ``authenticate`` | ``manage-attendance`` | **none** |
| POST | /api/v1/kiosk/:kioskId/broadcast | ``authenticate`` | ``manage-attendance`` | **none** |

**Notes:**
- Routes are mounted at /api/v1/kiosk (registered in server/src/app.ts line 115).
- No validation schemas exist -- no kiosk.validation.ts file.
- No PATCH or DELETE route for updating/deactivating devices, despite the model having an isActive field.
- No route to fetch a single device by ID.

---

## Issues Found

### Critical

#### 1. Zero request validation across all routes
The kiosk module has **no Zod/validation middleware** on any route. Every other audited module (departments, shifts, attendance) uses the validate() middleware with a schema. The POST /devices route accepts raw req.body and relies solely on Mongoose schema required: true -- which produces a **500 Internal Server Error** instead of a proper 400 Bad Request on malformed input.

**Fixes needed:**
- Create server/src/modules/kiosk/kiosk.validation.ts with registerDeviceSchema (name, lat, lng required; address optional).
- Apply validate(registerDeviceSchema) on POST /devices.
- Consider adding kioskId param validation for /:kioskId routes.
- **Not applied.**

---

### Medium

#### 2. GET /qr/validate -- no auth on token validation endpoint
The validate endpoint is completely unauthenticated. While it must be accessible to the mobile app, there is no rate limiting, origin restriction, or IP throttling. An attacker could probe valid tokens.

**Fixes needed:**
- Add rate limiting middleware.
- Add request logging for failed validation attempts.
- At minimum document why auth is intentionally absent.
- **Not applied.**

#### 3. GET /:kioskId/qr/public -- no auth on QR generation endpoint
Generates a signed QR token for any valid kiosk ID with zero authentication or rate limiting. An attacker who knows a valid kiosk device ID can generate unlimited tokens.

**Fixes needed:**
- Add rate limiting per IP.
- Add request logging for public QR generation.
- Consider nonce tracking to detect token replay.
- **Not applied.**

#### 4. startQRBroadcast leaks setInterval -- no cleanup
Each call to POST /:kioskId/broadcast creates a new setInterval(generateAndEmit, refreshInterval) that is never cleared. Multiple calls for the same kiosk create duplicate broadcast loops, each independently emitting QR tokens.

**Fixes needed:**
- Store interval references in a Map<kioskId, NodeJS.Timeout>.
- Clear existing interval before creating a new one for the same kiosk.
- **Not applied.**

#### 5. No PATCH or DELETE routes for device management
The KioskDevice model has isActive and registeredBy, but there is no API route to update a device properties or deactivate it. Administrative workflows require direct DB access.

**Fixes needed:**
- Add PATCH /devices/:kioskId with updateDeviceSchema.
- Add DELETE /devices/:kioskId (or soft-deactivate via PATCH).
- **Not applied.**

#### 6. Missing updatedBy on model
The KioskDevice model has registeredBy (equivalent of createdBy) but no updatedBy field. If device update routes are added, there is no field to track the modifier.

**Fixes needed:**
- Add updatedBy: { type: Schema.Types.ObjectId, ref: "User" } to the schema.
- Set it in any future update service method.
- **Not applied.**

#### 7. QR_SECRET fallback resets on every server restart
If the QR_SECRET env var is not set, crypto.randomBytes(64).toString("hex") generates a new secret on every restart, invalidating all previously issued unexpired QR tokens.

**Fixes needed:**
- Log a warning when falling back to a random secret.
- Document that QR_SECRET must be set in production.
- **Not applied.**

---

### Minor

#### 8. listDevices returns raw Mongoose documents without population
KioskDevice.find({}).lean() returns the raw registeredBy ObjectId. If exposed to the client, this leaks internal MongoDB references.

**Fixes needed:**
- Omit registeredBy from the response or populate it with user name/email.
- **Not applied.**

#### 9. Redundant expiry check in validateQRToken
validateQRToken manually checks payload.exp < Math.floor(Date.now() / 1000) after jwt.verify(). JWT verification already validates expiration. The manual check is dead code.

**Fixes needed:**
- Remove the redundant manual expiry check.
- **Not applied.**

#### 10. Client hardcodes main-gate as default kiosk ID
KioskPage.tsx line 47 defaults to main-gate if no kioskId query param is provided. If no device named main-gate exists, the UI shows "Disconnected" permanently without a clear error.

**Fixes needed:**
- Show an error state on the UI when fetchQR returns null after the first attempt.
- Remove the hard-coded fallback so a missing query param is handled explicitly.
- **Not applied.**

#### 11. Duplicate device names not prevented
No unique index on name in the model and no service-layer check. Multiple devices can share the same name.

**Fixes needed:**
- Add a unique index on the name field.
- Add duplicate-name checking in registerDevice.
- **Not applied.**

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Non-existent kiosk ID (findById fails) | Handled -- 404 |
| Inactive kiosk device | Handled -- 400 |
| Expired QR token (JWT exp) | Handled -- 401 |
| Invalid/malformed QR token | Handled -- 401 |
| Missing token query param | Handled -- 400 |
| Missing QR_SECRET env var | Falls back to random -- tokens invalidated on restart |
| Duplicate device name registration | **Not handled** |
| Invalid lat/lng (out of range) | **Not handled** -- Mongoose only, yields 500 |
| Empty name on registration | **Not handled** -- Mongoose only, yields 500 |
| Double startBroadcast for same kiosk | **Not handled** -- creates duplicate intervals |
| Socket.io not initialized | Silently swallowed (if (io) guard) |
| Concurrent QR generation | Handled -- JWT is stateless |
| Client before WebSocket is ready | HTTP poll fallback mitigates this |
| Device deleted between requests | Handled -- 404 before token creation |

---

## Fix Items Summary

All fix items remain **Not applied**.

| # | Issue | Severity | Fix Required |
|---|-------|----------|-------------|
| 1 | Zero validation on all routes | Critical | Create kiosk.validation.ts, apply validate() middleware |
| 2 | /qr/validate no auth/rate-limit | Medium | Add rate limiting + logging |
| 3 | /qr/public no auth/rate-limit | Medium | Add rate limiting + logging |
| 4 | setInterval leak in broadcast | Medium | Track intervals per kiosk, clear on duplicate |
| 5 | No PATCH/DELETE routes | Medium | Add device update and deactivation endpoints |
| 6 | Missing updatedBy field | Medium | Add to model schema |
| 7 | QR_SECRET volatile fallback | Medium | Warn + document requirement |
| 8 | Raw ObjectId leak in list | Minor | Omit or populate registeredBy |
| 9 | Redundant JWT expiry check | Minor | Remove dead code |
| 10 | Hard-coded main-gate fallback | Minor | Add error state UI |
| 11 | Duplicate device names | Minor | Add unique index + service check |
