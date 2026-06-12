# Employee Management – End‑User Guide

**Welcome!** This guide explains how to work with employee records in the HRMS web application. All actions are performed through the UI; the underlying API details are covered for completeness.

---

## 1. Overview
The **Employee** module lets you:
- Browse a searchable list of all employees.
- View a detailed profile (personal, employment, salary, statutory, documents, attendance, payroll).
- Create new employee records (single entry or bulk import).
- Edit existing records.
- Archive (delete) and restore employees.
- Upload, view, download, and delete employee documents.
- Export the employee list to Excel or download a CSV template.
- Bulk assign a shift to multiple employees.
- Generate the next employee code automatically.

---

## 2. Access & Permissions
| Action | Required permission |
|--------|----------------------|
| View employee list / details | `view‑employees` |
| Add, edit, delete, restore, bulk‑assign, import, upload documents | `manage‑employees` |

If you do not have the required permission, the corresponding buttons will be hidden and the API will reject the request.

---

## 3. Related Settings
The Employee module depends on the following **CompanySettings** fields:
- **authConfig.tokenExpiry** and **authConfig.refreshTokenExpiry** – affect session expiration for the logged‑in user.
- **payrollConfig.minimumWage** – the minimum allowed `baseSalary` when creating or updating an employee.
- **employeeCodeConfig.isAutoGenerate** – controls whether the employee code field is auto‑filled.
- **documentConfig.maxFileSizeMb** – maximum allowed size for uploaded employee documents.
- **authConfig.passwordHistoryCount** – number of previous passwords disallowed when changing a password.

These settings are managed in **Settings → Authentication**, **Settings → Payroll**, **Settings → Employee Code**, and **Settings → Document** sections respectively.

---


---

## 3. Main UI Pages & What You Can Do
### 3.1 Employee List (`/employees`)
- **Search** – Type any part of the employee code, name, or father’s name in the search box (top‑left). Press **Enter**.
- **Filters** – Use dropdowns to filter by **Status**, **Category**, **Department**, or **Designation**.
- **Pagination** – Bottom toolbar shows total count; change page size with the selector.
- **Actions per row** –
  - **View** (eye icon) – Opens the employee detail page.
  - **Edit** (pencil icon) – Opens the edit form.
  - **Delete** (trash icon) – Archives the employee after confirmation.
- **Toolbar buttons** (top‑right):
  - **Template** – Downloads an Excel template for bulk import.
  - **Import** – Opens a file picker; you can select an `.xlsx` file. The import is rate‑limited (max 2 requests per minute).
  - **Export** – Generates an Excel file with the current employee list.
  - **Add Employee** – Opens the **Add Employee** form.

### 3.2 Add Employee (`/employees/new`)
- The form is split into logical sections (Personal Info, Employment Details, Organization, Contact Info, Salary & Benefits, Bank Details, Statutory Compliance).
- **Employee Code** – If the *Employee Code* auto‑generation setting is enabled, the field is pre‑filled and disabled. Otherwise you must enter a unique code.
- Required fields are marked with a red asterisk.
- After filling the form, click **Create Employee**. On success you are returned to the employee list.

### 3.3 Edit Employee (`/employees/:id/edit`)
- The edit form mirrors the creation form, but the **Employee Code** is read‑only.
- Existing values are pre‑loaded. Change what you need and click **Update Employee**.
- A **Status** dropdown lets you set the employee to `active`, `inactive`, `terminated`, or `archived`.

### 3.4 Employee Detail (`/employees/:id`)
- **Header** shows the employee’s name, code, and a status tag.
- **Avatar** – Displays the photo if uploaded; otherwise a placeholder.
- **Tabs**:
  - **Documents** – List of uploaded files. You can **view**, **download**, or **delete** each document. Use the **Add Document** button to upload a new file (image or PDF, max 5 MB).
  - **Attendance History** – Table of attendance entries (date, status, in/out times, shift, late flag).
  - **Payroll History** – Table of payroll runs (month, present days, basic earnings, allowances, deductions, net pay, status).
- **Sections** display personal details, employment details, organization (dept, designation, shift), salary info, contact & address, bank details, and statutory compliance (PF, ESI, PT, etc.).
- **Edit** button (top‑right) navigates to the edit page.

### 3.5 Bulk Assign Shift (`POST /employees/bulk/shift`)
- From the employee list, click the **Bulk shift** button.
- A dialog (not shown in UI code) asks you to select a shift and the employees to apply it to.
- Only users with `manage‑employees` can perform this; otherwise the API returns **403**.

### 3.6 Generate Next Employee Code (`GET /employees/next-code`)
- When auto‑generation is enabled, the UI automatically fetches the next code and fills it in the **Add Employee** form.
- You can also manually request the code via the **Next Code** button (if exposed).

---

## 4. Data Import / Export
### 4.1 Export
- Click **Export** on the employee list page. An Excel file (`employees_YYYY‑MM‑DD.xlsx`) is downloaded.
- The file contains columns such as Employee Code, Full Name, Father Name, Category, Employment Type, Department, Designation, Shift, Joining Date, Salary Type, Base Salary, Daily Wage, OT Eligibility, Status, Contact Number, and Address.

### 4.2 Template Download
- Click **Template** on the employee list page to download a blank Excel file (`employee_template.xlsx`) pre‑populated with a single example row.
- Use this template for bulk imports.

### 4.3 Bulk Import
- Click **Import**, select an `.xlsx` file matching the template format.
- The server validates each row (required fields, valid ObjectIds for department/designation/shift, numeric values, etc.).
- After processing you receive a success message indicating how many rows succeeded and how many failed.
- Successful imports are immediately visible after the list is refreshed.

---

