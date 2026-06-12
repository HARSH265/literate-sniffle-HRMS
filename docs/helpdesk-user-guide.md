# Help Desk – End‑User Guide
---
## 1. Overview
The **Help Desk** module lets employees raise support tickets for IT, HR, facilities, payroll, or any other issue. Tickets track a subject, description, priority, SLA deadline, status, assigned support staff, and a threaded comment history. The UI supports creating new tickets, viewing the ticket list, filtering by status/priority/category, editing tickets (for managers/agents), adding comments, and downloading attachments.
---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View ticket list / details / stats | `view‑tickets` |
| Create a new ticket | `manage‑tickets` |
| Edit ticket (change status, priority, assign) | `manage‑tickets` |
| Add a comment to a ticket | `view‑tickets` |
| Delete (soft‑delete) a ticket | `manage‑tickets` |
| Run SLA check manually (admin utility) | `manage‑tickets` |
| View ticket statistics (dashboard) | `view‑tickets` |

If you lack a permission, the related UI elements (buttons, filters) are hidden and API calls will return **403 Unauthorized**.
---
## 3. Related Settings
The Help Desk workflow reads the following **CompanySettings.helpdeskConfig** fields (editable via **Settings → Help Desk**):
- **helpdeskConfig.ticketsEnabled** – Enable/disable the entire ticketing system.
- **helpdeskConfig.autoAssign** – When true, new tickets are automatically assigned to the first available support agent.
- **helpdeskConfig.maxAttachments** – Maximum number of files that can be attached to a ticket.
- **helpdeskConfig.slaHoursUrgent** – SLA deadline in hours for `urgent` priority tickets.
- **helpdeskConfig.slaHoursHigh** – SLA deadline for `high` priority.
- **helpdeskConfig.slaHoursNormal** – SLA deadline for `medium` priority (default).
- **helpdeskConfig.slaHoursLow** – SLA deadline for `low` priority.
---
## 4. UI Pages & Workflow
### 4.1 Ticket List (`/helpdesk`)
- **PageHeader** shows *Help Desk* with subtitle *Manage support tickets*.
- **Toolbar actions** (visible with `manage‑tickets`): **New Ticket** button opens the ticket creation modal.
- **Filters** – Status dropdown (Open, In‑Progress, Resolved, Closed), Priority dropdown (Low, Medium, High, Urgent), Category dropdown (IT, HR, Facilities, Payroll, Other).
- **Search** – Free‑text search across ticket ID, subject, and description.
- **Table columns**:
  - Ticket ID (code styled, clickable → detail)
  - Subject (bold if ticket is still open)
  - Category (tag)
  - Priority (colored tag)
  - Status (colored tag)
  - Requested By (user name)
  - SLA column – shows remaining time, overdue badge, or “—” when not applicable
  - Created date
  - Actions – **View** (eye icon) and **Delete** (trash) for users with `manage‑tickets`.
- **Stats cards** – Total tickets, Open, In‑Progress, Resolved, Closed, Overdue (based on SLA).

### 4.2 Create / Edit Ticket (`/helpdesk/new` & `/helpdesk/:id/edit`)
- **Form fields**:
  - *Subject* (required)
  - *Description* (required, multiline)
  - *Category* dropdown (IT, HR, Facilities, Payroll, Other)
  - *Priority* dropdown (Low, Medium, High, Urgent)
  - *Attachments* – optional file upload (up to `maxAttachments` files, each respecting size limits defined elsewhere).
- When editing (only for agents with `manage‑tickets`), additional **Status** dropdown and **Assign To** selector become available.
- **Save** creates the ticket, automatically generates a ticket ID (`TKT‑####`), calculates the SLA deadline based on priority and the `helpdeskConfig` values, and logs the creation.

