# Shifts – End‑User Guide

---

## 1. Overview
The **Shifts** module lets you define work‑schedule blocks (e.g., Morning, Evening, Night) that can be assigned to employees. Each shift includes a name, start/end times, total working hours per day, and a scope (`all`, `worker`, or `office‑staff`).

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View shift list | `view-shifts` |
| Create, edit, delete, bulk‑assign shifts | `manage-shifts` |

If you lack a permission the corresponding UI buttons disappear and API calls return **403 Unauthorized**.

---

## 3. Related Settings
This module does not rely on any configurable settings in **CompanySettings**. All shift behavior (timings, applicability) is defined directly in the UI and validated by the server.

---

## 3. UI Pages & Workflow

### 3.1 Shifts List (`/shifts`)
- **Search** – Type any part of a shift name and press **Enter**.
- **Toolbar Buttons** (top‑right)
  - **Bulk Assign** – Opens a dialog to apply a selected shift to multiple employees.
  - **Add Shift** – Opens the *Create Shift* modal.
- **Table columns**
  - **Shift Name** – Clickable to edit (via the edit icon).
  - **Time** – Shows `Start → End` (styled with distinct colours).
  - **Hours/Day** – Number of working hours, displayed as a blue tag.
  - **Applicable To** – Indicates whether the shift applies to all employees, only workers, or only office staff.
  - **Status** – `Active` (green) or `Inactive` (grey) badge.
  - **Actions** – Edit (pencil) and Delete (trash) icons.
- **Pagination** – Bottom of the table shows total count; you can change page size.

### 3.2 Create / Edit Shift (modal)
- **Fields**
  - **Shift Name** – Required, 2‑100 characters.
  - **Start Time** – `HH:MM` (24‑hour). Night shifts are allowed when `Start > End`.
  - **End Time** – `HH:MM`.
  - **Hours/Day** – Number between 1‑24.
  - **Applicable To** – Dropdown (`All Employees`, `Workers Only`, `Office Staff Only`).
- **Validation** – End time must be later than start time unless it’s a night shift. Duplicate shift names are rejected.
- **Create** – Click **Create**; on success you see a toast “Shift created” and the list refreshes.
- **Edit** – Click the edit icon on a row, the modal loads the existing values, make changes, then click **Update**.

### 3.3 Bulk Assign Shift (modal)
- **Select Shift** – Choose a shift from a searchable dropdown (shows `ShiftName (HH:MM‑HH:MM)`).
- **Select Employees** – Multi‑select searchable list of active employees (max 500 fetched). Each entry shows `Full Name (EmployeeCode)`.
- **Assign** – Click **Assign**; the API assigns the chosen shift to all selected employees and shows a success toast with the server message.

### 3.4 Delete Shift
- Click the trash icon → confirm dialog. Deleting is only possible if no employees are currently assigned to the shift. If employees exist, the server returns an error explaining how many need reassignment.

## 4. Data Import / Export
- **Export** – Click **Export** on the list page (toolbar). Downloads `shifts_YYYY‑MM‑DD.xlsx` containing all shift records.
- **Import** – Not exposed in the UI for shifts (can be added via the API if required).

## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/shifts` | List shifts (supports pagination, `search`, `status`, `applicableTo`) | `view-shifts` |
| GET | `/shifts/:id` | Get shift details | `view-shifts` |
| POST | `/shifts` | Create a new shift | `manage-shifts` |
| PATCH | `/shifts/:id` | Update an existing shift | `manage-shifts` |
| DELETE | `/shifts/:id` | Delete (soft‑remove) a shift | `manage-shifts` |
| PATCH | `/employees/bulk/shift` | Bulk‑assign a shift to many employees | `manage-shifts` |
| GET | `/shifts/export` | Export shift list to Excel | `view-shifts` |

## 6. Edge Cases & Gotchas
1. **Night Shift** – When `Start Time` > `End Time` the system treats it as a night shift (spanning midnight). Validation still ensures that the period does not overlap with other night shifts.
2. **Overlap Detection** – The server checks that the new or edited shift timing does not clash with any existing active shift. Overlap errors list the conflicting shift names.
3. **Delete Guard** – A shift cannot be deleted while employees are assigned to it. Reassign those employees (via *Bulk Assign Shift*) before deleting.
4. **Unique Name** – Shift names must be unique across the organization. Duplicate attempts return a clear validation message.
5. **Cache** – Shift list results are cached for the first page (20 items). After any create, update, or delete the cache is invalidated automatically.

## 7. FAQ
| Question | Answer |
|----------|--------|
| *How do I know if a shift overlaps with another?* | The server performs an overlap check and returns an error like `Shift timing overlaps with: Evening Shift`. Adjust the times accordingly.
| *Can I create a night shift?* | Yes. Enter a start time later than the end time (e.g., `22:00` → `06:00`). The UI accepts it, and the server treats it as a night shift.
| *Why can’t I delete a shift?* | Because at least one employee is currently assigned to it. Use **Bulk Assign Shift** to move those employees to a different shift, then try deleting again.
| *What does “Applicable To” mean?* | It determines which employee categories can be assigned this shift. `All Employees` works for any employee, `Workers Only` limits to the *worker* category, and `Office Staff Only` limits to *office‑staff*.
| *Is there an audit log for shift changes?* | Yes. Every create, update, delete, and bulk‑assign action logs an entry via `AuditService` for traceability.
| *How are shift times stored?* | As strings in `HH:MM` (24‑hour) format in the database.
| *Can I export the shift list?* | Click **Export** on the list page; an Excel file named `shifts_YYYY‑MM‑DD.xlsx` will be downloaded.
| *Is there a bulk‑assign feature for other entities?* | Bulk assign is currently only implemented for shifts (employees → shift). Other bulk operations have separate endpoints.

## 8. Quick Actions Summary
- **Add Shift** → `+ Add Shift` button → fill modal → **Create**.
- **Edit Shift** → pencil icon on a row → modify → **Update**.
- **Delete Shift** → trash icon → confirm → shift removed (if no employees assigned).
- **Bulk Assign** → `Bulk Assign` button → select shift & employees → **Assign**.
- **Export** → toolbar → **Export** → download Excel.

---

*Generated on **2026‑06‑11***