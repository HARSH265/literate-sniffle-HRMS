# Master Todo List — Orian HRMS Feature Development

> **Status Legend:** ⬜ Pending | 🔷 In Progress | ✅ Completed | ❌ Blocked | ➖ Cancelled
> This document is updated progressively as each phase progresses.

---

## Phase 1: Employee Self-Service & Foundation

### 1.1 Employee Self-Service (ESS) Portal

**Server:**
- [x] ✅ Create ChangeRequest model
- [x] ✅ Update User model (add employeeId)
- [x] ✅ Create `ess.service.ts`
- [x] ✅ Create `ess.controller.ts`
- [x] ✅ Create `ess.routes.ts` + register in `app.ts`
- [x] ✅ Create `ess.validation.ts`
- [x] ✅ Add `employeeSelfService` config to CompanySettings
- [x] ✅ Add new permissions + update permissions.config.ts
- [x] ✅ Update AuditMiddleware
- [x] ✅ Write server tests
- [x] ✅ Add audit middleware

**Client:**
- [x] ✅ Update client permissions
- [x] ✅ Create `features/employee-self-service/` module
- [x] ✅ Create `essService.ts`
- [x] ✅ Create hooks
- [x] ✅ Create pages (dashboard, profile, documents, attendance, leave, payslips)
- [x] ✅ Create components (ProfileField, ChangeRequestBadge)
- [x] ✅ Add routes in `App.tsx`
- [x] ✅ Add sidebar navigation
- [x] ✅ Add Settings section + update SettingsPage
- [x] ✅ Write client tests (6 page + 1 hook test)

**Verify:**
- [x] ✅ End-to-end flow
- [x] ✅ Audit logs
- [x] ✅ Settings toggle
- [x] ✅ Permission gates

---

### 1.2 Announcements / Broadcast

**Server:**
- [x] ✅ Create Announcement model
- [x] ✅ Create `announcement.service.ts`
- [x] ✅ Create `announcement.controller.ts`
- [x] ✅ Create `announcement.routes.ts` + register
- [x] ✅ Create `announcement.validation.ts`
- [x] ✅ Add config to CompanySettings
- [x] ✅ Write server tests

**Client:**
- [x] ✅ Create `features/announcements/` module
- [x] ✅ Create pages (list, detail, form)
- [x] ✅ Create service + hooks
- [x] ✅ Add routes in `App.tsx`
- [x] ✅ Add sidebar navigation
- [x] ✅ Add Settings section (AnnouncementSection)
- [x] ✅ Write client tests
- [x] ✅ Integrate with Notification system

**Verify:**
- [x] ✅ Notification delivery (via existing NotificationService)
- [x] ✅ Scheduled announcements
- [x] ✅ Unread badge (useUnreadCount hook)
- [x] ✅ Settings toggle

---

### 1.3 Help Desk / Tickets

**Server:**
- [x] ✅ Create Ticket model
- [x] ✅ Create `helpdesk.service.ts`
- [x] ✅ Create `helpdesk.controller.ts`
- [x] ✅ Create `helpdesk.routes.ts` + register in app.ts
- [x] ✅ Create `helpdesk.validation.ts`
- [x] ✅ Add config to CompanySettings
- [x] ✅ Write server tests

**Client:**
- [x] ✅ Create `features/helpdesk/` module
- [x] ✅ Create pages (list, detail, form)
- [x] ✅ Add routes
- [x] ✅ Write client tests (service, hooks, 3 pages — 50 tests total)

**Verify:**
- [x] ✅ Full ticket lifecycle (create, list, update, delete, comments)
- [x] ✅ SLA breach detection (deadline calculation, checkSla cron, breach indicators in UI)
- [x] ✅ Comment/attachment flow
- [x] ✅ Settings toggle

---

### Phase 1 Gate
- [x] ✅ All tests passing (server: 453/453, client: all passing pre-existing)
- [x] ✅ No regression (existing tests unaffected, timezone fix in attendance test)
- [x] ✅ Audit trail verified (helpdesk middleware mapping added, module labels added)
- [x] ✅ Documentation updated

---

## Phase 2: Operational Management

### 2.1 Asset Management
- [x] ✅ Server: Model, Service, Controller, Routes, Validation, Config
- [x] ✅ Client: Module, Pages, Components, Routes
- [x] ✅ Verify: Lifecycle, History, Settings toggle, Tests (25/25 passing)

### 2.2 Document Repository
- [x] ✅ Server: Model, Service, Controller, Routes, Validation, Config
- [x] ✅ Client: Module, Pages, Components, Routes
- [x] ✅ Verify: Upload, Versions, Expiry, Access control, Settings toggle, Tests (17/17 passing)

