# Decision Log — Manufacturing HRMS V1

## 1. Project Initiation (2026-05-14)

**Decision:** Create a production-grade HRMS for a manufacturing company using MERN stack with TypeScript.
**Rationale:** Manufacturing companies need digitizing attendance from physical registers, overtime tracking, and salary slip generation. Standard ERP solutions are overkill and expensive.
**Status:** Approved

---

## 2. Architecture Choices

| Decision | Rationale | Status |
|----------|-----------|--------|
| MongoDB Atlas for database | Managed cloud DB, Mongoose ODM, aggregation pipeline for reports | Approved |
| Express.js backend | Standard, well-supported, large ecosystem | Approved |
| React 18 + Vite frontend | Fast dev server, HMR, modern React patterns | Approved |
| Ant Design as primary UI | Enterprise-grade components, consistent design | Approved |
| TanStack Query v5 | Server state management, caching, pagination built-in | Approved |
| Zustand for client state | Lightweight, minimal boilerplate | Approved |
| JWT in httpOnly cookies | More secure than localStorage for XSS | Approved |
| Cloudinary for file storage | Managed, reliable, free tier sufficient | Approved |
| node-cache for caching | Simple in-memory cache, no Redis infrastructure needed | Approved |
| puppeteer for PDF generation | Headless Chrome rendering, reliable PDF output | Approved |

---

## 3. Database Design Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| SalarySlip stored (not generated on-demand) | Needed for audit trail, slip number uniqueness, download tracking | Approved |
| CompanySettings as singleton | Only one company record, simpler than multi-tenant | Approved |
| AttendanceEntry with source field | Distinguish manual entry from future biometric integration | Approved |
| Separate OvertimeEntry from AttendanceEntry | Overtime is a separate business concept, may need approval workflow | Approved |
| PayrollItem stored separately | Allows editing individual items before finalizing the run | Approved |

---

## 4. Security Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| bcrypt salt rounds 10 | Balanced security vs. login performance | Approved |
| express-mongo-sanitize | Prevent NoSQL injection on all inputs | Approved |
| helmet | Baseline security headers | Approved |
| Rate limiting (10/min auth, 100/min general) | Prevent brute force and DoS | Approved |
| Sanitized errors in production | Never expose stack traces or internals | Approved |
| Audit log all sensitive operations | Regulatory and accountability requirement | Approved |

---

## 5. Performance Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| MongoDB aggregation for all reports | Database computes, not Node.js | Approved |
| Master data cached (TTL 1 hour) | Departments, designations, shifts rarely change | Approved |
| lean() on all read-only queries | 10x faster than full Mongoose documents | Approved |
| Lazy loaded frontend pages | Smaller initial bundle, faster first paint | Approved |
| Default page size 20, max 100 | Reasonable default, prevents unbounded queries | Approved |
| Pagination on all list APIs | Standard for enterprise apps | Approved |

---

## 6. File Handling Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Only logo and employee photo uploaded | HRMS not DMS, keep file storage minimal | Approved |
| Files on Cloudinary only | No server storage, no local file management | Approved |
| PDF/Excel generated on-demand, streamed | No storage needed, always fresh | Approved |
| Salary slips NOT stored after generation | Generated from PayrollItem data | Approved |

---

## 7. Frontend Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Ant Design with default styling only | Business admin tool, not a consumer product | Approved |
| No custom fonts | System stack only, no font loading overhead | Approved |
| Desktop-first layout | Manufacturing HR uses desktop machines | Approved |
| React.lazy + Suspense for all pages | Code splitting, faster initial load | Approved |
| useDebounce on all search inputs | Prevent API spam on every keystroke | Approved |

---

## 8. Pending Decisions

- Overtime rate calculation basis (basic only vs. basic + allowances)
- Statutory deductions (PF, ESI, TDS) requirements
- Daily wage proration formula
- Specific allowances and deductions for this company