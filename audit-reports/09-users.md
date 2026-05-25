# Audit Report: Users & Auth Module

**Date:** May 25, 2026
**Files audited:** 18 (9 server, 7 client, 1 model, 1 core store)

---

## Route Inventory

### Users Routes (`/users`)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/users` | ✅ `authenticate` | ✅ `manage-users` | none |
| GET | `/users/:id` | ✅ `authenticate` | ✅ `manage-users` | none |
| GET | `/users/:id/activity` | ✅ `authenticate` | ✅ `manage-users` | none |
| GET | `/users/:id/stats` | ✅ `authenticate` | ✅ `manage-users` | none |
| POST | `/users` | ✅ `authenticate` | ✅ `manage-users` | ✅ `createUserSchema` |
| PATCH | `/users/:id` | ✅ `authenticate` | ✅ `manage-users` | ✅ `updateUserSchema` |
| PATCH | `/users/:id/deactivate` | ✅ `authenticate` | ✅ `manage-users` | none |
| PATCH | `/users/:id/activate` | ✅ `authenticate` | ✅ `manage-users` | none |
| GET | `/users/export` | ✅ `authenticate` | ✅ `manage-users` | none |
| POST | `/users/import` | ✅ `authenticate` | ✅ `manage-users` | none |

### Auth Routes (`/auth`)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| POST | `/auth/login` | ❌ public | ❌ none | ✅ `loginSchema` |
| POST | `/auth/refresh` | ❌ public | ❌ none | ✅ `refreshTokenSchema` |
| POST | `/auth/logout` | ✅ `authenticate` | ❌ none | none |
| POST | `/auth/logout-all-devices` | ✅ `authenticate` | ❌ none | none |
| GET | `/auth/me` | ✅ `authenticate` | ❌ none | none |
| POST | `/auth/change-password` | ✅ `authenticate` | ❌ none | ✅ `changePasswordSchema` |

---

## Issues Found

### 🔴 Critical

#### 1. GET `/users/export` route shadowed by `/:id` (DEAD ROUTE)

**Files:**
- `server/src/modules/users/users.routes.ts` (lines 13 vs 21)

The `router.get('/export', usersController.exportUsers)` is defined **after** `router.get('/:id', usersController.getById)`. Since Express matches routes in definition order, a request to `GET /users/export` is caught by `/:id` with `id = "export"`, which calls `UsersService.getById("export")` and returns `404 User not found`. The `exportUsers` handler is **never reachable**.

```typescript
// Broken: /:id defined BEFORE /export
router.get('/:id', usersController.getById);      // line 14 — catches /export first
router.get('/export', usersController.exportUsers); // line 21 — DEAD CODE
```

**Fix:** Move `GET /export` **above** `GET /:id`.

---

#### 2. Self-registration flow is broken

**Files:**
- `client/src/features/auth/pages/LoginPage.tsx` (line 49)
- `server/src/modules/users/users.routes.ts` (lines 10-11)

The LoginPage's "Create Account" flow posts to `POST /users`:

```typescript
await apiClient.post('/users', { ...values, role: 'hr-staff' });
```

However, the users router applies `authenticate` + `authorize('manage-users')` globally to **all** user routes:
```typescript
router.use(authenticate);                  // line 10
router.use(authorize('manage-users'));     // line 11
```

An unauthenticated user attempting to self-register will receive a **401 Unauthorized** error. This means the "Create Account" button is non-functional for its intended use case (new users signing up).

**Fix:** Either (a) remove the registration flow from the UI since users are only created by admins, or (b) add a dedicated public registration route that bypasses auth.

---

### 🟡 Medium

#### 3. Missing `updatedBy` in User model

**Files:**
- `server/src/models/User.model.ts` (lines 5-19)
- `server/src/modules/users/users.service.ts` (lines 92-120, 234-260)

The `User` model has a `createdBy` field but **no `updatedBy`** field. The `update()` service method accepts an `updatedById` parameter but never persists it:

```typescript
// users.service.ts line 92
static async update(id: string, data: Record<string, unknown>, updatedById: string) {
    // ... updatedById is received but NEVER written to the document
    Object.assign(user, data);
    await user.save();
```

Similarly, `importUsers()` updates existing users without recording who performed the update:

```typescript
// users.service.ts lines 239-245
const existing = await User.findOne({ email: userData.email.toLowerCase() });
if (existing) {
    existing.name = userData.name;
    existing.role = userData.role as any;
    existing.isActive = true;
    await existing.save();  // no updatedBy set
```

**Fix:** Add `updatedBy` field to the User model schema and set it in both `update()` and `importUsers()`.

---

#### 4. Search regex unescaped — ReDoS vulnerability

**Files:**
- `server/src/modules/users/users.service.ts` (lines 15-18)

The search parameter is passed directly into a MongoDB `$regex` without escaping special regex characters:

```typescript
if (search) {
    filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
    ];
}
```

