# Employee Self‑Service (ESS) – End‑User Guide
---
## 1. Overview
The **ESS** portal provides employees with a personal dashboard to view and manage their own data: profile, documents, attendance, leave requests, payslips, shift‑swap preferences, and training. It offers a mobile‑friendly UI and integrates with the core HRMS backend.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| Access ESS dashboard | `view-announcements` (implicitly granted to all logged‑in users) |
| View / edit own profile | `view-own-profile` / `update-own-profile` |
| Upload / view own documents | `view-documents` (employees) |
| Record QR check‑in/out | `check-in-out` |
| Submit leave application | `manage-leave-applications` |
| View own payslips | `view-payroll` |
| Participate in shift swaps (request) | `request-shift-swap` |
| View training enrollment | `view-own-training` / `enroll-training` |

If the user lacks any of these, the corresponding UI sections are hidden.

## 3. Related Settings
ESS respects the same `CompanySettings` as the back‑office modules (attendanceConfig, payrollConfig, etc.). No dedicated ESS settings exist.

## 4. UI Pages & Workflow
- **Dashboard** (`/ess`): Overview cards for announcements, upcoming holidays, leave balance, pending approvals, and quick actions.
- **Profile** (`/ess/profile`): View and edit personal details, change password, and update contact information.
- **Documents** (`/ess/documents`): List of personal documents (Aadhaar, PAN, certificates). Upload, view, download, delete.
- **Attendance** (`/ess/attendance`): QR code scanner for check‑in/out, attendance calendar view.
- **Leave** (`/ess/leave`): Apply for leave, view leave balance, cancel pending requests.
- **Payslips** (`/ess/payslips`): List of monthly payslips with download PDF.
- **Shift Swaps** (`/ess/shift-swaps`): View preferred shifts, request a swap, accept/reject incoming swap requests.
- **Training** (`/ess/training`): View enrolled courses, progress, and certificates.

## 5. API Reference (for troubleshooting)
Most ESS endpoints are proxies to the core modules (e.g., `/ess/attendance` → `/api/v1/attendance/...`). Permissions are enforced at the core level.

## 6. Edge Cases & Gotchas
- **Offline QR** – If the device is offline, QR scanning falls back to a cached token that syncs when back online.
- **Document size** – Upload limits follow `documentConfig.maxFileSizeMb`.
- **Leave cancellation** – May be disallowed after the `leaveConfig.allowCancelAfterApproval` window.
- **Shift‑swap limits** – Users can have at most one pending swap request at a time.

## 7. Quick Actions Summary
- **Check‑in** → Scan QR → system records time.
- **Apply Leave** → **Leave** tab → **Apply** → fill form → submit.
- **Upload Document** → **Documents** → **Add Document** → select file → upload.
- **View Payslip** → **Payslips** → select month → download PDF.
- **Request Shift Swap** → **Shift Swaps** → select preferred shift → submit request.

*Generated on **2026‑06‑12***