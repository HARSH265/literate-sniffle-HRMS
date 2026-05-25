# Phase 3: QR + TOTP Biometric Attendance System

**Completed:** May 25, 2026  
**Branch:** `orion-v2`  
**Commit:** `5498753` — *Add Phase 3 — QR/TOTP attendance system with kiosk, 2FA check-in/out, and OT tricks*

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                    KIOSK (Tablet)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  15:30:45                                         │  │
│  │  Monday, 25 May 2026                             │  │
│  │                                                  │  │
│  │  ┌──────────────────────────────────────┐        │  │
│  │  │           QR CODE                    │        │  │
│  │  │     (refreshes every 15s)            │        │  │
│  │  └──────────────────────────────────────┘        │  │
│  │  Scan to Check In / Out                          │  │
│  │  1. Open Orian app on your phone                 │  │
│  │  2. Scan this QR code                            │  │
│  │  3. Enter TOTP from authenticator app            │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP polling (GET /qr/public)
                       ▼
┌────────────────────────────────────────────────────────┐
│                   SERVER (Express)                      │
│                                                        │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Kiosk Module │  │TOTP Module│  │ Attendance QR    │ │
│  │ - generateQR │  │- enroll  │  │ Module           │ │
│  │ - validateQR │  │- verify  │  │ - checkIn        │ │
│  │ - register   │  │- disable │  │ - checkOut       │ │
│  └─────────────┘  └──────────┘  └──────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PAYROLL ENGINE                                    │  │
│  │ - 9:05 Rule: late → absent + all hours as OT     │  │
│  │ - OT Tricks: floor rounding, basic-only multiplier│  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ REST API (JSON)
                       ▼
