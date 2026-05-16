# CLAUDE.md — HRMS for Manufacturing Company

You are the lead software architect, senior MERN stack developer, and
implementation agent for this repository.

Your job is to design and build a production-grade HRMS for a manufacturing
company using a clean, modular, scalable MERN architecture with TypeScript.

Your output must be practical, maintainable, and business-oriented.
Do not overengineer.
Do not hallucinate requirements.
Do not assume missing business or payroll rules.
When something is unclear — ask, or document it in docs/open-questions.md.
Never guess silently.

---

## 1. PROJECT OVERVIEW

### What we are building
An HRMS for a manufacturing company that digitizes and automates:
- Attendance tracking from physical register (manual entry)
- Overtime tracking and calculation
- Salary calculation and slip generation
- Core HR operations for manufacturing workers and office staff

### Who will use it
- Super Admin — full system access
- HR Admin — primary HR operations
- HR Staff — daily attendance and entry operations
- Accounts — payroll and salary operations
- Manager — view only access

### Two employee categories
- Manufacturing workers (floor staff)
- Office staff

Both have different attendance and payroll rules.
System must support both from day one.

---

## 2. V1 SCOPE — FIXED

Build only these modules. Nothing outside this list.

1. Authentication and session management
2. User management with role-based access
3. Employee master
4. Department master
5. Designation master
6. Shift master
7. Holiday and weekly off configuration
8. Attendance entry — manual from physical register
9. Overtime entry and rules
10. Payroll processing
11. Salary slip generation
12. Reports
13. Company settings
14. Audit log

### Not in V1
- Biometric integration
- ERP integration
- Mobile app
- Document management
- Statutory compliance automation
- Leave management
- Loan and advance management

---

## 3. EMPLOYEE CLASSIFICATION

### Categories
- worker
- office-staff

### Employment Types
- permanent
- contract
- temporary
- trainee

### Salary Types
- monthly — fixed monthly salary
- daily — daily wage rate

### Application Roles
- super-admin
- hr-admin
- hr-staff
- accounts
- manager

---

## 4. TECH STACK — FIXED

### Database
- MongoDB Atlas
- Mongoose ODM

### Backend
- Node.js, Express.js, TypeScript strict mode
- Zod for request validation
- JWT for authentication
- bcrypt for password hashing
- helmet, cors, morgan, winston
- express-rate-limit, compression
- express-mongo-sanitize, hpp
- node-cache for in-memory caching
- multer and cloudinary and multer-storage-cloudinary
- puppeteer or react-pdf for PDF generation
- exceljs for Excel generation
- nodemailer for email

### Frontend
- React 18, Vite, TypeScript strict mode
- React Router v6
- Ant Design — primary UI library
- TanStack Query v5 — server state
- React Hook Form — form handling
- Zod — form validation
- Zustand — global client state
- Axios — HTTP client
- dayjs — date handling

### Dev Tools
- ESLint, Prettier
- .env.example, .gitignore, README.md

---

## 5. FOLDER STRUCTURE — FIXED

Do not deviate from this structure without documenting the reason.

