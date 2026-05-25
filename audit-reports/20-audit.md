# Audit Report: Audit Log Module

**Date:** May 25, 2026
**Files audited:** 9 (4 server module, 2 client, 1 model, 2 core audit)

---

## Files Examined

| # | File | Path |
|---|------|------|
| 1 | Routes | `server/src/modules/audit/audit.routes.ts` |
| 2 | Controller | `server/src/modules/audit/audit.controller.ts` |
| 3 | Service | `server/src/modules/audit/audit.service.ts` |
| 4 | Validation | `server/src/modules/audit/audit.validation.ts` |
| 5 | Model | `server/src/models/AuditLog.model.ts` |
| 6 | Core Audit Service | `server/src/core/audit/AuditService.ts` |
| 7 | Core Audit Utils | `server/src/core/audit/AuditUtils.ts` |
| 8 | Core Audit Middleware | `server/src/core/audit/AuditMiddleware.ts` |
| 9 | Client Service | `client/src/features/audit/services/auditService.ts` |
| 10 | Client Page | `client/src/features/audit/pages/AuditLogsPage.tsx` |
| 11 | App entry | `server/src/app.ts` |
| 12 | Permissions config | `server/src/core/permissions/permissions.config.ts` |
| 13 | Common schemas | `server/src/core/validation/common.schemas.ts` |

---

## Route Inventory

Mount point: `app.use('/api/v1/audit-logs', auditRoutes)` — **no `auditMiddleware` applied**.

All routes use `router.use(authenticate)` + `router.use(authorize('view-audit'))`.

| Method | Path | Auth | Authorize | Validation | Notes |
|--------|------|------|-----------|------------|-------|
| GET | `/api/v1/audit-logs/` | authenticate | view-audit | auditListSchema | Paginated list |
| GET | `/api/v1/audit-logs/modules` | authenticate | view-audit | — (stateless) | Distinct modules |
| GET | `/api/v1/audit-logs/actions` | authenticate | view-audit | — (stateless) | Distinct actions |
| GET | `/api/v1/audit-logs/export` | authenticate | view-audit | MISSING | Raw query pass-through |
| GET | `/api/v1/audit-logs/stats` | authenticate | view-audit | — (stateless) | Aggregate counts |
| GET | `/api/v1/audit-logs/retention` | authenticate | view-audit | — (stateless) | Retention info |
| POST | `/api/v1/audit-logs/cleanup` | authenticate | view-audit | MISSING | Body not validated |

---

## Issues Found

### Critical

1. **`view-audit` controls data deletion** — `POST /cleanup` is guarded only by `authorize('view-audit')`, a **read** permission. Any HR_ADMIN (or SUPER_ADMIN) can permanently delete audit logs. There is no `manage-audit` permission for write/delete operations. A user trusted only to *view* logs should not be able to *delete* them.

   **Fix:** Add `manage-audit` permission to the `Permission` type, assign it only to SUPER_ADMIN (and optionally HR_ADMIN), and split the routes so that read-only endpoints use `view-audit` and destructive endpoints use `manage-audit`.

2. **No audit logging for audit module actions** — The audit routes are mounted WITHOUT `auditMiddleware` (line 127 of `app.ts`: `app.use('/api/v1/audit-logs', auditRoutes)` — no `auditMiddleware`). This means exporting audit logs (`GET /export`), fetching stats, viewing retention info, and **deleting old logs** (`POST /cleanup`) are never themselves audit-logged. This is a compliance blind spot — if a malicious insider deletes audit trails, there is no record of it.

   **Fix:** Either apply `auditMiddleware` to the audit routes, or explicitly call `AuditService.log()` inside the controller for destructive/export actions.

3. **`POST /cleanup` has no request body validation** — The controller reads `req.body.days` directly as a raw value with no Zod schema:
   ```
   const { days } = req.body;
   const retentionDays = Math.max(30, Math.min(365, Number(days) || 90));
   ```
   No schema validates `days` is a number, is within range, or even exists. While the controller clamps the value, malformed or missing input still passes through.

   **Fix:** Create a `cleanupSchema` with Zod (`z.object({ days: z.coerce.number().int().min(30).max(365).optional().default(90) })`) and apply `validate(cleanupSchema)` to the route.

### Medium

4. **`GET /export` has no validation middleware** — The route is defined as:
   ```
   router.get('/export', auditController.exportLogs);
   ```
   No `validate()` call. The `exportLogs` service method accepts raw `req.query` and builds Mongo filters from it. While the model fields are typed, invalid date strings like `?startDate=not-a-date` will produce `new Date('not-a-date')` which is `Invalid Date` in MongoDB, potentially causing unexpected query behavior or errors.

   **Fix:** Either apply `auditListSchema` (or a dedicated `exportSchema`) to this route, or add explicit validation/coercion in the service.

