# Compliance – End‑User Guide
---
## 1. Overview
The **Compliance** module aggregates statutory and internal compliance data (PF, ESI, TDS, PT, etc.) and produces summary reports, gap analyses, and audit logs. It is primarily used by HR administrators and accountants to ensure legal obligations are met.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View compliance summary | `view-payroll` |
| Run a compliance check for a specific run | `view-payroll` |
| View detailed compliance report for a run | `view-payroll` |
| Generate gap‑report | `view-payroll` |
| View compliance configuration audit log | `view-payroll` |

If you lack permission the UI elements are hidden and API calls return **403 Unauthorized**.

## 3. Related Settings
No dedicated settings; the module reads from **CompanySettings.payrollConfig** and other statutory configurations.

## 4. UI Pages & Workflow
- **Compliance Summary** (`/compliance/summary`): Shows overall compliance status, missing filings, and upcoming deadlines.
- **Run Check** (`/compliance/runs/:runId/check`): Triggers a live verification of a payroll run against statutory rules.
- **Run Summary** (`/compliance/runs/:runId/summary`): Detailed view of compliance checks for a specific payroll run.
- **Gap Report** (`/compliance/runs/:runId/gap-report`): Lists items that are out of compliance, with suggested actions.
- **Audit Log** (`/compliance/audit-log`): Chronological log of configuration changes affecting compliance calculations.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/compliance/summary` | Retrieve high‑level compliance overview | `view-payroll` |
| GET | `/compliance/runs/:runId/check` | Execute a compliance check for a payroll run | `view-payroll` |
| GET | `/compliance/runs/:runId/summary` | Get detailed compliance results for a run | `view-payroll` |
| GET | `/compliance/runs/:runId/gap-report` | Generate a gap report highlighting issues | `view-payroll` |
| GET | `/compliance/audit-log` | View audit log of compliance‑related config changes | `view-payroll` |

## 6. Edge Cases & Gotchas
- **Rate limiting** – the endpoint is limited to 30 requests per 15 minutes per user.
- **Stale data** – compliance results are cached for 5 minutes; re‑run the check for the latest data.
- **Permissions** – the module re‑uses payroll permissions; ensure users with `view-payroll` also have the necessary statutory knowledge.

## 7. Quick Actions Summary
- **View Summary** → `/compliance/summary`.
- **Run Check** → click **Run Check** on a payroll run → view results.
- **Generate Gap Report** → from run summary → **Generate Gap**.
- **Audit Log** → `/compliance/audit-log`.

*Generated on **2026‑06‑12***