## 5. Document Management
- **Upload Document** – From the employee detail page, click **Add Document**, choose the document type (Aadhar, PAN, etc.), then drag‑drop or select a file.
- **View** – Click the eye icon to open the document in a new tab.
- **Download** – Click the download icon to save the file locally.
- **Delete** – Click the trash icon and confirm to remove the document. The system logs this action for audit purposes.

---

## 6. Auditing & Security (What Happens Behind the Scenes)
- Every change (create, update, delete, document upload, shift assignment) creates an entry in the **Audit** collection via `AuditService.log`. This ensures traceability for administrators.
- Sensitive fields such as **PF UAN**, **ESI Number**, **PAN**, **Aadhaar**, and **Employee Code** are masked for users without full‑access roles. Only `super‑admin`, `hr‑admin`, `hr‑staff`, or `accounts` can see the raw values.
- Salary fields (`baseSalary`, `dailyWage`) are hidden from users without salary‑access roles.
- Uploaded files are stored using the `FileUploadService` (e.g., Cloudinary) and a public URL is generated for download.

---

## 7. Edge Cases & Gotchas
1. **Employee Code uniqueness** – The system checks for duplicates (case‑insensitive). If you attempt to create or import a record with an existing code, you’ll receive an error.
2. **Minimum wage validation** – When creating or updating, the base salary must be ≥ `CompanySettings.payrollConfig.minimumWage`. If not, the request fails with a validation error.
3. **Archived employees** – Archived records are hidden from the default list (`status: { $ne: 'archived' }`). Users with `view‑employees` can still see them by directly navigating to the URL.
4. **Bulk import rate limit** – Only **2** import requests per minute are allowed per IP. Exceeding this returns a *Too many import requests* error.
5. **Document size limit** – Uploads exceeding the size defined in `CompanySettings.documentConfig.maxFileSizeMb` are rejected.
6. **Permission errors** – If you see a *403 Unauthorized* message, you lack the required permission (e.g., trying to edit without `manage‑employees`).

---

## 8. Frequently Asked Questions
| Question | Answer |
|----------|--------|
| *How do I get a new employee code?* | If auto‑generation is enabled, the **Add Employee** form shows the next code automatically. Otherwise, ask an admin to enable auto‑generation or manually enter a unique code.
| *Can I import employees with existing codes?* | No. The import will fail for any duplicate codes. Remove duplicates from the file before uploading.
| *What file format is required for import?* | An Excel `.xlsx` file matching the template (`employee_template.xlsx`). Required columns: Employee Code (optional if auto‑generated), Full Name, Father Name, Category, Employment Type, Department ID, Designation ID, Shift ID, Joining Date, Salary Type, Base Salary, Daily Wage (optional), Overtime Eligible (true/false), Contact Number, Address, etc.
| *How are documents stored?* | Files are uploaded via `FileUploadService` and stored in a cloud bucket. The system stores the URL; you can view/download directly from the UI.
| *Who can see masked fields like PF UAN?* | Only roles with full access (`super‑admin`, `hr‑admin`, `hr‑staff`, `accounts`). Other users see asterisks.
| *How do I restore an archived employee?* | On the employee list, click the **Restore** button (visible only to users with `manage‑employees`). This sends a request to `/employees/:id/restore` and changes the status back to `active`.
| *What happens when I delete an employee?* | The record’s `status` is set to `archived`; the data remains in the database and can be restored later. It is not physically removed.
| *Is there a limit on how many documents an employee can have?* | No hard limit, but each file must respect the size limit defined in settings.

---

## 9. Quick Reference – API Endpoints (for developers or troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|-----------|
| GET | `/employees` | List employees (supports pagination, filters, search) | `view‑employees` |
| GET | `/employees/:id` | Get employee details | `view‑employees` |
| POST | `/employees` | Create employee | `manage‑employees` |
| PUT | `/employees/:id` | Update employee | `manage‑employees` |
| DELETE | `/employees/:id` | Archive employee | `manage‑employees` |
| POST | `/employees/:id/restore` | Restore archived employee | `manage‑employees` |
| POST | `/employees/import` | Bulk import Excel file | `manage‑employees` (rate‑limited) |
| GET | `/employees/export` | Export employee list to Excel | `view‑employees` |
| GET | `/employees/template` | Download import template | `view‑employees` |
| GET | `/employees/next-code` | Get next auto‑generated employee code | `manage‑employees` |
| POST | `/employees/bulk/shift` | Bulk assign shift to multiple employees | `manage‑employees` |
| POST | `/employees/:id/documents` | Upload a document | `manage‑employees` |
| GET | `/employees/:id/documents/:docId` | Download a document | `view‑employees` |
| DELETE | `/employees/:id/documents/:docId` | Delete a document | `manage‑employees` |

---

## 10. Support
If you encounter any issues not covered here, contact your HR or IT administrator. Provide the error message and the action you were trying to perform.

---

*Generated on **2026‑06‑11***

## 11. Workflow Summary

A typical end‑user workflow for employee management:

1. **Login** – Obtain a JWT token via `/auth/login`.
2. **View employees** – Access the employee list, use search and filters.
3. **Create employee** – Click **Add Employee**, fill the form (code auto‑generated if enabled), and submit.
4. **Edit employee** – From the list or detail view, edit fields and save.
5. **Delete / Archive** – Use the Delete button and confirm.
6. **Restore** – For archived employees, click **Restore**.
7. **Bulk assign shift** – Select multiple employees, choose a shift, and assign.
8. **Export / Import** – Use Export to download Excel or Template & Import for bulk upload.
9. **Logout** – Call `/auth/logout` to invalidate the token.

All actions respect the permissions listed earlier.