5. **Client `targetId` param declared but never sent** — The `AuditLogQuery` interface in `client/src/features/audit/services/auditService.ts` includes `targetId?: string`, and the server `list()` method supports filtering by `targetId`. However, the client's `list()` function never appends `targetId` to the URL search params:
   ```
   // line 49-61 of auditService.ts — targetId is NEVER appended
   if (query.page) params.append('page', ...);
   if (query.limit) params.append('limit', ...);
   if (query.module) params.append('module', ...);
   if (query.action) params.append('action', ...);
   if (query.userId) params.append('userId', ...);
   if (query.startDate) params.append('startDate', ...);
   if (query.endDate) params.append('endDate', ...);
   // targetId is MISSING
   ```

   **Fix:** Add `if (query.targetId) params.append('targetId', query.targetId);` to the list function.

6. **`exportLogs` client function also omits `targetId`** — Same issue as above: the `exportLogs` function accepts the full `AuditLogQuery` interface (including `targetId`) but only sends `module`, `action`, `startDate`, `endDate`. If a user filters by targetId on the list and then exports, the filter is lost.

   **Fix:** Add `targetId` param forwarding to the export function.

7. **Zod default limit (10) vs service fallback (20)** — `paginationSchema` in `common.schemas.ts` defaults `limit` to `10`, but the audit service's `list()` method uses `Math.min(Number(query.limit) || 20, 100)`. The client sends `limit: 20` by default, so in practice the mismatch is masked, but if validation ever runs without the client providing a limit (e.g., programmatic API calls), the Zod default of 10 will be used rather than the expected 20.

   **Fix:** Align `paginationSchema` default to 20, or change the service fallback to 10.

8. **No search/free-text filter on audit logs** — Other modules (departments, employees, shifts) support a `search` query param for filtering by name/code. The audit log list has no search capability. Users cannot search across `targetName`, `targetId`, `ipAddress`, or `userAgent`.

   **Fix:** Add a `search` field to `auditListSchema` and implement a `$or` query in the service that searches `targetName`, `targetId`, `ipAddress`, `userAgent`, and maybe `details` (with care).

9. **`sanitizeDetails()` defined but never called by AuditMiddleware** — `server/src/core/audit/AuditUtils.ts` exports a `sanitizeDetails` function that redacts sensitive fields (passwords, tokens, etc.) from audit log details. However, `AuditMiddleware.ts` never calls it:
   ```
   details: {
     query: req.query,      // <-- raw query, could contain sensitive data
     statusCode: res.statusCode,
   },
   ```
   If a request contains sensitive query parameters (e.g., `?token=abc` or `?password=secret`), those will be stored in the audit log in plain text.

   **Fix:** Apply `sanitizeDetails()` to the details object in AuditMiddleware before logging.

### Minor

10. **Action label map is incomplete** — `AuditUtils.ts` `getActionLabel()` is missing entries for several actions defined in the `AuditAction` type:
    - `export-employees`, `export-report`, `export-audit`
    - `approve`, `reject`, `download`, `view`, `activate`, `deactivate`
    - `attendance-checkin`, `attendance-checkout`, `kiosk-register`
    - `totp-enroll`, `totp-disable`
    - `generate-challan`, `generate-report`, `generate-statutory`
    - `bulk-update` (has `bulk-create` but missing `bulk-update` label)

    Missing labels fall through to returning the raw action string.

    **Fix:** Add the missing label entries.

11. **Module label map is incomplete** — Missing entries for:
    - `weekly-off` / `weekly-off-rules`
    - `overtime-rules`
    - `audit` (present but listed as `'Audit Logs'`)

12. **Export hard-limiting at 10,000 with no pagination** — The `exportLogs()` method calls `.limit(10000)` but does not support pagination or streaming. For large datasets, this will consume significant memory and may timeout.

    **Fix:** Consider generating a CSV stream for large exports, or support offset-based chunking.

13. **Client uses `useQuery` + `fetchQuery` for mutation (cleanup)** — The cleanup operation is a write (POST), but the client handles it with:
    ```
    const result = await queryClient.fetchQuery({
      queryKey: ['audit-cleanup'],
      queryFn: () => auditService.cleanupLogs(cleanupDays),
    });
    ```
    `fetchQuery` is designed for reads, not mutations. This bypasses proper mutation caching, retry behavior, and error handling patterns.

    **Fix:** Use `useMutation` from `@tanstack/react-query` instead.

14. **Sort parameter not whitelisted** — The `paginationSchema` allows `sort` to be any string (default: `'createdAt'`). This string is interpolated directly into a MongoDB sort object: `.sort({ [sort]: order })`. While Zod constrains it to a string, there is no whitelist of allowed sort fields.

    **Fix:** Add a Zod enum to `paginationSchema` that restricts `sort` to known sortable fields (e.g., `createdAt`, `action`, `module`, `targetName`).

