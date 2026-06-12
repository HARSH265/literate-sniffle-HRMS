# Tax – End‑User Guide
---
## 1. Overview
The **Tax** module handles income‑tax calculations (TDS), tax slabs, exemptions, and generation of tax‑related reports for employees. It works together with the Payroll module to deduct the correct amount each month and produce annual tax certificates.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View tax summary / employee tax details | `view-payroll` |
| Configure tax slabs and exemptions | `manage-payroll` |
| Export tax reports | `view-reports` |

If you lack the required permission, the UI hides tax configuration sections and API returns **403**.

## 3. Related Settings
- **taxConfig.slabs** – Array of income‑range objects with percent rates.
- **taxConfig.exemptions** – Fixed exemption amount per employee.
- **taxConfig.financialYearStartMonth** – Determines the fiscal year for tax calculations.
- **taxConfig.tdsRate** – Default TDS percentage used when no slab matches.

These settings are edited in **Settings → Tax**.

## 4. UI Pages & Workflow
- **Tax Dashboard** (`/tax`): Overview of total TDS collected, pending tax filings, and upcoming deadlines.
- **Employee Tax Details** (`/tax/employee/:id`): Shows taxable income, calculated TDS, exemptions applied, and downloadable Form 16/16A.
- **Tax Settings** (`/settings/tax`): Manage tax slabs, exemptions, and fiscal year.
- **Export Tax Report** (`/tax/export`): Generate CSV/Excel of TDS deductions for a given period.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/tax/summary` | Get overall tax collection summary | `view-payroll` |
| GET | `/tax/employee/:id` | Get tax details for an employee | `view-payroll` |
| PATCH | `/tax/config` | Update tax configuration | `manage-payroll` |
| GET | `/tax/export` | Export tax report (CSV/Excel) | `view-reports` |

## 6. Edge Cases & Gotchas
- **Retroactive changes** – Updating slabs affects future payroll runs only; past TDS records stay unchanged.
- **Partial year employees** – Pro‑rated tax calculations are applied based on the employee’s joining date.
- **Multiple exemptions** – Custom exemptions per employee can be added via the employee edit form (requires `manage-employees`).

## 7. Quick Actions Summary
- **View Summary** → Tax Dashboard.
- **Check Employee Tax** → Search employee → view tax details.
- **Configure Slabs** → Settings → Tax → edit → **Save**.
- **Export Report** → Tax page → **Export** → download file.

*Generated on **2026‑06‑12***