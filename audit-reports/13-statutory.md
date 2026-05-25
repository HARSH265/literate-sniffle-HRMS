# Audit Report: Statutory Compliance Module

**Date:** May 25, 2026
**Files audited:** 7 (3 server, 2 client, 2 models)

---

## Route Inventory

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | /api/v1/statutory/defaults | MISSING authenticate | view-statutory | none |
| POST | /api/v1/statutory/calculate | MISSING authenticate | manage-statutory | calculateStatutorySchema |
| GET | /api/v1/statutory/summary/:month | MISSING authenticate | view-statutory | none |
| POST | /api/v1/statutory/challans/generate/:month | MISSING authenticate | manage-statutory | NONE (schema defined but unused) |
| GET | /api/v1/statutory/challans | MISSING authenticate | view-statutory | none |
| GET | /api/v1/statutory/challans/:id | MISSING authenticate | view-statutory | none |
| PATCH | /api/v1/statutory/challans/:id | MISSING authenticate | manage-statutory | updateChallanSchema |
| POST | /api/v1/statutory/reports/generate | MISSING authenticate | manage-statutory | generateReportSchema |
| GET | /api/v1/statutory/reports | MISSING authenticate | view-statutory | none |
| GET | /api/v1/statutory/reports/:id | MISSING authenticate | view-statutory | none |
| PATCH | /api/v1/statutory/reports/:id | MISSING authenticate | manage-statutory | updateReportSchema |

Note: Every other module (departments, shifts, employees, payroll, leave, holidays, etc.) uses router.use(authenticate). The statutory module is the ONLY module that omits authenticate entirely.

---

## Issues Found

### CRITICAL

#### 1. Missing authenticate middleware on ALL routes
- **Severity:** Critical -- production-breaking
- **Files:** server/src/modules/statutory/statutory.routes.ts, server/src/app.ts
- **Description:** Every other module applies authenticate via router.use(authenticate) or inline. The statutory routes do NOT import or apply authenticate at all. Since authenticate decodes JWT and populates req.user, and authorize() checks req.user (throwing 401 if absent):
  - No JWT verification occurs for any statutory endpoint
  - req.user is never populated, even for valid authenticated requests
  - authorize() always throws Not authenticated (401) because req.user is undefined
  - All 11 statutory API routes return 401 to ALL users -- the module is completely broken
- **Fix:** Add authenticate import and router.use(authenticate) in statutory.routes.ts
- **Status:** NOT FIXED

#### 2. Missing updatedBy on both models
- **Severity:** Critical -- audit trail gap
- **Files:** server/src/models/PFChallan.model.ts, server/src/models/StatutoryReport.model.ts, server/src/modules/statutory/statutory.service.ts
- **Description:** Neither PFChallan nor StatutoryReport models have updatedBy. Service update methods (updateChallan, updateReport) use findByIdAndUpdate without tracking who updated. Other models (Department, Shift, Employee, etc.) all have updatedBy. No audit trail for who modified status, payments, or acknowledgements.
- **Fix:** Add updatedBy to both schemas; pass userId to update methods; update controllers to pass req.user?.id.
- **Status:** NOT FIXED

#### 3. Missing createdBy on both models (only generatedBy exists)
- **Severity:** Critical -- inconsistent schema pattern
- **Files:** server/src/models/PFChallan.model.ts, server/src/models/StatutoryReport.model.ts
- **Description:** Both models have generatedBy but lack standard createdBy. When challans/reports are updated, generatedBy should not change, but no createdBy field exists. Standard pattern across codebase is createdBy + updatedBy.
- **Fix:** Add createdBy to both models or rename generatedBy to createdBy and add updatedBy.
- **Status:** NOT FIXED

### MEDIUM

#### 4. Unused validation schema -- generateChallanSchema
- **Severity:** Medium -- validation gap
- **Files:** server/src/modules/statutory/statutory.validation.ts, server/src/modules/statutory/statutory.routes.ts
- **Description:** generateChallanSchema is defined in statutory.validation.ts but never imported in statutory.routes.ts. The route POST /challans/generate/:month has zero validation middleware. Also, schema validates req.body.month but route uses req.params.month.
- **Fix:** Import and apply schema or refactor as param-validator.
- **Status:** NOT FIXED

#### 5. No pagination on list endpoints
- **Severity:** Medium -- performance/scalability
- **Files:** server/src/modules/statutory/statutory.service.ts (lines 190-200, 332-342)
- **Description:** getChallans() and getReports() return ALL documents matching filter without skip or limit. Will degrade with data growth.
- **Fix:** Add page and limit query params; apply skip + limit to queries; return total count for UI pagination.
- **Status:** NOT FIXED

#### 6. Audit middleware does not cover statutory module
- **Severity:** Medium -- audit gap
- **Files:** server/src/core/audit/AuditMiddleware.ts (getModuleFromPath)
- **Description:** getModuleFromPath() does not handle statutory paths. Despite auditMiddleware being applied at mount point, no statutory API operations are captured in audit logs.
- **Fix:** Add path check for statutory in getModuleFromPath().
- **Status:** NOT FIXED