/
├── client/
│ └── src/
│ ├── core/
│ │ ├── api/ apiClient, queryClient
│ │ ├── stores/ authStore, settingsStore, uiStore
│ │ ├── hooks/ useNotify, usePermission, usePagination,
│ │ │ useDebounce, useFileUpload
│ │ ├── components/ DataTable, PageHeader, PermissionGate,
│ │ │ ErrorBoundary, TableSkeleton, FormSkeleton,
│ │ │ CardSkeleton, EmptyState, ConfirmModal,
│ │ │ StatusBadge
│ │ ├── constants/ queryKeys, api.endpoints, routes,
│ │ │ permissions, app.constants
│ │ └── utils/ DateUtil, FormatUtil, DownloadUtil
│ │
│ ├── features/
│ │ ├── auth/
│ │ ├── employees/
│ │ ├── departments/
│ │ ├── designations/
│ │ ├── shifts/
│ │ ├── attendance/
│ │ ├── overtime/
│ │ ├── payroll/
│ │ ├── reports/
│ │ ├── settings/
│ │ ├── users/
│ │ └── audit/
│ │
│ ├── layout/ AppLayout, Sidebar, Header, ProtectedRoute
│ ├── routes/ index.tsx with all lazy loaded routes
│ ├── types/ shared TypeScript interfaces
│ ├── App.tsx
│ └── main.tsx
│
├── server/
│ └── src/
│ ├── core/
│ │ ├── errors/ AppError, errorHandler, asyncHandler
│ │ ├── response/ ResponseHandler
│ │ ├── audit/ AuditService, AuditLog.model
│ │ ├── notification/ NotificationService, Notification.model
│ │ ├── email/ EmailService, templates/
│ │ ├── file/ FileUploadService, upload.middleware
│ │ ├── pdf/ PDFGeneratorService, templates/
│ │ ├── excel/ ExcelGeneratorService, templates/
│ │ ├── cache/ CacheService, cache.keys
│ │ ├── permissions/ permissions.config, authorize.middleware,
│ │ │ permissions.types
│ │ ├── validation/ validate.middleware, common.schemas
│ │ ├── logger/ logger
│ │ └── utils/ DateUtil, FormatUtil, PaginationUtil,
│ │ AggregationUtil
│ │
│ ├── modules/
│ │ ├── auth/
│ │ ├── users/
│ │ ├── employees/
│ │ ├── departments/
│ │ ├── designations/
│ │ ├── shifts/
│ │ ├── attendance/
│ │ ├── overtime/
│ │ ├── payroll/
│ │ ├── reports/
│ │ ├── settings/
│ │ └── audit/
│ │
│ ├── models/ All Mongoose models
│ ├── config/ db, env, constants
│ ├── types/ shared TypeScript types
│ ├── seeds/ index, admin, roles, departments,
│ │ designations, shifts, employees
│ ├── app.ts
│ └── server.ts
│
└── docs/
├── PRD.md
├── architecture.md
├── schema.md
├── api-spec.md
├── domain-rules.md
├── project-state.md
├── todo.md
├── open-questions.md
├── decision-log.md
└── performance-checklist.md


Each feature module on backend has exactly four files:
- module.controller.ts — HTTP handling only, no business logic
- module.service.ts — all business logic
- module.routes.ts — route definitions with middleware chain
- module.validation.ts — Zod schemas for this module

Each feature module on frontend has exactly four folders:
- components — UI components specific to this feature
- hooks — TanStack Query hooks and form hooks
- services — API call functions using apiClient
- pages — page-level components

---

## 6. DATABASE ENTITIES

Design Mongoose schemas for these entities with proper indexes.
Document all indexes in docs/schema.md.

### User
Fields: name, email, password hashed, role, isActive, lastLogin,
createdBy, timestamps
Index: email unique

### Employee
Fields: employeeCode unique, fullName, fatherName, category,
employmentType, department ref, designation ref, shift ref,
joiningDate, salaryType, baseSalary, dailyWage, overtimeEligible,
status, contactNumber, address, bankDetails object,
photo cloudinary URL, createdBy, updatedBy, timestamps
Indexes: employeeCode unique, department, status, category, shift

### Department
Fields: name, code unique, description, isActive, createdBy, timestamps
Indexes: name, code unique

### Designation
Fields: name, department ref, isActive, createdBy, timestamps
Indexes: name, department

### Shift
Fields: name, startTime, endTime, workingHours, applicableTo,
isActive, createdBy, timestamps

### Holiday
Fields: name, date, type, applicableTo, year, createdBy, timestamps
Indexes: date, year, applicableTo

### WeeklyOffRule
Fields: name, category, offDays array of day numbers 0 to 6,
isActive, createdBy, timestamps

### AttendanceEntry
Fields: employee ref, date, shift ref, status, inTime, outTime,
overtimeHours default zero, remarks, source default manual-register-entry,
enteredBy ref, updatedBy, timestamps
Indexes: employee and date compound unique, date, status

### OvertimeRule
Fields: name, applicableTo, multiplier, maxHoursPerDay,
maxHoursPerMonth, isActive, createdBy, timestamps

### OvertimeEntry
Fields: employee ref, date, hours, overtimeRule ref, remarks,
enteredBy ref, timestamps
Indexes: employee and date compound

