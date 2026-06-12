# Statutory – End‑User Guide
---
## 1. Overview
The **Statutory** module tracks statutory contributions and compliance for employees, including Provident Fund (PF), Employee State Insurance (ESI), Professional Tax (PT), and Tax Deducted at Source (TDS). It integrates with payroll processing to automatically calculate contributions and generate filing reports.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View statutory summary / employee contributions | `view-statutory` |
| Manage statutory configuration (rates, thresholds) | `manage-statutory` |
| Export statutory filings | `view-reports` |

If you lack permission the UI hides the statutory pages and API calls return **403**.

## 3. Related Settings
- **statutoryConfig.pfEmployerRate** – Employer PF contribution %.
- **statutoryConfig.pfEmployeeRate** – Employee PF contribution %.
- **statutoryConfig.esiEmployerRate** / **esiEmployeeRate** – ESI percentages.
- **statutoryConfig.ptRate** – Professional Tax slab configuration.
- **statutoryConfig.tdsRate** – Income tax withholding rate.

These settings are edited via **Settings → Statutory**.

## 4. UI Pages & Workflow
- **Statutory Dashboard** (`/statutory`): Summary cards for total PF, ESI, PT contributions for the selected month, and compliance status.
- **Employee Contributions** (`/statutory/employee/:id`): View an individual employee’s statutory calculations, history, and downloadable challan PDFs.
- **Configuration** (`/settings/statutory`): Edit rates, thresholds, and generate statutory reports.
- **Export Filings** (`/statutory/export`): Generate CSV/Excel files for PF/ESI/TDS filing.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/statutory/summary` | Get overall statutory contribution summary | `view-statutory` |
| GET | `/statutory/employee/:id` | Get contributions for a specific employee | `view-statutory` |
| GET | `/statutory/config` | Retrieve current statutory configuration | `view-statutory` |
| PATCH | `/statutory/config` | Update configuration (rates, thresholds) | `manage-statutory` |
| GET | `/statutory/export` | Export filing data (CSV/Excel) | `view-reports` |

## 6. Edge Cases & Gotchas
- **Rate changes** – Changing a rate only affects future payroll runs; historical runs retain the rates at the time of processing.
- **Employee eligibility** – Some employees may be exempt from PF/ESI based on salary thresholds; the system respects those rules.
- **Audit trail** – All configuration changes are logged in the audit collection.

## 7. Quick Actions Summary
- **View Summary** → Statutory Dashboard.
- **Check Employee** → Search employee → view statutory details.
- **Update Rates** → Settings → Statutory → edit fields → **Save**.
- **Export Filings** → Export button → download CSV/Excel.

*Generated on **2026‑06‑12***