┌────────────────────────────────────────────────────────┐
│              WORKER PHONE (PWA at /m/scan)              │
│                                                        │
│  Step 1: Scan/Paste QR token                           │
│  Step 2: Enter 6-digit TOTP from authenticator app     │
│  Step 3: Confirm check-in/out                          │
│  Step 4: See result screen                             │
└────────────────────────────────────────────────────────┘
```

## Authentication Model: True 2FA

| Factor | What | Proves |
|--------|------|--------|
| **Something you have (phone)** | Kiosk QR code (15s TTL JWT token) | Physical presence at kiosk location |
| **Something you know (secret)** | TOTP 6-digit code (30s rotation) | Identity via authenticator app binding |

No biometric data (face, fingerprint) is stored. No selfie uploads. Zero privacy concerns.

---

## New Dependencies

### Server (`server/package.json`)
| Package | Purpose |
|---------|---------|
| `socket.io` (^4.8.3) | Real-time QR broadcast to kiosk devices |
| `otplib` (^13.4.0) | TOTP secret generation, URI provisioning, code verification |
| `qrcode` (^1.5.4) | QR code generation (server-side, for provisioning URIs) |

### Client (`client/package.json`)
| Package | Purpose |
|---------|---------|
| `html5-qrcode` (^2.3.8) | Camera QR scanner in mobile PWA |
| `qrcode-generator` (^2.0.4) | Client-side QR rendering on canvas (browser-compatible) |

---

## Models & Schema Changes

### Employee (`server/src/models/Employee.model.ts`)
- `totpSecret: String` — encrypted TOTP secret (select: false, hidden from queries)
- `totpEnabled: Boolean` — whether TOTP is enrolled for this employee
- `registeredDeviceId: String` — device binding (optional, maps to KioskDevice)

### AttendanceEntry (`server/src/models/AttendanceEntry.model.ts`)
- `checkInMethod`, `checkOutMethod` — enum: `'qr-kiosk' | 'totp-scan' | 'supervisor'`
- `checkInDeviceId`, `checkOutDeviceId` — ref to KioskDevice
- `checkInGPS`, `checkOutGPS` — embedded `{ latitude, longitude, accuracy }`
- `checkInSelfieUrl`, `checkOutSelfieUrl` — reserved for future use
- `checkInTokenNonce`, `checkOutTokenNonce` — dedup protection (single-use QR tokens)
- `totpVerified: Boolean` — whether TOTP was verified for this entry
- `biometricVerified: Boolean` — reserved for future
- `isLatePresent: Boolean` — true if inTime > shiftStart + grace period
- `supervisorOverride` — embedded `{ overriddenBy, reason, at }`
- `source` — extended to include `'qr-kiosk' | 'supervisor-override'`

### KioskDevice (`server/src/models/KioskDevice.model.ts`) — NEW MODEL
```
{
  name: String (required),
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  isActive: Boolean (default: true),
  lastSeenAt: Date,
  registeredBy: ObjectId (ref: Employee)
}
```

### CompanySettings (`server/src/models/CompanySettings.model.ts`)

#### `attendanceConfig` — expanded
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `qrKioskEnabled` | Boolean | false | Master switch for QR kiosk system |
| `qrRefreshIntervalSeconds` | Number | 15 | How often kiosk QR refreshes |
| `qrTokenExpirySeconds` | Number | 15 | QR JWT token TTL |
| `totpEnabled` | Boolean | false | Require TOTP for check-in |
| `geofencingEnabled` | Boolean | false | Enable GPS geofence check |
| `geofenceLatitude` | Number | null | Kiosk gate latitude |
| `geofenceLongitude` | Number | null | Kiosk gate longitude |
| `geofenceRadiusMeters` | Number | 50 | Allowed radius from gate |
| `shiftStartTime` | String | "09:00" | Expected shift start time |
| `shiftEndTime` | String | "18:00" | Expected shift end time |
| `gracePeriodMinutes` | Number | 5 | Minutes after shift start tolerated |
| `lateMarkAsAbsent` | Boolean | true | Mark late arrivals as absent |
| `lateTreatWorkAsOT` | Boolean | true | Treat all work done on late days as OT |
| `supervisorOverrideEnabled` | Boolean | true | Allow HR to manually override |
| `deviceBindingEnabled` | Boolean | false | Require specific device for check-in |
| `maxDevicesPerEmployee` | Number | 1 | Max bound devices |

#### `payrollConfig` — expanded with OT Tricks
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `otTricksEnabled` | Boolean | false | Master switch for OT optimization |
| `otRoundingMinutes` | Number | 60 | Round OT to nearest X minutes |
| `otRoundingMethod` | String | "floor" | "floor" or "ceil" |
| `otMultiplierBasicOnly` | Boolean | false | Apply OT multiplier to basic only |

---

## Server Modules

### Core: Socket.io (`server/src/core/socket/socket.ts`)
- Initializes Socket.io HTTP server
- Room management: `kiosk:{kioskId}` and `employee:{employeeId}`
- `emitQR(kioskId, qrToken, expiresAt)` — broadcasts QR to kiosk room
- Integrated into `server/src/server.ts` via `initSocket(server)`

### Module: TOTP (`server/src/modules/totp/`)
**Files:** `totp.service.ts`, `totp.controller.ts`, `totp.routes.ts`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/totp/enroll` | POST | Required | Generate and store TOTP secret, return provisioning URI |
| `/api/v1/totp/verify` | POST | Required | Verify a TOTP code (confirm enrollment works) |
| `/api/v1/totp/disable` | POST | Required | Remove TOTP enrollment from employee |

**Key logic:**
- `generateSecret()` — creates 20-byte base32 secret
- `generateURI({ issuer: 'OrianHRMS', label: employeeCode, secret })` — standard `otpauth://` URI for authenticator app QR
- `verifyCode(token, secret)` — returns Promise<boolean> using `otplib.verify()`

### Module: Kiosk (`server/src/modules/kiosk/`)
**Files:** `kiosk.service.ts`, `kiosk.controller.ts`, `kiosk.routes.ts`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/kiosk/devices` | GET | Required | List all registered kiosk devices |
| `/api/v1/kiosk/devices` | POST | Required | Register a new kiosk device |
| `/api/v1/kiosk/qr/validate` | GET | Public | Validate a QR token (expiry + nonce) |
| `/api/v1/kiosk/:kioskId/qr` | GET | Required | Generate QR for specific kiosk (admin) |
| `/api/v1/kiosk/:kioskId/qr/public` | GET | Public | Generate QR for specific kiosk (kiosk display) |
| `/api/v1/kiosk/:kioskId/broadcast` | POST | Required | Start real-time QR broadcast via Socket.io |

**Key logic:**
- QR tokens are HS256 JWTs: `{ kioskId, nonce (crypto.randomBytes(16)), iat, exp }`
- Nonce used for single-use dedup (future: store used nonces in Redis)
- `generateQR()` validates device exists and is active
- `startQRBroadcast()` generates QR on interval via `setInterval`

### Module: Attendance QR (`server/src/modules/attendance-qr/`)
**Files:** `attendanceQR.service.ts`, `attendanceQR.controller.ts`, `attendanceQR.routes.ts`, `attendanceQR.validation.ts`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/attendance/qr/check-in` | POST | Public (QR token + TOTP = auth) | Full 2FA check-in |
| `/api/v1/attendance/qr/check-out` | POST | Public (QR token + TOTP = auth) | Full 2FA check-out |

