# Kiosk – End‑User Guide
---
## 1. Overview
The **Kiosk** module provides on‑site QR‑code terminals for shop‑floor employees to record attendance (check‑in / check‑out) without using a personal device. Kiosks run a lightweight web app that displays a QR scanner and a simple status panel.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View kiosk dashboard (admin) | `manage-attendance` |
| Configure kiosk settings | `manage-attendance` |
| Operate kiosk (employee) | `check-in-out` |

If you lack permission, the kiosk admin UI is hidden; employees can still scan QR codes on the terminal.

## 3. Related Settings
Kiosk behavior reads **CompanySettings.attendanceConfig** fields:
- `qrKioskEnabled` – Enable/disable kiosk use.
- `qrRefreshIntervalSeconds` – How often the QR token refreshes.
- `qrTokenExpirySeconds` – Validity period of a QR token.
- `totpEnabled` – Whether TOTP verification is required at the kiosk.

## 4. UI Pages & Workflow
- **Kiosk Admin** (`/kiosk`): List of deployed kiosks, status (online/offline), and configuration (device name, location, network settings).
- **Device Settings** (`/kiosk/:id`): Edit kiosk name, assign to a physical location, toggle `qrKioskEnabled`.
- **Kiosk Terminal** (accessed via dedicated hardware URL, e.g., `http://kiosk.local`): Displays a continuously refreshing QR code. Employees scan it with their mobile app to log attendance.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/kiosk` | List all kiosks | `manage-attendance` |
| POST | `/kiosk` | Register a new kiosk device | `manage-attendance` |
| PATCH | `/kiosk/:id` | Update kiosk configuration | `manage-attendance` |
| DELETE | `/kiosk/:id` | Decommission a kiosk | `manage-attendance` |
| GET | `/kiosk/:id/status` | Retrieve current status (online/offline, last heartbeat) | `manage-attendance` |

## 6. Edge Cases & Gotchas
- **Network loss** – If the kiosk cannot reach the backend, it queues scans locally and syncs when connectivity returns.
- **QR expiration** – Ensure the device clock is accurate; otherwise tokens may appear invalid.
- **TOTP** – When enabled, the employee must enter a 6‑digit code after scanning the QR.

## 7. Quick Actions Summary
- **Add Kiosk** → Admin → **Add Kiosk** → fill device info → **Create**.
- **Edit Kiosk** → list → **Edit** → change settings → **Save**.
- **Delete Kiosk** → list → **Delete** → confirm.
- **Monitor Status** → kiosk list shows online/offline badge.

*Generated on **2026‑06‑12***