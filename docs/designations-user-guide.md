# Designations – End‑User Guide

---

## 1. Overview
The **Designations** module lets you manage job titles and hierarchical levels used when assigning employees to roles. You can view, create, edit, archive, and restore designations.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View list / details | `view-designations` |
| Add, edit, delete, restore | `manage-designations` |

If you lack a permission, the related UI buttons or pages are hidden and any API call will return **403 Unauthorized**.

---

## 3. Related Settings
This module does not currently depend on any configurable settings in **CompanySettings**. All behavior is static.

---

## 3. UI Pages & Workflow

### 3.1 Designation List (`/designations`)
- **Search** – type any part of the designation name and press **Enter**.
- **Filters** – status filter (active / archived).
- **Columns** – Name, Code (optional), Department (if linked), Status, Actions.
- **Row actions**
  - **View** (eye) → Designation Detail.
  - **Edit** (pencil) → Edit form.
  - **Delete** (trash) → Archive after confirmation.
- **Toolbar** (top‑right)
  - **Add Designation** – opens the create form.
  - **Export** – downloads the current list as an Excel file.

### 3.2 Add Designation (`/designations/new`)
- **Fields**
  - **Designation Name** (required)
  - **Designation Code** (optional, unique)
  - **Department** – optional association to a department.
  - **Status** – defaults to **active**.
- **Create** – click **Create Designation**; on success you return to the list with a toast.

### 3.3 Edit Designation (`/designations/:id/edit`)
- Form pre‑filled with existing data.
- **Code** can be edited only if not already used elsewhere (validation will warn).
- **Status** dropdown (`active` / `archived`).
- **Save** – updates the record and redirects to the detail view.

### 3.4 Designation Detail (`/designations/:id`)
- Header shows **Name** and **Code**, with a status tag.
- **Department** displayed (if linked).
- **Actions** – Edit (top‑right) and **Restore** (if archived).

### 3.5 Restore Archived Designation
- Archived rows show a **Restore** button (visible only to users with `manage-designations`).
- Restores the designation to **active** status.

## 4. Data Import / Export
- **Export** – click **Export** on the list page; file named `designations_YYYY‑MM‑DD.xlsx`.
- **Import** – not exposed in the UI for designations (can be added via API if needed).

## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/designations` | List designations (supports pagination, search, status filter) | `view-designations` |
| GET | `/designations/:id` | Get designation details | `view-designations` |
| POST | `/designations` | Create a new designation | `manage-designations` |
| PUT | `/designations/:id` | Update a designation | `manage-designations` |
| DELETE | `/designations/:id` | Archive (soft‑delete) a designation | `manage-designations` |
| POST | `/designations/:id/restore` | Restore an archived designation | `manage-designations` |
| GET | `/designations/export` | Export list to Excel | `view-designations` |

## 6. Edge Cases & Gotchas
1. **Unique Code** – Must be unique across all designations; duplicates return a validation error.
2. **Archived Dependencies** – You cannot archive a designation that is currently assigned to active employees; reassign those employees first.
3. **Department Link** – Linking to a department is optional; if the department later becomes archived, the designation remains but cannot be used for new employee assignments until the department is active again.
4. **Soft Delete** – Archiving only changes the `status` field; the record stays for audit and can be restored later.

## 7. FAQ
| Question | Answer |
|----------|--------|
| *How do I know if a designation code is already used?* | The form validates in real time; duplicate codes show “Designation code already exists”. |
| *Can I delete a designation that is assigned to employees?* | No. Reassign those employees or archive the designation first. |
| *Where can I see which employees use a designation?* | In the **Employees** tab of the Designation Detail page (read‑only). |
| *Can I change the department linked to a designation?* | Yes, via the edit form; the new department must be active. |
| *Are changes logged?* | Every create, update, archive, and restore creates an entry in the Audit collection for traceability. |
| *Is there bulk‑assign for designations?* | Not in the UI; an admin can perform bulk updates via the API. |

## 8. Quick Actions Summary
- **Add** → `+ Add Designation` → fill form → **Create**.
- **Edit** → eye → **Edit** → modify → **Save**.
- **Archive** → trash → confirm → status becomes *archived*.
- **Restore** → archived row → **Restore** button → status becomes *active*.
- **Export** → toolbar → **Export** → download Excel.

---

*Generated on **2026‑06‑11***