# Phase 4: Financial & Compliance

## Features
1. Travel & Expense Management
2. Gratuity Calculation
3. ESI / PF Auto Filing

---

## 4.1 Travel & Expense Management

### Overview
Manage employee travel requests, expense claims, approval workflows, reimbursement processing, and integration with payroll. Supports mileage, per-diem, and actual expense tracking.

### Configuration (Settings)
- `travelConfig` section in `CompanySettings`:
  - `travelEnabled` (Boolean, default: true)
  - `requirePreApproval` (Boolean, default: true)
  - `maxAdvanceAmount` (Number, default: 50000)
  - `mileageRatePerKm` (Number, default: 0)
  - `perDiemRate` (Number, default: 0)
  - `perDiemEligible` (Boolean, default: false)
  - `maxClaimsPerMonth` (Number, default: 5)
  - `reimbursementProcessingDays` (Number, default: 7)
  - `allowPartialReimbursement` (Boolean, default: false)
  - `expenseCategories` ([String], default: ['Travel', 'Accommodation', 'Food', 'Fuel', 'Miscellaneous'])
  - `approvalLevels` (Number, default: 1)
  - `autoApprovalUpTo` (Number, default: 0) — auto-approve claims below this amount

### Server Plan

**Model: TravelRequest** (new model)
Fields: `requestNumber` (String, auto-generated, unique), `employee` (ref Employee), `purpose` (String), `destination` (String), `departureDate` (Date), `returnDate` (Date), `modeOfTravel` (String), `estimatedAmount` (Number), `advanceRequired` (Boolean), `advanceAmount` (Number), `status` (draft|pending|approved|rejected|cancelled), `approvedBy` (ref User), `approvedAt` (Date), `rejectionReason` (String), `itinerary` ([{ date, activity, location }])

**Model: ExpenseClaim** (new model)
Fields: `claimNumber` (String, auto-generated, unique), `employee` (ref Employee), `travelRequest` (ref TravelRequest, optional), `claimDate` (Date), `status` (draft|submitted|approved|rejected|reimbursed), `items` ([{ category, date, description, amount, billUrl, billNumber, remarks }]), `totalAmount` (Number), `approvedAmount` (Number), `reimbursedAmount` (Number), `reimbursementDate` (Date), `approvedBy` (ref User), `approvedAt` (Date), `rejectionReason` (String), `processedInPayroll` (Boolean), `payrollRun` (ref PayrollRun)

**Service:** `travel.service.ts`
- `createRequest(data)` — create travel request
- `getRequests(filters)` — list with status filters
- `approveRequest(id, approverId)` — approve
- `rejectRequest(id, reason)` — reject
- `createClaim(data)` — create expense claim
- `addClaimItem(claimId, item)` — add expense item
- `submitClaim(claimId)` — submit for approval
- `approveClaim(claimId, approverId, approvedAmount)` — approve (full or partial)
- `rejectClaim(claimId, reason)` — reject
- `markReimbursed(claimId)` — mark as paid
- `getMyRequests(employeeId)` — employee's requests
- `getMyClaims(employeeId)` — employee's claims
- `getPendingApprovals(managerId)` — items needing approval
- `getStats()` — totals, pending amounts
- `exportToExcel(filters)` — Excel report

**Controller:** `travel.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/travel/requests` | `view-travel` | List requests |
| GET | `/travel/requests/my` | `view-own-travel` | My requests |
| GET | `/travel/requests/:id` | `view-travel` | Request detail |
| POST | `/travel/requests` | `create-travel` | Create request |
| PATCH | `/travel/requests/:id` | `manage-travel` | Update request |
| POST | `/travel/requests/:id/approve` | `manage-travel` | Approve |
| POST | `/travel/requests/:id/reject` | `manage-travel` | Reject |
| GET | `/travel/claims` | `view-travel` | List claims |
| GET | `/travel/claims/my` | `view-own-travel` | My claims |
| GET | `/travel/claims/:id` | `view-travel` | Claim detail |
| POST | `/travel/claims` | `create-travel` | Create claim |
| POST | `/travel/claims/:id/submit` | `create-travel` | Submit claim |
| PATCH | `/travel/claims/:id` | `manage-travel` | Update claim |
| POST | `/travel/claims/:id/approve` | `manage-travel` | Approve |
| POST | `/travel/claims/:id/reject` | `manage-travel` | Reject |
| POST | `/travel/claims/:id/reimburse` | `manage-travel` | Mark reimbursed |
| GET | `/travel/pending` | `manage-travel` | Pending approvals |
| GET | `/travel/stats` | `manage-travel` | Dashboard stats |
| GET | `/travel/reports` | `manage-travel` | Export data |

