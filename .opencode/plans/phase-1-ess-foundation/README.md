# Phase 1: Employee Self-Service & Foundation

## Features
1. Employee Self-Service (ESS) Portal
2. Announcements / Broadcast
3. Help Desk / Tickets

---

## 1.1 Employee Self-Service (ESS) Portal

### Overview
Allow employees to log into a dedicated portal where they can view and update their own information — reducing HR administrative load. Employees can update personal details, bank account info, emergency contacts, view their documents, and see their attendance/leave/payslip history.

### Configuration (Settings)
- `employeeSelfService` section in `CompanySettings`:
  - `essEnabled` (Boolean, default: true) — master toggle
  - `allowAddressUpdate` (Boolean, default: false)
  - `allowBankUpdate` (Boolean, default: false)
  - `allowEmergencyContactUpdate` (Boolean, default: false)
  - `allowPhoneUpdate` (Boolean, default: true)
  - `changeRequiresApproval` (Boolean, default: true)
  - `maxChangesPerMonth` (Number, default: 5)

### Server Plan

**Model: ESS Change Request** (new model)
Fields: `employee` (ref Employee), `field` (String), `oldValue` (Mixed), `newValue` (Mixed), `status` (pending|approved|rejected), `approvedBy` (ref User), `approvedAt` (Date), `notes` (String)

**Service:** `ess.service.ts`
- `getProfile(employeeId)` — returns employee data (filtered to editable fields)
- `requestChange(employeeId, field, newValue)` — creates change request (if approval required) or directly updates
- `getChangeRequests(employeeId)` — list employee's requests
- `approveChange(requestId, approverId)` — approve and apply change
- `rejectChange(requestId, approverId, reason)` — reject with notes

