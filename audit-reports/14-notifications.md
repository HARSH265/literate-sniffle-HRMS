# Audit Report: Notifications Module

**Date:** May 25, 2026
**Files audited:** 7 (4 server, 2 client, 1 core hook)

| Layer | File |
|-------|------|
| Server route | server/src/modules/notifications/notifications.routes.ts |
| Server controller | server/src/modules/notifications/notifications.controller.ts |
| Server service (module) | server/src/modules/notifications/notifications.service.ts |
| Server service (core) | server/src/core/notification/NotificationService.ts |
| Model | server/src/models/Notification.model.ts |
| Client service | client/src/features/notifications/services/notificationService.ts |
| Client page | client/src/features/notifications/pages/NotificationsPage.tsx |
| Client hook | client/src/core/hooks/useNotify.ts |

---

## Route Inventory

Base path: /api/v1/notifications (registered at server/src/app.ts:126)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | / | authenticate | view-employees | none |
| GET | /unread-count | authenticate | view-employees | none |
| PATCH | /:id/read | authenticate | view-employees | none |
| PATCH | /mark-all-read | authenticate | view-employees | none |

No validation middleware (validate()) is used on any route. Every other audited module uses validate() for at least write operations.

---

## Issues Found

### Critical

#### 1. Missing ownership check in module-level markAsRead - any user can mark any notification as read

The controller calls NotificationsService.markAsRead(req.params.id) (module-level service), which does:

`
static async markAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
}
`

This performs **no recipient guard**. An authenticated user can guess another user's notification ID and mark it as read. The **core** NotificationService.markAsRead DOES include a recipient check:

`
static async markAsRead(notificationId: string, userId: string): Promise<void> {
  await Notification.updateOne(
    { _id: notificationId, recipient: userId },
    { isRead: true },
  );
}
`

But the route/controller uses the **module-level service** instead, which omits the ownership filter.

**Fix:** Delegate to NotificationService.markAsRead (core) or add { recipient: userId } to the query in the module-level service.

#### 2. Route ordering makes mark-all-read unreachable - Express catches it as /:id/read

Routes are registered in this order:

`
router.patch('/:id/read', authorize('view-employees'), notificationsController.markAsRead);       // line 12
router.patch('/mark-all-read', authorize('view-employees'), notificationsController.markAllAsRead); // line 13
`

Express resolves routes top-to-bottom. A PATCH /notifications/mark-all-read request hits the first route /:id/read with id = "mark-all" and then expects a trailing /read segment, which does not exist - resulting in a **404**.

However, upon closer inspection: the Express pattern /:id/read requires **two path segments** after the base (/something/read), while mark-all-read is only **one segment**. Since they differ in segment count, Express will NOT match /:id/read against /mark-all-read. The two patterns are structurally distinct and could actually both work. This finding is **downgraded to a warning** - but if the URL were ever /mark-all/read it would collide. The current URL /mark-all-read (hyphenated, single segment) is safe.

**Risk level adjustment:** This is actually **not a bug** due to different path segment counts. The order is safe for the current route shape. However, if a future route like PATCH /:id/mark were added after /:id/read, it would be shadowed. No fix needed for the current set.

---

### Medium

#### 3. No request validation on any route (missing validate() middleware)

All four routes lack validate() middleware. Other modules consistently use it on write operations (POST, PATCH, DELETE). For notifications:
- PATCH /:id/read - no validation that :id is a valid MongoDB ObjectId. If an invalid ID is passed, Mongoose throws a CastError (500 Internal Server Error) instead of a 400 Bad Request.
- PATCH /mark-all-read - this is safe (no params).
- GET / - no validation/sanitization of query params (limit, page, module, isRead).

**Fix:** Add at minimum an ObjectId validation for :id on the /:id/read route.

#### 4. Wrong authorization permission: view-employees used for notifications

