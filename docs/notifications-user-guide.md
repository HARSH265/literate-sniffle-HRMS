# Notifications – End‑User Guide
---
## 1. Overview
The **Notifications** module delivers real‑time in‑app alerts for key events: leave approvals, payroll processing, shift swaps, announcements, and help‑desk updates. Notifications appear in the bell icon dropdown and on the dedicated Notifications page.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View notifications list | `view-notifications` |
| Mark notification as read | `view-notifications` |
| Mark all notifications as read | `view-notifications` |

If you lack permission the notification bell and page are hidden.

## 3. Related Settings
- **notificationConfig.inAppEnabled** – Enable/disable in‑app notifications.
- **notificationConfig.emailEnabled** – Whether notifications also trigger an email.

## 4. UI Pages & Workflow
- **Bell Icon** (header bar): Shows unread count badge. Clicking opens a dropdown with the latest 10 unread notifications.
- **Notifications Page** (`/notifications`): Full paginated list of all notifications with filters (read/unread). Each entry shows title, message, type icon, timestamp, and a read/unread indicator.
- **Mark as Read** – Clicking a notification opens the related page and marks it as read.
- **Mark All as Read** – Button on the Notifications page clears all unread notifications.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/notifications` | List notifications (paginated, filter: `isRead`) | `view-notifications` |
| GET | `/notifications/unread-count` | Get count of unread notifications | `view-notifications` |
| PATCH | `/notifications/:id/read` | Mark a single notification as read | `view-notifications` |
| PATCH | `/notifications/mark-all-read` | Mark all notifications as read | `view-notifications` |

## 6. Edge Cases & Gotchas
- **Real‑time** – New notifications are pushed via Socket.io; the bell badge updates without page refresh.
- **Retention** – Notifications older than 90 days are automatically archived.
- **Email duplicates** – If both in‑app and email are enabled, the user receives both; there is no deduplication.

## 7. Quick Actions Summary
- **View Notifications** → Click bell icon → browse list.
- **Mark Read** → Click a notification → marks as read and navigates to source.
- **Mark All Read** → Notifications page → **Mark All as Read** button.

*Generated on **2026‑06‑12***