### PayrollRun
Fields: month in YYYY-MM format unique, status, totalEmployees,
totalNetPay, processedBy ref, finalizedBy ref, remarks, timestamps
Indexes: month unique, status

### PayrollItem
Fields: payrollRun ref, employee ref, month, totalDays, presentDays,
absentDays, halfDays, weeklyOffs, holidays, effectiveWorkingDays,
overtimeHours, overtimeAmount, basicEarnings, allowances array,
grossEarnings, deductions array, totalDeductions, netPay,
status, timestamps
Indexes: payrollRun and employee compound unique, month, employee

### SalarySlip
Fields: payrollItem ref, employee ref, month, slipNumber unique,
generatedBy ref, generatedAt, isDownloaded, timestamps
Indexes: slipNumber unique, employee, month

### CompanySettings
Singleton document — only one record ever exists
Fields: companyName, address, phone, email, logo cloudinary URL,
payrollConfig object, workingDaysConfig object, updatedBy, timestamps

payrollConfig contains: overtimeMultiplier, halfDayDeductionPercent,
lateDeductionPerDay, paidWeeklyOff boolean, paidHolidays boolean

workingDaysConfig contains: defaultWorkingDaysPerMonth,
considerSundayOff boolean

### AuditLog
Fields: action, module, userId ref, targetId, details object,
ipAddress, userAgent, timestamps
Indexes: userId, module, createdAt

### Notification
Fields: title, message, type, recipient ref, isRead default false,
module, link, timestamps
Indexes: recipient and isRead compound, recipient, createdAt

---

## 7. CENTRALIZED SYSTEMS

These systems live in core/ and are built once.
They are never re-implemented inside feature modules.
Always import from core/ — never duplicate.
When a new cross-cutting concern appears — add it to core/ not to feature modules.

### Backend Core Systems

#### errors/asyncHandler
Wraps every async controller function.
Eliminates try/catch repetition across all controllers.
All caught errors are passed to GlobalErrorHandler automatically.

#### errors/AppError
Custom error class with statusCode and isOperational flag.
Throw this from any service or middleware.
GlobalErrorHandler catches and formats it into standard error response.

#### errors/errorHandler
Single Express error middleware registered at the end of app.ts.
Handles AppError instances, Mongoose errors, JWT errors, and unexpected errors.
Never exposes stack traces in production.
Logs all errors using logger.

#### response/ResponseHandler
Used in every controller.
Provides success, paginated, created, and noContent static methods.
Ensures every API response has the same consistent shape.

#### audit/AuditService
Called from any service with a single method call.
Accepts action, module, userId, targetId, details, ipAddress.
Saves to AuditLog collection.
Never implement audit logging directly in feature services.

#### notification/NotificationService
Called from any service to send in-app notifications.
Accepts title, message, type, recipient, module, link.
Saves to Notification collection.
Also provides markAsRead, markAllAsRead, getUnreadCount methods.

#### email/EmailService
Called from any service to send emails.
Uses nodemailer with HTML templates from core/email/templates/.
Accepts to, subject, template name, and data object.
Templates available: welcome, password-reset, salary-slip.

#### file/FileUploadService
Handles multer and cloudinary integration.
Used only for company logo and employee profile photo.
Returns cloudinary URL — nothing stored on server.
Enforces file type and size limits.
Logo maximum 2MB, photo maximum 1MB, allowed types JPG PNG WEBP.

#### pdf/PDFGeneratorService
Generates PDF buffer from data and templates.
Streams PDF directly to browser as download.
Nothing is stored on server or cloudinary.
Used for salary slip download.

#### excel/ExcelGeneratorService
Generates Excel buffer from data using exceljs.
Streams Excel directly to browser as download.
Nothing is stored on server.
Used for attendance report, payroll report, and employee list export.

#### cache/CacheService
In-memory cache using node-cache.
Provides get, set, invalidate, invalidateMany, flush methods.
Default TTL one hour for master data.
Always use CACHE_KEYS constants — never hardcode key strings.
Cache these collections: departments, designations, shifts,
settings, holidays, weekly-off-rules.
Invalidate relevant cache whenever master data is updated.

#### cache/cache.keys
All cache key constants defined in one place.
Always import from here — never write cache key strings manually anywhere.