**Controller:** `ess.controller.ts` — standard CRUD handlers

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/ess/profile` | `view-own-profile` | Get own employee data |
| PUT | `/ess/profile` | `update-own-profile` | Update own profile fields |
| GET | `/ess/change-requests` | `view-own-profile` | List change requests |
| POST | `/ess/change-requests` | `update-own-profile` | Submit change request |
| PATCH | `/ess/change-requests/:id/approve` | `manage-employees` | Approve change |
| PATCH | `/ess/change-requests/:id/reject` | `manage-employees` | Reject change |

**Validation:** `ess.validation.ts` — Zod schemas for allowed field updates

**Tests:**
- Unit: service with mocked Employee model
- Integration: profile fetch, field update, change request lifecycle
- Auth: unauthenticated access blocked

### Client Plan

**Module:** `client/src/features/employee-self-service/`

**Pages:**
- `EssDashboardPage.tsx` — main ESS dashboard with overview cards (attendance summary, upcoming leave, pending requests)
- `EssProfilePage.tsx` — view/edit personal details (Ant Design Form with inline editing)
- `EssDocumentsPage.tsx` — view own documents with download
- `EssAttendancePage.tsx` — read-only attendance log
- `EssLeavePage.tsx` — leave balance + apply leave
- `EssPayslipsPage.tsx` — view/download payslips

**Components:**
- `ProfileField.tsx` — reusable display/edit toggle field
- `ChangeRequestBadge.tsx` — shows pending change count

**Hooks:**
- `useEssProfile.ts` — TanStack Query hooks for profile CRUD
- `useEssChangeRequests.ts` — change request management

**Services:** `essService.ts` — Axios API client

**Tests:**
- Component render tests for each page
- Form submission flows
- Permission gate behavior

**Route:** `/ess/*` (inside AppLayout)

### Fallbacks
- **HR override:** Even when ESS is enabled, HR can always edit employee data from Employees page
- **Approval timeout:** If no approver acts within 7 days, auto-escalate to manager's manager
- **Rate limiting:** Max 10 profile changes per hour per employee

---

## 1.2 Announcements / Broadcast

### Overview
Create and send company-wide or targeted announcements. Leverages existing **Notification** module for delivery. Supports rich text, attachments, scheduling, and read receipts.

### Configuration (Settings)
- `announcementConfig` section in `CompanySettings`:
  - `announcementsEnabled` (Boolean, default: true)
  - `maxAnnouncementLength` (Number, default: 5000)
  - `allowAttachments` (Boolean, default: true)
  - `maxAttachmentSizeMb` (Number, default: 5)
  - `autoExpireDays` (Number, default: 30)
  - `allowScheduling` (Boolean, default: true)

### Server Plan

**Model: Announcement** (new model)
Fields: `title` (String, required), `content` (String, required), `priority` (low|normal|high|urgent), `targetAudience` (all|department|designation|specificEmployees), `targetIds` ([ObjectId]), `attachments` ([{ url, name, size }]), `scheduledAt` (Date), `expiresAt` (Date), `createdBy` (ref User), `readBy` ([{ user, readAt }]), `isActive` (Boolean)

**Service:** `announcement.service.ts`
- `create(data)` — create announcement, schedule notification delivery
- `getAll(filters)` — list with pagination, filters (priority, date range, active)
- `getById(id)` — single with read status
- `markAsRead(announcementId, userId)` — track read receipt
- `getUnreadCount(userId)` — for badge display
- `expireOld()` — cron job to auto-expire
- `delete(id)` — soft delete

**Controller:** `announcement.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/announcements` | `view-announcements` | List announcements |
| GET | `/announcements/unread-count` | `view-announcements` | Unread count |
| GET | `/announcements/:id` | `view-announcements` | Single announcement |
| POST | `/announcements` | `manage-announcements` | Create announcement |
| PATCH | `/announcements/:id` | `manage-announcements` | Update announcement |
| DELETE | `/announcements/:id` | `manage-announcements` | Delete announcement (soft) |
| POST | `/announcements/:id/read` | `view-announcements` | Mark as read |

**Validation:** `announcement.validation.ts`

**Tests:**
- CRUD operations
- Read receipt tracking
- Scheduled delivery logic
- Target audience filtering

### Client Plan

**Module:** `client/src/features/announcements/`

**Pages:**
- `AnnouncementsPage.tsx` — list with priority badges, unread indicators
- `AnnouncementDetailPage.tsx` — full view with read status
- `AnnouncementFormPage.tsx` — create/edit with rich text editor

**Components:**
- `AnnouncementCard.tsx` — list item card
- `AnnouncementPriorityBadge.tsx`
- `AnnouncementTargetSelect.tsx` — target audience picker

**Hooks:**
- `useAnnouncements.ts`
- `useAnnouncementMutations.ts`

**Services:** `announcementService.ts`

**Route:** `/announcements` (inside AppLayout)

**Integration:** Creates Notification record on publish for each target user; shows unread badge in sidebar.

### Fallbacks
- **Bulk notification failure:** If notification delivery fails for some users, retry with backoff; log failures
- **Scheduled announcement:** Server-side cron checks every minute for due announcements
- **Attachment storage:** Use existing Cloudinary upload pattern

---

## 1.3 Help Desk / Tickets

### Overview
Internal issue tracking system for employees to raise IT, HR, or facility-related tickets. Includes status workflow, assignment, priority, and audit trail.

### Configuration (Settings)
- `helpDeskConfig` section in `CompanySettings`:
  - `helpDeskEnabled` (Boolean, default: true)
  - `autoAssignEnabled` (Boolean, default: false)
  - `defaultAssigneeRole` (String, default: 'hr-staff')
  - `slaHoursUrgent` (Number, default: 4)
  - `slaHoursHigh` (Number, default: 8)
  - `slaHoursNormal` (Number, default: 24)
  - `slaHoursLow` (Number, default: 72)
  - `maxTicketsPerEmployee` (Number, default: 5) — open tickets limit
  - `allowAttachments` (Boolean, default: true)
  - `categories` ([String]) — configurable categories like IT, HR, Facilities, Payroll

### Server Plan

**Model: Ticket** (new model)
Fields: `ticketNumber` (String, auto-generated, unique), `title` (String), `description` (String), `category` (String), `priority` (low|normal|high|urgent), `status` (open|in-progress|resolved|closed|reopened), `createdBy` (ref Employee/User), `assignedTo` (ref User), `comments` ([{ author (ref User), content (String), attachments ([{url, name}]), createdAt }]), `attachments` ([{url, name}]), `closedAt` (Date), `closedBy` (ref User), `slaDeadline` (Date), `slaBreached` (Boolean)

**Service:** `ticket.service.ts`
- `create(data)` — generate ticket number, set SLA, notify assignee
- `getAll(filters)` — list with status/category/priority/date filters
- `getById(id)` — single with comments
- `updateStatus(id, status, userId)` — transition with validation
- `assign(ticketId, assigneeId)` — assign/reassign
- `addComment(ticketId, authorId, content, attachments)` — add comment
- `getMyTickets(userId)` — employee's own tickets
- `checkSla()` — cron to flag breached tickets
- `getStats()` — counts by status, category, SLA compliance %

**Controller:** `ticket.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/tickets` | `view-tickets` | List all tickets |
| GET | `/tickets/my` | `view-own-tickets` | My tickets |
| GET | `/tickets/stats` | `view-tickets` | Dashboard stats |
| GET | `/tickets/:id` | `view-tickets` | Single ticket |
| POST | `/tickets` | `create-tickets` | Create ticket |
| PATCH | `/tickets/:id` | `manage-tickets` | Update ticket |
| PATCH | `/tickets/:id/assign` | `manage-tickets` | Assign ticket |
| PATCH | `/tickets/:id/status` | `manage-tickets` | Change status |
| POST | `/tickets/:id/comments` | `view-tickets` | Add comment |

**Validation:** `ticket.validation.ts`

**Tests:**
- Ticket lifecycle (open → in-progress → resolved → closed)
- SLA deadline calculation
- Auto-assignment logic
- Comment attachment flow
- Reopen validation

### Client Plan

**Module:** `client/src/features/help-desk/`

**Pages:**
- `TicketsPage.tsx` — list with filters, status badges, priority indicators
- `TicketDetailPage.tsx` — full view with comment thread, status transitions
- `TicketFormPage.tsx` — create/edit ticket
- `TicketDashboardPage.tsx` — stats overview for admins

**Components:**
- `TicketStatusBadge.tsx`
- `TicketPriorityBadge.tsx`
- `TicketCommentList.tsx`
- `TicketCommentForm.tsx`
- `TicketSlaIndicator.tsx`

**Hooks:**
- `useTickets.ts`
- `useTicketMutations.ts`
- `useTicketStats.ts`

**Services:** `ticketService.ts`

**Route:** `/help-desk/*` (inside AppLayout)
- `/help-desk` — ticket list/dashboard
- `/help-desk/new` — create ticket
- `/help-desk/:id` — ticket detail

### Fallbacks
- **SLA breach notification:** Auto-notify assigned user + their manager when SLA breached
- **Orphan tickets:** Weekly cron reports tickets with no assignment for 24h
- **Duplicate prevention:** Check for similar open tickets by same creator before creating
- **Audit:** All status changes and assignments logged via existing Audit module

---

## Development Rules (Phase 1)

1. **Order of implementation per feature:** Server model → Server service → Server controller → Server routes → Client service → Client hooks → Client pages → Tests → Audit wiring → Verify end-to-end
2. **Each feature must have a Settings toggle** to disable it entirely
3. **All API endpoints must use existing `authenticate` + `authorize` middleware**
4. **All mutations must be logged** via the existing Audit service
5. **UI must match existing Ant Design patterns** — refer to employees or attendance modules
6. **No feature starts until previous feature tests pass**
7. **Rollback plan:** Disable feature toggle → remove routes → clean up data if needed
