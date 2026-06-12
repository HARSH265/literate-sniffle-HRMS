# Documents – End‑User Guide
---
## 1. Overview
The **Documents** module provides a searchable repository for company policies, contracts, certificates, ID proofs, payslips, and any other files that need to be stored centrally. Documents can be scoped to the whole company or attached to a specific employee. The UI supports upload, versioning, expiry tracking, tag‑based categorisation, and download count monitoring.
---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View documents list / details / stats | `view‑documents` |
| Upload a new document | `manage‑documents` |
| Edit / update an existing document | `manage‑documents` |
| Delete (soft‑delete) a document | `manage‑documents` |
| Download a document (increments count) | `view‑documents` |
| Access company‑wide document list | `view‑documents` |
| Access employee‑specific documents | `view‑documents` |

If you lack a permission, the related UI buttons are hidden and API calls return **403 Unauthorized**.
---
## 3. Related Settings
The Documents workflow reads the following **CompanySettings.documentConfig** fields (editable via **Settings → Documents**):
- **documentConfig.documentRepoEnabled** – Enable/disable the entire document repository.
- **documentConfig.maxFileSizeMb** – Maximum file size per upload (default 20 MB).
- **documentConfig.allowedFileTypes** – List of permitted extensions (e.g. pdf, doc, docx, xlsx, jpg, png).
- **documentConfig.enableVersioning** – Keep previous versions when a document is re‑uploaded.
- **documentConfig.maxVersions** – Maximum number of historic versions retained per document.
- **documentConfig.autoExpireReminderDays** – Days before expiry when a reminder is shown.
- **documentConfig.tags** – Pre‑defined tag suggestions for quick categorisation.
- **documentConfig.categories** – Structured categories (name + accessRoles) that appear in the Category dropdown.
---
## 4. UI Pages & Workflow
### 4.1 Documents List (`/documents`)
- **Stats cards** – Total documents, Company docs, Employee docs, Expiring Soon.
- **Table columns** – Title (clickable → detail), Category, File type, Size, Owner (Employee or Company), Downloads.
- **Filters** – Category dropdown (populated from `documentConfig.categories`).
- **Search** – Free‑text search across title, description, and tags.
- **Toolbar actions** (visible only with `manage‑documents`):** Upload Document** button opens the upload form.
- **Row actions** (visible with permission):** View** (eye icon) opens the detail page; **Delete** (trash icon) soft‑deletes the document.

### 4.2 Upload / Edit Document (`/documents/new` & `/documents/:id/edit`)
- **Form sections**:
  - **Document Information** – Title (required), Category (required), Document Type (Company vs Employee), Employee selector (when type = Employee), Tags, Expiry date.
  - **File Upload** – Drag‑and‑drop area that accepts the configured MIME types; shows file name after selection.
  - **Additional Details** – Description, optional custom tags (add via input + **Add** button).
- **Versioning** – When editing an existing document and a new file is supplied, the previous file is stored as a historic version (if versioning is enabled).
- **Save** – Creates or updates the document, records the uploader, and triggers immediate download availability unless a future schedule is implemented (not currently used).

### 4.3 Document Detail (`/documents/:id`)
- Header displays **Title**, **Category**, and a **Company** tag when `isCompanyDocument` is true.
- **Descriptions** list all metadata: Category, Version, File name & size, Downloads, Uploaded By, Owner (Employee or Company), Expiry Date, Tags, Description.
- **Version History** panel (right side) shows previous versions with their file name, size, and upload date.
- **Actions** (permission‑gated): **Edit**, **Delete** (soft‑delete), and a large **Download File** button that streams the file and increments the download counter.
- **Back** button returns to the list.

### 4.4 Dashboard Widget (Employee‑Self‑Service)
The **Documents** widget on the ESS dashboard shows the most recent active employee‑specific documents. Clicking an entry navigates to its detail page.
---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/documents` | List documents with pagination and optional filters (`category`, `employee`, `isCompanyDocument`, `search`, `sort`) | `view‑documents` |
| GET | `/documents/:id` | Retrieve a single document (populated `uploadedBy` and `employee`) | `view‑documents` |
| GET | `/documents/company` | List all active company‑wide documents | `view‑documents` |
| GET | `/documents/employee/:employeeId` | List active documents for a specific employee | `view‑documents` |
| GET | `/documents/expiring` | Get documents whose expiry is within the next *n* days (query `days`) | `view‑documents` |
| GET | `/documents/stats` | Summary statistics (total, byCategory, activeCompanyDocs, expiringSoon) | `view‑documents` |
| POST | `/documents` | Upload a new document (multipart/form‑data: `file` + JSON fields) | `manage‑documents` |
| PATCH | `/documents/:id` | Update document metadata and optionally replace the file (multipart/form‑data) | `manage‑documents` |
| DELETE | `/documents/:id` | Soft‑delete a document (sets `isActive` to false) | `manage‑documents` |
| GET | `/documents/:id/download` | Increment download count and redirect to the stored file URL | `view‑documents` |
---
## 6. Edge Cases & Gotchas
1. **Repository toggle** – If `documentConfig.documentRepoEnabled` is false, any upload attempt returns a 400 error and the UI shows *Document repository is disabled*.
2. **File size / type limits** – The server enforces `maxFileSizeMb` and `allowedFileTypes`. Oversized or disallowed files are rejected with a clear error message.
3. **Versioning** – When enabled, each new upload creates a historic entry and increments the version number. Only the most recent `maxVersions` are retained; older versions are automatically dropped.
4. **Expiry handling** – Documents with an `expiryDate` become highlighted in the **Expiring Soon** stat card. The system sends a reminder after `autoExpireReminderDays` and automatically hides expired documents from the default list (they remain accessible by ID for audit).
5. **Access roles** – The `accessRoles` array limits which user roles can view a document. If empty, the document follows the general `view‑documents` permission.
6. **Company vs Employee documents** – Selecting *Employee Document* forces you to pick an employee; the document is then visible only to that employee (and users with appropriate access roles). Company documents are visible to all users with `view‑documents`.
7. **Permissions** – Users with only `view‑documents` can browse and download but cannot see the **Upload** button or the **Edit/Delete** actions.
8. **Soft‑delete** – Deleting a document does not remove the file from storage; it merely marks the record inactive. Soft‑deleted docs are omitted from list endpoints but can still be fetched directly by ID for audit purposes.
---
## 7. Quick Actions Summary
- **Upload Document** → `/documents/new` → fill form (title, category, type, file, optional tags/expiry) → **Upload Document**.
- **Edit Document** → list → **Edit** (eye → detail → Edit button) → modify fields / replace file → **Update Document**.
- **Delete Document** → list → trash icon → confirm → soft‑delete.
- **Download** → detail page → **Download File** button (or directly via `/documents/:id/download`).
- **Filter / Search** → category dropdown, search bar → table updates.
- **View Version History** → detail page → right‑hand panel shows previous versions.
- **Check Expiring Docs** → Summary card → see count; use **Expiring** filter via API `/documents/expiring`.
---
*Generated on **2026‑06‑12***