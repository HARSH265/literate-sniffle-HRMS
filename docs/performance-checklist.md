# Performance Checklist — Manufacturing HRMS V1

## Backend Performance

### Database
- [ ] MongoDB indexes defined on all queried fields — see docs/schema.md
- [ ] lean() used on all read-only queries
- [ ] select only required fields (never select all blindly)
- [ ] MongoDB aggregation used for all reports and summaries
- [ ] Connection pool size configured for MongoDB Atlas
- [ ] Query timeout configured

### Caching
- [ ] node-cache configured for master data
- [ ] CACHE_KEYS constants used everywhere (no hardcoded strings)
- [ ] Cache invalidated on master data updates
- [ ] Default TTL: 1 hour for master data
- [ ] Cached: departments, designations, shifts, settings, holidays, weekly-off-rules

### API
- [ ] All list endpoints paginated (page, limit)
- [ ] Default page 1, limit 20
- [ ] Maximum limit 100 enforced
- [ ] Default sort, order, search, filters on all list endpoints
- [ ] Request timeout: 30 seconds
- [ ] Response compression (gzip): enabled
- [ ] Maximum request body size: 10MB

### Rate Limiting
- [ ] Auth routes: 10 requests per minute
- [ ] General routes: 100 requests per minute

### Error Handling
- [ ] Global error handler catches all errors
- [ ] Winston logger used everywhere (no console.log/error)
- [ ] Stack traces hidden in production

### Server
- [ ] Health check endpoint at GET /api/v1/health
- [ ] Graceful shutdown for SIGTERM and SIGINT
- [ ] express-mongo-sanitize on all requests
- [ ] helmet for secure HTTP headers
- [ ] CORS configured for frontend origin only

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
- [ ] ESLint configured
- [ ] Prettier configured
- [ ] No console.log in application code
- [ ] TypeScript strict mode on

---

## General
- [ ] All API responses use ResponseHandler (consistent shape)
- [ ] All TanStack Query hooks return typed data
- [ ] All API endpoints typed in types/index.ts
- [ ] PaginationUtil used in every paginated service
- [ ] AggregationUtil used for all MongoDB aggregation pipelines