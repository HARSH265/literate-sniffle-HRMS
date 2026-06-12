# Settings – End‑User Guide
---
## 1. Overview
The **Settings** section centralises configuration of the entire HRMS platform, including authentication, payroll, statutory, notifications, reports, and UI preferences. Changes are stored in Vault (secrets) or in the `CompanySettings` document and take effect immediately for most modules.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View any settings page | `view-settings` |
| Modify settings (save changes) | `manage-settings` |

If you lack `manage-settings`, the UI renders fields as read‑only and the **Save** button is disabled.

## 3. Settings Sections
- **Authentication** – Token expiry, password policy, TOTP toggle.
- **Payroll** – Overtime multiplier, minimum wage, rounding, lock days.
- **Statutory** – PF/ESI/PT rates, tax slabs.
- **Leave** – Accrual rules, approval workflow.
- **Attendance** – Late‑mark thresholds, QR kiosk enable, geofencing.
- **Notifications** – Email/SMS templates, push notification toggles.
- **Reports** – Scheduled export configuration, default formats.
- **Audit** – Retention days, max log size.
- **Component Master** – UI component definitions (advanced users).
- **API Keys** – Create and manage programmatic access tokens.

Each section has a dedicated page under `/settings/<section>`.

## 4. UI Pages & Workflow
- **Settings Home** (`/settings`): Grid of cards linking to each configuration category.
- **Section Page**: Form fields grouped logically; some fields have tooltips explaining their impact.
- **Save Flow**: Clicking **Save** sends a PATCH request to `/settings/<section>`; on success a toast appears and dependent services are refreshed.
- **Reset to Defaults**: Some sections expose a **Reset** button that restores factory defaults (requires confirmation).

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/settings/:section` | Retrieve current configuration for a section | `view-settings` |
| PATCH | `/settings/:section` | Update configuration fields (partial) | `manage-settings` |
| POST | `/settings/api-keys` | Create a new API key (if exposed) | `manage-settings` |
| DELETE | `/settings/api-keys/:id` | Delete an API key | `manage-settings` |

## 6. Edge Cases & Gotchas
- **Vault secrets** – Changing secrets (e.g., SMTP credentials) may require a service restart for the changes to take effect.
- **Inter‑module dependencies** – Some settings (e.g., `payrollConfig.overtimeMultiplier`) influence multiple modules; inform users of downstream impacts.
- **Validation** – The backend validates each field (e.g., number ranges, email formats). Errors are displayed inline in the UI.
- **Versioning** – Settings changes are logged in the Audit service.

## 7. Quick Actions Summary
- **Edit Section** → Settings → select section → modify fields → **Save**.
- **Create API Key** → Settings → API Keys → **Create** → copy secret.
- **Reset Section** → Settings → section → **Reset to defaults** → confirm.
- **View Audit** → Settings → **Audit** tab → review change history.

*Generated on **2026‑06‑12***