# Todo — Manufacturing HRMS V1

## Phase 0 — Project Setup

- [x] Scaffold client (React, Vite, TypeScript, Ant Design)
- [x] Scaffold server (Express, TypeScript, MongoDB)
- [x] Configure ESLint, Prettier, tsconfig (both client and server)
- [x] Create .env.example files
- [x] Set up Express middleware (helmet, cors, morgan, compression, rate-limit, mongo-sanitize, hpp)
- [x] Set up MongoDB Atlas connection
- [x] Build backend core/ system
  - [x] errors/ (asyncHandler, AppError, errorHandler)
  - [x] response/ (ResponseHandler)
  - [x] audit/ (AuditService, AuditLog model)
  - [x] notification/ (NotificationService, Notification model)
  - [x] email/ (EmailService)
  - [x] file/ (FileUploadService, upload.middleware)
  - [x] pdf/ (PDFGeneratorService)
  - [x] excel/ (ExcelGeneratorService)
  - [x] cache/ (CacheService, cache.keys)
  - [x] permissions/ (permissions.config, authorize.middleware, permissions.types, authenticate.middleware)
  - [x] validation/ (validate.middleware, common.schemas)
  - [x] logger/ (Winston)
  - [x] utils/ (DateUtil, FormatUtil, PaginationUtil, AggregationUtil)
- [x] Build frontend core/ system
  - [x] api/ (apiClient, queryClient)
  - [x] stores/ (authStore, settingsStore, uiStore)
  - [x] hooks/ (useNotify, usePermission, usePagination, useDebounce, useFileUpload)
  - [x] constants/ (queryKeys, api.endpoints, routes, permissions, app.constants)
  - [x] components/ (DataTable, PageHeader, PermissionGate, ErrorBoundary, TableSkeleton, FormSkeleton, CardSkeleton, EmptyState, ConfirmModal, StatusBadge)
  - [x] utils/ (DateUtil, FormatUtil, DownloadUtil)
- [x] Build app layout (AppLayout, Sidebar, Header, ProtectedRoute)
- [x] Create lazy-loaded routes for all pages
- [x] Create all module skeleton files (backend models, frontend pages)
- [x] Set up seed script structure
- [x] Create .gitignore and README.md
- [ ] Present architecture proposal for confirmation
- [ ] Present schema proposal for confirmation

## Phase 1 — Foundation

- [ ] Auth module (login, logout, get me, change password)
- [ ] User CRUD with role assignment
- [ ] Department CRUD with cache
- [ ] Designation CRUD with cache
- [ ] Shift CRUD with cache
- [ ] Employee CRUD with photo upload
- [ ] Employee list with filters
- [ ] Seed data (admin, departments, designations, shifts, 10 sample employees)

## Phase 2 — Attendance

- [ ] Holiday CRUD with cache
- [ ] Weekly off rule CRUD with cache
- [ ] Attendance bulk entry
- [ ] Attendance monthly view
- [ ] Overtime rules CRUD
- [ ] Overtime entry page
- [ ] Attendance summary (aggregation)

## Phase 3 — Payroll

- [ ] Company settings page with payroll config
- [ ] Payroll calculator (pure functions)
- [ ] Payroll run flow
- [ ] Salary slip data API
- [ ] Salary slip PDF generation
- [ ] Audit logs for payroll actions

## Phase 4 — Reports and Completion

- [ ] Attendance report (Excel export)
- [ ] Payroll report (Excel export)
- [ ] Employee list export (Excel)
- [ ] Dashboard with stat cards
- [ ] Notification center
- [ ] Audit log viewer
- [ ] Final seed data (2-3 months)
- [ ] Complete all docs/ files