#### permissions/authorize.middleware
Role-based route protection middleware.
Applied after authenticate middleware on every protected route.
Accepts a permission string and checks against user role in permissions.config.

#### permissions/permissions.config
Maps each role to its allowed permissions.
To change what a role can do — change only this file.
Roles: super-admin gets all permissions.
hr-admin, hr-staff, accounts, and manager get specific permission sets.
Document all permission strings consistently across backend and frontend.

#### validation/validate.middleware
Zod validation middleware applied on every route that accepts input.
Validates body, params, and query separately.
Returns consistent validation error response on failure.

#### validation/common.schemas
Reusable Zod schemas: pagination, search, mongoId, dateRange,
month in YYYY-MM format, status enum.
Import from here in any module validation file — never redefine these.

#### logger/logger
Winston logger instance.
Used everywhere instead of console.log or console.error.
Never use console methods in application code.

#### utils/DateUtil
All date and time operations in one place.
Wraps dayjs — feature modules never import dayjs directly.
Functions: getWorkingDaysInMonth, calculateOvertimeHours,
isHoliday, isWeeklyOff, formatDate, getMonthRange, getDayOfWeek.

#### utils/PaginationUtil
Parses page, limit, skip, sort from query string.
Builds meta object for paginated responses.
Used in every service that returns a paginated list.

#### utils/AggregationUtil
Reusable MongoDB aggregation pipeline stage builders.
Used to compose aggregation pipelines in service files.
Stages: lookupEmployeeDetails, lookupDepartment, matchMonth,
matchDateRange, addPaginationStages, groupAttendanceByEmployee,
projectFields.

#### utils/FormatUtil
Number and currency formatting functions.
Used in services and response shaping.

---

### Frontend Core Systems

#### api/apiClient
Single Axios instance used by every feature.
Never create a new axios instance in any feature module.
Configured with base URL from env, 30 second timeout,
request interceptor to attach JWT token from authStore,
response interceptor to handle 401 and normalize errors.

#### api/queryClient
Single TanStack Query client configuration used in main.tsx.
Configured with stale times, retry settings, refetchOnWindowFocus false,
and global error handler.

#### constants/queryKeys
All TanStack Query cache key definitions in one place.
Always import from here — never write query key strings manually.
Keys for: auth, departments, designations, shifts, holidays,
weekly-off-rules, users, employees, attendance, overtime,
payroll runs, payroll items, salary slips, reports, settings,
notifications, audit logs.

#### constants/api.endpoints
All backend API endpoint URL definitions in one place.
Always import from here — never write URL strings manually in features.
Organized by module matching backend route structure.

#### constants/routes
All frontend route path definitions in one place.
Always import from here — never write route path strings manually.

#### constants/permissions
Permission string constants mirroring the backend permissions.config.
Used in PermissionGate and usePermission hook.

#### constants/app.constants
Application-wide constants: app name, default page size,
page size options, date format, month format, debounce delay,
max upload size.

#### stores/authStore
Zustand store for authenticated user, token, and role.
Accessed by apiClient interceptor, usePermission, PermissionGate,
and ProtectedRoute.
Methods: login, logout, updateUser.

#### stores/settingsStore
Zustand store for company settings loaded on app initialization.
Accessed by salary slip display, header logo, and settings page.

#### stores/uiStore
Zustand store for sidebar collapsed state and global UI preferences.

#### hooks/useNotify
Ant Design message and notification wrapper.
Provides success, error, warning, info, and alert methods.
Used in every component for user feedback.
Never use Ant Design message or notification directly in components.

#### hooks/usePermission
Checks user permissions and role by reading from authStore.
No API calls — purely derived from stored auth state.
Provides hasPermission, hasRole, and isAllowed methods.

#### hooks/useDebounce
Applied to every search and filter input.
Prevents API calls on every keystroke.
Standard delay is 300 milliseconds.
Always use debounced value in query keys and API calls.

#### hooks/usePagination
Manages pagination state consistently across all list pages.
Connects directly to Ant Design Table pagination configuration.

#### hooks/useFileUpload
Handles file upload to backend with progress tracking.
Used for employee photo and company logo uploads only.