#### 7. No duplicate challan prevention
- **Severity:** Medium -- data integrity
- **Files:** server/src/modules/statutory/statutory.service.ts (generatePFChallan)
- **Description:** generatePFChallan() does not check if a challan already exists for the given month before creating. Multiple calls create duplicate challan records.
- **Fix:** Check for existing challan with same month/financialYear before creating.
- **Status:** NOT FIXED

#### 8. No input validation on :month param routes
- **Severity:** Medium -- input validation gap
- **Files:** server/src/modules/statutory/statutory.routes.ts (routes for :month params)
- **Description:** URL param :month has no format validation on these two routes. Body-based schemas validate with regex but param-based routes skip validation entirely.
- **Fix:** Add param-validation middleware for :month using same YYYY-MM regex.
- **Status:** NOT FIXED

### MINOR

#### 9. generateChallanSchema validates body but route uses param
- **Severity:** Minor -- dead code / design mismatch
- **Files:** server/src/modules/statutory/statutory.validation.ts
- **Description:** Schema validates req.body.month but route uses req.params.month. Dead code since schema is never imported anyway.
- **Fix:** Delete unused schema or redesign as param validator.
- **Status:** NOT FIXED

#### 10. Client rowKey may not match API response
- **Severity:** Minor -- potential React key warnings
- **Files:** client/src/features/statutory/pages/StatutoryDashboard.tsx (lines 181, 188)
- **Description:** Ant Design Table components use rowKey=id but API returns MongoDB _id via .lean(). React may log key warnings and row operations may misbehave.
- **Fix:** Use rowKey=_id or add a response interceptor mapping _id to id.
- **Status:** NOT FIXED

#### 11. No isActive or soft-delete on statutory records
- **Severity:** Minor -- no way to void/archive challans
- **Files:** server/src/models/PFChallan.model.ts, server/src/models/StatutoryReport.model.ts
- **Description:** No way to void or archive challans/reports. Only status workflow (generated to paid to filed for challans; generated to downloaded to filed for reports).
- **Fix:** Add isActive boolean or archivedAt date field; filter inactive by default.
- **Status:** NOT FIXED

#### 12. Summary calculation in getStatutorySummary uses JS loop
- **Severity:** Minor -- performance
- **Files:** server/src/modules/statutory/statutory.service.ts (lines 354-443)
- **Description:** Iterates all payroll items in JavaScript. For months with thousands of employees, this will be slow. MongoDB aggregation pipeline would be more efficient.
- **Fix:** Use MongoDB aggregation ($group, $sum) to compute summary server-side.
- **Status:** NOT FIXED

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Missing authenticate -- all routes return 401 | BROKEN -- no route works for any user |
| Duplicate challan for same month | Not handled -- creates duplicate records |
| Invalid month format in params | Not validated -- :month param has no schema |
| Invalid month format in body | Handled -- Zod regex on body-validation schemas |
| Non-existent challan ID on get/update | Handled -- returns 404 |
| Non-existent report ID on get/update | Handled -- returns 404 |
| Employee not found on calculate | Handled -- throws error |
| Empty payroll items (no data for month) | Warning -- creates challan/report with all-zero values |
| Unknown report type | Warning -- falls through to default, dumps raw payroll |
| Concurrent challan generation (race condition) | Not handled -- two calls create two challans |
| State with no PT slabs configured | Warning -- silently returns PT = 0 |
| PT half-yearly assessment months | Handled -- correctly checks March/September |
| PF exempted employees in challan calc | Handled -- skipped via exempted check |
| Large dataset on list endpoints | Not handled -- no pagination, returns all records |
| Audit trail for statutory operations | Not handled -- getModuleFromPath missing statutory |
| PATCH vs PUT mismatch | Consistent -- server uses PATCH, client uses patch() |
| Zero gross pay / negative values | Handled -- Zod validates min(0) |
| updatedBy not tracked on patch | Not handled -- no field or service param |

---

## Fixes Applied

| # | Issue | Status | Files Changed |
|---|-------|--------|--------------|
| 1 | Missing `authenticate` middleware on all routes | ✅ Fixed | `server/src/modules/statutory/statutory.routes.ts` |

## Recommended Fix Order

2. CRITICAL: Add updatedBy + createdBy to both models and service update methods
2. CRITICAL: Add updatedBy + createdBy to both models and service update methods
3. MEDIUM: Import/generate param validation for :month routes
4. MEDIUM: Add duplicate challan prevention in generatePFChallan()
5. MEDIUM: Add pagination to list endpoints
6. MEDIUM: Fix audit middleware to cover statutory paths
7. MINOR: Fix rowKey on client tables
8. MINOR: Use aggregation pipeline for summary endpoint