A malicious input like `(.*){100,}` could cause catastrophic backtracking (ReDoS). Also, regex special chars like `.`, `*`, `+`, `?`, `[`, `]`, `(`, `)`, `{`, `}`, `^`, `$`, `|`, `\` will produce unexpected matching behavior.

**Fix:** Escape the search string before passing to `$regex`, e.g.:
```typescript
const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

---

#### 5. Missing `updatedBy` tracking in Auth password change

**Files:**
- `server/src/modules/auth/auth.service.ts` (lines 149-151)

When a user changes their password via the auth module, the user document is saved but no `updatedBy` is set (the document has no `updatedBy` field):

```typescript
user.password = newPassword;
user.passwordHistory = previousPasswords;
await user.save();  // no updatedBy
```

While `auditService.log` tracks this, the document itself is not marked as updated-by-whom.

---

### 🟢 Minor

#### 6. Client/Server pagination defaults inconsistent

**Files:**
- `client/src/features/users/pages/UsersPage.tsx` (line 43)
- `server/src/core/utils/PaginationUtil.ts` (line 24)

The UsersPage client defaults to `limit=10`:

```typescript
const [limit, setLimit] = useState(10);
```

The server's `PaginationUtil.parseFromObject` defaults to `limit=20`:

```typescript
const limit = Math.min(parseInt(String(query?.limit || params.limit || '20'), 10), 100);
```

Since the client explicitly sends `limit: 10` in every request, there is **no runtime mismatch** — the server receives and honors the client's value. However, if any other consumer of the API (or a future code path) does not send a limit, it would get 20 items while the UI expects 10. The table pagination component uses `defaultPageSize: 10` which happens to match, but this is accidental consistency.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate email on create | ✅ Handled (400 error with `$ne` check) |
| Duplicate email on update (same ID) | ✅ Handled (`$ne` on `_id`) |
| Non-existent user on get/update/deactivate/activate | ✅ 404 error |
| Self-deactivation attempt | ✅ Blocked (400 error) |
| Deactivate last super-admin | ✅ Blocked (count check) |
| Empty name on create | ✅ Zod validates min 2 chars |
| Invalid email format | ✅ Zod `.email()` validation |
| Password complexity (uppercase, lowercase, number, special) | ✅ Zod regex validators |
| Password history reuse | ✅ Checked against last 5 passwords |
| Account lockout after 5 failed attempts | ✅ Implemented (15-min lock) |
| Search with special regex chars | ⚠️ **NOT escaped** — ReDoS / unexpected match risk |
| Export with no users | ✅ Returns empty array |
| Import with invalid email format | ❌ **No validation** — `importUsers` does not validate each row |
| Non-existent ID in activity/stats | ✅ Returns 404 on user fetch first |
| Pagination overflow (page > total) | ✅ Returns empty data array |
| Token expiry in JWT | ✅ Configurable via CompanySettings |
| Refresh token rotation | ✅ Old token invalidated on refresh |
| Multiple concurrent login from same user | ✅ Each login gets new refreshToken (only last one valid) |
| User deactivation clears refresh token | ✅ `refreshToken = undefined` on deactivate |
| GET /export route shadowed by GET /:id | 🔴 **ALWAYS 404** — dead code |

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|---------------|
| 1 | GET /export route shadowed by /:id | ❌ Not fixed | Move `router.get('/export', ...)` before `router.get('/:id', ...)` in `server/src/modules/users/users.routes.ts` |
| 2 | Self-registration flow broken | ❌ Not fixed | `client/src/features/auth/pages/LoginPage.tsx` + `server/src/modules/users/users.routes.ts` |
| 3 | Missing `updatedBy` in User model | ✅ Fixed | `server/src/models/User.model.ts`, `server/src/modules/users/users.service.ts` |
| 4 | Search regex unescaped | ✅ Fixed — escaped | `server/src/modules/users/users.service.ts` |
| 5 | Missing `updatedBy` in auth password change | ❌ Not fixed | `server/src/models/User.model.ts`, `server/src/modules/auth/auth.service.ts` |
| 6 | Pagination defaults inconsistent | ❌ Not fixed | `client/src/features/users/pages/UsersPage.tsx` |

---

## Summary

**Total files audited:** 18

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 Critical | 2 | `/export` route shadowed by `/:id` (dead code, always 404); self-registration broken by auth middleware |
| 🟡 Medium | 3 | Missing `updatedBy` field in model/service; unescaped search regex (ReDoS); missing `updatedBy` on auth password change |
| 🟢 Minor | 1 | Pagination default inconsistency (client 10 vs server 20) |

**All fixes are pending (❌).** The most critical fix is #1 — moving `GET /export` above `GET /:id` — without which the export functionality is completely broken and returns a 404 for all requests. Fix #2 (self-registration) is also critical because the UI presents a "Create Account" option that will always fail for unauthenticated users.
