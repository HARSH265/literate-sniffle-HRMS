# Loans – End‑User Guide
---
## 1. Overview
The **Loans** module lets employees apply for salary advances or loans, managers approve them, and finance disburse and track repayments. Loan EMIs are automatically deducted from salary during payroll processing.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View loan list / details / summary | `view-loans` |
| Create / edit / delete loan types | `manage-loans` |
| Apply for a loan | `apply-loan` |
| Approve / reject loan applications | `manage-loans` |
| Disburse approved loans | `manage-loans` |
| Cancel own pending loan | `apply-loan` |

If you lack permission the UI hides the corresponding buttons and API calls return **403**.

## 3. Related Settings
- **loanConfig.interestRate** – Default annual interest rate for loans.
- **loanConfig.maxLoanAmount** – Maximum loan amount allowed.
- **loanConfig.repaymentPeriodMonths** – Default repayment period.
- **loanConfig.autoDeductFromPayroll** – Whether EMI is auto‑deducted during payroll.

## 4. UI Pages & Workflow
- **Loan Types** (`/loans/types`): List of available loan products (e.g., Emergency, Advance, Festival). Admin can add/edit/delete types.
- **Apply for Loan** (`/loans/apply`): Form to select loan type, amount, reason, repayment period. Submits for approval.
- **Loan List** (`/loans`): All loans with status (Pending, Approved, Disbursed, Repaid, Cancelled). Filters by status and employee.
- **Loan Detail** (`/loans/:id`): Shows loan info, repayment schedule, EMI breakdown, and status history.
- **Employee Loan Summary** (`/loans/employee/:id/summary`): Overview of active loans, total outstanding, and EMI deductions for a specific employee.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/loans/loan-types` | List loan types | `view-loans` |
| POST | `/loans/loan-types` | Create a loan type | `manage-loans` |
| PATCH | `/loans/loan-types/:id` | Update a loan type | `manage-loans` |
| DELETE | `/loans/loan-types/:id` | Delete a loan type | `manage-loans` |
| POST | `/loans/apply` | Apply for a loan | `apply-loan` |
| GET | `/loans` | List all loans | `view-loans` |
| GET | `/loans/:id` | Get loan details | `view-loans` |
| PATCH | `/loans/:id/approve` | Approve a loan | `manage-loans` |
| PATCH | `/loans/:id/disburse` | Disburse an approved loan | `manage-loans` |
| PATCH | `/loans/:id/cancel` | Cancel a pending loan | `apply-loan` |
| GET | `/loans/employee/:employeeId/summary` | Get employee loan summary | `view-loans` |

## 6. Edge Cases & Gotchas
- **Max amount** – Applications exceeding `loanConfig.maxLoanAmount` are rejected at the API level.
- **Auto‑EMI** – When `autoDeductFromPayroll` is true, the payroll engine automatically deducts the monthly EMI from the employee's salary.
- **Repayment schedule** – Generated at disbursement time; early repayments do not auto‑recalculate the schedule.
- **Cancellation** – Only pending loans can be cancelled by the applicant.

## 7. Quick Actions Summary
- **Apply** → Loans → **Apply** → select type & amount → **Submit**.
- **Approve** → Manager view → pending loan → **Approve** with remarks.
- **Disburse** → Admin → approved loan → **Disburse** → confirm.
- **View Summary** → Employee → **Loan Summary** → outstanding balance & schedule.

*Generated on **2026‑06‑12***