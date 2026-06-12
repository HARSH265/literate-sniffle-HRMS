# Departments – End‑User Guide

---

## 1. Overview
The **Departments** module lets you define and manage organizational units such as Production, HR, Finance, etc. Each department has a name, optional code, description, and status (active/archived). Employees are assigned to a department, which is used for reporting, permissions, and payroll.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View list / details | `view-departments` |
| Add, edit, delete, restore, generate next code | `manage-departments` |

If you lack a permission, the related UI buttons are hidden and API calls will return **403 Unauthorized**.

---

## 3. Related Settings
The Departments module reads the following **CompanySettings** fields:
- **departmentCodeConfig.prefix** – Prefix used when auto‑generating department codes (e.g., `DEPT`).
- **departmentCodeConfig.startNumber** – Starting numeric value for the first generated code.
- **departmentCodeConfig.padding** – Number of digits to pad the numeric part (e.g., `001`).
- **departmentCodeConfig.isAutoGenerate** – When `true` (default), the department code field is auto‑filled and disabled in the UI. If set to `false`, users must manually enter a unique code.

These settings are editable under **Settings → Department Code**. Changing them affects only newly created departments.

---

## 4. UI Pages & Workflow

### 4.1 Department List (`/departments`)
- **Search** – Type any part of the department name or code and press **Enter**.
- **Filters** – Status filter (active / archived).
- **Columns** – Name, Code, Description, Status, Actions.
- **Row actions**
  - **View** (eye) → Department Detail page.
  - **Edit** (pencil) → Edit form.
  - **Delete** (trash) → Archive after confirmation.
- **Toolbar** (top‑right)
  - **Add Department** – Opens the create form.
  - **Export** – Downloads the current list as an Excel file.

### 4.2 Add Department (`/departments/new`)
- **Fields**
  - **Department Name** (required).
  - **Department Code** – If auto‑generation is enabled, this field shows the next code and is read‑only. Otherwise, you must provide a unique code (uppercase letters/digits).
  - **Description** – Optional free‑text.
  - **Status** – Defaults to **active**.
- **Create** – Click **Create Department**; on success you return to the list with a toast.

### 4.3 Edit Department (`/departments/:id/edit`)
- Form pre‑filled with existing data.
- **Code** can be edited only if it does not clash with another department and auto‑generation is disabled.
- **Status** dropdown (`active` / `archived`).
- **Save** – Updates the record and redirects to the detail view.

### 4.4 Department Detail (`/departments/:id`)
- Header shows **Name**, **Code**, and a status badge.
- **Description** displayed if provided.
- **Actions** – Edit (top‑right) and **Restore** (if archived).

### 4.5 Restore Archived Department
- Archived rows show a **Restore** button (visible only to `manage-departments`).
- Restores the department to **active** status.

## 5. Data Import / Export
- **Export** – Click **Export** on the list page; file named `departments_YYYY‑MM‑DD.xlsx`.
- **Import** – Not exposed in the UI for departments (can be added via API if required).

## 6. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/departments` | List departments (supports pagination, search, status filter) | `view-departments` |
| GET | `/departments/:id` | Get department details | `view-departments` |
| POST | `/departments` | Create a new department | `manage-departments` |
| PATCH | `/departments/:id` | Update a department | `manage-departments` |
| DELETE | `/departments/:id` | Archive (soft‑delete) a department | `manage-departments` |
| POST | `/departments/:id/restore` | Restore an archived department | `manage-departments` |
| GET | `/departments/export` | Export list to Excel | `view-departments` |
| GET | `/departments/next-code` | Get next auto‑generated department code | `manage-departments` |

## 7. Edge Cases & Gotchas
1. **Unique Code** – Must be unique across all departments; duplicate attempts return a validation error.
2. **Auto‑generation disabled** – If `departmentCodeConfig.isAutoGenerate` is `false`, you must manually enter a unique code; otherwise the system will generate one automatically.
3. **Delete Guard** – A department cannot be deleted while employees are assigned to it. Reassign those employees first, then you can archive the department.
4. **Soft Delete** – Archiving only changes the `isActive` flag; the record stays for audit and can be restored later.
5. **Cache** – The department list is cached for the first page; any create, update, or delete invalidates the cache.

## 8. FAQ
| Question | Answer |
|----------|--------|
| *How do I know the next department code?* | The UI displays the next code automatically when creating a department if auto‑generation is enabled. You can also call the **Next Code** API.
| *Can I change a department’s code after creation?* | Yes, if auto‑generation is disabled. The system checks for uniqueness before saving.
| *Why can’t I delete a department?* | Because one or more employees are still assigned to it. Use **Bulk Assign Shift** or the employee edit form to move them to another department.
| *Where are department codes stored?* | In the `code` field of the `Department` collection in MongoDB.
| *Who can restore an archived department?* | Users with the `manage-departments` permission.

## 9. Quick Actions Summary
- **Add** → `+ Add Department` → fill form → **Create**.
- **Edit** → eye → **Edit** → modify → **Save**.
- **Archive** → trash → confirm → status becomes *archived*.
- **Restore** → archived row → **Restore** button → status becomes *active*.
- **Export** → toolbar → **Export** → download Excel.

---

*Generated on **2026‑06‑11***