**Validation:** `travel.validation.ts`

**Tests:**
- Travel request lifecycle
- Expense claim with item management
- Approval workflow with partial approval
- Reimbursement integration with payroll flag
- Travel advance vs expense reconciliation

### Client Plan

**Module:** `client/src/features/travel/`

**Pages:**
- `TravelDashboardPage.tsx` — stats, pending approvals
- `TravelRequestsPage.tsx` — list with filters
- `TravelRequestFormPage.tsx` — create request
- `TravelRequestDetailPage.tsx` — full detail
- `ExpenseClaimsPage.tsx` — list with status filters
- `ExpenseClaimFormPage.tsx` — create claim with item grid
- `ExpenseClaimDetailPage.tsx` — items, approval status
- `TravelApprovalsPage.tsx` — manager approval queue

**Components:**
- `ExpenseItemTable.tsx` — editable item table
- `TravelStatusBadge.tsx`
- `ClaimStatusBadge.tsx`
- `ExpenseCategoryIcon.tsx`
- `BillPreview.tsx` — Cloudinary image preview

**Hooks:**
- `useTravelRequests.ts`
- `useExpenseClaims.ts`
- `useTravelMutations.ts`
- `useTravelApprovals.ts`
- `useTravelStats.ts`

**Services:** `travelService.ts`

**Route:** `/travel/*` (inside AppLayout)

### Fallbacks
- **Advance misuse:** Deduct un-reconciled advance from salary if not claimed within 30 days
- **Duplicate bills:** Check bill number uniqueness within same employee
- **Payroll integration:** Flag reimbursed claims for payroll processing

---

## 4.2 Gratuity Calculation

### Overview
Automated gratuity computation per **Payment of Gratuity Act, 1972**. Calculates gratuity eligibility and amount based on employee service period, last drawn salary, and applicable formula.

### Configuration (Settings)
- `gratuityConfig` section in `CompanySettings`:
  - `gratuityEnabled` (Boolean, default: true)
  - `gratuityActApplicable` (Boolean, default: true)
  - `minServiceYears` (Number, default: 5) — per Act
  - `maxGratuityAmount` (Number, default: 2000000) — per Act (₹20L)
  - `calculationMethod` (String, default: 'act-formula') — act-formula|custom
  - `customMultiplier` (Number, default: 15) — 15 days wages per year
  - `considerMonthlyWages` (Boolean, default: true) — basic + DA for calculation

### Server Plan

**Model: GratuityRecord** (new model)
Fields: `employee` (ref Employee), `dateOfJoining` (Date), `dateOfExit` (Date), `totalServiceYears` (Number), `totalServiceMonths` (Number), `lastBasicSalary` (Number), `lastDAPerMonth` (Number), `lastMonthlyWages` (Number), `lastDailyWage` (Number), `gratuityAmount` (Number), `formula` (String), `eligibilityStatus` (eligible|not-eligible|partially-eligible), `excludedPeriods` ([{ from, to, reason }]), `calculatedAt` (Date), `calculatedBy` (ref User), `disbursedInPayroll` (Boolean), `payrollRun` (ref PayrollRun), `notes` (String)

**Service:** `gratuity.service.ts`
- `calculate(employeeId, exitDate)` — compute gratuity for single employee
- `batchCalculate(employeeIds, exitDate)` — bulk calculation
- `getRecord(employeeId)` — get latest gratuity record
- `getAllRecords(filters)` — list with filters
- `markDisbursed(recordId, payrollRunId)` — link to payroll
- `exportReport(filters)` — Excel export
- `getStats()` — totals, pending disbursements
- `validateServicePeriod(doj, doe)` — calculate years/months with rounding rules

