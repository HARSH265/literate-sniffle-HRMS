# Performance Checklist — Manufacturing HRMS V1

## Backend Performance

### Database
- [x] MongoDB indexes defined on all queried fields — see docs/schema.md
- [x] lean() used on all read-only queries
- [x] select only required fields (never select all blindly)
- [ ] MongoDB aggregation used for all reports and summaries
- [ ] Connection pool size configured for MongoDB Atlas
- [ ] Query timeout configured

### Caching
- [x] node-cache configured for master data
- [x] CACHE_KEYS constants used everywhere (no hardcoded strings)
- [x] Cache invalidated on master data updates
- [x] Default TTL: 1 hour for master data
- [x] Cached: departments, designations, shifts, settings, holidays, weekly-off-rules

### API
- [x] All list endpoints paginated (page, limit)
- [x] Default page 1, limit 20
- [x] Maximum limit 100 enforced
- [x] Default sort, order, search, filters on all list endpoints
- [ ] Request timeout: 30 seconds
- [ ] Response compression (gzip): enabled
- [x] Maximum request body size: 10MB

### Rate Limiting
- [ ] Auth routes: 10 requests per minute
- [ ] General routes: 100 requests per minute

### Error Handling
- [x] Global error handler catches all errors
- [ ] Winston logger used everywhere (no console.log/error)
- [x] Stack traces hidden in production

### Server
- [ ] Health check endpoint at GET /api/v1/health
- [ ] Graceful shutdown for SIGTERM and SIGINT
- [x] express-mongo-sanitize on all requests
- [x] helmet for secure HTTP headers
- [x] CORS configured for frontend origin only

---

## Frontend Performance

### Code Splitting
- [ ] All page components lazy loaded with React.lazy
- [ ] Router wrapped in Suspense with PageLoader
- [ ] ErrorBoundary wrapping layout and major sections

### Data Fetching
- [ ] TanStack Query configured with appropriate stale times:
  - Master data: 10 minutes
  - Dynamic data: 1 minute
  - Reports: always fresh (staleTime 0)
- [ ] refetchOnWindowFocus: false
- [ ] All tables use DataTable component with server-side pagination
- [ ] All search/filter inputs debounced (300ms) using useDebounce

### Loading States
- [ ] Skeleton loading on every page that fetches data
- [ ] TableSkeleton for list pages
- [ ] FormSkeleton for create/edit pages
- [ ] CardSkeleton for detail/display pages
- [ ] Never show blank screen or spinner-only state

### Rendering
- [ ] React.memo on heavy list row components only
- [ ] useMemo only for genuinely expensive derived data
- [ ] No unnecessary re-renders from prop drilling (use context for global state)

### Bundle
- [x] ESLint configured
- [x] Prettier configured
- [ ] No console.log in application code
- [x] TypeScript strict mode on

---

## General
- [x] All API responses use ResponseHandler (consistent shape)
- [ ] All TanStack Query hooks return typed data
- [ ] All API endpoints typed in types/index.ts
- [x] PaginationUtil used in every paginated service
- [ ] AggregationUtil used for all MongoDB aggregation pipelines