# Audit Report: Overtime Module

**Date:** May 25, 2026
**Files audited:** 15 (8 server, 2 models, 5 client)

---

## Route Inventory

### Overtime Rules (`/api/v1/overtime-rules`)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/overtime-rules` | ✅ `authenticate` | ✅ `view-departments` | none |
| GET | `/api/v1/overtime-rules/:id` | ✅ `authenticate` | ✅ `view-departments` | none |
| POST | `/api/v1/overtime-rules` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `createOvertimeRuleSchema` |
| PATCH | `/api/v1/overtime-rules/:id` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `updateOvertimeRuleSchema` |
| DELETE | `/api/v1/overtime-rules/:id` | ✅ `authenticate` | ✅ `manage-departments` | none |

### Overtime Entries (`/api/v1/overtime-entries`)

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/overtime-entries` | ✅ `authenticate` | ✅ `view-employees` | none |
| GET | `/api/v1/overtime-entries/:id` | ✅ `authenticate` | ✅ `view-employees` | none |
| POST | `/api/v1/overtime-entries` | ✅ `authenticate` | ✅ `manage-overtime` | ✅ `createOvertimeEntrySchema` |
| PATCH | `/api/v1/overtime-entries/:id` | ✅ `authenticate` | ✅ `manage-overtime` | ✅ `updateOvertimeEntrySchema` |
| DELETE | `/api/v1/overtime-entries/:id` | ✅ `authenticate` | ✅ `manage-overtime` | none |

---

## Issues Found

### 🔴 Critical

#### 1. OvertimePage date filter and search are non-functional (client-server parameter mismatch)

**Files:**
- `client\src\features\overtime\pages\OvertimePage.tsx` (lines 23-33)
- `server\src\modules\overtime-entries\overtimeEntries.service.ts` (lines 9-18)

**Description:**
The `OvertimePage` computes a date range from `monthFilter`/`yearFilter` and sends it as `startDate`/`endDate` + `search` to the API. However, the server's `OvertimeEntriesService.list()` method only looks for `employee`, `month`, and `year` query parameters, ignoring `startDate`, `endDate`, and `search` entirely. Additionally, the `PaginationUtil.parseFromObject()` extracts a `search` value but the service destructuring `{ page, limit, sort, order }` discards it.

**Impact:** The month/year filter dropdowns and the search input on the OvertimePage have no effect. All entries are returned unfiltered regardless of user selection.

**Fix:**
- Option A: Update the client to send `month` and `year` params instead of `startDate`/`endDate`.
- Option B: Update the server's `list()` to parse `startDate`/`endDate` and `search` from query params and apply them as MongoDB filters (with regex escaping for search).

---

### 🟡 Medium

#### 2. Missing `updatedBy` in both models and services

**Files:**
- `server\src\models\OvertimeRule.model.ts` (line 10 — has `createdBy` only)
- `server\src\models\OvertimeEntry.model.ts` (line 9 — has `enteredBy` only)
- `server\src\modules\overtime-rules\overtimeRules.service.ts` (lines 51-67 — `update()` never sets `updatedBy`)
- `server\src\modules\overtime-entries\overtimeEntries.service.ts` (lines 147-170 — `update()` never sets `updatedBy`)

**Description:**
Both models lack an `updatedBy` field. The `update()` methods in both services accept a `userId` parameter (used for audit logging) but never persist it on the document. The `OvertimeRule` model has `createdBy`, and `OvertimeEntry` has `enteredBy` (set on create only), but neither tracks who last modified a record.

**Impact:** Loss of audit trail for modifications. Cannot determine who changed a rule or entry after creation.

**Fix:** Add `updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }` to both schemas and set `record.updatedBy = userId` in both `update()` methods before `save()`.

---

#### 3. Overtime Rules uses department-level permissions

**File:** `server\src\modules\overtime-rules\overtimeRules.routes.ts` (lines 12-16)

| Route | Permission Used | Likely Intended |
|-------|----------------|----------------|
| GET / GET /:id | `view-departments` | `view-overtime` |
| POST / PATCH / DELETE | `manage-departments` | `manage-overtime` |

**Description:**
All overtime-rules routes use `view-departments`/`manage-departments` permission strings instead of overtime-specific permissions like `view-overtime`/`manage-overtime`. This means any user granted department permissions can also manage overtime rules, which is likely a privilege escalation / incorrect access control.

**Impact:** Users with department management access can create/edit/delete overtime rules without explicit overtime permissions.

**Fix:** Define `view-overtime` and `manage-overtime` permissions (or reuse `manage-overtime` from the entries routes) and update the authorize calls accordingly.

---

#### 4. Duplicate client service file for overtime entries

**Files:**
- `client\src\features\overtime\services\overtimeEntryService.ts` (used by `OvertimePage`)
- `client\src\features\overtime-entries\services\overtimeEntryService.ts` (unreferenced by any page)

**Description:**
Two nearly identical service files exist for overtime entries under different feature directories. The `overtime-entries/services/` copy has a simplified interface (missing `enteredBy` and timestamps). There is no page or component importing from the `overtime-entries` service, suggesting it is dead code.

**Impact:** Maintenance burden — any API change must be updated in two places. Risk of drift between the two copies.

**Fix:** Remove the unused `client\src\features\overtime-entries\services\overtimeEntryService.ts` and consolidate into a single service.

---

### 🟢 Minor

#### 5. No `isActive` filter UI on Overtime Rules page

**File:** `client\src\features\overtime-rules\pages\OvertimeRulesPage.tsx`

**Description:** The server supports filtering by `isActive` query param, but there is no UI toggle to show/hide inactive rules. Inactive rules are mixed in the table with an "Inactive" tag.

**Impact:** Minor usability issue.

**Fix:** Add a filter toggle (e.g., Switch or Select) to allow filtering active/inactive/all rules.

---

## Edge Cases Checked

| Scenario | Status | Notes |
|----------|--------|-------|
| Duplicate rule name on create | ⚠️ Not checked | No unique index on `name` in the schema |
| Non-existent ID on get/update/delete | ✅ 404 | Throws `AppError('not found', 404)` |
| Create overtime entry for future date | ✅ Blocked | Service checks `overtimeDate > today` |
| Overtime hours exceed max per day | ✅ Blocked | Rule-based check in service |
| Overtime hours exceed max per month | ✅ Blocked | Aggregate query totals month hours |
| Employee does not exist | ✅ 400 | `Employee.exists()` check |
| Empty name on rule | ✅ Zod min(1) | |
| Hours ≤ 0 or > 24 | ✅ Validated | Both Zod (0.5-24) and service (0-24) |
| Search with special regex chars | ⚠️ No search regex exists | Search param sent from client but ignored by server |
| Pagination overflow (page > total) | ✅ Returns empty array | MongoDB skip works correctly |
| Missing `overtimeRule` on entry create | ⚠️ Falls back to default rule | Finds first `isActive: true, applicableTo: 'all'` or any active rule |
| PUT/PATCH mismatch | ✅ Clean | Both client services use `apiClient.patch()` matching server `PATCH` |
| `new Promise(async...)` anti-pattern | ✅ Clean | Not present in any overtime file |
| `authorize()` missing on routes | ✅ Clean | All routes have `authorize()` |
| Pagination default mismatch | ✅ Clean | Client uses `limit=20`, server defaults to 20 |

---

## Fixes Required

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | OvertimePage date filter & search broken (client-server param mismatch) | 🔴 Critical | ❌ Not fixed |
| 2 | Missing `updatedBy` in models + services | 🟡 Medium | ✅ Fixed |
| 3 | Overtime Rules uses department-level permissions | 🟡 Medium | ❌ Not fixed |
| 4 | Duplicate client service for overtime entries | 🟡 Medium | ❌ Not fixed |
| 5 | No `isActive` filter UI on Overtime Rules page | 🟢 Minor | ❌ Not fixed |

---

## Summary

The Overtime module consists of 15 files across two sub-modules (rules + entries). Route coverage is complete: all 10 routes have `authenticate`, `authorize`, and validation where appropriate. No PUT/PATCH mismatch exists, no `new Promise(async...)` anti-patterns are present, and no `authorize()` calls are missing.

**However, one critical functional bug exists:** the Overtime Entries page's month/year filter and search input are completely non-functional because the client sends parameter names (`startDate`/`endDate`/`search`) that the server ignores (it expects `month`/`year`). This renders the primary filtering mechanism of the page broken.

Medium-severity issues include missing `updatedBy` tracking on both models, incorrect permission strings on overtime rules routes (using department permissions instead of overtime-specific ones), and a duplicate/unused client service file.

**Total: 1 🔴 Critical, 3 🟡 Medium, 1 🟢 Minor — 0 fixes applied.**