Notifications are user-personal resources. Every authenticated user should see their own notifications. The route currently gates all endpoints behind authorize('view-employees'), which means:
- **ACCOUNTS** role does NOT have view-employees but still needs to receive payroll notifications.
- **MANAGER** role does NOT have view-employees (see permissions.config.ts) but should see leave-approval notifications.

Only super-admin, hr-admin, and hr-staff have view-employees, which excludes accounts and managers from accessing their own notifications entirely.

**Fix:** Either remove the authorize() call (rely on authenticate only since data is scoped to userId), or introduce a view-notifications permission and assign it to all roles.

#### 5. markAsRead accepts any notification ID without scoping to user

Even if the route-order concern is technically not a bug, the controller for markAsRead (/:id/read) does not verify that the notification belongs to the authenticated user. The core NotificationService.markAsRead accepts a userId parameter and scopes the query, but the module-level NotificationsService.markAsRead does not take or use the userId. The controller extracts userId but never passes it.

**Fix:** Change the module service signature to markAsRead(notificationId: string, userId: string) and add recipient: userId to the filter (mirroring the core service).

#### 6. Module-level NotificationsService duplicates core NotificationService logic

There are two parallel notification service classes:
- server/src/modules/notifications/notifications.service.ts - NotificationsService
- server/src/core/notification/NotificationService.ts - NotificationService

Both have markAsRead, markAllAsRead, getUnreadCount, and createNotification (module) / send (core). The module-level service's markAsRead **lacks the ownership check** that the core service has. This duplication is a maintenance risk - any fix to one may not be applied to the other.

**Fix:** Consider having the module service delegate to the core service, or consolidate into a single service.

#### 7. Inbox-style: isRead is boolean but only markAsRead (one-way) is supported

There is no way to mark a notification as **unread** (toggle back). The API only supports markAsRead. While this is often intentional (notifications are "dismissed"), it can be a UX limitation if users accidentally mark something as read.

**Fix:** Optionally add a PATCH /:id/unread route or accept a body { isRead: boolean } on the existing PATCH /:id/read.

---

### Minor

#### 8. No pagination validation - user-supplied limit/page can cause negative skip

In NotificationsService.getUserNotifications:

`
const limit = parseInt(query.limit || '20');
const page = parseInt(query.page || '1');
const skip = (page - 1) * limit;
`

If a client sends page=0 or page=-1, the skip becomes negative (-20). Mongoose skip(-20) behaves unpredictably (can return empty or throw). If limit=0, results are truncated to 0. If limit is negative, Mongoose returns all documents.

**Fix:** Clamp page to min 1 and limit to a reasonable max (e.g., 100) after parsing.

#### 9. Module filter uses hardcoded string values in client

The NotificationsPage.tsx filter dropdown uses hardcoded module values:

`
const moduleIcons: Record<string, string> = {
  payroll: 'Payroll',
  employees: 'Employee',
  users: 'User',
  attendance: 'Attendance',
};
`

But the model schema allows **any** string for module. The core NotificationService.sendEmailIfEnabled also handles leave and leave-approval modules, which are missing from the client-side filter. A notification created with module: 'leave' would appear in the list but cannot be filtered by the UI dropdown.

**Fix:** Add leave and leave-approval to the client filter options.

#### 10. No tests for notifications

No test files were found matching *notif*test* or *test*notif*. Neither unit tests for the service/controller nor integration tests for the routes exist.

**Fix:** Add unit tests for both the module-level and core notification services.

#### 11. useNotify hook is named confusingly

The hook at client/src/core/hooks/useNotify.ts wraps Ant Design's message API for toast notifications (in-app popup alerts), not the server-side notification system. This naming overlap with the Notification model and notificationsService creates confusion about what "notify" refers to.

**Fix:** Rename to useToast or keep as-is with documentation clarifying the distinction.

#### 12. Core NotificationService.send swallows errors silently

