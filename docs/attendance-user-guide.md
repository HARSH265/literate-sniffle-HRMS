# Attendance – End‑User Guide
---

## 1. Overview
The **Attendance** module lets HR staff and administrators record, view, and manage daily employee attendance. It supports manual entry, bulk updates, monthly summary views, admin‑forced check‑outs, and QR‑code based check‑in/out for on‑site terminals.

---

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View attendance list / daily records / monthly view | `view‑attendance` |
| Mark attendance (single day bulk entry) | `manage‑attendance` |
| Update / bulk‑update existing records | `manage‑attendance` |
| Delete attendance entry | `manage‑attendance` |
| Admin checkout (force out‑time) | `manage‑attendance` |
| QR check‑in / check‑out (kiosk) | `check‑in‑out` |

If you lack a permission, the related UI buttons are hidden and API calls will return **403 Unauthorized**.

---

## 3. Related Settings
The Attendance workflow reads the following **CompanySettings** fields (editable via **Settings → Attendance**):
- **attendanceConfig.pastEntryLimitDays** – How many past days can be edited manually (default 7).
- **attendanceConfig.lateMarkEnabled** – Enable late‑arrival detection.
- **attendanceConfig.lateMarkThresholdMinutes** – Minutes after shift start that count as late.
- **attendanceConfig.lateToHalfDayAfterOccurrences** – Convert to half‑day after N late instances.
- **attendanceConfig.shiftStartTime / shiftEndTime** – Default shift boundaries used for late calculations.
- **attendanceConfig.gracePeriodMinutes** – Grace period before a late is recorded.
- **attendanceConfig.lateMarkAsAbsent** – Treat late as absent instead of present.
- **attendanceConfig.lateTreatWorkAsOT** – Count late work time as overtime.
- **attendanceConfig.autoCheckoutEnabled** – Auto‑checkout at shift end + overtime.
- **attendanceConfig.autoCheckoutGraceMinutes** – Extra minutes after overtime before auto‑checkout.
- **attendanceConfig.breakMinutes** – Standard break duration deducted from work time.
- **attendanceConfig.breakDeductionThresholdMinutes** – Minimum work minutes before break is deducted.
- **attendanceConfig.qrKioskEnabled** – Enable QR‑code kiosk check‑in/out.
- **attendanceConfig.qrRefreshIntervalSeconds** – QR token refresh interval.
- **attendanceConfig.qrTokenExpirySeconds** – QR token validity period.
- **attendanceConfig.totpEnabled** – Require TOTP code for QR check‑in/out.
- **attendanceConfig.geofencingEnabled** – Enforce location‑based check‑in.
- **attendanceConfig.geofenceLatitude / geofenceLongitude / geofenceRadiusMeters** – Geofence parameters.
- **attendanceConfig.supervisorOverrideEnabled** – Allow supervisors to force checkout.
- **attendanceConfig.deviceBindingEnabled** – Bind a device ID to a QR check‑in.
- **attendanceConfig.maxDevicesPerEmployee** – Maximum devices an employee may use.

---

## 4. UI Pages & Workflow
### 4.1 Attendance page (`/attendance`)
The main page contains three tabs:

- **Mark Attendance** – Select a date, click **Mark Attendance** to open a bulk entry modal. For each active employee you can set status (Present, Absent, Half‑Day, Leave, Weekly‑Off, Holiday), optional in/out times, and remarks. Click **Save Attendance** to bulk‑create or update records.
- **Records** – Paginated table of existing attendance entries. Supports date and department filters, column sorting, and row‑level actions:
  - **Force Checkout** – For entries without an out‑time, click the logout icon to open a modal, provide a reason, and force a checkout (admin only).
  - Bulk Update – Select **Bulk Update** to edit status/in/out times for multiple rows at once.
- **Monthly View** – Calendar‑style view showing each employee’s daily status for the selected month. Department filter applies to the view.

All tabs respect the permissions above; missing permissions hide the corresponding tab or buttons.

### 4.2 QR Check‑in/out (`/m/scan` & `/m/confirm`)
If **attendanceConfig.qrKioskEnabled** is true, staff can use a mobile device or kiosk to scan a QR token:
1. Open the scan page (e.g., `https://hrms.example.com/m/scan`).
2. Camera activates; point at the QR code displayed on the kiosk.
3. After scanning, optionally enter a TOTP code (if enabled) and an optional device ID.
4. Choose **Check‑in** or **Check‑out**. The system records the entry, applies late rules, and shows a confirmation screen.

### 4.3 Admin Checkout (Force Checkout)
From the **Records** tab, click the **Force Checkout** (logout) icon on a row without an out‑time. In the modal:
- Select the employee, review the in‑time, and type a reason.
- Submit to set an out‑time equal to the current server time, log the action, and recalculate total/OT hours.

---

## 5. Quick Actions Summary
- **Mark Attendance** → select date → **Mark Attendance** button → fill bulk form → **Save Attendance**.
- **View / Filter Records** → department filter → pagination.
- **Force Checkout** → logout icon on a row → provide reason → **Checkout**.
- **Bulk Update** → **Bulk Update** button → edit selected rows → **Update Selected**.
- **Monthly View** → select month → optional department filter.
- **QR Scan** → open `/m/scan` → scan code → (optional TOTP) → **Check‑in** / **Check‑out**.

---

*Generated on **2026‑06‑11***