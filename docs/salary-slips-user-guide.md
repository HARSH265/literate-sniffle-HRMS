# Salary Slips – End‑User Guide
---
## 1. Overview
The **Salary Slips** module generates monthly salary slip PDFs for employees after payroll is finalized. Employees can preview and download their payslips from the ESS portal; HR and accounts staff can view and generate slips for all employees.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View salary slip list | `view-reports` |
| Preview a salary slip | `view-reports` |
| Download salary slip PDF | `view-reports` |

If you lack permission the Salary Slips page is hidden.

## 3. Related Settings
- **payrollConfig payslipTemplate** – PDF template used for salary slips.
- **payrollConfig.companyLogo** – Company logo displayed on slips.

## 4. UI Pages & Workflow
- **Salary Slips List** (`/salary-slips`): Table of generated slips with columns: Employee, Month, Gross Pay, Deductions, Net Pay, Status. Filters by month/year and employee.
- **Slip Preview** (`/salary-slips/:id/preview`): In‑browser preview of the salary slip PDF with earnings, deductions, and statutory contributions breakdown.
- **Download PDF** (`/salary-slips/:id/pdf`): Downloads the slip as a formatted PDF file.
- **ESS Payslips** (`/ess/payslips`): Employee‑facing view showing only their own slips with download buttons.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/salary-slips` | List salary slips (filter: `month`, `year`, `employeeId`) | `view-reports` |
| GET | `/salary-slips/:id/preview` | Preview slip data (JSON) | `view-reports` |
| GET | `/salary-slips/:id/pdf` | Download slip as PDF | `view-reports` |

## 6. Edge Cases & Gotchas
- **Rate limit** – PDF downloads are limited to 5 requests per minute per user.
- **Generation** – Slips are generated on‑demand from payroll data; there is no pre‑generated cache.
- **Unavailable slips** – If payroll for a given month has not been finalized, no slips are available for that month.

## 7. Quick Actions Summary
- **View Slips** → Salary Slips page → filter by month/employee.
- **Preview** → Click a slip row → preview opens in browser.
- **Download** → Click download icon → PDF saved locally.
- **ESS** → Employee portal → Payslips tab → download.

*Generated on **2026‑06‑12***