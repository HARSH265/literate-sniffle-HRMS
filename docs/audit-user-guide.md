# Audit – End‑User Guide
---
## 1. Overview
The **Audit** module records immutable logs of critical system actions: user logins, data changes, permission edits, payroll runs, and configuration updates. Auditors can query, filter, and export logs for compliance and forensic analysis.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View audit logs | `view-audit` |
| Export audit logs | `view-audit` |
| Manage audit retention settings | `manage-audit` |

If you lack permission, the Audit page is hidden and API calls return **403**.

## 3. Related Settings
- **auditConfig.retentionDays** – Number of days audit entries are kept before auto‑deletion.
- **auditConfig.maxLogSizeMb** – Maximum size of the audit log collection.

These are edited in **Settings → Audit**.

## 4. UI Pages & Workflow
- **Audit Log List** (`/audit-logs`): Table with columns: Timestamp, User, Action, Entity, Details, IP address. Filters for date range, user, action type.
- **Export Logs**: Button to download CSV/Excel of filtered results.
- **Retention Settings** (`/settings/audit`): Adjust retention period and archiving options.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/audit` | Query audit entries with filters (date, user, action) | `view-audit` |
| GET | `/audit/export` | Export audit entries (CSV/Excel) | `view-audit` |
| PATCH | `/audit/config` | Update audit retention settings | `manage-audit` |

## 6. Edge Cases & Gotchas
- **Performance** – Large audits can be paginated; avoid requesting massive date ranges without pagination.
- **Immutable** – Audit entries cannot be edited or deleted manually; only retention policies control deletion.
- **Sensitive data** – Audit logs may contain personal identifiers; restrict access to trusted roles.

## 7. Quick Actions Summary
- **Search Logs** → Audit page → set filters → **Search**.
- **Export** → after filtering → **Export** button → download file.
- **Configure Retention** → Settings → Audit → adjust days → **Save**.

*Generated on **2026‑06‑12***