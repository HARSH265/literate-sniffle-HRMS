# API Keys – End‑User Guide
---
## 1. Overview
API keys provide programmatic access to HRMS APIs for integrations, bots, or third‑party services. Keys can be created, listed, rotated, and revoked.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| List API keys | `manage-api-keys` |
| Create a new API key | `manage-api-keys` |
| Revoke / delete a key | `manage-api-keys` |
| View usage / audit | `view-audit` |

If you lack permission the UI hides actions and the API returns **403 Unauthorized**.

## 3. Related Settings
No dedicated settings; keys are stored securely in Vault.

## 4. UI Pages & Workflow
- **API Keys List** (`/settings/api-keys`): shows key name, created date, last used, status. Buttons: **Create**, **Revoke**.
- **Create Key Modal**: name, optional description, optional scopes (list of permission strings). Returns the secret token shown only once.
- **Key Details**: displays partial key, usage stats, revoke button.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/api-keys` | List all keys | `manage-api-keys` |
| POST | `/api-keys` | Create a new key | `manage-api-keys` |
| DELETE | `/api-keys/:id` | Revoke/delete key | `manage-api-keys` |

## 6. Edge Cases & Gotchas
- The secret is shown only once; store it securely.
- Revoked keys cannot be used; existing sessions may remain active until their token expires.
- Rate‑limit on creation to prevent abuse.

## 7. Quick Actions Summary
- **Create Key** → List → **Create** → fill form → **Create**.
- **Revoke Key** → List → **Revoke** button → confirm.
- **View Usage** → List → click key → see stats.

*Generated on **2026‑06‑12***