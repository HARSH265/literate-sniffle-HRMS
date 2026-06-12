# Attendance QR Scanning – End‑User Guide
---
## 1. Overview
The **Attendance QR** module enables employees to check in and check out by scanning a dynamically generated QR code displayed on a kiosk terminal or shared screen. It uses TOTP verification for added security and rate‑limits attempts to prevent brute‑force attacks.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| QR check‑in / check‑out | `check-in-out` |

If you lack permission the scan page is inaccessible and API calls return **403**.

## 3. Related Settings
- **attendanceConfig.qrKioskEnabled** – Master toggle to enable/disable QR scanning.
- **attendanceConfig.qrRefreshIntervalSeconds** – How often the QR code refreshes (default: 30s).
- **attendanceConfig.qrTokenExpirySeconds** – How long a QR token is valid (default: 60s).
- **attendanceConfig.totpEnabled** – Whether a TOTP code is required after scanning.
- **attendanceConfig.geofencingEnabled** – Enforce location‑based check‑in.
- **attendanceConfig.geofenceLatitude / geofenceLongitude / geofenceRadiusMeters** – Geofence parameters.

## 4. UI Pages & Workflow
- **Scan Page** (`/m/scan`): Opens the device camera. Point at the QR code displayed on the kiosk. After scanning:
  1. If TOTP is enabled, a 6‑digit code input appears.
  2. Optionally enter a device ID (for device binding).
  3. Choose **Check‑in** or **Check‑out**.
- **Confirm Page** (`/m/confirm`): After successful scan, shows confirmation with employee name, time, and status (present/late).
- **Kiosk Display** (`/kiosk`): Admin-managed page that continuously renders a refreshing QR code for employees to scan.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| POST | `/attendance/qr/check-in` | Check in via QR (payload: `token`, optional `totpCode`, `deviceId`) | `check-in-out` |
| POST | `/attendance/qr/check-out` | Check out via QR (payload: `token`, optional `totpCode`, `deviceId`) | `check-in-out` |

## 6. Edge Cases & Gotchas
- **Rate limiting** – QR check‑in/out is limited to 10 attempts per minute per IP to prevent TOTP brute‑force.
- **Token expiry** – If the QR code has expired (beyond `qrTokenExpirySeconds`), the scan is rejected and a new QR must be generated.
- **Geofencing** – When enabled, the device's GPS coordinates are validated against the configured geofence. Check‑in fails if outside the radius.
- **Device binding** – If `deviceBindingEnabled` is true, the first check‑in binds the employee to that device; subsequent check‑ins from a different device are rejected.
- **Night shifts** – Check‑in/out跨越 midnight is handled correctly; the system uses the employee's assigned shift to determine the correct date.

## 7. Quick Actions Summary
- **Check‑in** → Open `/m/scan` → scan QR → (enter TOTP if required) → **Check‑in**.
- **Check‑out** → Open `/m/scan` → scan QR → (enter TOTP if required) → **Check‑out**.
- **Kiosk Setup** → Admin → Kiosk → register device → display QR on screen.

*Generated on **2026‑06‑12***