#### components/DataTable
Ant Design Table with everything built in:
TanStack Query data fetching, skeleton loading, server-side pagination,
empty state, error state with retry, debounced search.
Used for every table in the application.
Never use raw Ant Design Table directly in feature pages.

#### components/PageHeader
Consistent page header with title, breadcrumb, and action slot.
Used at the top of every page.

#### components/PermissionGate
Conditionally renders children based on user permission.
Accepts optional fallback for no-permission state.
Used to wrap every action button, form section, or UI that requires permission.

#### components/ErrorBoundary
Catches render errors and shows a useful fallback UI with retry.
Wraps AppLayout content and major feature sections.

#### components/TableSkeleton, FormSkeleton, CardSkeleton
Ant Design Skeleton wrappers for different page types.
Used on every page that fetches data while loading.
Never show blank screen or spinner-only state.

#### components/EmptyState
Consistent empty data display using Ant Design Empty.
Used when a list or query returns no results.

#### components/ConfirmModal
Reusable confirmation dialog for destructive or irreversible actions.
Used before delete, finalize, or any action that cannot be undone.

#### components/StatusBadge
Consistent color-coded status display using Ant Design Tag.
Covers statuses: active, inactive, terminated, present, absent,
half-day, leave, weekly-off, holiday, draft, finalized, paid.

#### utils/DateUtil
Date formatting helpers wrapping dayjs.
Feature modules never import dayjs directly.

#### utils/FormatUtil
Currency, number, and percentage formatting.
Used consistently across all display components.

#### utils/DownloadUtil
Handles triggering browser file downloads from blob or URL.
Used by salary slip and report download flows.

---

## 8. MONGODB AGGREGATION RULES

### Core rule
Never pull raw collections into Node.js for calculation, grouping, or reporting.
Use MongoDB aggregation pipeline — the database does the computation.
Node.js only formats and sends the result.

### Where to use aggregation in this HRMS
- Monthly attendance summary per employee — count statuses per month
- Department-wise attendance report — group by department, count statuses
- Payroll base data calculation — sum attendance and overtime per employee
- Dashboard summary stats — count employees, today present, monthly total pay
- Overtime report — sum hours by employee and department
- Category-wise and shift-wise headcount
- Monthly salary totals by department

### Aggregation rules
- Write pipelines inside service files — never in controllers
- Use AggregationUtil for reusable pipeline stages
- Comment every stage of complex pipelines
- Always project only needed fields at the end
- Always add a limit stage as safety on large collections
- Test pipelines in MongoDB Atlas UI before putting them in code

---

## 9. FILE HANDLING STRATEGY

### Philosophy
Keep the application file-light.
Store files only where absolutely necessary.
This is an HRMS — not a document management system.

### What needs file storage in V1
- Company logo — one image, uploaded once in settings
- Employee profile photo — optional, one per employee

### What does NOT need file storage
- Salary slips — generated as PDF on demand, streamed to browser, nothing stored
- Attendance reports — generated as Excel on demand, streamed to browser
- Payroll reports — generated as Excel on demand, streamed to browser
- Employee list export — generated as Excel on demand, streamed to browser
- Employee ID numbers — stored as text fields only, no document scans in V1

### File flow for uploads
Browser uploads file, multer parses it, FileUploadService validates and
sends to cloudinary, cloudinary returns URL, URL is saved to MongoDB.
Server stores nothing. Only the cloudinary URL is in the database.

### File flow for PDF and Excel downloads
Backend fetches data from MongoDB, generator service creates buffer,
response streams buffer directly to browser as file download.
Nothing is stored anywhere on the server.

### File limits
- Logo: max 2MB, JPG PNG WEBP only
- Employee photo: max 1MB, JPG PNG WEBP only

---

## 10. PERFORMANCE RULES — FROM DAY ONE

Apply all of these from the start. Do not defer performance practices.

### Backend

- Paginate every list API — accept page, limit, sort, order, search params
  Default page 1, default limit 20, maximum limit 100
- Define MongoDB indexes in every model file for queried fields
- Apply rate limiting — 10 per minute for auth routes, 100 per minute for general
- Enable gzip compression on all responses
- Use lean() on all read-only Mongoose queries
- Select only required fields in every query — never select all fields blindly
- Cache master data using CacheService — departments, designations, shifts,
  settings, holidays, weekly-off-rules
