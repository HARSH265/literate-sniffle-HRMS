# Holidays – End‑User Guide
---
## 1. Overview
The **Holidays** module lets HR staff define company‑wide, national, state, and festival holidays. Holidays are used by the Attendance engine to automatically mark days as non‑working and by Payroll to determine paid days.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View holiday list / details | `view-departments` |
| Create, edit, delete holidays | `manage-departments` |

If you lack permission the UI hides the Holidays section and API calls return **403**.

## 3. Related Settings
- **attendanceConfig.paidHolidays** – Whether holidays are treated as paid days in payroll.

## 4. UI Pages & Workflow
- **Holidays List** (`/holidays`): Table with columns: Name, Date, Type, Applicable To, Paid/Unpaid, Status. Supports year filter and search.
- **Holiday Calendar** (`/holidays` → Calendar tab): Monthly calendar view showing holiday markers.
- **Create / Edit Holiday** (`/holidays/new` & `/holidays/:id/edit`): Form fields – Name, Date, Type (National/State/Company/Festival), Applicable To (All/Workers/Office Staff), Paid toggle.
- **Bulk Import** (`/holidays/import`): Upload an Excel file with holiday data.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/holidays` | List holidays (filter: `year`) | `view-departments` |
| GET | `/holidays/:id` | Get holiday details | `view-departments` |
| POST | `/holidays` | Create a holiday | `manage-departments` |
| PATCH | `/holidays/:id` | Update a holiday | `manage-departments` |
| DELETE | `/holidays/:id` | Delete a holiday | `manage-departments` |

## 6. Edge Cases & Gotchas
- **Date uniqueness** – Two holidays cannot share the same date for the same applicability scope.
- **Year filter** – The list defaults to the current year; change the year filter to view past/future holidays.
- **Paid flag** – The `isPaid` flag determines whether the holiday is counted as a paid day in salary calculations.

## 7. Quick Actions Summary
- **Add Holiday** → Holidays → **Add Holiday** → fill form → **Create**.
- **Edit Holiday** → list → **Edit** (pencil) → modify → **Save**.
- **Delete Holiday** → list → **Delete** (trash) → confirm.
- **Import** → **Import** button → upload Excel → confirm.
- **View Calendar** → Calendar tab → browse monthly view.

*Generated on **2026‑06‑12***