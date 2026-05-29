# Feature Phases — Orian HRMS

> Master overview of all planned feature additions. Each phase builds on the previous.
> All features are designed to be configurable from **Settings**.

---

## Phase 1: Employee Self-Service & Foundation

| # | Feature | Status |
|---|---------|--------|
| 1.1 | Employee Self-Service (ESS) Portal | ✅ Complete |
| 1.2 | Announcements / Broadcast | ✅ Complete |
| 1.3 | Help Desk / Tickets | ✅ Complete |

## Phase 2: Operational Management

| # | Feature | Status |
|---|---------|--------|
| 2.1 | Asset Management | ✅ Complete |
| 2.2 | Document Repository | ✅ Complete |
| 2.3 | Shift Swap / Preferences | ✅ Complete |

## Phase 3: People Development

| # | Feature | Status |
|---|---------|--------|
| 3.1 | Performance Management System | ✅ Server (models, API, tests) |
| 3.2 | Training & Development | ✅ Server (models, API, tests) |
| 3.3 | Performance Client Module | ✅ Complete |
| 3.4 | Training Client Module | ✅ Complete |

## Phase 4: Financial & Compliance

| # | Feature | Status |
|---|---------|--------|
| 4.1 | Travel & Expense Management | Pending |
| 4.2 | Gratuity Calculation | Pending |
| 4.3 | ESI / PF Auto Filing | Pending |

## Phase 5: Advanced HR

| # | Feature | Status |
|---|---------|--------|
| 5.1 | Exit Management | Pending |
| 5.2 | Contractor Management | Pending |

## Phase 6: Platform & Analytics

| # | Feature | Status |
|---|---------|--------|
| 6.1 | Dashboard / BI Analytics | Pending |
| 6.2 | PWA / Mobile Optimization | Pending |
| 6.3 | Multi-language / i18n | Pending |

---

## Development Principles (All Phases)

1. **Develop → Audit → Test → Wire → Verify** — every module follows this exact order
2. **Settings-first** — all feature toggles, configs must be accessible from `Settings`
3. **Server-client alignment** — API contracts defined before client implementation
4. **Existing patterns** — match existing module structure (models, services, controllers, routes, validation)
5. **UI consistency** — follow Ant Design patterns used in existing features
6. **No rapid development** — deliberate, well-planned, tested increments only
7. **Rollback ready** — each feature should be independently disable-able via Settings
