# Orian HRMS — V2 Plan

**Planned Start:** May 25, 2026  
**Status:** In Planning

---

## V2 Philosophy

V1 delivered a solid, production-ready HRMS foundation. V2 builds on it with one core principle:

> **Everything must be configurable.** No hardcoded rules. HR Admins control every behavior from the UI.

V2 focuses on three pillars:
1. **Leave Management** — The biggest functional gap between Attendance and Payroll
2. **Module Deepening** — Making existing modules more powerful and flexible
3. **New Capabilities** — Loan management and statutory compliance automation

---

## Phase 1: Leave Management

### What It Solves
Currently, leaves are just an attendance status. There's no application workflow, no balance tracking, no paid/unpaid distinction, and no integration with payroll deductions. HR staff manually track everything.

### What We're Building

A fully configurable leave management system where HR Admins control every rule:

- **Leave Types** — HR creates as many leave types as needed (Sick, Casual, Earned, Maternity, Paternity, LWP, Comp-off, etc.) with per-type configuration:
  - Paid/unpaid, max days, carry-forward, encashment
  - Gender-specific, category-specific (worker vs office staff)
  - Approval requirements, document requirements
  - Deduction method and payroll impact

- **Leave Applications** — Employees apply from the UI. Configurable approval workflow:
  - Single or multi-level approval chain
  - Auto-approval threshold for short leaves
  - Partial approval (approve fewer days than requested)
  - Cancel before approval

- **Leave Balances** — Auto-calculated per employee per year:
  - Configurable accrual (yearly lump, monthly pro-rata, manual allocate)
  - Carry-forward with optional expiry
  - Pro-rata on joining date
  - Encashment with configurable rate

- **Payroll Integration** — Leave days flow into payroll:
  - Paid leave → full pay, no deduction
  - Unpaid leave → deduction per configurable formula (base-only, gross, basic+allowances)
  - Allowances and deductions optionally pro-rated on unpaid leave
  - Leave days tracked separately from absent days in PayrollItem

- **Calendar & Balance Views** — Team calendar, individual balance dashboard, encashment requests

### Configurability
All behavior driven by `CompanySettings.leaveConfig`, `CompanySettings.payrollConfig` (extended), per-leave-type fields on `LeaveType` model, and per-item fields on `allowanceConfig`/`deductionConfig`. Nothing hardcoded.

---

## Phase 2: Payroll Enhancements

- Approval workflow (submit → review → approve → finalize)
- Revision history (who changed what, when, with diff)
- What-if scenario preview (adjust variables, see calculated result without saving)
- Batch edit payroll items (update multiple employees at once)

---

## Phase 3: Attendance Enhancements

- Geo-tagging entries (latitude, longitude for location verification)
- Drag-and-drop calendar (change status by dragging on monthly view)
- Bulk edit existing entries (change multiple entries at once)
- Auto-calculate overtime from inTime/outTime

---

## Phase 4: Reports Enhancements

- Custom report builder (select fields, filters, group-by, export)
- Chart visualizations (bar, line, pie — aggregated by month/department/category)
- Scheduled automated exports (configurable frequency and recipients)
- Drill-down from summary to detail records

---

## Phase 5: Loan & Advance Management

- Loan types with configurable max amount, interest rate, max tenure
- Loan application and approval workflow
- EMI calculation with auto-deduction from payroll
- Repayment tracking and balance view
- Integration with employee detail page

---

## Phase 6: Statutory Compliance Automation

- Slab-based PF calculation (employee 12%, employer 3.67% + 8.33% EPS)
- Slab-based ESI calculation (employee 0.75%, employer 3.25%)
- State-wise Professional Tax calculation
- Statutory report generation (Form 5, Form 10, ESI Return, PF ECR)
- Challan generation for payment deposit

---

## V2 Configurability Summary

| Area | What's Configurable |
|------|-------------------|
| Leave Types | Name, code, color, gender, category, paid/unpaid, max days, carry-forward, encashment, approval, documents, deduction method |
| Leave Accrual | Yearly/monthly/manual, max accumulation, pro-rata on join, negative balance |
| Leave Approval | Single/multi-level, auto-approve threshold, cancel policy, backup approver |
| Leave Deduction | Deduction priority, formula, cap, allowance/deduction pro-ration mode |
| Payroll | Approval workflow, revision tracking, what-if mode, batch edit |
| Allowances | Per-item: pro-rate on leave, pro-rate mode, include in leave calc base |
| Deductions | Per-item: pro-rate on leave, pro-rate mode |
| Attendance | Geo-tracking enable/disable, OT auto-calc enable/disable |
| Reports | Custom fields, filters, group-by, schedule, format |
| Loans | Max amount, interest rate, max tenure, applicable categories |
| Statutory | PF/ESI slabs, state-wise PT, report templates |

---

## How We Build

Each phase follows the same V1 workflow:

1. Backend implementation (models, module 4-files, integration)
2. Frontend implementation (pages, services, routes, navigation)
3. Cross-cutting (permissions, audit, notifications, seed data)
4. Audit pass — verify everything works, no hardcoded values, server/client aligned
5. Only then move to next phase

---

## When

| Phase | Module | Est. Effort |
|-------|--------|-------------|
| 1 | Leave Management | — |
| 2 | Payroll Enhancements | — |
| 3 | Attendance Enhancements | — |
| 4 | Reports Enhancements | — |
| 5 | Loan & Advance Management | — |
| 6 | Statutory Compliance Automation | — |

Phases are sequential. Each must pass audit before the next begins.
