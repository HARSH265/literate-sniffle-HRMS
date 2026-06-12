# Payroll – End‑User Guide
---

## 1. Overview
The **Payroll** module enables HR administrators and accounting staff to process monthly payroll runs, preview calculations, submit runs for approval, approve/reject, finalize, un‑finalize (within a configurable window), and delete draft runs. Payroll calculations pull data from **Attendance**, **Leave**, **Overtime**, and the **CompanySettings.payrollConfig** configuration.

---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View payroll runs list / individual run details | `view-payroll` |
| Run a new payroll, preview a payroll, create supplementary payroll | `process-payroll` |
| Submit a draft run for approval | `process-payroll` |
| Approve / reject a submitted run | `process-payroll` |
| Finalize an approved run | `process-payroll` |
| Un‑finalize a finalized run (within un‑finalize window) | `process-payroll` |
| Delete a draft run | `process-payroll` |
| View payroll configuration (read‑only) | `view-payroll` |

If you lack a permission, the corresponding UI buttons are hidden and API calls will return **403 Unauthorized**.

---
## 3. Related Settings
Payroll calculations read the following **CompanySettings.payrollConfig** fields (editable via **Settings → Payroll**):
- **payrollConfig.overtimeBase** – `basic` or `basicPlusAllowances` – determines whether overtime is calculated on basic salary only or on basic + allowances.
- **payrollConfig.overtimeMultiplier** – Multiplier applied to overtime hours (default 2.0).
- **payrollConfig.halfDayDeductionPercent** – Percentage deducted for a half‑day.
- **payrollConfig.lateDeductionPerDay** – Fixed amount deducted for each day an employee is late.
- **payrollConfig.paidWeeklyOff** – Whether weekly‑off days are paid.
- **payrollConfig.paidHolidays** – Whether statutory holidays are paid.
- **payrollConfig.defaultWorkingDays** – Baseline working days per month used for LOP calculations.
- **payrollConfig.standardHoursPerDay** – Standard daily work hours (default 8).
- **payrollConfig.payrollLockDays** – Number of days after month‑end during which a run cannot be edited.
- **payrollConfig.unfinalizeWindowDays** – Days after finalization during which a run can be un‑finalized.
- **payrollConfig.otTricksEnabled** – Enables custom overtime rounding tricks.
- **payrollConfig.otRoundingMinutes** – Rounding granularity for overtime (e.g., 60 min).
- **payrollConfig.otRoundingMethod** – Rounding method: `floor`, `ceil`, or `round`.
- **payrollConfig.otMultiplierBasicOnly** – Apply overtime multiplier only on basic salary.
- **payrollConfig.perDayCalcMethod** – Basis for per‑day salary (`30`, `actual`, `26`).
- **payrollConfig.lopCalcMethod** – Basis for loss‑of‑pay calculation (`30`, `actual`, `26`).
- **payrollConfig.roundingFinalSalary** – Rounding of final net salary (`floor`, `ceil`, `nearest`).
- **payrollConfig.roundingPrecision** – Number of decimal places for rounding.
- **payrollConfig.negativeNetPayAllow** – Whether a negative net‑pay is permitted.
- **payrollConfig.arrearsAutoCalculate** – Auto‑calculate arrears when a run is processed.
- **payrollConfig.multiBankSplit** – Split salary across multiple bank accounts.
- **payrollConfig.makerCheckerEnabled** – Enforce maker‑checker workflow for payroll runs.
- **payrollConfig.lopPerDayBase** – Basis for LOP per‑day amount.
- **payrollConfig.lopComponentsAffected** – Salary components affected by LOP (e.g., `basic`, `hra`).
- **payrollConfig.lopImpactsPf / lopImpactsEsi / lopImpactsBonus** – Whether LOP reduces PF, ESI, and bonus calculations.
- **payrollConfig.lopAutoFromAttendance** – Auto‑create LOP entries from attendance data.
- **payrollConfig.lopReversalAllowed** – Whether LOP can be reversed.
- **payrollConfig.lopReversalDeadline** – Deadline for LOP reversal (`next-month` or `2-months`).
- **payrollConfig.minimumWage** – Minimum wage floor used when calculating basic earnings.

