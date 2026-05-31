# HRMS Client — Complete Audit Report

**Date:** 2026-05-31
**Stack:** React 18 + TypeScript + Ant Design 5 + TanStack Query v5 + Zustand + Vite
**Score:** 6.5/10

---

## 1. Architecture Overview

### Structure
```
client/src/
├── core/           # Shared: api, components, hooks, stores, utils, constants, socket
├── features/       # 30 feature modules (each with pages/services/hooks/components)
├── layout/         # AppLayout, Header, Sidebar
├── types/          # Shared TypeScript interfaces
└── test/           # Vitest setup + custom render
```

### Data Flow Pattern
```
Page Component → useQuery(useXxx hooks) → Service (apiClient) → Server API
                                    ↓
                              TanStack Query Cache
                                    ↓
                              Zustand Store (auth/settings/ui)
```

### Routing
- ~70+ lazy-loaded pages via `React.lazy()` + `Suspense`
- Two layout shells: `AppLayout` (admin) + `EssLayout` (employee self-service)
- Smart home path: mobile/employee → `/ess`, admin → `/dashboard`
- All routes protected via `ProtectedRoute` with optional permission gates

### Key Metrics
| Metric | Before | After |
|--------|--------|-------|
| Feature modules | 30 | 30 |
| Total page components | ~70 | ~70 |
| Total service files | ~30 | ~30 |
| Total hook files | ~20 | ~20 |
| Total shared components | 14 | 9 |
| `as any` casts | 32 | 32 |
| Orphaned files | 20 | **0** |
| Raw `fetch()` calls | 2 | **0** |
| Duplicate type definitions | 12 | **0** |
| Hardcoded passwords | 1 | **0** |

---

## 2. Core Infrastructure (Score: 7/10)

### What's Good

| Component | Quality | Notes |
|-----------|---------|-------|
| `apiClient.ts` | **Excellent** | Token refresh queue, 401 retry, concurrent request handling |
| `queryClient.ts` | **Good** | 5min stale, 10min GC, 1 retry, no refetch on focus |
| `authStore.ts` | **Good** | Zustand persisted, hydration handling |
| `ProtectedRoute.tsx` | **Good** | Auth + permission gate with `requireAll` flag |
| `DataTable.tsx` | **Excellent** | Generic typed table, server pagination, filters, detail drawer |
| `ErrorBoundary.tsx` | **Good** | Retry + navigation fallback |
| `PageHeader.tsx` | **Good** | Breadcrumbs + title + actions |
| `StatusBadge.tsx` | **Good** | Color-coded status tags |
| `usePermission.ts` | **Good** | Role + permission checking |
| `permissions.ts` | **Good** | 51 permissions, 5 roles, full role→permission map |
| `api.endpoints.ts` | **Good** | Centralized API paths |
| `queryKeys.ts` | **Good** | Centralized query key definitions |

### What Drags It Down

| Issue | Impact | Location |
|-------|--------|----------|
| 32 `as any` casts in production | Type safety holes | Throughout codebase |
| `socketClient.ts` only used in kiosk | Limited utility | `core/socket/socketClient.ts` |

---

## 3. Module-by-Module Audit

### Table Consistency

**Modules using `DataTable` (all consistent — 23 modules):**
1. `employees` — EmployeesPage.tsx
2. `departments` — DepartmentsPage.tsx
3. `designations` — DesignationsPage.tsx
4. `shifts` — ShiftsPage.tsx
5. `attendance` — AttendancePage.tsx (Records tab only)
6. `overtime` — OvertimePage.tsx
7. `overtime-rules` — OvertimeRulesPage.tsx
8. `payroll` — PayrollPage.tsx
9. `leave` — LeaveApplicationsPage.tsx
10. `loans` — LoansPage.tsx
11. `users` — UsersPage.tsx
12. `notifications` — NotificationsPage.tsx
13. `audit-logs` — AuditLogsPage.tsx
14. `statutory` — StatutoryDashboard.tsx
15. `holidays` — HolidaysPage.tsx
16. `weekly-off-rules` — WeeklyOffRulesPage.tsx
17. `helpdesk` — HelpdeskPage.tsx ✅ (migrated)
18. `announcements` — AnnouncementsPage.tsx ✅ (migrated)
19. `documents` — DocumentsPage.tsx ✅ (migrated)
20. `assets` — AssetsPage.tsx ✅ (migrated)
21. `performance` — PerformancePage.tsx (2 DataTables) ✅ (migrated)
22. `training` — TrainingProgramsPage.tsx ✅ (migrated)
23. `shift-swaps` — ShiftSwapsPage.tsx ✅ (migrated)