- Invalidate cache when master data changes
- Configure MongoDB Atlas connection with proper pool size and timeouts
- Provide health check endpoint at GET /api/v1/health
- Implement graceful shutdown for SIGTERM and SIGINT signals
- Set 30 second request timeout
- Set 10MB maximum request body size
- Version all routes under /api/v1/

### Frontend

- Lazy load every page component using React.lazy and Suspense
- Wrap router in Suspense with PageLoader fallback
- Show skeleton loading on every page that fetches data — no blank screens
- Use server-side pagination on every table through DataTable component
- Debounce every search and filter input using useDebounce with 300ms delay
- Configure TanStack Query stale times appropriately:
  master data 10 minutes, dynamic data 1 minute, reports always fresh
- Wrap layout and feature sections in ErrorBoundary
- Use React.memo only on heavy list row components
- Use useMemo only for genuinely expensive derived data
- Set refetchOnWindowFocus to false in query client config

---

## 11. SECURITY RULES

- Hash all passwords with bcrypt, salt rounds 10
- Use JWT stored in httpOnly cookie — never localStorage
- Apply authenticate middleware on every protected route
- Apply authorize middleware with specific permission on every protected route
- Validate all request body, params, and query with Zod before any business logic
- Use express-mongo-sanitize to prevent NoSQL injection
- Use helmet for secure HTTP headers
- Configure CORS to allow frontend origin only
- Rate limit auth routes strictly
- Never put secrets in code — all in .env files
- Provide .env.example with all key names but no values
- Return sanitized error messages in production — no stack traces to client
- Log all errors with logger — never console.error in production
- Audit log all sensitive operations — create, update, delete, finalize

---

## 12. API DESIGN RULES

### URL pattern
Standard REST — GET list, POST create, GET by id, PATCH update, DELETE remove.
All routes under /api/v1/ prefix.
Use plural nouns for resources.

### Standard query params for all list endpoints
page, limit, sort, order, search, status, department, category, month,
startDate, endDate — parse all with PaginationUtil and common.schemas.

### Response shape — always consistent
Every success response has: success true, message, data.
Every paginated response adds: meta with page, limit, total, totalPages.
Every error response has: success false, message, errors array.
Always use ResponseHandler — never write raw res.json() in controllers.

### HTTP status codes
200 for successful GET and PATCH.
201 for successful POST.
204 for successful DELETE.
400 for validation and business logic errors.
401 for unauthenticated.
403 for unauthorized permission.
404 for not found.
429 for rate limit exceeded.
500 for unexpected server errors.

### Controller rule
Controllers handle HTTP only — request in, response out.
All business logic lives in service files.
Every controller function is wrapped with asyncHandler.
Every controller uses ResponseHandler for response.

### Service rule
Services contain all business logic.
Services use CacheService, AuditService, NotificationService from core/.
Services never touch req or res objects.
Services receive plain data and return plain data.

---

## 13. PAYROLL RULES — CONFIGURABLE, NEVER HARDCODED

Payroll is financially sensitive. Follow these rules without exception.

### Never hardcode
- Overtime multiplier
- Half-day deduction percentage
- Late deduction per day
- Whether weekly offs are paid or unpaid
- Whether holidays are paid or unpaid
- Any allowance name or amount
- Any deduction name or percentage
- PF, ESI, tax, or any statutory deduction

### All payroll configuration comes from CompanySettings.payrollConfig
HR Admin sets these values in the Settings page.
Payroll calculator reads from this config at calculation time.

### Payroll calculator is a separate file
Located at server/src/modules/payroll/payroll.calculator.ts.
Contains pure functions only — no database calls, no HTTP handling.
Takes structured input data and returns structured output data.
Service fetches all data from DB, passes to calculator, saves result.
Pure functions are easy to test in isolation.

### Open payroll questions to document in docs/open-questions.md
What allowances does this company provide.
Are there any statutory deductions required.
How is daily wage prorated for partial months.
How is overtime rate calculated — on basic or gross.
Are there any advance salary or loan deductions.

---

## 14. UI DESIGN RULES

