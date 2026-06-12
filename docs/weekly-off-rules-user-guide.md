# Weekly Off Rules – End‑User Guide
---
## 1. Overview
The **Weekly Off Rules** module defines the default weekly off days (e.g., Saturday, Sunday) and any special overrides for particular departments or shifts. The rules are used by the Attendance engine to mark days as non‑working and to calculate overtime.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View weekly‑off rules | `view-departments` |
| Create / edit / delete rules | `manage-departments` |

If you lack permission the UI hides the Weekly Off Rules page and API returns **403**.

## 3. Related Settings
No dedicated `CompanySettings` fields; the rules are stored in the `weeklyOffRules` collection.

## 4. UI Pages & Workflow
- **Weekly Off Rules List** (`/weekly-off-rules`): Table displaying rule name, applicable departments/shifts, off‑day pattern (e.g., every Sunday), and active status.
- **Create / Edit Rule** (`/weekly-off-rules/new` & `/weekly-off-rules/:id/edit`): Form to select off‑day(s), start/end dates, and optionally limit to specific departments or shifts.
- **Apply Rules**: The system automatically applies active rules when calculating attendance; no manual trigger needed.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/weekly-off-rules` | List all weekly‑off rules | `view-departments` |
| POST | `/weekly-off-rules` | Create a new rule | `manage-departments` |
| GET | `/weekly-off-rules/:id` | Get rule details | `view-departments` |
| PATCH | `/weekly-off-rules/:id` | Update rule | `manage-departments` |
| DELETE | `/weekly-off-rules/:id` | Delete rule | `manage-departments` |

## 6. Edge Cases & Gotchas
- **Overrides** – More specific rules (e.g., department‑level) take precedence over global rules.
- **Future dates** – Rules can be scheduled to become active on a future date; the UI shows a preview of upcoming changes.
- **Conflict detection** – The system warns if a new rule overlaps with an existing rule for the same department/shift.

## 7. Quick Actions Summary
- **Add Rule** → Weekly Off Rules → **Add Rule** button → configure → **Create**.
- **Edit Rule** → list → **Edit** (pencil) → modify → **Save**.
- **Delete Rule** → list → **Delete** (trash) → confirm.

*Generated on **2026‑06‑12***