**Modules with no table (N/A — 7 modules):**
1. `auth` — Forms only (login, forgot-password, reset-password)
2. `settings` — Forms only (20+ settings sections)
3. `attendance-qr` — Custom QR scan UI
4. `kiosk` — Custom kiosk dashboard UI
5. `ESS` — Custom employee self-service dashboard (12 pages)
6. `rule-book` — Static documentation page
7. `reports` — Charts + export UI (no data table)

### Loading States

| Pattern | Modules |
|---------|---------|
| **DataTable skeleton** | None — no module uses skeleton loading |
| **Spin/loading boolean** | attendance-qr, ESS |
| **Nothing** | All other modules |

**Verdict: 0 out of 30 modules use proper skeleton loading.** This is a major UX gap.

### Service Layer Consistency

| Pattern | Modules |
|---------|---------|
| **apiClient + typed service** | employees, departments, designations, shifts, attendance, overtime, overtime-rules, payroll, leave, loans, helpdesk, announcements, documents, assets, users, notifications, audit-logs, statutory, holidays, weekly-off-rules, ESS |
| **apiClient direct (no service)** | reports (804-line page calls apiClient directly) |
| **raw `fetch()`** | payroll (PayrollDetailsPage PDF download), kiosk (KioskPage QR token) |
| **Untyped service** | shift-swaps (all `any`) |

### Security Concerns

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| `TempPass123` hardcoded default password | **High** | **Fixed** — now uses `crypto.getRandomValues` | `features/users/pages/UsersPage.tsx:111` |
| Raw `fetch()` bypasses auth interceptors | **High** | **Fixed** — replaced with `apiClient` | `PayrollDetailsPage.tsx`, `KioskPage.tsx` |
| `admin@hrms.com` hardcoded in login | **Low** | Placeholder only | `features/auth/pages/LoginPage.tsx:77,172` |

### Page Size (Lines)

| Page | Lines | Status |
|------|-------|--------|
| **ReportsPage.tsx** | **804** | Needs split |
| SettingsPage.tsx | 533 | Needs split |
| AttendancePage.tsx | 467 | Borderline |
| AuditLogsPage.tsx | 346 | Borderline |
| ScanPage.tsx | 309 | Borderline |
| RuleBookPage.tsx | 307 | Static, OK |
| HelpdeskPage.tsx | 304 | Borderline |
| HolidaysPage.tsx | 317 | Borderline |
| OvertimePage.tsx | 294 | OK |
| EmployeesPage.tsx | 280 | OK |
| UsersPage.tsx | 284 | OK |
| DashboardPage.tsx | ~250 | OK |
| All others | <250 | OK |

### Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| auth | 2 | Partial |
| employees | 5 | Good |
| departments | 1 | Minimal |
| designations | 1 | Minimal |
| shifts | 1 | Minimal |
| attendance | 2 | Partial |
| overtime | 1 | Minimal |
| overtime-rules | 1 | Minimal |
| payroll | 5 | Good |
| leave | 4 | Good |
| loans | 2 | Partial |
| helpdesk | 5 | Good |
| announcements | 3 | Good |
| users | 1 | Minimal |
| holidays | 2 | Partial |
| settings | 1 | Minimal |
| ESS | 7 | Good |
| kiosk | 1 | Minimal |
| notifications | 1 | Minimal |
| statutory | 1 | Minimal |
| **documents** | **0** | None |
| **assets** | **0** | None |
| **performance** | **0** | None |
| **training** | **0** | None |
| **shift-swaps** | **3** | Good |
| **reports** | **1** | Minimal |
| **audit-logs** | **0** | None |
| **weekly-off-rules** | **0** | None |
| **rule-book** | **0** | None |

---

## 4. Orphaned Files (0 files — all resolved)

**Phase 1 completed. All 20 orphaned files deleted:**
- `types/shared.ts` → recreated with canonical `PaginatedResponse<T>`, imported by 12 services
- `core/stores/settingsStore.ts` → deleted
- `core/hooks/useDebounce.ts`, `useFileUpload.ts`, `usePagination.ts` → deleted
- `core/utils/FormatUtil.ts`, `DateUtil.ts`, `DownloadUtil.ts` → deleted
- `core/components/PermissionGate.tsx` → deleted
- `core/components/EmptyState.tsx`, `CardSkeleton.tsx`, `FormSkeleton.tsx`, `TableSkeleton.tsx`, `ConfirmModal.tsx` → deleted (+ test files)
- `features/performance/components/RatingScale.tsx`, `CycleProgressBar.tsx`, `GoalCard.tsx` → deleted
- `features/employee-self-service/components/ChangeRequestBadge.tsx`, `ProfileField.tsx` → deleted
- `features/attendance-qr/components/KioskQR.tsx` → deleted

---

## 5. `as any` Type Safety Issues (32 occurrences)

