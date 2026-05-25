# Audit Report: Settings Module

**Date:** May 25, 2026
**Files audited:** 7 (3 server, 2 client, 1 model, 1 store)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/settings` | ✅ `authenticate` | ⚠️ `view-departments` (wrong permission) | none |
| PATCH | `/api/v1/settings` | ✅ `authenticate` | ✅ `manage-settings` | none |
| POST | `/api/v1/settings/test-email` | ✅ `authenticate` | ✅ `manage-settings` | none |
| POST | `/api/v1/settings/logo` | ✅ `authenticate` | ✅ `manage-settings` | none |

---

## Issues Found

### 🔴 Critical

1. **`fromEmail` / `fromAddress` field name mismatch** — The Mongoose model schema defines `emailConfig.fromAddress` (line 251 of `CompanySettings.model.ts`) but the service (`settings.service.ts` lines 118, 136) and client (`SettingsPage.tsx` line 615) both use `fromEmail`. Since Mongoose strict mode strips unknown fields, `fromEmail` is silently dropped on save and `fromAddress` is never read. This means:
   - The test-email check `!emailConfig?.fromEmail` (line 118) will **always** evaluate to `true`, blocking test emails from being sent.
   - The `from:` field in the transport (line 136) will be `undefined`, causing sendMail to fail.
   - **Fix:** Rename model field `fromAddress` → `fromEmail`, or rename service/client to `fromAddress`. Align all three layers.

2. **Email `secure` field missing from model schema** — The client sends `emailConfig.secure` (SettingsPage.tsx line 600) and the service reads `emailConfig.secure` (line 128), but the Mongoose schema does not define a `secure` field under `emailConfig`. Mongoose strict mode strips it, so the SSL toggle on the UI is completely non-functional — SSL is always `false`.

3. **Email `fromName` field missing from model schema** — The client sends `emailConfig.fromName` (SettingsPage.tsx line 620) but the model schema has no `fromName` field. The value is silently dropped.

4. **`uploadLogo` null-safety gap** — Unlike `get()` and `update()`, the `uploadLogo()` method (line 164-169) calls `CompanySettings.findOne()` but does **not** check if the result is null. If no settings document exists (e.g., fresh database), it crashes with `TypeError: Cannot read properties of null`. The `get()` and `update()` methods properly handle this by creating a new document.

### 🟡 Medium

5. **Wrong authorization permission on GET** — The GET `/api/v1/settings` route uses `authorize('view-departments')` (line 11 of `settings.routes.ts`). This is a copy-paste error from the departments module. Settings contain sensitive data (SMTP passwords, PF/ESI rates, payroll config, etc.) and should be gated behind `manage-settings` (or a new `view-settings` permission). Currently, any role with `view-departments` (HR Staff, Accounts, Manager) can read full settings.

6. **No request validation middleware** — The settings module has no Zod/validation schema (unlike departments, shifts, etc.). The PATCH route accepts arbitrary raw `req.body` with no structural validation. Any malformed payload passes through to the database.

7. **`ptSlabs` uses `Schema.Types.Mixed`** — The Professional Tax slabs are typed as `Schema.Types.Mixed` (model line 329). This bypasses Mongoose schema validation, allowing malformed slab data to be stored.

8. **No `createdBy` tracking** — The model only has `updatedBy` but no `createdBy`. While settings is a singleton and creation is rare, the `get()` method can auto-create the document (line 30) without recording who triggered the creation.

### 🟢 Minor

9. **`getChangedFields` uses JSON.stringify comparison** — The change-detection helper (line 16) uses `JSON.stringify(oldVal) !== JSON.stringify(newVal)`. This can produce false positives/negatives for nested objects with different key orderings or Mongoose subdocuments with internal fields.

10. **Logo upload missing creation fallback** — Uploading a logo with no prior settings document crashes (see issue #4). Needs the same `if (!settings) settings = await CompanySettings.create({})` pattern used in `update()`.

11. **No pagination** — Settings is a singleton, so pagination is not applicable. No issue here.

12. **No search regex** — Settings module has no search functionality. No ReDoS risk.

13. **No Promise anti-patterns** — All service methods use proper `async/await`. No `new Promise(async...)` anti-pattern found.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| No settings document exists on GET | ✅ Auto-creates with defaults |
| No settings document exists on PATCH | ✅ Auto-creates with defaults |
| No settings document exists on POST /logo | 🔴 **CRASH** — `TypeError` on null access |
| Test email with no SMTP config | ✅ Returns `{ success: false, message: 'Email not configured...' }` |
| Test email with invalid recipient | ✅ Returns `{ success: false, message: error.message }` |
| Upload invalid file type (e.g., .exe) | ✅ Returns 400 error |
| Upload oversized file (>2MB) | ✅ Returns 400 error |
| Upload with no file in request | ✅ 400 "No file uploaded" |
| `fromEmail` never persisted due to schema mismatch | 🔴 Silently dropped, test email always blocked |
| SSL toggle (`secure`) never persisted | 🔴 Silently dropped, always false |
| `fromName` never persisted | 🔴 Silently dropped |
| Concurrent PATCH requests (race condition) | ⚠️ No atomic update — last write wins, partial data loss possible |
| Arbitrary/malformed fields in PATCH body | ⚠️ No validation — silently accepted |
| Settings read by unauthorized role | ⚠️ Uses `view-departments` permission, leaks sensitive config |
| Odd key ordering in nested objects | 🟢 `JSON.stringify` comparison may produce false change detection |
| `ptSlabs` field with invalid structure | 🟢 Schema.Types.Mixed allows any shape |
| Missing `createdBy` on auto-create | 🟢 No tracking of who initialized settings |

---

## Client PUT vs Server PATCH Check

| Server Route (HTTP Method) | Client Call | Match? |
|---------------------------|-------------|--------|
| `PATCH /api/v1/settings` | `apiClient.patch('/settings', ...)` (line 96) | ✅ **PATCH/PATCH — Match** |

No PUT/PATCH mismatch found for settings.

---

## Fixes Required

| # | Issue | Severity | Status | Files to Change |
|---|-------|----------|--------|-----------------|
| 1 | `fromEmail` vs `fromAddress` field name mismatch | 🔴 Critical | ❌ | `CompanySettings.model.ts` (rename `fromAddress` → `fromEmail`), or `settings.service.ts` + `SettingsPage.tsx` (rename `fromEmail` → `fromAddress`) |
| 2 | `secure` field missing from emailConfig model schema | 🔴 Critical | ❌ | `CompanySettings.model.ts` (add `secure: { type: Boolean, default: false }` to emailConfig) |
| 3 | `fromName` field missing from emailConfig model schema | 🔴 Critical | ❌ | `CompanySettings.model.ts` (add `fromName: { type: String }` to emailConfig) |
| 4 | `uploadLogo` null-check missing for settings document | 🔴 Critical | ❌ | `settings.service.ts` (add `if (!settings) settings = await CompanySettings.create({})` before line 165) |
| 5 | GET settings uses wrong permission `view-departments` | 🟡 Medium | ❌ | `settings.routes.ts` (change to `authorize('manage-settings')`) |
| 6 | No request validation schema for PATCH | 🟡 Medium | ❌ | Create `settings.validation.ts` with a Zod schema; add middleware to route |
| 7 | `ptSlabs` uses `Schema.Types.Mixed` with no validation | 🟡 Medium | ❌ | `CompanySettings.model.ts` (define proper nested schema for ptSlabs) |
| 8 | No `createdBy` field on auto-created settings | 🟡 Medium | ❌ | `CompanySettings.model.ts` (add `createdBy` field), `settings.service.ts` (set on creation) |
| 9 | `JSON.stringify` diffing fragile | 🟢 Minor | ❌ | `settings.service.ts` (use deep equality library or lodash `isEqual`) |

---

## Summary

- **Files audited:** 7
- **Critical issues:** 4 (`fromEmail`/`fromAddress` mismatch, missing `secure`/`fromName` in schema, `uploadLogo` null crash)
- **Medium issues:** 4 (wrong GET permission, no validation, `Mixed` type, missing `createdBy`)
- **Minor issues:** 1 (fragile change detection)
- **PUT/PATCH mismatch:** ✅ None found (client uses `patch`, server uses `PATCH`)
- **`updatedBy`:** ✅ Present in model and set in service
- **Search regex escaping:** ✅ N/A (no search features)
- **Promise anti-patterns:** ✅ None found
- **Pagination defaults:** ✅ N/A (singleton document)
- **All fixes marked ❌ — none applied yet.**
