# Architecture — Manufacturing HRMS

## 1. Overview

Clean, modular, scalable MERN architecture with TypeScript strict mode on both client and server.

## 2. Folder Structure

```
/
├── client/src/
│   ├── core/
│   │   ├── api/           # apiClient, queryClient
│   │   ├── stores/        # authStore, settingsStore, uiStore
│   │   ├── hooks/         # useNotify, usePermission, usePagination, useDebounce, useFileUpload
│   │   ├── components/    # DataTable, PageHeader, PermissionGate, ErrorBoundary, TableSkeleton, FormSkeleton, CardSkeleton, EmptyState, ConfirmModal, StatusBadge
│   │   ├── constants/     # queryKeys, api.endpoints, routes, permissions, app.constants
│   │   └── utils/         # DateUtil, FormatUtil, DownloadUtil
│   ├── features/
│   │   ├── auth/, employees/, departments/, designations/, shifts/
│   │   ├── attendance/, overtime/, payroll/, reports/, settings/, users/, audit/
│   ├── layout/            # AppLayout, Sidebar, Header, ProtectedRoute
│   ├── routes/            # index.tsx (lazy loaded)
│   ├── types/             # shared TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
│
├── server/src/
│   ├── core/
│   │   ├── errors/        # AppError, errorHandler, asyncHandler
│   │   ├── response/      # ResponseHandler
│   │   ├── audit/         # AuditService, AuditLog.model
│   │   ├── notification/  # NotificationService, Notification.model
│   │   ├── email/         # EmailService, templates/
│   │   ├── file/          # FileUploadService, upload.middleware
│   │   ├── pdf/           # PDFGeneratorService, templates/
│   │   ├── excel/         # ExcelGeneratorService, templates/
│   │   ├── cache/         # CacheService, cache.keys
│   │   ├── permissions/   # permissions.config, authorize.middleware, permissions.types
│   │   ├── validation/    # validate.middleware, common.schemas
│   │   ├── logger/       # logger
│   │   └── utils/         # DateUtil, FormatUtil, PaginationUtil, AggregationUtil
│   ├── modules/          # auth/, users/, employees/, departments/, designations/, shifts/, attendance/, overtime/, payroll/, reports/, settings/, audit/
│   ├── models/           # All Mongoose models
│   ├── config/           # db, env, constants
│   ├── types/            # shared TypeScript types
│   ├── seeds/            # index, admin, roles, departments, designations, shifts, employees
│   ├── app.ts
│   └── server.ts
│
└── docs/
    ├── PRD.md, architecture.md, schema.md, api-spec.md, domain-rules.md
    ├── project-state.md, todo.md, open-questions.md, decision-log.md
    └── performance-checklist.md
```

## 3. Backend Module Structure

Each module has exactly four files:
- `module.controller.ts` — HTTP handling only
- `module.service.ts` — all business logic
- `module.routes.ts` — route definitions with middleware chain
- `module.validation.ts` — Zod schemas

## 4. Frontend Module Structure

Each feature module has four folders:
- `components/` — UI components specific to this feature
- `hooks/` — TanStack Query hooks and form hooks
- `services/` — API call functions using apiClient
- `pages/` — page-level components

## 5. Centralized Systems (Built Once)

### Backend
- **errors/** — asyncHandler, AppError, errorHandler (Global)
- **response/** — ResponseHandler (success, paginated, created, noContent)
- **audit/** — AuditService (called from any service)
- **notification/** — NotificationService (in-app notifications)
- **email/** — EmailService (nodemailer + HTML templates)
- **file/** — FileUploadService (multer + Cloudinary)
- **pdf/** — PDFGeneratorService (salary slip PDF)
- **excel/** — ExcelGeneratorService (attendance/payroll reports)
- **cache/** — CacheService (node-cache + cache.keys constants)
- **permissions/** — permissions.config, authorize.middleware
- **validation/** — validate.middleware, common.schemas
- **logger/** — Winston logger
- **utils/** — DateUtil, FormatUtil, PaginationUtil, AggregationUtil

### Frontend
- **api/** — apiClient (Axios), queryClient (TanStack Query)
- **stores/** — authStore, settingsStore, uiStore (Zustand)
- **hooks/** — useNotify, usePermission, usePagination, useDebounce, useFileUpload
- **constants/** — queryKeys, api.endpoints, routes, permissions, app.constants
- **components/** — DataTable, PageHeader, PermissionGate, ErrorBoundary, TableSkeleton, FormSkeleton, CardSkeleton, EmptyState, ConfirmModal, StatusBadge
- **utils/** — DateUtil, FormatUtil, DownloadUtil

## 6. Security Architecture

- JWT stored in httpOnly cookie
- bcrypt password hashing (salt rounds 10)
- express-mongo-sanitize (NoSQL injection prevention)
- helmet (secure HTTP headers)
- CORS (frontend origin only)
- Rate limiting (10/min auth routes, 100/min general)
- Zod validation on all inputs
- Sanitized error responses in production

## 7. Performance Architecture

- Pagination on every list API (default 20, max 100)
- MongoDB indexes on all queried fields
- node-cache for master data (TTL 1 hour)
- lean() on all read-only Mongoose queries
- Select only required fields
- Lazy loading on frontend pages
- Skeleton loading on every data-fetching page
- 300ms debounce on search/filter inputs
- MongoDB aggregation for reports (not JS computation)
- gzip compression on all responses

## 8. Data Flow

### Reads
`Browser → apiClient (Axios) → Express Route → Controller → Service → Mongoose → MongoDB`

### Writes
`Browser → React Hook Form + Zod → apiClient → Express Route → validate middleware → Controller → Service → Mongoose → MongoDB`

### Payroll Processing
`Service fetches attendance data → PayrollCalculator (pure functions) → Service saves PayrollRun + PayrollItems`

### File Uploads
`Browser → multer → FileUploadService → Cloudinary → Cloudinary URL → MongoDB`

### PDF/Excel Generation
`Service fetches data → GeneratorService → Buffer → Stream to browser (download)`

## 9. Cache Strategy

Cached collections (TTL 1 hour):
- departments, designations, shifts, settings, holidays, weekly-off-rules

Invalidation: whenever master data is updated, call `CacheService.invalidate()` with the relevant cache key.

## 10. API Versioning

All routes under `/api/v1/` prefix.
Health check at `GET /api/v1/health`.