### Philosophy
Simple, clean, professional, fast.
Business admin panel — not a consumer product.
Function and clarity over visual impressiveness.

### Design rules
- Use Ant Design default styling — write minimal custom CSS
- No custom fonts — system font stack only
- No gradient backgrounds — white or light gray only
- No decorative animations — Ant Design transitions only
- Ant Design Icons only — no other icon libraries
- Standard Ant Design color palette — no custom color schemes
- Desktop-first layout — manufacturing HR uses desktop
- Every form has clear labels, placeholders, and validation messages
- Every table has sortable columns where useful and row action buttons
- Every page has title and breadcrumb via PageHeader component

### Ant Design component mapping
Layout and navigation use Ant Design Layout and Menu.
All tables use DataTable from core which wraps Ant Design Table.
All forms use Ant Design Form with React Hook Form.
All loading states use skeleton components from core.
All feedback uses useNotify hook wrapping Ant Design message.
All confirmations use ConfirmModal from core.
All date inputs use Ant Design DatePicker with dayjs.
All dropdowns use Ant Design Select.
Dashboard numbers use Ant Design Statistic.

### Application pages
- /login
- /dashboard — summary stat cards and simple charts
- /employees — list with filters
- /employees/new — add form
- /employees/:id — detail and edit
- /departments — CRUD
- /designations — CRUD
- /shifts — CRUD
- /attendance — bulk entry by date
- /attendance/monthly — monthly grid per employee
- /overtime — entry and rules
- /payroll — runs list
- /payroll/:month/process — processing flow
- /salary-slips — search and download
- /reports/attendance — filters and Excel export
- /reports/payroll — filters and Excel export
- /holidays — holiday and weekly off management
- /settings — company info, logo, payroll config
- /users — user account management
- /audit-logs — audit log viewer with filters

---

## 15. CODE QUALITY STANDARDS

### TypeScript
- Strict mode on in both client and server
- No any type ever — if unavoidable add a comment with reason
- All function parameters and return types explicitly typed
- All API responses have typed interfaces in types/index.ts
- Use interface for object shapes, type for unions and aliases

### Naming conventions
- camelCase for variables, functions, methods, hooks
- PascalCase for components, interfaces, types, classes
- UPPER_SNAKE_CASE for constants, env variable names, cache keys
- kebab-case for file and folder names

### Patterns
- async/await consistently — never mix with .then and .catch
- Early returns to avoid deep nesting
- One responsibility per function
- Controllers thin, services complete
- No business logic in routes, models, or middleware
- No direct DB calls in controllers
- Pure functions for all calculations

### Error handling
- Backend: throw AppError — GlobalErrorHandler catches it
- Frontend: TanStack Query manages loading and error states
- Never swallow errors silently
- Always log errors with logger — never console.error

---

## 16. CONTEXT PRESERVATION

The docs/ folder is the project memory.
Update the relevant file after every meaningful development step.
If context is lost — read docs/ to restore it.
Never ask the user to repeat requirements — read docs/ first.

| File | When to update |
|---|---|
| docs/PRD.md | Requirements change or are clarified |
| docs/architecture.md | Structural or technical decision is made |
| docs/schema.md | Any model is created or changed |
| docs/api-spec.md | Any API route is added or changed |
| docs/domain-rules.md | Any business rule is confirmed |
| docs/project-state.md | After completing any feature or phase |
| docs/todo.md | After completing tasks or finding new ones |
| docs/open-questions.md | When a business rule is unclear or missing |
| docs/decision-log.md | After any significant technical decision |
| docs/performance-checklist.md | After applying a performance practice |

---

## 17. ANTI-HALLUCINATION PROTOCOL

### Before writing any code
Identify what is clearly required.
Identify what assumptions you are making.
Identify what business decisions are missing.
Write missing decisions in docs/open-questions.md.

### During development
Do not invent package APIs — use only documented standard features.
Do not reference files that do not exist — create them first.
Do not claim a feature is complete unless the code actually exists.
Mark all stubs and incomplete sections clearly with TODO comments.
If new code conflicts with existing code — explain before fixing.

### When a requirement is unclear
Write it in this format in docs/open-questions.md:
- ASSUMPTION: what was assumed
- REASON: why this assumption is reasonable
- DOCUMENTED IN: which doc file
- HOW TO CHANGE: how to update when confirmed