### 4.3 Ticket Detail (`/helpdesk/:id`)
- Header displays the **Ticket ID**, status tag, priority tag, and an overdue SLA tag when applicable.
- **Action bar** – **Back**, **Edit** (if permitted), and the **Comment** input at the bottom.
- **Ticket information** card shows subject, description, category, priority, status, requester, assignee (if any), created date, SLA deadline (with countdown), and timestamps for resolved/closed dates.
- **Comments section** – Lists all comments in chronological order, each showing author, timestamp, message, and any attached files. Users can add a new comment via the textarea and **Send** button.
- **Download attachment** – Clicking a file name triggers the download endpoint and increments the download count.

### 4.4 Statistics Dashboard
The **Help Desk** stats API (`GET /helpdesk/stats`) provides:
- Total ticket count
- Breakdown by status and priority
- SLA compliance percentage (percentage of tickets that met their deadline)
These numbers are displayed on the admin dashboard and can be used for reporting.
---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/helpdesk` | List tickets with pagination and optional filters (`status`, `priority`, `category`, `search`, `sort`, `userId`, `assignedTo`) | `view‑tickets` |
| GET | `/helpdesk/:id` | Retrieve a single ticket (populated requester, assignee, comments) | `view‑tickets` |
| POST | `/helpdesk` | Create a new ticket (payload: subject, description, category, priority, optional attachments) | `manage‑tickets` |
| PUT | `/helpdesk/:id` | Update ticket fields (subject, description, category, priority, status, assignedTo, attachments) | `manage‑tickets` |
| DELETE | `/helpdesk/:id` | Soft‑delete a ticket (sets `isActive` to false) | `manage‑tickets` |
| POST | `/helpdesk/:id/comments` | Add a comment (payload: message, optional attachments) | `view‑tickets` |
| GET | `/helpdesk/stats` | Summary statistics (total, byStatus, byPriority, SLA compliance) | `view‑tickets` |
| POST | `/helpdesk/check-sla` | Run the SLA breach check manually (updates tickets whose deadline passed) | `manage‑tickets` |
---
## 6. Edge Cases & Gotchas
1. **Feature toggle** – If `helpdeskConfig.ticketsEnabled` is false, any request to create, edit, or list tickets returns a 400 error and the UI shows *Help desk is disabled*.
2. **SLA calculation** – The SLA deadline is calculated at ticket creation (and when priority changes) using the hour values from the settings. If the deadline passes, the system automatically marks `slaBreached: true`.
3. **Auto‑assign** – When `autoAssign` is true, the service will automatically select an available agent (based on your implementation) – otherwise tickets start unassigned and must be manually assigned.
4. **Attachment limits** – The server enforces `maxAttachments` per ticket and a file‑size limit defined in the generic file upload service. Oversized files or too many attachments cause a 400 error.
5. **Permission granularity** – Users with only `view‑tickets` can see the list and details, add comments, and download attachments, but cannot edit status/priority or delete tickets.
6. **SLA breach flag** – Once a ticket is resolved or closed, `slaBreached` is cleared automatically. Ongoing tickets that exceed their deadline are highlighted in red in the list and detail view.
7. **Soft‑delete** – Deleting a ticket only marks it inactive; the record remains for audit purposes and can be fetched directly by ID but is omitted from list endpoints.
8. **Statistics** – The stats endpoint counts only active tickets (`isActive: true`). SLA compliance is calculated as `(total‑breached)/total * 100`.
---
## 7. Quick Actions Summary
- **Create Ticket** → **New Ticket** button → fill form → **Create Ticket**.
- **Edit Ticket** → list → eye icon → **Edit** button (or directly `/helpdesk/:id/edit`) → modify fields → **Update Ticket**.
- **Add Comment** → ticket detail → type comment → **Send**.
- **Assign / Change Status** → edit ticket → set **Status** and **Assignee** → **Update Ticket**.
- **Delete Ticket** → list → trash icon → confirm → soft‑delete.
- **Run SLA Check** → admin utility → `POST /helpdesk/check-sla` (or scheduled job).
- **Filter / Search** → status, priority, category dropdowns, search bar → table updates.
- **View Stats** → dashboard or `GET /helpdesk/stats` for overview.
---
*Generated on **2026‑06‑12***