### 2.3 Shift Swap / Preferences
- [x] ✅ Server: Model, Service, Controller, Routes, Validation, Config, Tests
- [x] ✅ Client: Module, Pages, Routes, Tests
- [x] ✅ Verify: Swap lifecycle, Limits, Deadline, Settings toggle

### Phase 2 Gate
- [ ] All tests passing, no regression, audit verified

---

## Phase 3: People Development

### 3.1 Performance Management
- [x] ✅ Server: 3 models, Service, Controller, Routes, Validation, Config, Tests
- [x] ✅ Client: Module, 10 pages, Routes, Tests
- [x] ✅ Verify: Full lifecycle, Rating calculation, 360 feedback, Settings toggle

### 3.2 Training & Development
- [x] ✅ Server: 4 models, Service, Controller, Routes, Validation, Config, Tests
- [x] ✅ Client: Module, Pages (programs, enrollments, skills, gap), Routes, Tests
- [x] ✅ Verify: Enrollment lifecycle, Skill matrix, Cert expiry, Settings toggle

### Phase 3 Gate
- [ ] All tests passing, no regression in Employee model, audit verified

---

## Phase 4: Financial & Compliance

### 4.1 Travel & Expense
- [ ] Server: 2 models, Service, Controller, Routes, Validation, Config, Tests
- [ ] Client: Module, Pages (requests, claims, approvals), Routes, Tests
- [ ] Verify: Request→Claim→Approval→Reimbursement, Payroll integration, Settings toggle

### 4.2 Gratuity Calculation
- [ ] Server: Model, Service (formula), Controller, Routes, Validation, Config, Tests
- [ ] Client: Module, Pages (list, detail, calculator, report), Routes, Tests
- [ ] Verify: Formula accuracy (Payment of Gratuity Act), Cap enforcement, Settings toggle

### 4.3 ESI / PF Auto Filing
- [ ] Server: Extend PFChallan model, ESIReturn model, Service, Controller, Routes, Config, Tests
- [ ] Client: Extend statutory module with PF/ESI pages, Routes, Tests
- [ ] Verify: Contribution calculation, Export format, No duplicates, Settings toggle

### Phase 4 Gate
- [ ] All tests passing, no regression in Payroll/Statutory, audit verified

---

## Phase 5: Advanced HR

### 5.1 Exit Management
- [ ] Server: 4 models, Service (multi-module integration), Controller, Routes, Validation, Config, Tests
- [ ] Client: Module, Pages (resignations, clearance, FnF, interview, analytics), Routes, Tests
- [ ] Verify: Full exit lifecycle, FnF with Payroll/Leave/Asset/Loan, Clearance, Settings toggle

### 5.2 Contractor Management
- [ ] Server: 4 models, Service, Controller, Routes, Validation, Config, Tests
- [ ] Client: Module, Pages (contractors, contracts, workers, invoices), Routes, Tests
- [ ] Verify: Contractor→Contract→Worker→Invoice flow, Expiry alerts, Settings toggle

### Phase 5 Gate
- [ ] All tests passing, no regression in 6 dependent modules, audit verified

---

## Phase 6: Platform & Analytics

### 6.1 Dashboard / BI Analytics
- [ ] Server: Widget model, Service, Controller, Routes, Validation, Config, Tests
- [ ] Client: Enhanced DashboardPage, Widget grid, Trend charts, Export
- [ ] Verify: Existing dashboard intact, Widget accuracy, Cache, Settings toggle

### 6.2 PWA / Mobile Optimization
- [ ] Service worker + manifest (vite-plugin-pwa)
- [ ] Offline queue + sync
- [ ] Enhanced `/m/scan` with camera QR
- [ ] Mobile pages: `/m/attendance`, `/m/leave`, `/m/payslips`, `/m/profile`
- [ ] Push notification registration
- [ ] Verify: PWA installable, Offline works, Push notifications, Settings toggle

### 6.3 Multi-language / i18n
- [ ] Install react-i18next, configure
- [ ] Extract UI strings, create en/ locale files
- [ ] Create hi/ locale (at least common + auth + employees)
- [ ] Language switcher in header
- [ ] Backend: preferredLanguage + defaultLanguage
- [ ] Verify: Language switching, English fallback, Persistence, Settings toggle

### Phase 6 Gate
- [ ] All tests passing, no regression in any feature
- [ ] PWA functional offline
- [ ] i18n with 2+ languages
- [ ] Dashboard with 5+ widget types
- [ ] Documentation updated

---

## Final Integration

- [ ] All 15 features independently disableable via Settings
- [ ] All API endpoints secured with `authenticate` + `authorize`
- [ ] All mutations audited
- [ ] Permission roles updated
- [ ] Sidebar navigation updated
- [ ] All tests passing (server + client)
- [ ] All existing features verified for regression
- [ ] README updated
- [x] ✅ FEATURES_OVERVIEW.md status updated
