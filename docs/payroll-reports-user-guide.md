# Payroll Reports – End‑User Guide
---
## 1. Overview
The **Payroll Reports** module provides pre‑built exportable reports for payroll data, including salary breakdowns, tax deductions, statutory contributions, and custom filters. These reports can be downloaded as Excel files or CSV for accounting and audit purposes.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View payroll reports page | `view-reports` |
| Export any payroll report | `view-reports` |
| Schedule automatic report exports | `manage-settings` |

If you lack permission, the Reports UI hides the Payroll tab and export actions.

## 3. Related Settings
- **reportsConfig.scheduledExportEnabled** – Enables automated payroll report generation.
- **reportsConfig.scheduledExportFrequency** – Determines how often payroll reports are generated (daily/weekly/monthly).
- **reportsConfig.scheduledExportRecipients** – Email addresses that receive the generated reports.

## 4. UI Pages & Workflow
- **Payroll Reports Tab** (within the main **Reports** page): Choose a report type (e.g., *Monthly Payroll*, *Tax Summary*, *PF Contributions*), set date range and filters, then click **Export**.
- **Scheduled Export Settings** (`/settings/reports`): Enable scheduling, set frequency, recipients, and select which payroll reports to include.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/reports/payroll` | Export payroll data for a given month/year (query params: `month`, `year`, optional filters) | `view-reports` |
| GET | `/reports/payroll/tax-summary` | Export tax deduction summary | `view-reports` |
| GET | `/reports/payroll/pf-summary` | Export Provident Fund contribution summary | `view-reports` |
| POST | `/reports/scheduled-export-config` | Save scheduled export configuration | `manage-settings` |
| GET | `/reports/scheduled-export-config` | Get current scheduled export configuration | `manage-settings` |

## 6. Edge Cases & Gotchas
- **Large date ranges** – Exporting many months may produce very large files; the UI warns and recommends narrowing the range.
- **Data privacy** – Exported files contain personal salary details; only users with `view-reports` should have access.
- **Schedule conflicts** – If multiple scheduled exports overlap, the system queues them to avoid duplicate emails.

## 7. Quick Actions Summary
- **Export Payroll** → Reports → Payroll tab → set filters → **Export**.
- **Schedule Payroll Export** → Settings → Reports → enable → configure recipients and frequency → **Save**.

*Generated on **2026‑06‑12***