| Location | Count | Example |
|----------|-------|---------|
| `App.tsx` | 1 | `user.role as any` |
| `DataTable.tsx` | 2 | `(value as any).name` |
| `PayrollPage.tsx` | 2 | `(runsData as any)?.data` |
| `SettingsPage.tsx` | 1 | `(location.state as any)?.section` |
| `EssDashboardPage.tsx` | 4 | `profileData?.data as any` |
| `PerformanceReviewDetailPage.tsx` | 1 | `data?.data as any` |
| `UsersPage.tsx` | 1 | `XLSX.utils.sheet_to_json(sheet) as any[]` |
| `ScanPage.tsx` | 2 | `(window as any).BarcodeDetector`, `(res.data as any).isLate` |
| `EssAttendancePage.tsx` | 1 | `profileData?.data as any` |
| `EssProfilePage.tsx` | 3 | `(profile.department as any)?.name` |
| Other files | 15 | Various |

---

## 6. Duplicate Type Definitions (0 remaining — all resolved)

**Phase 1 completed.** `types/shared.ts` recreated with canonical `PaginatedResponse<T>`. All 12 service files now import from it instead of redeclaring locally.

---

## 7. Raw `fetch()` Bypassing apiClient (0 remaining — all resolved)

**Phase 1 completed. Both raw `fetch()` calls replaced with `apiClient`:**
- `PayrollDetailsPage.tsx` → uses `apiClient.get()` with `responseType: 'blob'`
- `KioskPage.tsx` → uses `apiClient.get()` for QR token fetch

---

## 8. Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 8/10 | Clean modular structure, good separation |
| API Client | 9/10 | Token refresh queue is excellent |
| State Management | 8/10 | Zustand + TanStack Query well-chosen |
| Type Safety | 6.5/10 | 32 `as any`, 1 untyped service (duplicates resolved) |
| Component Reuse | 9/10 | ~~7 modules used raw Table~~ → all 23 table modules now use DataTable |
| Loading States | 3/10 | Zero skeleton loading in any module |
| Error Handling | 7/10 | Consistent error catching, but no global error boundary for data |
| Test Coverage | 5/10 | 8 modules have zero tests |
| Code Hygiene | 7/10 | ~~20 orphaned files~~ → resolved. Dead utilities cleaned. |
| Security | 8/10 | ~~Hardcoded password~~ → random. ~~Raw fetch~~ → apiClient. |
| Consistency | 7/10 | ~~Mixed table patterns~~ → all DataTable. Remaining: service patterns. |
| Performance | 7/10 | Lazy loading, query caching, but no React.memo |

**Overall: 7.5/10** — Phase 1 + 2 improved Code Hygiene (5→7), Security (6→8), Component Reuse (7→9), Consistency (5→7). Remaining: loading states, type safety.

---

## 9. Recommended Next Steps

### Phase 1: Quick Wins (High Impact, Low Effort) — COMPLETED
1. **Delete 20 orphaned files** — removes ~10% dead code ✅
2. **Use `types/shared.ts`** — eliminates 12 duplicate `PaginatedResponse` definitions ✅
3. **Replace 2 raw `fetch()` calls** with `apiClient` — fixes security bypass ✅
4. **Remove `TempPass123`** — generate random password for imports ✅

### Phase 2: Consistency (High Impact, Medium Effort) — PARTIAL
5. **Migrate 7 modules from raw `Table` to `DataTable`:** ✅
   - `helpdesk` → HelpdeskPage.tsx ✅
   - `announcements` → AnnouncementsPage.tsx ✅
   - `documents` → DocumentsPage.tsx ✅
   - `assets` → AssetsPage.tsx ✅
   - `performance` → PerformancePage.tsx ✅
   - `training` → TrainingProgramsPage.tsx ✅
   - `shift-swaps` → ShiftSwapsPage.tsx ✅
6. **Add skeleton loading to all list pages** — use existing `TableSkeleton` component ⏳
7. **Split `ReportsPage.tsx`** (804 lines) into tab components ⏳
8. **Split `SettingsPage.tsx`** (533 lines) into lazy-loaded sections ⏳
9. **Type the `shift-swaps` service** — replace all `any` types ⏳

### Phase 3: Type Safety (Medium Impact, Medium Effort)
10. **Replace 32 `as any` casts** with proper type guards
11. **Type `shift-swaps` service** properly
12. **Add proper interfaces for `PaginatedResponse`** in shared types

### Phase 4: Testing (Medium Impact, High Effort)
13. **Add tests for 8 zero-test modules** — documents, assets, performance, training, audit-logs, weekly-off-rules, rule-book, statutory

### Phase 5: Performance (Low Impact, High Effort)
14. **Add `React.memo` to heavy list row components**
15. **Add `useMemo` for expensive derived data** in reports/settings
16. **Implement debounced search** — currently all search is enter-triggered
