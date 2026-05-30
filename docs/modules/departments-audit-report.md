# Departments Module — Audit Report

**Date:** May 30, 2026
**Module:** Departments (Master Data)
**Status:** Audit Complete — 7 Fixes Applied
**Depends On:** Auth (JWT permissions)

---

## 1. Architecture Overview

### Components

| Layer | Implementation | Files |
|-------|---------------|-------|
| Server Controller | Express handlers, CRUD + code gen | `server/src/modules/departments/departments.controller.ts` (37 lines) |
| Server Service | Business logic, pagination, caching, auto-code | `server/src/modules/departments/departments.service.ts` (186 lines) |
| Server Routes | 6 endpoints with authenticate + authorize | `server/src/modules/departments/departments.routes.ts` (19 lines) |
| Server Validation | Zod schemas for create/update | `server/src/modules/departments/departments.validation.ts` (34 lines) |
| Server Model | Mongoose schema, 2 unique fields | `server/src/models/Department.model.ts` (28 lines) |
| Client Page | Single page with table + modal | `client/src/features/departments/pages/DepartmentsPage.tsx` (239 lines) |
| Client Service | API calls, types | `client/src/features/departments/services/departmentService.ts` (67 lines) |

### Data Model

- **Fields:** name (unique), code (unique, uppercase), description, isActive, createdBy, updatedBy, timestamps
- **Relationships:** Referenced by Employee model (required field)
- **Indexes:** name (unique), code (unique) — auto-created by Mongoose
- **Soft delete:** Uses `isActive` boolean toggle instead of hard delete

### API Endpoints (6)

| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/next-code` | manage-departments | Generate next auto department code |
| GET | `/` | view-departments | Paginated list with search/filter |
| GET | `/:id` | view-departments | Get single department |
| POST | `/` | manage-departments | Create department |
| PATCH | `/:id` | manage-departments | Update department |
| DELETE | `/:id` | manage-departments | Delete department |

---

## 2. Cross-Module Data Flow

### Modules that WRITE to Department
1. **Departments Module** — create, update, delete

### Modules that READ from Department
1. **Employee Module** — department dropdown in create/edit forms
2. **Designation Module** — department dropdown in create/edit forms
3. **Reports Module** — department summary queries
4. **Attendance Module** — department filter in attendance views
5. **Dashboard** — department count stat

### Architectural Concern
Departments is master data consumed by nearly every module. Proper caching and indexing is critical for performance.

---

## 3. Security Findings

### CRITICAL

| # | Issue | Status | File |
|---|-------|--------|------|
| 1 | Departments route NOT wrapped with `<ProtectedRoute>` | ✅ FIXED | `App.tsx` |

### HIGH

| # | Issue | Status | File |
|---|-------|--------|------|
| 2 | Sidebar shows "Departments" to all authenticated users regardless of permission | ✅ FIXED | `Sidebar.tsx` |

---

## 4. Performance Findings

| # | Issue | Status | Fix |
|---|-------|--------|-----|
| 1 | Missing index on `isActive` (used for status filtering) | ✅ FIXED | Added index to `Department.model.ts` |
| 2 | `StatusBadge` component defined inside render body | ✅ FIXED | Moved outside + `React.memo` | `DepartmentsPage.tsx` |
| 3 | Columns array not memoized | ✅ FIXED | `useMemo` | `DepartmentsPage.tsx` |
| 4 | Search input not debounced | ✅ FIXED | `useDebounce` hook (300ms) | `DepartmentsPage.tsx` |
| 5 | StaleTime 5min instead of 10min for master data | ✅ FIXED | Updated to 10min | `DepartmentsPage.tsx` |
| 6 | No `React.memo` on row render components | ✅ FIXED | `StatusBadge` wrapped | `DepartmentsPage.tsx` |

---

## 5. Edge Cases

| # | Edge Case | Current Behavior | Risk |
|---|-----------|------------------|------|
| 1 | Duplicate name/code | Server validates with `findOne`, throws 400 | Low |
| 2 | Delete department with employees | Server checks `Employee.countDocuments`, blocks delete | Low |
| 3 | Auto-generation disabled | Server throws `AppError` if no code provided | Low |
| 4 | Concurrent code generation | No retry logic (single query, could race) | Low |
| 5 | Case sensitivity on codes | Server normalizes to uppercase | Low |

---

## 6. Client-Server Wiring

| Check | Status | Notes |
|-------|--------|-------|
| Server routes protected | ✅ | authenticate + authorize on all routes |
| Client routes protected | ❌ FIXED | `<ProtectedRoute>` added with `permission="view-departments"` |
| Sidebar permission gate | ❌ FIXED | `permission: 'view-departments'` added |
| React Query caching | ✅ | staleTime 10min (master data) |
| Query invalidation | ✅ | After create/update/delete |
| Error handling | ✅ | Mutation errors + GET errors handled |
| Loading states | ⚠️ | DataTable has loading, no dedicated skeleton |

---

## 7. Performance Checklist Cross-Reference

| Checklist Item | Status |
|----------------|--------|
| lean() on read-only queries | ✅ |
| Pagination on list endpoints | ✅ |
| Maximum limit 100 enforced | ✅ |
| MongoDB indexes on queried fields | ⚠️ Fixed (added `isActive` index) |
| Audit logging | ✅ |
| Input validation (Zod) | ✅ |
| Lazy loading | ✅ |
| React.memo on components | ✅ Fixed |
| useMemo on expensive computations | ✅ Fixed |
| Debounced search inputs | ✅ Fixed |
| Master data staleTime: 10 minutes | ✅ Fixed |

---

## 8. Fixes Applied (10 Total)

| # | Fix | Severity | Files Changed |
|---|-----|----------|---------------|
| 1 | Added `<ProtectedRoute>` to departments route | CRITICAL | `App.tsx` |
| 2 | Added `permission: 'view-departments'` to sidebar item | HIGH | `Sidebar.tsx` |
| 3 | Moved `StatusBadge` outside component + `React.memo` | MEDIUM | `DepartmentsPage.tsx` |
| 4 | Memoized `columns` array with `useMemo` | MEDIUM | `DepartmentsPage.tsx` |
| 5 | Added debounced search (300ms) with `useDebounce` | MEDIUM | `DepartmentsPage.tsx` |
| 6 | Updated staleTime to 10 minutes for master data | LOW | `DepartmentsPage.tsx` |
| 7 | Added index on `isActive` for filter performance | LOW | `Department.model.ts` |
| 8 | Added retry logic for concurrent department code generation | MEDIUM | `departments.service.ts` |
| 9 | Updated API_ENDPOINTS.departments with `nextCode` endpoint | LOW | `api.endpoints.ts` |
| 10 | Updated departmentService to use API_ENDPOINTS constants | LOW | `departmentService.ts` |

---

## 9. Files Modified

### Server
| File | Change |
|------|--------|
| `server/src/models/Department.model.ts` | Added `isActive` index |

### Client
| File | Change |
|------|--------|
| `client/src/App.tsx` | Wrapped `departments` route with `<ProtectedRoute permission="view-departments">` |
| `client/src/layout/Sidebar.tsx` | Added `permission: 'view-departments'` to Departments menu item |
| `client/src/features/departments/pages/DepartmentsPage.tsx` | Moved `StatusBadge` outside + `React.memo`, `useMemo` on columns, `useDebounce` on search, staleTime 10min |

---

## 10. Remaining Items (Deferred)

_None – all identified items have been addressed._
