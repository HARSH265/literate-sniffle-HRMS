# Announcements – End‑User Guide
---
## 1. Overview
The **Announcements** module lets HR staff, administrators, and managers create, schedule, and broadcast company‑wide messages. Announcements can be targeted to all employees, a specific department, a designation, or a list of individual employees. They support priority levels, optional attachments, expiry dates, and optional scheduling for future delivery.
---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View announcements list / details / unread count | `view‑announcements` |
| Create a new announcement | `manage‑announcements` |
| Edit / update an existing announcement | `manage‑announcements` |
| Delete (soft‑delete) an announcement | `manage‑announcements` |
| Mark an announcement as read | `view‑announcements` |
| Expire old announcements (admin utility) | `manage‑announcements` |
| Run scheduled‑announcement processing manually | `manage‑announcements` |

If you lack a permission, the related UI elements and API calls return **403 Unauthorized**.
---
## 3. Related Settings
The Announcements workflow reads the following **CompanySettings.announcementConfig** fields (editable via **Settings → Announcements**):
- **announcementConfig.announcementsEnabled** – Enable/disable the entire announcements feature.
- **announcementConfig.maxAnnouncementLength** – Maximum number of characters allowed in the content field.
- **announcementConfig.allowAttachments** – Permit file attachments on announcements.
- **announcementConfig.maxAttachmentSizeMb** – Maximum size per attachment (MiB).
- **announcementConfig.autoExpireDays** – Number of days after which an announcement is automatically marked inactive.
- **announcementConfig.allowScheduling** – Allow scheduling a future publish time for an announcement.
---
## 4. UI Pages & Workflow
### 4.1 Announcements List (`/announcements`)
- **PageHeader** shows the title *Announcements* with a subtitle *Manage company‑wide announcements and broadcasts*.
- **Toolbar actions** (visible only with `manage‑announcements`): **New Announcement** button opens the create form.
- **Filters** – Priority dropdown (Low, Normal, High, Urgent) and Status dropdown (Active, Expired, Inactive).
- **Search** – Free‑text search across title and content.
- **Table columns**:
  - **Title** – shows a bell icon coloured by priority and bolds unread items.
  - **Priority** – coloured tag.
  - **Target** – displays the audience (All, Department, Designation, Specific Employees).
  - **Created** – formatted date.
  - **Status** – tags: *Active*, *Expired*, *Inactive*.
  - **Actions** – **View** (eye icon) opens the detail page; **Delete** (trash icon) soft‑deletes the announcement (requires `manage‑announcements`).

### 4.2 Create / Edit Announcement (`/announcements/new` & `/announcements/:id/edit`)
- **Form sections**: Title, Content, Priority, Target Audience, Optional Target IDs, Schedule At, Expires At.
- **Priority** – select from Low, Normal, High, Urgent.
- **Target Audience** – select All Employees, Department, Designation, Specific Employees. When a specific audience is chosen, a multi‑select appears to choose the relevant IDs (departments, designations, or employee IDs).
- **Scheduling** – optional date‑time picker (`scheduledAt`). If omitted, the announcement is published immediately.
- **Expiry** – optional date‑time picker (`expiresAt`). If omitted, the system applies `autoExpireDays` from settings.\n- **Attachments** – (if enabled) a file upload component (not shown in the core UI but available via the API).
- **Save** – creates or updates the announcement, records the creator, and triggers immediate notifications unless a future schedule is set.

### 4.3 Announcement Detail (`/announcements/:id`)
- Header displays the title, priority badge, and target audience tag.
- **Status tags** – *Active*/**Inactive**, and *Expired* if past `expiresAt`.
- **Content** – displayed in a pre‑formatted block preserving line breaks.
- **Metadata** – Created By, Created At, optional Scheduled At, optional Expires At, Read‑by count, overall status.
- **Back** button returns to the list.
- Opening the detail page automatically marks the announcement as read for the current user (via `POST /announcements/:id/read`).

### 4.4 Dashboard Widget
The **AnnouncementWidget** appears on the Dashboard (both admin and ESS) showing the most recent active announcements. Clicking an item navigates to its detail page.
---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/announcements` | List announcements with pagination and optional filters (`priority`, `status`, `search`, `sort`) | `view‑announcements` |
| GET | `/announcements/unread-count` | Returns the number of unread active announcements for the authenticated user | `view‑announcements` |
| GET | `/announcements/:id` | Retrieve a single announcement (including populated creator and read‑by list) | `view‑announcements` |
| POST | `/announcements` | Create a new announcement (payload: title, content, priority, targetAudience, targetIds, attachments, scheduledAt, expiresAt) | `manage‑announcements` |
| PUT | `/announcements/:id` | Update an existing announcement (partial payload) | `manage‑announcements` |
| DELETE | `/announcements/:id` | Soft‑delete (set `isActive` to false) an announcement | `manage‑announcements` |
| POST | `/announcements/:id/read` | Mark the announcement as read for the current user | `view‑announcements` |
| POST | `/announcements/expire-old` | Immediately expire all announcements whose `expiresAt` is past (admin utility) | `manage‑announcements` |
| POST | `/announcements/process-scheduled` | Immediately process scheduled announcements that are due (admin utility) | `manage‑announcements` |
---
## 6. Edge Cases & Gotchas
1. **Feature toggle** – If `announcementConfig.announcementsEnabled` is false, any attempt to create an announcement returns a 400 error and the UI shows *Announcements are disabled*.
2. **Scheduling** – When `allowScheduling` is false, the `scheduledAt` field is ignored and the announcement is published instantly.
3. **Expiry** – Announcements automatically become inactive after `autoExpireDays` (or the explicit `expiresAt`). Inactive announcements are hidden from most UI lists but can still be accessed via ID for audit purposes.
4. **Target audience resolution** –
   - `all` – every user with an employee record receives the announcement.
   - `department` / `designation` – `targetIds` must contain the corresponding department or designation IDs; the system resolves employees belonging to those groups.
   - `specificEmployees` – `targetIds` must contain employee IDs; only those users receive the announcement.
   Missing or empty `targetIds` for non‑`all` audiences results in no recipients and the announcement is still created.
5. **Attachments** – When `allowAttachments` is false, the `attachments` array is ignored. When enabled, each file must be ≤ `maxAttachmentSizeMb`; oversized files are rejected by the API.
6. **Permissions** – Users with only `view‑announcements` can see the list, read details, and have the read‑by count updated, but cannot create, edit, delete, or trigger admin utilities.
7. **Bulk utilities** – `expire-old` and `process-scheduled` are intended for scheduled background jobs; they can also be triggered manually via the API (requires `manage‑announcements`).
---
## 7. Quick Actions Summary
- **Create Announcement** → `/announcements/new` → fill form → **Create Announcement**.
- **Edit Announcement** → open detail → click **Edit** (or navigate to `/announcements/:id/edit`) → modify → **Update Announcement**.
- **Delete Announcement** → list → **Delete** (trash icon) → confirm.
- **Mark as Read** → open detail page (auto) or call `/announcements/:id/read`.
- **Filter / Search** → priority or status dropdown, search bar → table updates.
- **View Unread Count** → dashboard widget or `/announcements/unread-count`.
- **Schedule Publication** → set *Schedule At* in the create/edit form (requires `allowScheduling`).
- **Expire Manually** → call `/announcements/expire-old` (admin) to immediately deactivate old announcements.
---
*Generated on **2026‑06‑12***