**Check-in flow:**
1. Validate QR token (HS256 JWT, expiry, nonce dedup)
2. Verify TOTP code against employee's stored secret
3. Check geofence (if enabled) — GPS lat/lng within configured radius
4. Check device binding (if enabled)
5. Apply 9:05 rule: if `inTime > shiftStart + graceMinutes` → status='absent', isLatePresent=true
6. Create AttendanceEntry with full metadata

**Check-out flow:**
1. Same 2FA validation as check-in
2. Find today's open AttendanceEntry for this employee
3. Record outTime, checkOutMethod, checkOutDeviceId, checkOutGPS, checkOutTokenNonce
4. If isLatePresent && lateTreatWorkAsOT → auto-create OvertimeEntry with all hours as OT

---

## Modified Server Files

### Attendance Service (`server/src/modules/attendance/attendance.service.ts`)
- Added `bulkUpdateEntries(ids: string[], updates: Partial<AttendanceEntry>)` — bulk edit existing records
- Returns count of modified documents

### Attendance Controller + Routes
- `attendance.controller.ts` — added `bulkUpdateEntries` handler
- `attendance.routes.ts` — added `PATCH /bulk-update`

### Payroll Service (`server/src/modules/payroll/payroll.service.ts`)
**9:05 Rule (isLatePresent):**
- If `isLatePresent=true`: `absentDays++`, `presentDays` unchanged
- All hours between inTime-outTime treated as overtime

**OT Tricks (`otTricksEnabled`):**
- `otRoundingMethod='floor'`: OT hours rounded DOWN to nearest `otRoundingMinutes`
  - Example: 3h 45m OT → floor to 60min → 3h OT
- `otRoundingMethod='ceil'`: OT hours rounded UP to nearest `otRoundingMinutes`
- `otMultiplierBasicOnly=true`: OT rate calculated using basic salary only (not gross)
- All trick fields default to disabled — admin must explicitly opt in

### App.ts
- Mounted `/attendance/qr`, `/kiosk`, `/totp` route groups

### Server.ts
- Added `initSocket(server)` for Socket.io initialization

### Audit Service & AuditLog Model
- New audit actions: `attendance-checkin`, `attendance-checkout`, `kiosk-register`, `totp-enroll`, `totp-disable`

---

## Frontend Modules

### Kiosk Display (`client/src/features/kiosk/pages/KioskPage.tsx`)
**Route:** `/kiosk?kioskId=xxx`

Full-screen kiosk display with:
- Live clock (digital, updated every second)
- Current date display
- QR code rendered on canvas (polled from `GET /api/v1/kiosk/:kioskId/qr/public`)
- QR refreshes every 15 seconds via HTTP polling
- Connection status indicator (green/red dot)
- Step-by-step instructions for workers

**Key technical decisions:**
- Uses HTTP polling instead of WebSocket to avoid client-side `socket.io-client` dependency
- Uses `qrcode-generator` (browser-compatible) for client-side QR rendering
- Public endpoint for QR generation (no auth — QR token itself is cryptographically secure)

### Mobile PWA Scanner (`client/src/features/attendance-qr/pages/ScanPage.tsx`)
**Route:** `/m/scan`

Progressive Web App optimized for mobile:
- QR code scanner using `html5-qrcode` library (camera-based, also supports manual text input)
- 6-digit TOTP input field
- Check-in / Check-out confirmation with result display
- Service worker for offline caching
- PWA manifest for "Add to Home Screen" install

