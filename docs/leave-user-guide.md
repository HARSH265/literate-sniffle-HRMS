# Leave – End‑User Guide
---

## 1. Overview
The **Leave** module lets employees apply for leave, managers approve or reject applications, and HR staff track leave balances and accruals. It integrates with the Attendance module (for LOP calculations) and the Payroll module (to deduct leave‑taken wages).

---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View leave types / balances / calendar | `view-leave` |
| Apply for leave (create application) | `manage-leave-applications` |
| Cancel own leave application (if allowed) | `manage-leave-applications` |
| Approve / reject leave applications | `approve-leave` |
| Bulk accrue leave balances (admin) | `manage-leave-types` |
| Create / update / delete leave types | `manage-leave-types` |

If you lack a permission, the related UI buttons or pages are hidden and API calls will return **403 Unauthorized**.

---
## 3. Related Settings
Leave calculations read the following **CompanySettings.leaveConfig** fields (editable via **Settings → Leave**):
- **leaveConfig.financialYearStartMonth** – Month (1‑12) when the financial year begins; used for annual accrual resets.
- **leaveConfig.accrualDayOfMonth** – Day of the month when leave balances are automatically accrued.
- **leaveConfig.defaultApprovalLevels** – Number of approval tiers required for a leave request.
- **leaveConfig.allowCancelAfterApproval** – Whether employees can cancel a leave after it has been approved.
- **leaveConfig.cancelAfterApprovalDaysLimit** – If cancellations after approval are allowed, the maximum number of days after approval the request can be cancelled.
- **leaveConfig.deductionPriority** – Order in which deductions are applied (`unpaid-first` or `pro-rata`).
- **leaveConfig.allowanceProRateMode** – How allowances are prorated when leave is taken (`none`, `days`, `calendar`).
- **leaveConfig.deductionProRateMode** – How deductions are prorated (`none`, `days`, `calendar`).

---
## 4. UI Pages & Workflow
### 4.1 Leave Applications (`/leave/applications`)
- **Table** lists all leave applications (filterable by status). Columns show employee, leave type, dates, days, reason, status, and applied date.
- **Actions** – Pending applications have a **Cancel** button (if allowed). Managers see no action column here.
- **Apply Leave** – Click the **Apply Leave** button → modal opens.
  1. Select employee (admin only) or defaults to self.
  2. Choose a leave type (only active types are shown).
  3. Pick a start/end date range.
  4. Provide a reason (min 10 chars).
  5. Submit → application is created with status **pending**.
- **Cancel Application** – For your own pending request, click **Cancel**, confirm in the modal; the status becomes **cancelled**.

### 4.2 Leave Approvals (`/leave/approvals`)
- **Pending Approvals** table shows all applications that require your review.
- **Approve** – Click **Approve**, optional remarks, confirm. Status changes to **approved** and the leave balance is deducted.
- **Reject** – Click **Reject**, mandatory remarks, confirm. Status changes to **rejected**.
- **Statistics** – Top cards display counts of pending, approved, rejected, and total applications.
- **All Applications** – Below the pending list, a full table of every leave application is displayed for reference.

### 4.3 Leave Balances (`/leave/balances`)
- Select an employee from the dropdown and optionally a year.
- The table lists each leave type with:
  - **Entitled** – Total days allocated for the selected year.
  - **Carry Forward** – Days carried over from the previous year.
  - **Used** – Days already taken.
  - **Pending** – Days in pending applications.
  - **Available Balance** – Calculated as *Entitled + Carry Forward – Used – Pending*; displayed with a progress bar (percentage of entitlement).
- If no employee is selected, a prompt asks you to select one.

### 4.4 Leave Calendar (API only)
- `GET /leave/calendar` returns a calendar of public holidays and company‑wide leave days. The UI (e.g., date pickers) consumes this to block unavailable dates.

---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/leave/types` | List all leave types | `view-leave` |
| POST | `/leave/types` | Create a new leave type | `manage-leave-types` |
| PATCH | `/leave/types/:id` | Update a leave type | `manage-leave-types` |
| DELETE | `/leave/types/:id` | Delete a leave type | `manage-leave-types` |
| GET | `/leave/applications` | List leave applications (with filters) | `view-leave` |
| POST | `/leave/applications` | Submit a new leave application | `manage-leave-applications` |
| POST | `/leave/applications/:id/cancel` | Cancel a pending application | `manage-leave-applications` |
| POST | `/leave/applications/approve` | Approve or reject an application (payload includes `status` and optional `remarks`) | `approve-leave` |
| GET | `/leave/balances/:employeeId` | Get leave balances for an employee (optional `year` query) | `view-leave` |
| POST | `/leave/balance/accrue` | Bulk accrue leave balances (admin) | `manage-leave-types` |
| GET | `/leave/calendar` | Retrieve holiday / company‑wide leave calendar | `view-leave` |
| GET | `/leave/summary` | Get aggregated leave statistics for reporting | `view-reports` |

---
## 6. Quick Actions Summary
- **Apply Leave** → button → fill modal → **Submit**.
- **Cancel My Application** → **Cancel** button on pending row → confirm.
- **Approve / Reject** → open pending approvals → click **Approve** or **Reject**, add optional remarks → confirm.
- **View Balances** → select employee → view entitlement, used, pending, and available balance.
- **Check Calendar** → UI date pickers automatically block dates based on `/leave/calendar`.

---
*Generated on **2026‑06‑11***