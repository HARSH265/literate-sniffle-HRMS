# Assets – End‑User Guide
---
## 1. Overview
The **Assets** module lets HR staff, administrators, and managers track, allocate, maintain, and retire company‑owned assets such as laptops, monitors, mobile phones, tools, uniforms, vehicles, etc. It provides a searchable list, detailed view, bulk allocation, status‑based actions, and a history timeline for audit.
---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View asset list / details / statistics | `view‑assets` |
| Create, edit, delete assets | `manage‑assets` |
| Allocate an asset to an employee | `manage‑assets` |
| Return an allocated asset | `manage‑assets` |
| Mark asset as under maintenance | `manage‑assets` |
| Retire an asset | `manage‑assets` |

If you lack a permission, the related UI buttons are hidden and API calls return **403 Unauthorized**.
---
## 3. Related Settings
The Assets workflow reads the following **CompanySettings** fields (editable via **Settings → Assets**):
- **assetConfig.assetManagementEnabled** – Enable/disable the entire assets feature.
- **assetConfig.autoGenerateAssetCode** – Auto‑generate a sequential asset code (fallback to serial number).
- **assetConfig.assetCodePrefix** – Prefix for generated asset codes (default `AST`).
- **assetConfig.assetCodePadding** – Zero‑padding length for generated codes.
- **assetConfig.allowMultipleAllocation** – Allow more than one employee to be assigned the same asset.
- **assetConfig.maintenanceReminderDays** – Days before a maintenance reminder is shown.
- **assetConfig.categories** – List of allowed asset categories (e.g., Laptop, Monitor, Vehicle).
- **assetConfig.conditions** – List of allowed condition labels (e.g., New, Good, Fair, Damaged).
---
## 4. UI Pages & Workflow
### 4.1 Asset List (`/assets`)
- **Stats cards** – Total assets, Available, Allocated, Maintenance.
- **Table columns** – Asset Code (clickable → detail), Name, Category, Status badge, Assigned To, Condition.
- **Filters** – Status (Available, Allocated, Maintenance, Retired) and Category dropdown.
- **Search** – Free‑text search across name, code, and serial number.
- **Toolbar actions** (visible only with `manage‑assets`): Add Asset, Bulk Allocate.
- **Row actions** (visible with permission): Allocate, Return, Maintenance, Retire (buttons on the detail page).

### 4.2 Add / Edit Asset (`/assets/new` & `/assets/:id/edit`)
- Sections: Asset Information, Identification & Tracking, Purchase Details, Additional Notes.
- Key fields: Asset Name (required), Category (required), Brand, Model, Serial Number, Condition, Location, Purchase Date, Purchase Price, Description, Notes.
- Auto‑generated asset code appears automatically unless disabled.
- Save → creates asset with status `available`.

### 4.3 Asset Detail (`/assets/:id`)
- Header shows Name, Asset Code, and Status badge.
- Descriptions list all fields (category, serial, brand, model, condition, location, purchase info, assigned employee, notes).
- Actions (permission‑gated): Edit, Allocate (when available), Return (when allocated), Maintenance (when not retired/maintenance), Retire (when not retired).
- History timeline shows allocation, return, maintenance, retire events.

### 4.4 Bulk Allocate Modal (from list)
- Multi‑select of available assets (code + name) and an employee picker.
- Optional notes field.
- Submits each asset via `/assets/:id/allocate`; success toast shows count.
---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/assets` | List assets with pagination, filters (`status`, `category`, `search`) | `view‑assets` |
| GET | `/assets/stats` | Summary statistics (total, by status, by category) | `view‑assets` |
| GET | `/assets/employee/:employeeId` | Assets currently allocated to a specific employee | `view‑assets` |
| GET | `/assets/:id` | Get asset details (populated `assignedTo` and `createdBy`) | `view‑assets` |
| GET | `/assets/:id/history` | Asset history timeline | `view‑assets` |
| POST | `/assets` | Create a new asset | `manage‑assets` |
| PATCH | `/assets/:id` | Update asset fields | `manage‑assets` |
| POST | `/assets/:id/allocate` | Allocate asset to an employee (optional notes) | `manage‑assets` |
| POST | `/assets/:id/return` | Return an allocated asset, optionally update condition and notes | `manage‑assets` |
| POST | `/assets/:id/maintenance` | Mark asset as under maintenance (optional notes) | `manage‑assets` |
| POST | `/assets/:id/retire` | Retire asset permanently (optional notes) | `manage‑assets` |
---
## 6. Edge Cases & Gotchas
1. **Asset code generation** – If `autoGenerateAssetCode` is disabled you must provide either a serial number or a custom asset code. Duplicate serial numbers are rejected.
2. **Allocation rules** – When `allowMultipleAllocation` is false, an asset already allocated cannot be allocated again until it is returned.
3. **Retiring an allocated asset** – The system automatically clears the assignment before marking the asset as retired.
4. **Maintenance vs. Allocation** – Marking an asset as maintenance removes any current allocation (if allocated) but preserves history.
5. **Bulk allocate** – Only assets with status `available` appear in the bulk selector; the modal requires at least one asset and an employee.
6. **Permissions** – UI elements (Add, Edit, Allocate, Return, Maintenance, Retire) are hidden if the user lacks `manage‑assets`. The list view requires `view‑assets`.
---
## 7. Quick Actions Summary
- **Create Asset** → `/assets/new` → fill form → **Create Asset**.
- **Edit Asset** → click asset code → **Edit** → modify → **Update Asset**.
- **Allocate** → list → **Bulk Allocate** (multi‑select) OR detail → **Allocate** button → choose employee → **Allocate**.
- **Return** → detail → **Return** button → set condition/notes → **Return**.
- **Maintenance** → detail → **Maintenance** button → optional notes → **Mark Maintenance**.
- **Retire** → detail → **Retire** button → confirm → **Retire**.
- **Filter / Search** → status or category dropdown, search bar → table updates.
- **View History** → detail page → scroll to **History** timeline.
---
*Generated on **2026‑06‑12***