**Formula (per Gratuity Act):**
```
Gratuity = (Last drawn Basic + DA) × 15 × Years of service / 26
```
Where:
- Last drawn Basic + DA = monthly wages
- 15 = 15 days wages per year of service
- 26 = working days per month
- Years of service: >6 months = 1 year; <6 months = 0 year (rounding)

**Controller:** `gratuity.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/gratuity` | `view-payroll` | List gratuity records |
| GET | `/gratuity/employee/:employeeId` | `view-payroll` | Employee record |
| GET | `/gratuity/:id` | `view-payroll` | Single record |
| POST | `/gratuity/calculate` | `manage-payroll` | Calculate single |
| POST | `/gratuity/batch` | `manage-payroll` | Batch calculate |
| GET | `/gratuity/stats` | `manage-payroll` | Dashboard stats |
| GET | `/gratuity/report` | `manage-payroll` | Export report |

**Validation:** `gratuity.validation.ts`

**Tests:**
- Calculation formula correctness
- Service period rounding (5yr 6mo vs 5yr 5mo)
- Maximum cap enforcement
- Eligibility verification (<5 years = not eligible)
- Batch calculation accuracy

### Client Plan

**Module:** `client/src/features/gratuity/`

**Pages:**
- `GratuityPage.tsx` — list with filter by department, status
- `GratuityDetailPage.tsx` — calculation breakdown
- `GratuityCalculatorPage.tsx` — single employee calculator
- `GratuityReportPage.tsx` — exportable report

**Components:**
- `GratuityBreakdownCard.tsx` — formula visualization
- `EligibilityBadge.tsx`
- `ServicePeriodBar.tsx` — visual service timeline

**Route:** `/gratuity` (inside AppLayout)

### Fallbacks
- **Pending exits:** Batch calculate gratuity for all exits in a given period
- **Disbursement tracking:** Link to payroll run when paid out in FnF
- **Excluded periods:** Support for unpaid leave periods that don't count toward service

---

## 4.3 ESI / PF Auto Filing

### Overview
Auto-generate ESI (Employee State Insurance) and PF (Provident Fund) returns for statutory compliance. Extends the existing `statutory` module with automated filing data generation and Excel/JSON output for submission.

### Configuration (Settings) — Extend existing `statutoryConfig`
- Additional fields:
  - `pfAutoFilingEnabled` (Boolean, default: true)
  - `pfElectronicChallanEnabled` (Boolean, default: true)
  - `pfReturnFormat` (String, default: 'excel') — excel|json|csv
  - `pfDueDateReminderDays` (Number, default: 5)
  - `esiAutoFilingEnabled` (Boolean, default: true)
  - `esiReturnFormat` (String, default: 'excel')
  - `esiDueDateReminderDays` (Number, default: 5)
  - `autoCalculateArrears` (Boolean, default: true)
  - `includeAllEmployees` (Boolean, default: true)
  - `excludeEmployeesBelowThreshold` (Boolean, default: true)

### Server Plan

**Model: PFChallan** (extends existing — review current `PFChallan.model.ts`)
Add: `filingPeriod` ({ month, year }), `generatedAt`, `generatedBy`, `filingData` (JSON), `isFiled`, `filedAt`, `filedBy`, `transactionId`, `remarks`

**Model: ESIReturn** (new model if not exists)
Fields: `filingPeriod` ({ month, year }), `employerCode`, `employeeCount`, `totalGrossWages`, `employeeContribution`, `employerContribution`, `totalContribution`, `generatedAt`, `generatedBy`, `filingData` (JSON), `isFiled`, `filedAt`, `filedBy`, `transactionId`, `remarks`