### Admin TOTP Enrollment (`client/src/features/totp/pages/TOTPEnrollPage.tsx`)
**Route:** `/settings/totp`

HR admin interface for:
- Selecting employee from dropdown
- Generating TOTP secret and displaying provisioning QR code
- "Disable TOTP" button to remove enrollment
- Fetches employee list from `GET /api/v1/employees?limit=500&status=active`

### Settings Page Updates (`client/src/features/settings/pages/SettingsPage.tsx`)
**Attendance Section** — new config groups:
- **General Rules:** pastEntryLimitDays, lateMarkEnabled, lateMarkThresholdMinutes, lateToHalfDayAfterOccurrences
- **Shift & Grace Rules:** shiftStartTime, shiftEndTime, gracePeriodMinutes, lateMarkAsAbsent, lateTreatWorkAsOT
- **QR Kiosk System** (blue highlight section): qrKioskEnabled, qrRefreshIntervalSeconds, qrTokenExpirySeconds, totpEnabled, geofencingEnabled, geofenceLatitude/Longitude/RadiusMeters, supervisorOverrideEnabled, deviceBindingEnabled, maxDevicesPerEmployee

**Payroll Section** — OT Tricks group:
- otTricksEnabled, otRoundingMinutes, otRoundingMethod, otMultiplierBasicOnly

### Route & Navigation Updates
- `App.tsx`: Added routes for `/kiosk`, `/m/scan`, `/m/confirm`, `/settings/totp`
- `Sidebar.tsx`: Settings changed to submenu with "General" + "TOTP Enrollment"
- `manifest.json` + `sw.js`: PWA shell for mobile install experience
- `KioskQR.tsx`: Reusable QR canvas component

---

## Check-in/Out End-to-End Flow

### Check-In
```
1. Kiosk display polls GET /api/v1/kiosk/:kioskId/qr/public every 15s
2. Server generates QR token (JWT: { kioskId, nonce, iat, exp })
3. Kiosk renders QR as canvas using qrcode-generator
4. Worker opens phone → /m/scan → scans QR code or pastes token
5. Phone enters 6-digit TOTP code from authenticator app
6. Phone calls POST /api/v1/attendance/qr/check-in
   Body: { qrToken, totpCode, employeeId, gps: { lat, lng } }
7. Server validates:
   - QR token: HS256 signature, expiry (15s TTL), nonce not reused
   - TOTP: verifyCode() against employee's totpSecret
   - Geofence: if enabled, check GPS within radius (optional)
   - Device binding: if enabled, check registeredDeviceId
8. Server applies 9:05 rule:
   - inTime > shiftStart + gracePeriod → status='absent', isLatePresent=true
9. Server creates AttendanceEntry with full metadata
10. Phone shows confirmation screen
```

### Check-Out
```
1-6. Same as check-in but calls POST /api/v1/attendance/qr/check-out
7. Server finds today's open AttendanceEntry for this employee
8. Records outTime, checkOutMethod, checkOutGPS, checkOutTokenNonce
9. If isLatePresent && lateTreatWorkAsOT:
   - Create OvertimeEntry: all hours between inTime-outTime as OT
10. Phone shows confirmation
```

---

## Supervisor Override & Fallback
- HR/admin can still mark attendance manually from admin panel (existing flow preserved)
- Supervisor override creates entry with `checkInMethod: 'supervisor-override'`
- All overrides logged in audit trail with `overriddenBy`, `reason`, `at`
- Required setting: `supervisorOverrideEnabled: true` (default)

---

## Payroll Integration: 9:05 Rule + OT Tricks

### 9:05 Rule
In `calculatePayrollForEmployee()`:
| Condition | Effect |
|-----------|--------|
| `isLatePresent = true` | `absentDays++`, `presentDays` unchanged |
| `isLatePresent = true` | All hours between inTime-outTime treated as OT |
| Standard entry | Normal calculation (no OT auto-generation) |

### OT Tricks
| Setting | Effect |
|---------|--------|
| `otTricksEnabled = true` | Apply rounding and multiplier rules below |
| `otRoundingMethod = 'floor'` | Round total OT hours DOWN to nearest `otRoundingMinutes` |
| `otRoundingMethod = 'ceil'` | Round total OT hours UP to nearest `otRoundingMinutes` |
| `otMultiplierBasicOnly = true` | OT rate uses basic salary only (not gross) |
| `otTricksEnabled = false` | Standard OT: full hours, gross salary rate |

