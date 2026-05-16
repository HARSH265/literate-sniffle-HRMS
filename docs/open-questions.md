# Open Questions — Manufacturing HRMS V1

**Last Updated:** 2026-05-12

---

## Core Design Principle

This system is designed to be fully configurable by HR Admin from the UI.
No code changes should be needed for any business rule change.
All rules, rates, allowances, deductions, shifts, and policies
are managed through the Settings and Master Data pages.
Seed data provides sensible defaults — HR Admin customizes everything
after first login to match their company standards.

---

## Resolved

### Employee and Payroll

- **Q1 — Allowances:**
  Fully configurable by HR Admin from Settings page.
  HR Admin can add, remove, rename any allowance.
  Each allowance can be fixed amount or percentage of basic salary.
  Each allowance can be applied to all employees or specific
  category such as worker or office-staff or employment type.
  Default seed includes HRA, DA, Transport Allowance, Food Allowance
  as starting point only. HR Admin changes these to match
  their company structure after first login.
  Stored in CompanySettings.allowanceConfig as configurable array.
  PayrollItem.allowances stores the calculated values per employee.

- **Q2 — Statutory deductions PF ESI TDS:**
  Not automatic in V1.
  HR Admin can add PF, ESI, TDS as manual configurable deductions
  from Settings page with custom name, percentage or fixed amount.
  System stores and applies them but does not auto-calculate
  based on government slabs.
  Full statutory slab-based calculation planned for V2.

- **Q3 — Daily wage proration:**
  Formula configurable in CompanySettings.
  Default formula: Daily Wage multiplied by effective paid days.
  Paid days = present days plus paid holidays plus paid weekly offs.
  HR Admin sets whether holidays and weekly offs are paid or unpaid.
  HR Admin sets default working days per month.

- **Q4 — Overtime base:**
  Fully configurable in CompanySettings.payrollConfig.
  HR Admin sets:
    - Overtime base: basic salary only or basic plus fixed allowances
    - Overtime multiplier: default 1.5, HR Admin changes as needed
    - Standard hours per day: default 8, configurable
  Formula uses whatever HR Admin has configured.

- **Q5 — Advance and loan deductions:**
  HR Admin can add one-time or recurring manual deductions
  per employee during payroll finalization.
  Proper loan and advance module with tracking planned for V2.

- **Q6 — Company name and logo:**
  Entered by Super Admin in Company Settings on first login.
  All fields editable anytime from Settings page.
  Logo uploaded to Cloudinary, URL stored in CompanySettings.

- **Q7 — Bank details format:**
  Fields: Bank Name, Account Number 9 to 18 digits,
  IFSC Code 11 characters, Account Type savings or current.
  All fields optional as a group — either all filled or none.
  Validated with Zod on frontend and backend.

### Attendance

- **Q8 — Manufacturing worker shifts:**
  Fully configurable by HR Admin from Shift master.
  Default seed provides starting point:
  Morning 6AM to 2PM, Evening 2PM to 10PM, Night 10PM to 6AM.
  HR Admin edits timings, adds new shifts, deactivates unused ones.

- **Q9 — Office staff shifts:**
  Fully configurable by HR Admin from Shift master.
  Default seed: General shift 9AM to 6PM 8 working hours.
  HR Admin edits to match actual office timings.

- **Q10 — Half-day marking:**
  HR manually selects Half Day status during bulk attendance entry.
  Counts as 0.5 working days for salary.
  Deduction percentage configurable in CompanySettings.payrollConfig.
  HR Admin sets half day deduction percentage — default 50 percent.

- **Q11 — Late mark:**
  Configurable in CompanySettings.attendanceConfig.
  HR Admin sets:
    - Whether late mark is a separate status or not
    - Late threshold in minutes after shift start time
    - Whether late mark converts to half day after N occurrences
    - N occurrences threshold per month
  Default in V1: no separate late mark, HR marks half day manually.
  HR Admin can enable late mark tracking from settings anytime.

### Organizational

- **Q12 — Departments:**
  Fully configurable by HR Admin from Department master.
  Default seed provides common starting departments:
  Production, Quality Control, Maintenance, Store and Inventory,
  HR and Admin, Accounts and Finance, Security, IT.
  HR Admin adds, edits, or deactivates departments after first login
  to match actual company structure.

- **Q13 — Designations:**
  Fully configurable by HR Admin from Designation master.
  Default seed provides common designations per department.
  HR Admin adds, edits, or deactivates designations after first login
  to match actual company hierarchy.

- **Q14 — Employee headcount:**
  Current 100 to 500. Schema and indexes designed for up to 2000.
  No configuration needed — system scales automatically.

- **Q15 — Holidays:**
  Fully configurable by HR Admin from Holiday master.
  Default seed provides standard Indian national holidays.
  HR Admin adds, edits, removes holidays to match:
    - Regional holidays specific to company location
    - Company-specific holidays
    - Festival holidays as per local practice
  HR Admin sets each holiday as paid or unpaid.
  HR Admin sets each holiday as applicable to all or specific category.

- **Q16 — Weekly off:**
  Fully configurable by HR Admin from Weekly Off Rules master.
  HR Admin creates separate rules for workers and office staff.
  HR Admin sets which days are weekly off per rule.
  HR Admin assigns weekly off rule to employee or shift.
  Default seed: Sunday off for all as starting point.
  HR Admin changes to rotating or different days as needed.

### Technical

- **Q17 — Deployment:**
  Cloud. MongoDB Atlas, Cloudinary, cloud server for backend,
  cloud hosting for frontend.

- **Q18 — Email:**
  Configurable SMTP in CompanySettings or .env.
  HR Admin or Super Admin enters SMTP credentials from settings.
  Gmail SMTP as default for development and small companies.

---

## What HR Admin Can Configure From UI

### From Company Settings Page
- Company name, address, phone, email, logo
- Financial year start month
- Default working days per month
- Standard working hours per day
- Overtime base: basic or basic plus allowances
- Overtime multiplier
- Half day deduction percentage
- Whether weekly offs are paid or unpaid
- Whether holidays are paid or unpaid
- Payroll lock behavior
- SMTP email configuration

### From Allowance Configuration
- Add new allowance with name
- Set as fixed amount or percentage of basic
- Apply to all or specific category or employment type
- Activate or deactivate any allowance

### From Deduction Configuration
- Add new deduction with name
- Set as fixed amount or percentage
- Apply to all or specific category
- Activate or deactivate any deduction

### From Attendance Configuration
- Past entry limit in days
- Late mark enable or disable
- Late mark threshold in minutes
- Late to half day conversion rules

### From Shift Master
- Add, edit, deactivate any shift
- Set shift timings and working hours
- Set applicable employee category

### From Department Master
- Add, edit, deactivate departments

### From Designation Master
- Add, edit, deactivate designations per department

### From Holiday Master
- Add, edit, delete holidays
- Set paid or unpaid per holiday
- Set applicable category per holiday

### From Weekly Off Rules
- Create rules with any combination of off days
- Assign rules to employee category or shift

---

## Key Principle for All Developers

Seed data is a starting point only.
It gives HR Admin something to work with on day one.
Every piece of seed data is editable from the UI.
No business rule is hardcoded in the application logic.
All rules come from CompanySettings or master data at runtime.
HR Admin should never need a developer to change a business rule.

---

## Open — Awaiting Clarification

None currently.

---

## Questions from Implementation

To be added as development progresses.