**Service:** `statutoryFiling.service.ts`
- `generatePFChallan(month, year)` — aggregate payroll data for PF
- `generateESIReturn(month, year)` — aggregate payroll data for ESI
- `getPFChallan(month, year)` — get existing challan
- `getESIReturn(month, year)` — get existing return
- `listPFChallans(filters)` — list history
- `listESIReturns(filters)` — list history
- `markAsFiled(type, id, filingData)` — mark as submitted
- `getPendingFilings()` — periods not yet filed
- `exportPFData(month, year, format)` — export in required format
- `exportESIData(month, year, format)` — export in required format
- `getFilingStats()` — compliance overview

**Data Computation — PF:**
- Employee PF contribution: 12% of PF wages (basic + DA)
- Employer PF contribution: 3.67% to PF + 8.33% to EPS + 0.5% EDLI + admin charges
- PF wage ceiling: configurable (default ₹15,000)
- Include all eligible employees

**Data Computation — ESI:**
- Employee ESI contribution: 0.75% of gross wages
- Employer ESI contribution: 3.25% of gross wages
- ESI wage threshold: configurable (default ₹21,000/month)
- Exclude employees above threshold

**Controller:** `statutoryFiling.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/statutory/pf/challans` | `view-payroll` | List PF challans |
| GET | `/statutory/pf/challans/:id` | `view-payroll` | Single challan |
| POST | `/statutory/pf/generate` | `manage-payroll` | Generate challan |
| POST | `/statutory/pf/:id/mark-filed` | `manage-payroll` | Mark as filed |
| GET | `/statutory/pf/:id/export` | `manage-payroll` | Export challan |
| GET | `/statutory/esi/returns` | `view-payroll` | List ESI returns |
| GET | `/statutory/esi/returns/:id` | `view-payroll` | Single return |
| POST | `/statutory/esi/generate` | `manage-payroll` | Generate return |
| POST | `/statutory/esi/:id/mark-filed` | `manage-payroll` | Mark as filed |
| GET | `/statutory/esi/:id/export` | `manage-payroll` | Export return |
| GET | `/statutory/pending` | `view-payroll` | Pending filings |
| GET | `/statutory/stats` | `view-payroll` | Compliance stats |

**Validation:** `statutoryFiling.validation.ts`

**Tests:**
- PF challan generation accuracy (contribution calculation)
- ESI return generation
- Employee exclusion by threshold
- Filing period uniqueness (no duplicate challans for same period)
- Export format generation

### Client Plan

**Module:** Extend `client/src/features/statutory/`

**New Pages:**
- `PFChallansPage.tsx` — list, generate, mark filed
- `PFChallanDetailPage.tsx` — detailed breakdown, export
- `ESIReturnsPage.tsx` — list, generate, mark filed
- `ESIReturnDetailPage.tsx` — detailed breakdown, export
- `StatutoryFilingDashboardPage.tsx` — compliance calendar, pending filings

**Components:**
- `FilingStatusBadge.tsx`
- `FilingPeriodPicker.tsx`
- `ComplianceCalendar.tsx`
- `ContributionBreakdownTable.tsx`

**Route:** `/statutory` (extend existing sidebar, add sub-pages)
- `/statutory/pf` — PF challans
- `/statutory/pf/:id` — PF detail
- `/statutory/esi` — ESI returns
- `/statutory/esi/:id` — ESI detail

### Fallbacks
- **Zero-return filing:** If no employees eligible, generate zero challan
- **Threshold changes:** Configurable in Settings; re-calculation needed on change
- **Amendment:** Support amended returns for previously filed periods
- **Calendar integration:** Show due dates in dashboard (15th of following month for PF, 15th for ESI)

---

## Development Rules (Phase 4)

1. **Travel & Expense** must integrate with existing Payroll module for reimbursement processing
2. **Gratuity** calculation must match Payment of Gratuity Act formula exactly
3. **ESI/PF Filing** extends existing statutory module — do NOT create a separate module; add to existing `modules/statutory/`
4. **All financial calculations** must be tested with known inputs/outputs before client wiring
5. **Audit is critical** — all calculations, approvals, and disbursements must be audited
6. **Settings toggles** must independently disable each feature
7. **Export functionality** must use existing ExcelJS pattern from reports module
