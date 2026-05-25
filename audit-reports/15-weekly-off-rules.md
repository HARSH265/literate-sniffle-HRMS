# Audit Report: Weekly Off Rules Module

**Date:** May 25, 2026
**Files audited:** 7 (4 server, 2 client, 1 model)

| Layer | Files |
|-------|-------|
| Server Routes | `server/src/modules/weekly-off-rules/weeklyOffRules.routes.ts` |
| Server Controller | `server/src/modules/weekly-off-rules/weeklyOffRules.controller.ts` |
| Server Service | `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| Server Validation | `server/src/modules/weekly-off-rules/weeklyOffRules.validation.ts` |
| Server Model | `server/src/models/WeeklyOffRule.model.ts` |
| Client Service | `client/src/features/weekly-off-rules/services/weeklyOffRuleService.ts` |
| Client Page | `client/src/features/weekly-off-rules/pages/WeeklyOffRulesPage.tsx` |
| Client Settings (secondary) | `client/src/features/settings/pages/SettingsPage.tsx` (Lines 1013-1054) |
| Seed | `server/src/seeds/index.ts` (Lines 153-168) |

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | `/api/v1/weekly-off-rules` | ✅ `authenticate` | ✅ `view-departments` | none |
| GET | `/api/v1/weekly-off-rules/:id` | ✅ `authenticate` | ✅ `view-departments` | none |
| POST | `/api/v1/weekly-off-rules` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `createWeeklyOffRuleSchema` |
| PATCH | `/api/v1/weekly-off-rules/:id` | ✅ `authenticate` | ✅ `manage-departments` | ✅ `updateWeeklyOffRuleSchema` |
| DELETE | `/api/v1/weekly-off-rules/:id` | ✅ `authenticate` | ✅ `manage-departments` | none |

> **Note:** Route paths are relative to base `/api/v1/weekly-off-rules`.

---

## Issues Found

### 🔴 Critical

#### 1. `applicableTo` vs `category` field name mismatch (Settings Page)
**File:** `client/src/features/settings/pages/SettingsPage.tsx` (Line 245)
**Severity:** Data corruption — rules silently get wrong category.

The `SettingsPage.tsx` weekly-off modal uses a form field named `applicableTo` (line 245: `<Form.Item name="applicableTo">`), but the server expects `category`. Zod's default `.strip()` behavior removes unknown keys during validation, so `applicableTo` is silently dropped and `category` falls back to `'all'` (the model default).

**Impact:** Any weekly off rule created from the Settings page will always have `category: 'all'` regardless of what the user selects in "Applicable To". The UI shows correct options (`worker`, `office-staff`, `all`) but the value is never stored.

#### 2. Off-days format mismatch (Settings Page)
**File:** `client/src/features/settings/pages/SettingsPage.tsx` (Line 230)
**Severity:** Only single off-day supported via Settings, vs multi-day elsewhere.

The Settings modal uses a single `<Select>` for `offDay` (value is a single number) and transforms it via `offDays: [Number(values.offDay)]`. The main `WeeklyOffRulesPage.tsx` uses `<Select mode="multiple">` allowing multiple off-days. This means settings-page users can never create multi-day rules (e.g., Saturday + Sunday). If a rule is edited on the main page to have multiple off-days, the Settings page cannot represent it.

#### 3. Missing `updatedBy` on model
**File:** `server/src/models/WeeklyOffRule.model.ts` (Line 8)
**Severity:** No audit trail for who last modified a rule.

The `IWeeklyOffRule` interface and schema only define `createdBy` (line 8, line 26). The service passes `updatedById` to `AuditService.log()` (service line 84), but never stores it on the document. After an update, there is no record of who updated the rule within the document itself.

#### 4. Cache invalidation never called
**File:** `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts`
**Severity:** Stale cached data.

`CacheService.invalidateWeeklyOffRules()` exists (see `server/src/core/cache/CacheService.ts` lines 51-53) but is never invoked in the service layer — not in `create()`, `update()`, or `delete()`. Other modules (e.g., shifts) call their respective `CacheService.invalidate*()` methods after mutations. This means the weekly-off cache is never cleared and consumers will see stale data until TTL expires (3600s default).

#### 5. Missing query invalidation on SettingsPage delete
**File:** `client/src/features/settings/pages/SettingsPage.tsx` (Line 1021)
**Severity:** Stale UI after delete.

The `WeeklyOffSection` inside `SettingsPage.tsx` has a `deleteMutation` with `onSuccess: () => { message.success('Rule deleted'); }` — it does **not** call `queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] })`. After deleting a rule from the Settings page, the list will not refresh until the user navigates away and back (or manually refreshes).

---

### 🟡 Medium

#### 6. Category uniqueness check too broad — blocks inactive rules
**File:** `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` (Lines 46-49)
**Severity:** Cannot create a new rule for a category if a previous (even inactive) one exists.

```typescript
const existing = await WeeklyOffRule.findOne({ category });
if (existing) {
  throw new AppError(`Weekly off rule already exists for category: ${category}`, 400);
}
```

The check does not filter by `isActive` or `_id`. If a rule for `'worker'` is soft-deactivated (`isActive: false`), users cannot create a new active rule for the same category. Also, the check doesn't exclude the current document on update.

#### 7. Update does not prevent duplicate category
**File:** `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` (Lines 68-90)
**Severity:** Can silently create duplicate categories.

The `update()` method changes `category` without checking whether another rule already uses that category. Contrast with pattern used in departments module where `$ne: id` is used. Example: rule A has `category:'worker'`, update rule B to `category:'worker'` — succeeds, creates two `'worker'` rules.

#### 8. No duplicate-value validation on `offDays`
**File:** `server/src/modules/weekly-off-rules/weeklyOffRules.validation.ts` (Lines 9-12)
**Severity:** Invalid data shape accepted.

Zod validates `min(1)`, `max(7)`, and each element `0-6`, but does not check for duplicates. `[0, 0, 1]` passes validation even though having the same day listed twice is meaningless.

#### 9. Pagination default size mismatch (client)
**File:** `client/src/features/weekly-off-rules/pages/WeeklyOffRulesPage.tsx` (Line 184)
**Severity:** UI shows wrong "Showing X-Y of Z" range.

`defaultPageSize: 10` but the actual page size state `limit` defaults to `20` (line 38). The first load shows 20 items per page but the pagination component says "1-10 of X" because the default page size for the Ant Design pagination is 10. Same issue as departments module.

#### 10. No duplicate off-days in model validation
**File:** `server/src/models/WeeklyOffRule.model.ts` (Lines 21-24)
**Severity:** MongoDB stores data with duplicate entries.

The Mongoose validator only checks `d >= 0 && d <= 6`. There is no `$each` uniqueness check or custom validator to reject `[0, 0]`.

---

### 🟢 Minor

#### 11. Off-days not stored in sorted order
**File:** `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` (Line 52)
**Severity:** Display order inconsistency.

Days are stored in whatever order the user selects. `[6, 0]` (Saturday, Sunday) is stored and displayed in that order. Should sort ascending for consistent UI display.

#### 12. Settings modal uses `applicableTo` label but server calls it `category`
**File:** `client/src/features/settings/pages/SettingsPage.tsx` (Line 245)
**Severity:** Developer confusion / maintenance burden.

Even though the field name is wrong (Critical #1), the label "Applicable To" is also inconsistent with the main page's "Category" label. The validation schema uses `category`, the model uses `category`, the main page uses `category` — only the Settings page uses `applicableTo`.

#### 13. No text search on `name` field in list endpoint
**File:** `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` (Lines 7-35)
**Severity:** Users cannot search by rule name.

The `list()` method only supports `category` and `isActive` filters. No `search` or `name` query parameter is implemented, unlike other list endpoints (e.g., shifts, departments).

#### 14. Seed only creates a single Sunday-off rule for 'all'
**File:** `server/src/seeds/index.ts` (Lines 160-165)
**Severity:** Demo data is minimal.

Only one weekly off rule is seeded (Sunday for all categories). Production-like demo data would include rules for `worker` and `office-staff` as well.

#### 15. No test files exist
**Severity:** No automated coverage for weekly off rules.

No `*.test.ts` or `*.spec.ts` files were found for the weekly off rules module.

---

## Edge Cases Checked

| Scenario | Status | Details |
|----------|--------|---------|
| Duplicate category on create | ✅ | 400 error — `WeeklyOffRule.findOne({ category })` |
| Duplicate category on update (same ID excluded) | ❌ | **No `$ne` check** — can create duplicates via update |
| Duplicate category on update (inactive rule block) | ❌ | Check doesn't filter by `isActive` |
| Non-existent ID on get | ✅ | 404 — `AppError('Weekly off rule not found...', 404)` |
| Non-existent ID on update | ✅ | 404 — same check |
| Non-existent ID on delete | ✅ | 404 — same check |
| Empty name | ✅ | Zod `min(1)` + Mongoose `required: true` |
| Name > 100 chars | ✅ | Zod `max(100)` |
| Off days empty array | ✅ | Zod `min(1)` |
| Off days array with duplicate values | ❌ | No validation for duplicates |
| Off days value out of range (< 0 or > 6) | ✅ | Zod `min(0).max(6)` + Mongoose validator |
| Off days array > 7 items | ✅ | Zod `max(7)` |
| Invalid category enum | ✅ | Zod `z.enum(['all', 'worker', 'office-staff'])` |
| `applicableTo` sent instead of `category` | ❌ | **Silently defaults to `'all'`** — lost data |
| Cache invalidation after mutations | ❌ | Never called in service |
| Delete rule with employees assigned | ❌ | No check for employee references to this rule |
| Off days stored unsorted | 🟢 | Cosmetic — no sorting applied |
| Search with special regex chars | 🟢 | No search endpoint — N/A |
| Pagination overflow (page > total) | ✅ | MongoDB returns empty array |
| Concurrent category creation (race condition) | ⚠️ | `findOne` then `create` — not atomic |

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 Critical | 5 | `applicableTo` vs `category` field mismatch destroys data; Settings page only supports single off-day; missing `updatedBy`; cache never invalidated; Settings delete doesn't refresh |
| 🟡 Medium | 5 | Overly-broad uniqueness check; update allows duplicates; no duplicate off-day validation; pagination defaultSize mismatch; model lacks duplicate validation |
| 🟢 Minor | 5 | Unsorted off-days; inconsistent field label; no name search; sparse seed data; no tests |

**Total: 15 issues**

### Fixes Required

| # | Issue | Severity | Action Required | Files |
|---|-------|----------|-----------------|-------|
| 1 | `applicableTo` → rename to `category` | 🔴 | Change form field name from `applicableTo` to `category` in SettingsPage | `client/src/features/settings/pages/SettingsPage.tsx` |
| 2 | Settings page single off-day only | 🔴 | Change modal to support multi-select off-days (align with `WeeklyOffRulesPage.tsx`) | `client/src/features/settings/pages/SettingsPage.tsx` |
| 3 | Missing `updatedBy` in model | 🔴 | ✅ Fixed | `server/src/models/WeeklyOffRule.model.ts`, `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| 4 | Cache never invalidated | 🔴 | Call `CacheService.invalidateWeeklyOffRules()` in `create()`, `update()`, `delete()` | `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| 5 | Settings delete no query invalidation | 🔴 | Add `queryClient.invalidateQueries({ queryKey: ['weekly-off-rules'] })` to Settings delete onSuccess | `client/src/features/settings/pages/SettingsPage.tsx` |
| 6 | Category uniqueness too broad | 🟡 | Add `isActive: true` filter to duplicate check | `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| 7 | Update doesn't prevent duplicate category | 🟡 | Add `$ne: id` check before applying category change | `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| 8 | No duplicate off-days validation (Zod) | 🟡 | Add `.refine((days) => new Set(days).size === days.length, ...)` to both schemas | `server/src/modules/weekly-off-rules/weeklyOffRules.validation.ts` |
| 9 | Pagination defaultPageSize mismatch | 🟡 | Change `defaultPageSize: 10` to `defaultPageSize: 20` | `client/src/features/weekly-off-rules/pages/WeeklyOffRulesPage.tsx` |
| 10 | No duplicate off-days validation (Mongoose) | 🟡 | Add custom validator to reject duplicates | `server/src/models/WeeklyOffRule.model.ts` |
| 11 | Off-days unsorted | 🟢 | Sort `offDays` array before saving | `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| 12 | Wrong field label `applicableTo` | 🟢 | Rename to `category` (aligns with fix #1) | `client/src/features/settings/pages/SettingsPage.tsx` |
| 13 | No name search | 🟢 | Add `search` query param to `list()` method | `server/src/modules/weekly-off-rules/weeklyOffRules.service.ts` |
| 14 | Seed data sparse | 🟢 | Add worker + office-staff seed rules | `server/src/seeds/index.ts` |
| 15 | No tests | 🟢 | Add unit/integration tests | `server/src/modules/weekly-off-rules/` |

### Positive Notes
- ✅ Client `PATCH` matches server route (no `PUT`/`PATCH` mismatch like other modules).
- ✅ All routes have both `authenticate` and `authorize` middleware.
- ✅ Both `create` and `update` have Zod validation schemas.
- ✅ Audit logging is present for all CRUD operations.
- ✅ Timestamps (`createdAt`, `updatedAt`) are auto-managed by Mongoose.
- ✅ Response handler follows consistent pattern with `ResponseHandler`.
- ✅ Controller uses `asyncHandler` wrapper consistently.

---

**Report generated by automated audit.**