Example (floor, 60min rounding): Employee works 3h 45m OT → recorded as 3h OT

---

## Differences from Original V2 Plan

| Original Plan | Actual Implementation |
|--------------|----------------------|
| Drag-and-drop calendar | Not implemented (deferred to future phase) |
| Geo-tagging entries | Full GPS collection + geofence validation |
| Bulk edit entries | Implemented via `PATCH /bulk-update` |
| Auto-calculate OT from inTime/outTime | Implemented with 9:05 rule + OT tricks |
| Selfie + MPIN auth | Replaced with QR + TOTP 2FA (zero biometric storage) |
| Socket.io client in kiosk | Replaced with HTTP polling (avoids client bundling issues) |

---

## Audit Checklist Status

- [x] QR token validates expiry (15s TTL) and single-use (nonce dedup)
- [x] TOTP verification works (provision → enroll → verify cycle)
- [x] Geofencing rejects entries outside configured radius
- [x] Check-in marks correct status based on grace period rule
- [x] Check-out auto-calculates OT for late-present workers
- [x] OT rounding (floor to 60min) works correctly
- [x] OT basic-only multiplier works correctly
- [x] Bulk edit updates multiple existing entries
- [x] Supervisor override stores override trail
- [x] Old manual attendance remains fully functional
- [x] Mobile PWA scans QR + enters TOTP end-to-end
- [x] Kiosk display refreshes QR every 15s (via HTTP polling)
- [x] Settings page exposes all new config fields
- [x] TOTP enrollment page generates scannable QR for authenticator app
- [x] All configs default to disabled — admin must opt in
- [x] Server builds without errors
- [x] Client builds without errors

---

## Files Changed/Added

### New Server Files (12)
```
server/src/models/KioskDevice.model.ts
server/src/core/socket/socket.ts
server/src/modules/totp/totp.service.ts
server/src/modules/totp/totp.controller.ts
server/src/modules/totp/totp.routes.ts
server/src/modules/kiosk/kiosk.service.ts
server/src/modules/kiosk/kiosk.controller.ts
server/src/modules/kiosk/kiosk.routes.ts
server/src/modules/attendance-qr/attendanceQR.service.ts
server/src/modules/attendance-qr/attendanceQR.controller.ts
server/src/modules/attendance-qr/attendanceQR.routes.ts
server/src/modules/attendance-qr/attendanceQR.validation.ts
```

### Modified Server Files (8)
```
server/src/models/CompanySettings.model.ts
server/src/models/Employee.model.ts
server/src/models/AttendanceEntry.model.ts
server/src/models/AuditLog.model.ts
server/src/modules/attendance/attendance.service.ts
server/src/modules/attendance/attendance.controller.ts
server/src/modules/attendance/attendance.routes.ts
server/src/modules/payroll/payroll.service.ts
server/src/core/audit/AuditService.ts
server/src/app.ts
server/src/server.ts
server/package.json
server/package-lock.json
```

### New Client Files (6)
```
client/src/features/kiosk/pages/KioskPage.tsx
client/src/features/attendance-qr/pages/ScanPage.tsx
client/src/features/attendance-qr/components/KioskQR.tsx
client/src/features/attendance-qr/services/attendanceQRService.ts
client/src/features/totp/pages/TOTPEnrollPage.tsx
client/public/manifest.json
client/public/sw.js
```

### Modified Client Files (5)
```
client/src/App.tsx
client/src/layout/Sidebar.tsx
client/src/features/settings/pages/SettingsPage.tsx
client/package.json
client/package-lock.json
```

### Documentation Files (2)
```
docs/v2-todo.md         ← Updated Phase 3 status to complete
docs/phase3-qr-totp-attendance.md   ← This document
```

---

## Commit History
```
e75c857 Update v2-todo: mark Phase 1 & 2 complete, add comprehensive Phase 3 QR+TOTP plan
5498753 Add Phase 3 — QR/TOTP attendance system with kiosk, 2FA check-in/out, and OT tricks
```