15. **`auditMiddleware` captures raw `req.query` unconditionally** — Even for non-audit-worthy requests (e.g., health checks), the middleware captures the entire query string for every request it is applied to. This adds overhead and noise.

    **Fix:** Add a guard to skip logging for paths that don't match known modules or that are excluded (like `/health`).

---

## Edge Cases Checked

| Scenario | Status | Details |
|----------|--------|---------|
| Invalid date string in list query | Pass | Zod `coerce` handles; mongoose gracefully handles `Invalid Date` |
| Invalid date string in export query | FAIL | No validation on `/export` — `new Date('bad')` produces `Invalid Date` |
| Non-numeric `days` in cleanup body | Weak | Falls back to 90 via `Number(days) || 90`, silently ignores bad input |
| `days` out of range (0 or 500) | Pass | Clamped by `Math.max(30, Math.min(365, ...))` |
| Deleted user referenced in audit log | Pass | `populate('userId', 'name email')` returns null; fallback to 'Unknown' |
| Empty audit log table | Pass | Returns empty data array |
| Pagination overflow (page > total) | Pass | Returns empty data array |
| Export with no results | Pass | Returns empty array |
| Concurrent cleanup calls | Weak | No locking — two simultaneous POST /cleanup calls could race |
| Sort injection (`?sort=__proto__`) | Weak | `sort` is typed but not whitelisted — interpolated into `.sort({})` keys |
| Orphaned data during cleanup | Not checked | No verification that related data in other collections is cleaned up |
| Very old date range (year 1900) | Weak | Mongo will accept and try to match — may cause poor index performance |
| Missing `userId` in request | Pass | `auditMiddleware` checks `user && res.statusCode < 500` before logging |
| Sensitive data in query params (tokens, passwords) | FAIL | `req.query` stored raw; `sanitizeDetails()` exists but is not called |
| Audit log deletion not itself logged | FAIL | No audit middleware on audit routes — cleanup actions are invisible |

---

## Fixes Checklist

| # | Issue | Severity | Status | File(s) to Change |
|---|-------|----------|--------|-------------------|
| 1 | `view-audit` permits deletion | Critical | ✅ Fixed — changed to `manage-audit` | `audit.routes.ts` |
| 2 | No audit logging for audit actions | Critical | Not Fixed | `app.ts` (add middleware) or `audit.controller.ts` (explicit calls) |
| 3 | Cleanup body has no Zod validation | Critical | ✅ Fixed | `audit.routes.ts` |
| 4 | Export has no validation middleware | Medium | ✅ Fixed | `audit.routes.ts` (added `validate()`) |
| 5 | Client `targetId` declared but never sent | Medium | Not Fixed | `auditService.ts` (add param append) |
| 6 | Export client also omits `targetId` | Medium | Not Fixed | `auditService.ts` (add param append) |
| 7 | Pagination default mismatch (10 vs 20) | Medium | Not Fixed | `common.schemas.ts` or `audit.service.ts` |
| 8 | No search/free-text filter | Medium | Not Fixed | `audit.validation.ts`, `audit.service.ts` |
| 9 | `sanitizeDetails()` unused by middleware | Medium | Not Fixed | `AuditMiddleware.ts` |
| 10 | Action label map incomplete | Minor | Not Fixed | `AuditUtils.ts` |
| 11 | Module label map incomplete | Minor | Not Fixed | `AuditUtils.ts` |
| 12 | Export hard-limited to 10k rows | Minor | Not Fixed | `audit.service.ts` |
| 13 | Cleanup uses `fetchQuery` instead of `useMutation` | Minor | Not Fixed | `AuditLogsPage.tsx` |
| 14 | Sort param not whitelisted | Minor | Not Fixed | `common.schemas.ts` or `audit.service.ts` |
| 15 | Middleware captures query unconditionally | Minor | Not Fixed | `AuditMiddleware.ts` |

---

## Summary

The Audit Log module is functionally complete — it reads, filters, exports, and cleans up audit entries. The core audit service (`AuditService.log()`) is well-integrated across 20+ other modules. The model is cleanly indexed and the paginated list performs well.

**However, three critical issues undermine the module's own governance:**

1. **Deletion is too permissive** — a read permission (`view-audit`) governs a destructive operation (cleanup). A separate `manage-audit` permission is needed.
2. **The audit module audits everything except itself** — the audit routes are not passed through `auditMiddleware`, so exporting or deleting audit logs leaves no trail. This is a compliance gap.
3. **The cleanup endpoint accepts unvalidated input** — the only data deletion endpoint in the module has no Zod body validation.

**Medium concerns** include missing validation on the export endpoint, a client-side bug where `targetId` filter is silently dropped, unsanitized sensitive data in audit details, and no free-text search.

**Recommendation:** Prioritize fixes #1-#3 (critical) and #4-#9 (medium). The severities escalate in combination — for example, the lack of audit logging for cleanup (#2) combined with overly permissive deletion (#1) means a privileged insider could wipe audit trails undetected.

---

*Report generated by automated audit framework.*
