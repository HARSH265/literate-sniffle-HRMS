# Overtime – End‑User Guide
---
## 1. Overview
The **Overtime** feature lets HR staff record, view, and manage overtime hours worked by employees. Overtime is calculated based on the **Overtime Rules** module, which defines multipliers, rounding, and eligibility.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View overtime entries list / details | `view-employees` |
| Add an overtime entry | `manage-overtime` |
| Edit / delete overtime entries | `manage-overtime` |
| View / manage overtime rules | `manage-overtime` |

If you lack a permission the UI hides the relevant buttons and the API returns **403 Unauthorized**.

## 3. Related Settings
- **payrollConfig.overtimeBase** – Determines whether overtime is calculated on basic salary only or includes allowances.
- **payrollConfig.overtimeMultiplier** – Global default multiplier if a rule does not specify one.
- **payrollConfig.otRoundingMethod** / `otRoundingMinutes` – Controls rounding of overtime hours.

## 4. UI Pages & Workflow
- **Overtime Entries** (`/overtime`): List with employee, date, hours, multiplier, and calculated amount. Actions: **Add**, **Edit**, **Delete**.
- **Add / Edit Overtime** (`/overtime/new` & `/overtime/:id/edit`): Form to select employee, date, hours, and optional rule override.
- **Overtime Rules** (`/overtime-rules`): Manage rule definitions (name, effective dates, multiplier, applicable shifts/departments).
- **Rule Detail** (`/overtime-rules/:id`): View rule summary and edit.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/overtime` | List overtime entries (filters: employee, date) | `view-employees` |
| POST | `/overtime` | Create a new overtime entry | `manage-overtime` |
| PATCH | `/overtime/:id` | Update an entry | `manage-overtime` |
| DELETE | `/overtime/:id` | Delete an entry | `manage-overtime` |
| GET | `/overtime-rules` | List overtime rules | `manage-overtime` |
| POST | `/overtime-rules` | Create a rule | `manage-overtime` |
| PATCH | `/overtime-rules/:id` | Update a rule | `manage-overtime` |
| DELETE | `/overtime-rules/:id` | Delete a rule | `manage-overtime` |

## 6. Edge Cases & Gotchas
- **Rule precedence** – When multiple rules apply, the system uses the most specific one (e.g., employee‑specific overrides department‑wide).
- **Rounding** – Hours are rounded according to `otRoundingMethod` (`floor`, `ceil`, `round`).
- **Eligibility** – If `payrollConfig.overtimeBase` is set to `basic`, overtime on allowance components is ignored.
- **Bulk import** – Overtime entries can be bulk‑imported via CSV; each row must pass the same validation as the UI.

## 7. Quick Actions Summary
- **Add Overtime** → **Overtime** tab → **Add** → fill form → **Save**.
- **Edit Overtime** → list → **Edit** (pencil) → modify → **Update**.
- **Delete Overtime** → list → **Delete** (trash) → confirm.
- **Manage Rules** → **Overtime Rules** tab → **Add Rule**, **Edit**, **Delete**.

*Generated on **2026‑06‑12***