---
## 4. UI Pages & Workflow
### 4.1 Payroll List (`/payroll`)
- **Table columns** – Month, Status, Employees, Total Net Pay, Actions.
- **Run Payroll** button (visible to users with `process-payroll`). Opens the **Run Payroll** modal.
- **Preview** button (visible to `process-payroll`). Opens the **Payroll Preview** modal.
- **Row actions** (vary by status and permissions):
  - **View** – Opens the run detail page (`/payroll/:id`).
  - **Submit** – Draft → Submitted (requires `process-payroll`).
  - **Approve / Reject** – Submitted → Approved / Rejected (requires `process-payroll`).
  - **Finalize** – Approved → Finalized (requires `process-payroll`).
  - **Un‑finalize** – Finalized → Draft (available while the un‑finalize window is open; tooltip explains lock status). Disabled when the window has expired.
  - **Delete** – Remove a *draft* run permanently (requires `process-payroll`).

### 4.2 Run Payroll (modal)
1. Click **Run Payroll** → modal opens.
2. Choose a month via the **MonthPicker**.
3. Click **Process Payroll**.
4. Server creates a new payroll run, calculates earnings from attendance, overtime, allowances, deductions, and leaves, then returns the new run ID.
5. UI automatically redirects to the run’s detail page and shows a success toast.

### 4.3 Payroll Preview (modal)
1. Click **Preview** → modal opens.
2. Select a month.
3. Click **Generate Preview**.
4. The modal displays a *what‑if* summary: total employees, estimated net pay, gross pay, deductions, and a table of the first 10 payroll items (basic, allowances, OT, deductions, net). No data is persisted.

### 4.4 Run Details (`/payroll/:id`)
- Shows month, status, lock dates, un‑finalize window, total figures, and a detailed table of payroll items (basic earnings, allowances total, overtime amount, total deductions, net pay).
- Action buttons appear according to the current status and the user’s `process-payroll` permission:
  - **Submit**, **Approve**, **Reject**, **Finalize**, **Un‑finalize**, **Delete**.
- When a run is *finalized*, a tooltip on the **Un‑finalize** button indicates the remaining days in the un‑finalize window or explains that the window has expired.

### 4.5 Supplementary Payroll
- Accessed via the **Run Payroll** modal’s *Supplementary* option (if the feature flag `payrollConfig` permits).
- Provide month, year, list of employee IDs, and a reason. The server creates a separate payroll run containing only the specified employees.

---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/payroll/runs` | List payroll runs (paginated) | `view-payroll` |
| POST | `/payroll/run` | Process a new payroll run for a month | `process-payroll` |
| POST | `/payroll/preview` | Generate a preview (what‑if) for a month | `process-payroll` |
| POST | `/payroll/supplementary` | Create a supplementary payroll run for selected employees | `process-payroll` |
| GET | `/payroll/run/:id` | Retrieve details of a specific payroll run | `view-payroll` |
| POST | `/payroll/run/:id/submit` | Submit a draft run for approval | `process-payroll` |
| POST | `/payroll/run/:id/approve` | Approve a submitted run | `process-payroll` |
| POST | `/payroll/run/:id/reject` | Reject a submitted run (returns to draft) | `process-payroll` |
| POST | `/payroll/run/:id/finalize` | Finalize an approved run (locks it) | `process-payroll` |
| POST | `/payroll/run/:id/unfinalize` | Un‑finalize a finalized run within the allowed window | `process-payroll` |
| DELETE | `/payroll/run/:id` | Delete a draft run | `process-payroll` |
| GET | `/payroll/:employeeId` | Fetch payroll history for a specific employee (restricted to own record unless admin) | `view-payroll` |

---
## 6. Quick Actions Summary
- **Run Payroll** → select month → **Process Payroll** → redirects to run details.
- **Preview Payroll** → select month → **Generate Preview** → view estimated totals.
- **Submit** → draft run → **Submit** button → status becomes *submitted*.
- **Approve / Reject** → submitted run → click **Approve** or **Reject**.
- **Finalize** → approved run → click **Finalize** (locks the run).
- **Un‑finalize** → finalized run (within window) → click **Un‑finalize**, provide reason.
- **Delete** → draft run → click **Delete** (confirm).
- **Supplementary Payroll** → run modal → provide employee list and reason → creates a separate run.

---
*Generated on **2026‑06‑11***