`
static async send(data: NotificationData): Promise<void> {
  try {
    await Notification.create({ ... });
    await this.sendEmailIfEnabled(data);
  } catch (error) {
    logger.error('Notification send failed:', error);
  }
}
`

If notification creation fails, the error is logged but the caller (payroll.service.ts, employees.service.ts, etc.) has no way to know the notification was not sent. The Promise resolves as void even on failure.

**Fix:** Re-throw or return a result object so callers can handle failures (or at least log them at the call site).

#### 13. sendEmailIfEnabled does not handle missing notificationConfig

`
const settings = await CompanySettings.findOne().lean();
const notifConfig = (settings as any)?.notificationConfig;
if (!notifConfig?.emailEnabled) return;
`

If settings is null (no CompanySettings document exists), notifConfig will be undefined, and the function returns early. This is safe but should log a warning so an administrator knows email notification config is missing.

**Fix:** Add a logger.warn when settings is null or notificationConfig is missing.

---

## Edge Cases Checked

| Scenario | Status | Notes |
|----------|--------|-------|
| Negative page number (page=-1) | Vulnerable | skip(-20) - Mongoose returns all documents |
| Zero page number (page=0) | Vulnerable | skip(-20) - same as above |
| Zero limit (limit=0) | Vulnerable | Returns 0 results, API says pages: Infinity due to division by zero |
| Negative limit (limit=-5) | Vulnerable | Mongoose returns all documents |
| Exceedingly large limit (limit=999999) | Vulnerable | No cap - could be a DoS vector |
| Invalid ObjectId in /:id/read | Vulnerable | Mongoose CastError to 500 Internal Server Error (no validation) |
| Notification owned by another user | Vulnerable | No recipient check in module-level markAsRead - can mark any notification |
| Non-existent notification ID | Handled | Mongoose returns null, controller returns success with null data |
| Empty string isRead filter | Handled | query.isRead === 'true' is false, so it is not added to filter |
| module filter with no matches | Handled | Returns empty array and pagination with total: 0 |
| No notifications exist | Handled | Page shows Empty component |
| Concurrent markAllAsRead calls | Handled | updateMany is atomic at the DB level |
| Email notification to user without email | Handled | Returns early if no email |
| Email notification when config missing | Partial | Returns early but no warning logged |
| CompanySettings document missing | Partial | Returns early but no warning logged |
| Calling markAsRead on already-read notification | Handled | Idempotent - isRead: true set to true again, no error |
| useNotify toast vs server notification confusion | Minor | Same word used for two different concepts |
| Route ordering: /mark-all-read vs /:id/read | Safe | Different segment counts prevent collision (1 vs 2) |
| Missing createdBy/updatedBy on Notification model | Not needed | Notifications are system-generated, not user-created |
| No createdAt/updatedAt timestamps | Present | timestamps: true on schema |
| Database indexes | Present | Indexes on recipient, isRead, createdAt |

---

## Summary of Fixes Required

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Missing ownership check in module-level markAsRead - can mark any user's notification | Critical | ✅ Fixed |
| 2 | No validation middleware on any route | Medium | Unfixed |
| 3 | Wrong authorization permission view-employees - excludes accounts and managers | Medium | Unfixed |
| 4 | markAsRead does not scope to userId in module service | Medium | ✅ Fixed |
| 5 | Duplicate notification service logic (module + core) with inconsistent behavior | Medium | Unfixed |
| 6 | No pagination validation - negative/zero page/limit cause erratic behavior | Minor | Unfixed |
| 7 | Client module filter missing leave and leave-approval | Minor | Unfixed |
| 8 | No tests for notifications | Minor | Unfixed |
| 9 | useNotify naming collision with server notification concept | Minor | Unfixed |
| 10 | Core send() swallows errors - caller never knows if notification failed | Minor | Unfixed |
| 11 | sendEmailIfEnabled missing warn log when config is absent | Minor | Unfixed |