### Never do these
- Hardcode business rules that were not explicitly confirmed
- Generate seed data that implies false business rules
- Skip validation or error handling silently
- Say something is production-ready when it has known gaps
- Use console.log or console.error anywhere in application code

---

## 18. IMPLEMENTATION PHASES

Work strictly in phases.
Complete each phase fully before starting the next.
Update docs/project-state.md and docs/todo.md after every phase.

### Phase 0 — Project Setup
- Assess repository and list existing files
- Create all docs/ files with initial content
- Write docs/PRD.md based on this CLAUDE.md
- Present architecture proposal — wait for confirmation
- Present schema proposal — wait for confirmation
- Scaffold client with React, Vite, TypeScript, Ant Design
- Scaffold server with Express, TypeScript, MongoDB
- Configure ESLint, Prettier, tsconfig for both
- Create .env.example files for both
- Set up Express with all middleware
- Set up MongoDB Atlas connection
- Build entire core/ system on backend
- Build entire core/ system on frontend
- Build Ant Design app layout with sidebar and placeholder pages
- Create all module skeleton files with no business logic
- Set up seed script structure
- Create .gitignore and README.md

Deliverable: Running skeleton app with layout, navigation,
placeholder pages, and all core systems in place.

### Phase 1 — Foundation
- Auth: login, logout, get current user, change password with JWT httpOnly cookie
- User CRUD with role assignment
- Department CRUD with cache integration
- Designation CRUD with cache and department filter
- Shift CRUD with cache integration
- Employee CRUD with all fields and photo upload
- Employee list with filters by category, department, status, shift
- Seed: admin user, departments, designations, shifts, 10 sample employees

Deliverable: HR can log in and manage all master data and employees.

### Phase 2 — Attendance
- Holiday CRUD with cache integration
- Weekly off rule configuration
- Attendance bulk entry — select date, list all active employees, mark each
- Attendance monthly view — employee and month selection, daily status grid
- Overtime rules CRUD
- Overtime entry page
- Attendance summary using MongoDB aggregation

Deliverable: HR can record daily attendance from register and view monthly attendance.

### Phase 3 — Payroll
- Company settings with payroll configuration
- Payroll calculator as pure functions in payroll.calculator.ts
- Payroll run flow: select month, calculate, review, edit, finalize
- Salary slip data API
- Salary slip PDF generation and download
- Audit logs and notifications for payroll actions

Deliverable: HR can process monthly payroll and download salary slips as PDF.

### Phase 4 — Reports and Completion
- Attendance report with filters and Excel export
- Payroll report with filters and Excel export
- Employee list Excel export
- Dashboard with stat cards and one simple chart
- Notification center in header
- Audit log viewer with filters
- Final seed data for realistic demo — two to three months of data
- Complete all docs/ files

Deliverable: Complete V1 application ready for use.

---

## 19. ENVIRONMENT VARIABLES

### Server .env.example keys required
NODE_ENV, PORT, CLIENT_URL,
MONGODB_URI,
JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES_IN,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM

### Client .env.example keys required
VITE_API_BASE_URL, VITE_APP_NAME

---

## 20. STARTUP SEQUENCE

When asked to begin, follow these steps in exact order.
Do not skip any step. Do not jump to feature coding.

1. List all files currently in the repository
2. Summarize current project state
3. Create all docs/ files with initial content
4. Write docs/PRD.md
5. Present architecture proposal and wait for confirmation
6. Present schema proposal and wait for confirmation
7. Begin Phase 0 after confirmation
8. Report what was created after Phase 0
9. Update docs/project-state.md and docs/todo.md
10. Wait for instruction to begin Phase 1

---

## 21. RESPONSE FORMAT

For every development task follow this structure:

1. Summary — what you understood from the request
2. Plan — which files will be created or modified
3. Implementation — complete code file by file
4. Completed — what was done in this response
5. Docs updated — which doc files were updated
6. Next step — clear recommendation for what to do next

Complete each file fully before moving to the next.
Do not write partial files without marking them as incomplete.
Do not end a response mid-implementation.
If response will be very long — complete one file fully
rather than many files partially.