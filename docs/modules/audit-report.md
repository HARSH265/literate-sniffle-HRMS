# HRMS V1 — Complete Module Audit Report

**Date:** 2026-05-30  
**Scope:** Full-stack audit — Server (Express/MongoDB) + Client (React/TypeScript)  
**Modules Audited:** 32 server modules, 30 client features, 40+ models

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Server Core Infrastructure Audit](#3-server-core-infrastructure-audit)
4. [Database Models Audit](#4-database-models-audit)
5. [Module-by-Module Audit (Server)](#5-module-by-module-audit-server)
6. [Client Core Infrastructure Audit](#6-client-core-infrastructure-audit)
7. [Feature-by-Feature Audit (Client)](#7-feature-by-feature-audit-client)
8. [Server-Client Data Flow Analysis](#8-server-client-data-flow-analysis)
9. [Performance Checklist Status](#9-performance-checklist-status)
10. [Security Audit](#10-security-audit)
11. [Complete Issue Registry](#11-complete-issue-registry)
12. [Fix Priority Matrix](#12-fix-priority-matrix)

---

## 1. Executive Summary

### Overall Health Score: 7.2/10

| Category | Score | Status |
|----------|-------|--------|
| Schema Design | 8/10 | Good — minor index gaps |
| Index Coverage | 7/10 | Most queries covered, some missing |
| Caching | 4/10 | Only 2 of 32 modules cache master data |
| Validation (Server - Zod) | 9/10 | Almost all modules validate |
| Validation (Client) | 5/10 | Ant Form rules only, no Zod schemas |
| Authentication | 9/10 | Consistent JWT + bcrypt |
| Authorization (RBAC) | 9/10 | 5 roles, 51 permissions |
| Response Consistency | 7/10 | Most use ResponseHandler |
| Error Handling | 8/10 | AppError pattern, some inconsistency |
| Performance | 6/10 | N+1 queries, unbounded arrays, no settings caching |
| Security | 7/10 | Good overall, plaintext email password risk |
| Pagination | 8/10 | PaginationUtil used broadly |
| Code Splitting | 9/10 | All pages lazy-loaded |
| Loading States | 8/10 | Skeletons used appropriately |
| Component Optimization | 6/10 | Limited React.memo/useMemo usage |

### Critical Issues Found: 5
### High Priority Issues: 12
### Medium Priority Issues: 15
### Low Priority Issues: 8

---

## 2. Architecture Overview

### Server Stack
- **Runtime:** Node.js + TypeScript (tsx for dev)
- **Framework:** Express 4.x
- **Database:** MongoDB (Mongoose 8.x)
- **Auth:** JWT (HS256) + bcrypt + HTTP-only cookies
- **Cache:** node-cache (in-memory)
- **Realtime:** Socket.io 4.x
- **Validation:** Zod
- **Logging:** Winston
- **File Upload:** Multer + Cloudinary
- **PDF:** PDFKit
- **Excel:** ExcelJS
- **Email:** Nodemailer

### Client Stack
- **Framework:** React 18 + TypeScript
- **Build:** Vite 8
- **UI:** Ant Design 5.x
- **State:** Zustand (auth, settings, ui stores)
- **Server State:** TanStack Query v5
- **Routing:** React Router DOM v6
- **Forms:** Ant Design Form (native)
- **HTTP:** Axios with token refresh interceptors
- **Charts:** Recharts

### Module Count
- **Server modules:** 32
- **Client features:** 30 (including ESS)
- **Database models:** 40
- **Shared types:** Defined in `server/src/types/index.ts` and `client/src/types/`

---

## 3. Server Core Infrastructure Audit

### 3.1 Configuration (`server/src/config/`)

#### env.ts
- **Issue [CRITICAL]:** `ENCRYPTION_KEY` has hardcoded fallback `'hrms-secure-key-32chars!!'`
- **Issue:** `JWT_SECRET` / `JWT_REFRESH_SECRET` dev fallbacks are weak
- **Issue:** `MONGODB_URI` defaults to `''` with no production check
- **Issue:** `dotenv.config()` called in env.ts, db.ts, AND logger.ts — triple redundant

#### db.ts
- **Issue:** No connection pool options (`maxPoolSize`, `minPoolSize`) passed to `mongoose.connect()`
- **Issue:** No `serverSelectionTimeoutMS` or `socketTimeoutMS` configured
- **Issue:** No explicit `autoIndex` setting

#### constants.ts
- Clean implementation with `as const` enums and derived types. No issues.

### 3.2 Cache System (`server/src/core/cache/`)

#### CacheService.ts
- **Implemented:** node-cache with stdTTL=3600 (1hr), checkperiod=600
- **Implemented:** CACHE_KEYS constants for all master data keys
- **Implemented:** Invalidation on master data CUD operations
- **Issue:** `useClones: false` — risks mutation of cached objects
- **Issue:** `set()` uses `ttl ?? 0` — default=0 (no expiry) when no TTL passed
- **Issue:** No `invalidateOvertimeRules()` method
- **Issue:** No cache stats/monitoring

#### CACHE_KEYS
- **Implemented:** departments, designations, shifts, settings, holidays, weekly-off-rules, overtime-rules

### 3.3 Logger (`server/src/core/logger/logger.ts`)

- **Implemented:** Winston with JSON format (prod), colorized console (dev)
- **Issue:** No file transport — logs lost on restart
- **Issue:** No log rotation (no winston-daily-rotate-file)
- **Issue:** No request logging integration with morgan

### 3.4 Error Handling (`server/src/core/errors/`)

#### errorHandler.ts
- **Implemented:** Global handler for AppError, MongoDB errors, JWT errors, CastError, ValidationError
- **Issue:** `errors: []` always empty — validation details not forwarded
- **Issue:** No request ID correlation for debugging

#### AppError.ts
- **Implemented:** Custom error class with statusCode and isOperational flag
- **Issue:** `isOperational` always `true` — never distinguishes error types

### 3.5 Response Handler (`server/src/core/response/ResponseHandler.ts`)

- **Implemented:** Standardized responses: success, paginated, created, noContent, error
- **Issue:** `PaginationMeta` duplicated in 3 places (types/index.ts, ResponseHandler.ts, PaginationUtil.ts)

### 3.6 Validation (`server/src/core/validation/`)

#### common.schemas.ts
- **Implemented:** mongoIdSchema, paginationSchema, searchSchema, dateRangeSchema, monthSchema, combinedListSchema
- **Issue:** `paginationSchema` default limit is `10` — checklist requires `20`

#### validate.middleware.ts
- **Implemented:** Zod-based middleware for body/params/query
- **Issue:** Error details not forwarded — throws generic `AppError('Validation failed', 400)`

### 3.7 Authentication (`server/src/core/auth/`)

#### TokenBlacklist.ts
- **Implemented:** In-memory blacklist with NodeCache, 24hr TTL
- **Issue:** In-memory only — lost on restart, doesn't work in multi-instance deployments
- **Issue:** Default TTL 24hr but `add()` default is 3600s (1hr) — inconsistent

#### authenticate.middleware.ts
- **Implemented:** JWT from cookie or Bearer header, HS256, blacklist check
- **Issue:** Catches all errors as "Invalid token" — no distinction between expired vs malformed

### 3.8 Permissions (`server/src/core/permissions/`)

#### authorize.middleware.ts + permissions.config.ts
- **Implemented:** 51 permissions across 5 roles (super-admin, hr-admin, hr-staff, accounts, manager)
- **Issue:** No resource-level ownership checks (e.g., can only update own profile)
- **Issue:** No permission grouping/hierarchy system

### 3.9 Audit System (`server/src/core/audit/`)

#### AuditMiddleware.ts
- **Implemented:** Intercepts `res.send()` to log actions
- **Issue:** Uses `(req as any).user` instead of typed `req.user`
- **Issue:** Uses `console.error` instead of logger for middleware errors
- **Issue:** Path matching is fragile — depends on exact URL structure

#### AuditService.ts
- **Implemented:** 27 action types, writes to MongoDB
- **Issue:** No batching — one record per request
- **Issue:** No TTL index on AuditLog collection

### 3.10 Socket.io (`server/src/core/socket/socket.ts`)

- **Implemented:** Socket.io with CORS, kiosk device rooms, QR emission, lastSeenAt tracking
- **Issue [CRITICAL]:** No authentication on socket connections
- **Issue:** CORS uses `true` in development — allows any origin
- **Issue:** No socket rate limiting
- **Issue:** No disconnect cleanup

### 3.11 Email (`server/src/core/email/`)

#### EmailService.ts
- **Implemented:** Lazy-initialized nodemailer, templates for welcome, reset, salary slip
- **Issue:** Transporter created once and never refreshed
- **Issue:** Templates are inline HTML strings — not modular

#### sendEmail.ts
- **Issue [REDUNDANT]:** Duplicate of EmailService — creates second transporter. Should be deleted.

### 3.12 File Upload (`server/src/core/file/`)

#### FileUploadService.ts
- **Issue:** `uploadFromBuffer` hardcodes `data:image/png;base64,` — wrong for non-PNG files
- **Issue:** `getPublicIdFromUrl` is fragile — doesn't handle query params

#### upload.middleware.ts
- **Implemented:** Memory-storage multer configs with type/size filters
- **Issue:** `console.log('File mime:', ...)` on line 59 — debug logging in production
- **Issue:** `documentFilter` has redundant checks

#### multer.ts (core/multer/)
- **Issue [REDUNDANT]:** Duplicate functionality with file/upload.middleware.ts, uses disk storage instead of memory

### 3.13 PDF & Excel Generation

#### PDFGeneratorService.ts (312 lines)
- **Implemented:** PDFKit salary slip generator
- **Issue:** Large file — could be split
- **Issue:** Hardcoded to salary slips only — not generic
- **Issue:** Currency hardcoded to `Rs.`

#### ExcelGeneratorService.ts
- **Implemented:** Generic ExcelJS generator
- **Issue:** No streaming for large datasets

### 3.14 Notification Service

#### NotificationService.ts
- **Implemented:** In-app notifications + optional email forwarding
- **Issue:** `CompanySettings.findOne().lean()` called on every notification — should be cached
- **Issue:** `(settings as any)?.notificationConfig` — unsafe type assertion

### 3.15 Utility Classes

#### AggregationUtil.ts
- **Implemented:** Reusable MongoDB aggregation pipeline stages
- **Issue:** Both `default export` and `export class` — redundant

#### DateUtil.ts
- **Implemented:** Dayjs wrapper with plugins
- **Issue:** `getWorkingDaysInMonth` misnamed — returns total days, not working days

#### EncryptionUtil.ts
- **Implemented:** AES-256-GCM encryption
- **Issue:** `decrypt` silently returns original text on failure — masks data corruption

#### PaginationUtil.ts
- **Implemented:** Pagination helpers
- **Issue:** Default limit is `10` — checklist requires `20`

---

## 4. Database Models Audit

### 4.1 Index Coverage Summary

| Model | Indexes | Status |
|-------|---------|--------|
| Announcement | `{isActive:1, createdAt:-1}`, `{priority:1, createdAt:-1}`, `{scheduledAt:1}` sparse, `{expiresAt:1}` sparse | ✅ Good |
| Asset | `{status:1, category:1}`, `{assignedTo:1}`, unique on assetCode | ✅ Good |
| AttendanceEntry | `{employee:1, date:1}` unique, `{date:1}`, `{status:1}` | ✅ Excellent |
| AuditLog | `{userId:1}`, `{module:1}`, `{action:1}`, `{createdAt:1}`, `{targetId:1}` | ⚠️ Missing compound indexes |
| CompanySettings | None (singleton) | ✅ Fine |
| Department | Implicit from unique constraints | ⚠️ Missing `{isActive:1}` |
| Designation | `{department:1}` | ⚠️ Missing `{isActive:1}` |
| Document | `{category:1, isActive:1}`, `{employee:1}`, `{isCompanyDocument:1}`, `{expiryDate:1}` sparse | ✅ Good |
| Employee | `{department:1}`, `{status:1}`, `{category:1}`, `{shift:1}`, `{designation:1}`, `{fullName:1}`, `{fatherName:1}` | ⚠️ Missing `{status:1, department:1}` compound |
| EmployeeSkill | `{employee:1, skill:1}` unique, `{skill:1}` | ✅ Excellent |
| EssChangeRequest | `{employee:1, status:1}`, `{status:1, createdAt:-1}` | ✅ Good |
| Holiday | `{date:1}`, `{year:1}`, `{applicableTo:1}` | ⚠️ Missing `{date:1, applicableTo:1}` compound |
| KioskDevice | Implicit from unique | ⚠️ Missing `{isActive:1}` |
| LeaveApplication | `{employee:1, startDate:-1}`, `{status:1}`, `{'approvers.approver':1, status:1}` | ✅ Excellent |
| LeaveBalance | `{employee:1, leaveType:1, year:1}` unique, `{employee:1, year:1}` | ✅ Excellent |
| LeaveType | `{isActive:1, sortOrder:1}` | ✅ Good |
| Loan | `{employee:1, status:1}`, `{loanType:1}` | ✅ Good |
| LoanRepayment | `{loan:1, month:1}`, `{employee:1, month:1}` | ✅ Excellent |
| LoanType | Implicit from unique | ⚠️ Missing `{isActive:1}` |
| Notification | `{recipient:1, isRead:1}`, `{recipient:1}`, `{createdAt:1}` | ⚠️ `{recipient:1}` redundant |
| OvertimeEntry | `{employee:1, date:1}`, `{employee:1}` | ⚠️ Missing unique constraint |
| OvertimeRule | None | ❌ Missing all indexes |
| PasswordResetToken | `{user:1}`, `{token:1}` unique, `{expires:1}` TTL | ✅ Excellent |
| PayrollItem | `{payrollRun:1, employee:1}` unique, `{month:1}`, `{employee:1}`, `{loanRepayment:1}` | ✅ Excellent |
| PayrollRun | `{status:1}`, unique on month | ✅ Good |
| PerformanceCycle | `{year:1, quarter:1}` unique, `{status:1}` | ✅ Excellent |
| PerformanceFeedback | `{review:1, fromEmployee:1}` unique | ✅ Excellent |
| PerformanceReview | `{employee:1, reviewCycle:1}` unique, `{status:1}`, `{'reviewPeriod.year':1, 'reviewPeriod.quarter':1}` | ✅ Excellent |
| PFChallan | `{month:1, financialYear:1}`, `{status:1}` | ✅ Good |
| SalarySlip | `{slipNumber:1}` unique, `{employee:1}`, `{month:1}` | ✅ Good |
| Shift | None | ❌ Missing all indexes |
| ShiftPreference | `{preferredShift:1}`, unique on employee | ⚠️ Unique on employee limits to one preference ever |
| ShiftSwap | `{requestor:1, status:1, createdAt:-1}`, `{targetEmployee:1, status:1}`, `{status:1, createdAt:-1}`, `{fromDate:1, toDate:1}` | ✅ Excellent |
| Skill | `{category:1}` | ⚠️ Missing `{isActive:1}` |
| StatutoryReport | `{reportType:1, month:1, financialYear:1}` | ✅ Good |
| Ticket | `{status:1, createdAt:-1}`, `{priority:1, createdAt:-1}`, `{requestedBy:1, createdAt:-1}`, `{assignedTo:1, createdAt:-1}` | ✅ Excellent |
| TrainingEnrollment | `{training:1, employee:1}` unique, `{employee:1}` | ✅ Excellent |
| TrainingProgram | `{status:1, category:1}`, `{startDate:1}` | ✅ Good |
| User | `{email:1}` unique, `{refreshToken:1}` inline | ⚠️ Missing `{role:1}` |
| WeeklyOffRule | None | ❌ Missing all indexes |

### 4.2 Unbounded Array Growth Issues

| Model | Field | Risk |
|-------|-------|------|
| Announcement | `readBy[]` | Document bloat on popular announcements |
| Asset | `history[]` | Grows with every status change |
| Document | `previousVersions[]` | Grows with every edit |
| User | `passwordHistory[]` | Grows with every password change |

### 4.3 Missing Unique Constraints

| Model | Fields | Risk |
|-------|--------|------|
| OvertimeEntry | `{employee, date}` | Possible duplicate OT entries |

---

## 5. Module-by-Module Audit (Server)

### 5.1 Announcements
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Create, List, GetById, Update, SoftDelete, MarkAsRead, UnreadCount, ProcessScheduled |
| lean() | ✅ Used in list query |
| Pagination | ✅ Manual (skip/limit/countDocuments) |
| Zod Validation | ✅ Create & Update schemas |
| Caching | ❌ Not implemented |
| ResponseHandler | ❌ Uses manual res.json() |
| Security | ✅ authenticate + authorize |

### 5.2 Assets
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full + Allocate, Return, Maintenance, Retire, Stats, History |
| lean() | ✅ Used extensively |
| Pagination | ✅ Proper skip/limit with max cap |
| Zod Validation | ✅ 6 schemas |
| Caching | ❌ Not implemented |
| ResponseHandler | ✅ Consistently used |
| Security | ✅ Full auth + authorize |

### 5.3 Attendance
| Aspect | Status |
|--------|--------|
| CRUD | ✅ List, GetByEmployee, MonthlyView, BulkCreate, BulkUpdate, Delete |
| lean() | ✅ Used in queries |
| Pagination | ✅ PaginationUtil-based |
| Zod Validation | ✅ Including bulk schema (max 500) |
| Caching | ❌ Not implemented |
| ResponseHandler | ✅ Used |
| Security | ✅ Full auth + authorize |
| **Issue** | ❌ `bulkUpdateEntries` does N+1 (findById + save in loop) |
| **Issue** | ❌ `monthlyView` loads ALL records into memory |

### 5.4 Attendance QR
| Aspect | Status |
|--------|--------|
| CRUD | ✅ CheckIn, CheckOut |
| lean() | ✅ Used for CompanySettings |
| Zod Validation | ✅ GPS validation |
| Security | ⚠️ Unauthenticated (by design for kiosk) |
| **Issue** | ❌ CompanySettings fetched on every request — not cached |

### 5.5 Auth
| Aspect | Status |
|--------|--------|
| Features | ✅ Login, Logout, GetMe, ChangePassword, RefreshToken, ForgotPassword, ResetPassword |
| Security | ✅ bcrypt (cost=10), token blacklisting, rate limiting (5 attempts → 15min lock), httpOnly cookies |
| Validation | ✅ 6 schemas with password complexity |
| **Issue** | ⚠️ Password history count hardcoded in resetPassword but configurable in changePassword |

### 5.6 Departments
| Aspect | Status |
|--------|--------|
| CRUD | ✅ List, GetById, Create, Update, Delete, GenerateNextCode |
| lean() | ✅ All queries |
| Pagination | ✅ PaginationUtil-based |
| Zod Validation | ✅ |
| Caching | ✅ CacheService with TTL 3600s + invalidation |
| ResponseHandler | ✅ |

### 5.7 Designations
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full CRUD |
| lean() | ✅ Extensively used |
| Pagination | ✅ PaginationUtil-based |
| Caching | ✅ CacheService with TTL 3600s + invalidation |
| ResponseHandler | ✅ |

### 5.8 Documents
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full + versioning, download tracking, expiry |
| ResponseHandler | ✅ |

### 5.9 Employees
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full + bulk import, code generation |
| ResponseHandler | ✅ |

### 5.10 Holidays
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full CRUD |
| **Issue** | ❌ No caching (should be cached as master data) |

### 5.11 Shifts
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full CRUD |
| **Issue** | ❌ No caching (should be cached as master data) |

### 5.12 Overtime Rules
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full CRUD |
| **Issue** | ❌ No caching (should be cached as master data) |

### 5.13 Weekly Off Rules
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Full CRUD |
| **Issue** | ❌ No caching (should be cached as master data) |

### 5.14 Leave
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Applications, Approvals, Balances, Types |

### 5.15 Payroll
| Aspect | Status |
|--------|--------|
| Features | ✅ Run, Preview, Finalize, Unfinalize |

### 5.16 Helpdesk
| Aspect | Status |
|--------|--------|
| CRUD | ✅ Tickets with SLA |

### 5.17 Remaining Modules
- **Shift Swap:** ✅ Request, Approve, Reject, Preferences
- **Performance:** ✅ Cycles, Reviews, Feedback, Goals
- **Training:** ✅ Programs, Enrollments, Skills, Certifications
- **Notifications:** ✅ In-app notifications
- **Audit Logs:** ✅ Filterable, exportable
- **Statutory:** ✅ PF, ESI, reports
- **Settings:** ✅ 20+ configurable sections
- **Loans:** ✅ Apply, Approve, Repay
- **Kiosk:** ✅ Device management, QR display
- **TOTP:** ✅ Enrollment, verification
- **ESS:** ✅ Self-service portal
- **Reports:** ✅ Summary, Export, Charts

---

## 6. Client Core Infrastructure Audit

### 6.1 API Client (`core/api/apiClient.ts`)
- **Implemented:** Axios with token refresh queue, 401 retry, request/response interceptors
- **Quality:** Excellent — handles concurrent 401s elegantly
- **Issue:** Some pages use raw `fetch()` instead of apiClient (Reports page)

### 6.2 Query Client (`core/api/queryClient.ts`)
- **Implemented:** TanStack Query with 5min stale, 10min GC, 1 retry
- **Issue:** Retry count should be configurable per query type

### 6.3 Auth Store (`core/stores/authStore.ts`)
- **Implemented:** Zustand persisted (user, token, isAuthenticated)
- **Quality:** Clean with hydration handling in App.tsx

### 6.4 Settings Store (`core/stores/settingsStore.ts`)
- **Implemented:** Zustand store for company/payroll/attendance config
- **Quality:** Good — fetched once on auth, used globally

### 6.5 Permissions (`core/constants/permissions.ts`)
- **Implemented:** 5 roles, ~50 permissions matching server
- **Quality:** Consistent with server RBAC

### 6.6 Core Components

| Component | Quality | Notes |
|-----------|---------|-------|
| DataTable.tsx | Excellent | Generic typed table, server pagination, filters, detail drawer, skeleton |
| ErrorBoundary.tsx | Good | Retry + navigation, handles ESS/admin routes |
| ProtectedRoute.tsx | Good | Auth + permission gate |
| ConfirmModal.tsx | Good | Simple confirmation |
| EmptyState.tsx | Good | Empty state with optional action |
| PageHeader.tsx | Good | Breadcrumbs + title + actions |
| StatusBadge.tsx | Good | Color-coded tag |
| TableSkeleton.tsx | Good | Loading placeholder |
| CardSkeleton.tsx | Good | Card loading placeholder |
| FormSkeleton.tsx | Good | Form loading placeholder |

### 6.7 Core Hooks

| Hook | Quality | Notes |
|------|---------|-------|
| useDebounce.ts | Good | 300ms default |
| useIsMobile.ts | Good | Media query based |
| useNotify.ts | Good | Ant Design message wrapper |
| usePagination.ts | Good | Page/limit state with reset |
| usePermission.ts | Good | Role + permission checks |
| useFileUpload.ts | Good | FormData upload with progress |

---

## 7. Feature-by-Feature Audit (Client)

### 7.1 Auth (5 pages)
- **Loading:** Suspense lazy loading ✅
- **Form Validation:** Ant Form rules ✅
- **Error Handling:** AxiosError catch with status-specific messages ✅
- **Issue:** Dashboard makes 9 parallel API calls — should consolidate

### 7.2 Employees (4 pages)
- **Loading:** DataTable skeleton ✅
- **Server Pagination:** Yes ✅
- **Search:** `onSearch` (enter-triggered) — NOT debounced ⚠️
- **Optimization:** `useMemo` for columns, `memo` for sub-components ✅

### 7.3 Departments (1 page)
- **Server Pagination:** Yes ✅
- **Search:** onSearch (enter) ⚠️

### 7.4 Designations (1 page)
- **Server Pagination:** Yes ✅
- **Search:** onSearch (enter) ⚠️

### 7.5 Shifts (1 page)
- **Server Pagination:** Yes ✅
- **Issue:** Unused `empSearch` state

### 7.6 Holidays (1 page)
- **Server Pagination:** Yes ✅
- **Issue:** Year filter hardcoded to 2024-2028
- **Issue:** Calendar loads all with limit:100

### 7.7 Weekly Off Rules (1 page)
- **Server Pagination:** Yes ✅

### 7.8 Attendance (1 page, 3 tabs)
- **Server Pagination:** Yes (Records tab) ✅
- **Issue:** `MonthlyView` defined as `memo()` inside component — recreated every render
- **Issue:** Mark Attendance loads ALL active employees (limit:500)

### 7.9 Overtime & Overtime Rules (2 pages)
- **Server Pagination:** Yes ✅

### 7.10 Payroll (2 pages)
- **Server Pagination:** Yes ✅

### 7.11 Salary Slips (2 pages)
- **Server Pagination:** Yes ✅

### 7.12 Leave (3 pages)
- **Server Pagination:** ⚠️ ApplicationsPage loads `limit: 500`
- **Issue:** Not truly paginated for large datasets

### 7.13 Loans (3 pages)
- **Server Pagination:** Yes ✅

### 7.14 Users (2 pages)
- **Server Pagination:** Yes ✅
- **Features:** Import/Export via XLSX ✅

### 7.15 Helpdesk (3 pages)
- **Server Pagination:** Yes ✅
- **Issue:** Uses raw `Table` instead of `DataTable` — inconsistent ⚠️

### 7.16 Announcements (3 pages)
- **Server Pagination:** Yes ✅
- **Issue:** Uses raw `Table` instead of `DataTable` — inconsistent ⚠️

### 7.17 Settings (1 page, 20+ sections)
- **Loading:** FormSkeleton per section ✅
- **Issue:** 533 lines — should be decomposed further

### 7.18 Reports (1 page, 4 tabs)
- **Issue:** 811 lines — very large component
- **Issue:** Uses raw `fetch()` instead of `apiClient` — bypasses auth interceptors ❌

### 7.19 Performance (2 pages)
- **Custom Hooks:** usePerformanceCycles, usePerformanceReviews ✅

### 7.20 Training (7 pages)
- **Custom Hooks:** useTraining ✅

### 7.21 Assets (3 pages)
- **Custom Hooks:** useAssets, useAssetStats ✅

### 7.22 Documents (3 pages)
- **Custom Hooks:** Document-related ✅

### 7.23 Shift Swaps (3 pages)
- **Custom Hooks:** useShiftSwaps ✅

### 7.24 ESS (12 pages)
- **Layout:** Separate EssLayout for mobile-first ✅

### 7.25-7.30 Remaining Features
- **Notifications, Audit Logs, Kiosk, Attendance QR, Statutory, Rule Book** — All functional ✅

---

## 8. Server-Client Data Flow Analysis

### API Endpoint Mapping
All 32 server modules have corresponding client features with proper route mappings:
- Server routes: `/api/v1/{module}`
- Client API endpoints: defined in `core/api/api.endpoints.ts`
- Query keys: defined in `core/constants/queryKeys.ts`

### Response Shape Consistency
- **Server:** `ResponseHandler` returns `{ success, message, data, meta? }`
- **Client:** `apiClient` interceptors handle errors uniformly
- **Issue:** Announcements controller doesn't use ResponseHandler — inconsistent shape

### Auth Flow
1. Client: Login → POST `/api/v1/auth/login` → sets httpOnly cookie + returns user data
2. Client: apiClient attaches Bearer token from store
3. Server: authenticate middleware verifies JWT from cookie or header
4. Server: Token refresh via POST `/api/v1/auth/refresh-token`
5. Client: 401 interceptor queues requests, refreshes token, retries

### Pagination Flow
1. Client: DataTable sends `page`, `limit`, `search`, `sort`, filters
2. Server: PaginationUtil parses params, applies skip/limit
3. Server: ResponseHandler.paginated returns `{ data, meta: { page, limit, total, totalPages } }`
4. Client: DataTable renders pagination controls from meta

---

## 9. Performance Checklist Status

### Backend Performance

#### Database
| Requirement | Status |
|-------------|--------|
| MongoDB indexes on all queried fields | ⚠️ Partial — Shift, OvertimeRule, WeeklyOffRule missing |
| lean() on all read-only queries | ✅ Implemented across modules |
| Select only required fields | ✅ Used where needed (totpSecret, password) |
| MongoDB aggregation for reports | ✅ AggregationUtil used |
| Connection pool size configured | ❌ Not configured |
| Query timeout configured | ❌ Not configured |

#### Caching
| Requirement | Status |
|-------------|--------|
| node-cache configured | ✅ |
| CACHE_KEYS constants used | ✅ |
| Cache invalidated on updates | ✅ (departments, designations) |
| Default TTL: 1 hour | ✅ |
| Cached: departments | ✅ |
| Cached: designations | ✅ |
| Cached: shifts | ❌ Not cached |
| Cached: settings | ❌ Not cached (fetched on every notification) |
| Cached: holidays | ❌ Not cached |
| Cached: weekly-off-rules | ❌ Not cached |

#### API
| Requirement | Status |
|-------------|--------|
| All list endpoints paginated | ✅ |
| Default page 1, limit 10 | ✅ Intentional — 10 rows avoids table page scrolling (UX decision) |
| Maximum limit 100 enforced | ✅ |
| Default sort, order, search, filters | ✅ |
| Request timeout: 30 seconds | ✅ (in app.ts) |
| Response compression (gzip) | ✅ (compression middleware) |
| Maximum request body size: 10MB | ✅ (express.json limit) |

#### Rate Limiting
| Requirement | Status |
|-------------|--------|
| Auth routes: 10 req/min | ✅ |
| General routes: 100 req/min | ✅ |

#### Error Handling
| Requirement | Status |
|-------------|--------|
| Global error handler | ✅ |
| Winston logger everywhere | ⚠️ Mostly — console.error still in audit middleware |
| Stack traces hidden in production | ⚠️ Logger includes them (not in response) |

#### Server
| Requirement | Status |
|-------------|--------|
| Health check endpoint | ✅ GET /api/v1/health |
| Graceful shutdown | ✅ SIGTERM and SIGINT |
| express-mongo-sanitize | ✅ |
| helmet | ✅ |
| CORS configured | ✅ (origin: true in dev) |

### Frontend Performance

#### Code Splitting
| Requirement | Status |
|-------------|--------|
| All page components lazy loaded | ✅ All 70+ pages |
| Router wrapped in Suspense | ✅ |
| ErrorBoundary wrapping layout | ✅ |

#### Data Fetching
| Requirement | Status |
|-------------|--------|
| TanStack Query configured | ✅ |
| refetchOnWindowFocus: false | ❌ Not explicitly set |
| All tables use DataTable with server-side pagination | ⚠️ Most — Helpdesk/Announcements use raw Table |
| All search/filter inputs debounced | ❌ Most use onSearch (enter-triggered) |

#### Loading States
| Requirement | Status |
|-------------|--------|
| Skeleton loading on every page | ✅ |
| TableSkeleton for list pages | ✅ |
| FormSkeleton for create/edit pages | ✅ |
| CardSkeleton for detail pages | ✅ |
| Never show blank screen | ✅ |

#### Rendering
| Requirement | Status |
|-------------|--------|
| React.memo on heavy list row components | ⚠️ Limited — only EmployeesPage |
| useMemo for expensive derived data | ⚠️ Limited — only some pages |
| No unnecessary re-renders from prop drilling | ✅ (Zustand + context) |

#### Bundle
| Requirement | Status |
|-------------|--------|
| ESLint configured | ✅ |
| Prettier configured | ✅ |
| No console.log in application code | ⚠️ console.log in upload.middleware.ts |
| TypeScript strict mode | Need to verify |

### General
| Requirement | Status |
|-------------|--------|
| All API responses use ResponseHandler | ⚠️ Announcements doesn't |
| All TanStack Query hooks return typed data | ✅ |
| All API endpoints typed in types/index.ts | ✅ |
| PaginationUtil used in every paginated service | ✅ |
| AggregationUtil used for all aggregations | ✅ |

---

## 10. Security Audit

### Critical Security Issues
1. **Hardcoded ENCRYPTION_KEY fallback** in `env.ts` — exposed in source code
2. **No socket authentication** — anyone can connect to socket.io
3. **Plaintext email password** in CompanySettings model (`emailConfig.password`)
4. **In-memory token blacklist** — lost on restart, fails in multi-instance

### High Security Issues
5. **Duplicate email transporters** (EmailService + sendEmail.ts) — double exposure
6. **console.log in production** code (`upload.middleware.ts:59`)
7. **Unescaped regex in announcement search** — potential ReDoS
8. **auth.refreshToken** accepts body token as fallback — potential CSRF vector

### Medium Security Issues
9. **Weak JWT dev fallbacks** in env.ts
10. **Token blacklist TTL inconsistency** (24hr vs 1hr)
11. **No resource-level ownership checks** — any authorized user can modify any resource
12. **FileUploadService.uploadFromBuffer** hardcodes PNG mime type

### Low Security Issues
13. **No socket rate limiting**
14. **No CORS restrictions in development** (`origin: true`)
15. **Math.random() for filenames** — not cryptographically secure

---

## 11. Complete Issue Registry

### CRITICAL (5 issues)
| ID | Category | Issue | Location |
|----|----------|-------|----------|
| C1 | Security | Hardcoded ENCRYPTION_KEY fallback | `server/src/config/env.ts:29` |
| C2 | Security | No socket authentication | `server/src/core/socket/socket.ts` |
| C3 | Security | Plaintext email password in CompanySettings | `server/src/models/CompanySettings.model.ts` |
| C4 | Security | In-memory token blacklist | `server/src/core/auth/TokenBlacklist.ts` |
| C5 | Code Quality | Duplicate email transporter (sendEmail.ts) | `server/src/core/email/sendEmail.ts` |

### HIGH (12 issues)
| ID | Category | Issue | Location |
|----|----------|-------|----------|
| H1 | UX Decision | Default pagination limit is 10 (intentional — avoids table page scrolling) | `server/src/core/validation/common.schemas.ts`, `PaginationUtil.ts` |
| H2 | Performance | No MongoDB connection pool config | `server/src/config/db.ts` |
| H3 | Performance | CompanySettings not cached — fetched on every notification | `server/src/core/notification/NotificationService.ts` |
| H4 | Performance | N+1 queries in attendance bulkUpdateEntries | `server/src/modules/attendance/attendance.service.ts` |
| H5 | Performance | monthlyView loads ALL records into memory | `server/src/modules/attendance/attendance.service.ts` |
| H6 | Performance | 4 modules missing caching (holidays, shifts, overtime-rules, weekly-off-rules) | Multiple service files |
| H7 | Client | Search is enter-triggered, not debounced | All feature pages using `Input.Search` |
| H8 | Client | Leave Applications loads limit:500 | `client/src/features/leave/pages/LeaveApplicationsPage.tsx` |
| H9 | Client | ReportsPage uses raw `fetch()` | `client/src/features/reports/pages/ReportsPage.tsx` |
| H10 | Client | MonthlyView defined inside component | `client/src/features/attendance/pages/AttendancePage.tsx` |
| H11 | Consistency | Announcements doesn't use ResponseHandler | `server/src/modules/announcements/announcement.controller.ts` |
| H12 | Performance | Dashboard makes 9 parallel API calls | `client/src/features/auth/pages/DashboardPage.tsx` |

### MEDIUM (15 issues)
| ID | Category | Issue | Location |
|----|----------|-------|----------|
| M1 | Code Quality | PaginationMeta duplicated 3 times | types/index.ts, ResponseHandler.ts, PaginationUtil.ts |
| M2 | Code Quality | Duplicate multer configurations | core/file/ + core/multer/ |
| M3 | Code Quality | dotenv.config() called 3 times | env.ts, db.ts, logger.ts |
| M4 | Code Quality | DateUtil.getWorkingDaysInMonth misnamed | server/src/core/utils/DateUtil.ts |
| M5 | Code Quality | AggregationUtil redundant exports | server/src/core/utils/AggregationUtil.ts |
| M6 | Security | Unescaped regex in announcement search | server/src/modules/announcements/announcement.service.ts |
| M7 | Security | console.log in upload.middleware.ts | server/src/core/file/upload.middleware.ts:59 |
| M8 | Security | Token blacklist TTL inconsistency | server/src/core/auth/TokenBlacklist.ts |
| M9 | Performance | No file transport for Winston | server/src/core/logger/logger.ts |
| M10 | Performance | AuditLog missing compound indexes | server/src/models/AuditLog.model.ts |
| M11 | Performance | Missing unique constraint on OvertimeEntry(employee, date) | server/src/models/OvertimeEntry.model.ts |
| M12 | Client | Helpdesk/Announcements use raw Table instead of DataTable | client features |
| M13 | Client | Hardcoded year range in Holidays filter | client/src/features/holidays/pages/HolidaysPage.tsx |
| M14 | Client | refetchOnWindowFocus not set to false | client/src/core/api/queryClient.ts |
| M15 | Client | PaginatedResponse interface duplicated in service files | Multiple client service files |

### LOW (8 issues)
| ID | Category | Issue | Location |
|----|----------|-------|----------|
| L1 | Code Quality | AppError.isOperational always true | server/src/core/errors/AppError.ts |
| L2 | Code Quality | AuditMiddleware uses (req as any).user | server/src/core/audit/AuditMiddleware.ts |
| L3 | Code Quality | FileUploadService.uploadFromBuffer hardcodes PNG | server/src/core/file/FileUploadService.ts |
| L4 | Performance | No cache monitoring/stats | server/src/core/cache/CacheService.ts |
| L5 | Client | Unused empSearch state in ShiftsPage | client/src/features/shifts/pages/ShiftsPage.tsx |
| L6 | Client | SettingsPage at 533 lines | client/src/features/settings/pages/SettingsPage.tsx |
| L7 | Client | ReportsPage at 811 lines | client/src/features/reports/pages/ReportsPage.tsx |
| L8 | Client | Limited React.memo/useMemo usage across pages | Multiple client pages |

---

## 12. Fix Priority Matrix

### Phase 1: Critical Security Fixes (5 items)
- C1: Remove hardcoded ENCRYPTION_KEY fallback
- C2: Add socket authentication
- C3: Encrypt email password in CompanySettings
- C4: Add persistence layer for token blacklist (or document limitation)
- C5: Remove duplicate sendEmail.ts

### Phase 2: High-Performance Server Fixes (7 items)
- H1: ~~Change default pagination limit to 20~~ — Kept at 10 per UX decision (avoids table page scrolling)
- H2: Configure MongoDB connection pool
- H3: Cache CompanySettings in NotificationService
- H4: Fix N+1 queries in attendance bulkUpdate
- H5: Paginate attendance monthlyView
- H6: Add caching for holidays, shifts, overtime-rules, weekly-off-rules
- H11: Standardize announcements to use ResponseHandler

### Phase 3: High-Client Fixes (5 items)
- H7: Add debounce to search inputs
- H8: Fix Leave Applications pagination
- H9: Replace fetch() with apiClient in Reports
- H10: Move MonthlyView outside component
- H12: Optimize Dashboard parallel queries

### Phase 4: Medium Fixes (15 items)
- M1-M5: Code quality deduplication and cleanup
- M6-M8: Security hardening
- M9-M11: Performance improvements
- M12-M15: Client consistency

### Phase 5: Low Priority Fixes (8 items)
- L1-L8: Minor improvements and cleanup
