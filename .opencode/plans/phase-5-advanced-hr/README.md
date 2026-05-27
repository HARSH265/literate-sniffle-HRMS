# Phase 5: Advanced HR

## Features
1. Exit Management
2. Contractor Management

---

## 5.1 Exit Management

### Overview
Complete employee offboarding workflow. Supports resignation submission, approval chain, clearance checklists (HR/IT/Finance/Admin), final settlement (FnF) calculation, and exit interview. Integrates with Payroll, Attendance, Leave, Asset, and Document modules.

### Configuration (Settings)
- `exitConfig` section in `CompanySettings`:
  - `exitManagementEnabled` (Boolean, default: true)
  - `noticePeriodDays` (Number, default: 30)
  - `noticePeriodBuybackAllowed` (Boolean, default: false)
  - `requireExitInterview` (Boolean, default: true)
  - `clearanceRequiredDepartments` ([String], default: ['HR', 'IT', 'Finance', 'Admin', 'Operations'])
  - `autoDeactivateUser` (Boolean, default: true)
  - `fnfProcessingDays` (Number, default: 15)
  - `allowResignationWithdrawal` (Boolean, default: true)
  - `withdrawalDeadlineDays` (Number, default: 3)
  - `approvalLevels` (Number, default: 2)
  - `exitInterviewTemplate` (JSON) — configurable questions

### Server Plan

**Model: Resignation** (new model)
Fields: `employee` (ref Employee), `submittedAt` (Date), `lastWorkingDay` (Date), `proposedLastWorkingDay` (Date), `reason` (String), `reasonCategory` (better-opportunity|personal|health|retirement|relocation|termination|other), `status` (pending|approved|rejected|withdrawn|processing|completed), `noticePeriodDays` (Number), `noticeBuybackAmount` (Number), `isBuybackApproved` (Boolean), `approvedBy` (ref User), `approvedAt` (Date), `rejectionReason` (String)

**Model: ClearanceChecklist** (new model)
Fields: `resignation` (ref Resignation), `employee` (ref Employee), `departments` ([{ department (String), item (String), status (pending|cleared|waived), clearedBy (ref User), clearedAt (Date), remarks (String) }]), `overallStatus` (pending|in-progress|completed)

**Model: FnFSettlement** (new model)
Fields: `resignation` (ref Resignation), `employee` (ref Employee), `lastWorkingDay` (Date), `totalDaysWorked` (Number), `leavesEncashed` (Number), `leaveEncashmentAmount` (Number), `noticePeriodDays` (Number), `noticePeriodDeduction` (Number), `noticePeriodBuybackAmount` (Number), `gratuityAmount` (Number), `salaryUntilLastDay` (Number), `pendingReimbursements` (Number), `loanRecovery` (Number), `assetDeductions` (Number), `netPayable` (Number), `status` (draft|computed|approved|disbursed), `disbursedInPayroll` (Boolean), `payrollRun` (ref PayrollRun), `computedAt` (Date), `computedBy` (ref User), `approvedBy` (ref User), `notes` (String)

**Model: ExitInterview** (new model)
Fields: `resignation` (ref Resignation), `employee` (ref Employee), `responses` ([{ question, answer, rating }]), `overallFeedback` (String), `wouldRecommend` (Boolean), `reasonForLeaving` (String), `submittedAt` (Date)

**Service:** `exit.service.ts`
- `submitResignation(employeeId, data)` — create resignation, calculate notice period
- `getResignations(filters)` — list with status/date filters
- `getResignationById(id)` — full detail
- `approveResignation(id, approverId, lastWorkingDay)` — approve with official LWD
- `rejectResignation(id, reason)` — reject
- `withdrawResignation(id)` — employee withdraws (within deadline)
- `initiateClearance(resignationId)` — create clearance checklist
- `updateClearanceItem(resignationId, department, status, remarks)` — mark cleared
- `getClearanceStatus(resignationId)` — overall clearance progress
- `computeFnF(resignationId)` — calculate full & final settlement
- `approveFnF(resignationId, approverId)` — approve FnF
- `disburseFnF(resignationId, payrollRunId)` — mark disbursed
- `submitExitInterview(resignationId, data)` — submit interview
- `getExitInterview(resignationId)` — get responses
- `getExitAnalytics()` — trends, reasons, department stats
- `getPendingActions(managerId)` — actions requiring attention
- `autoDeactivateUser(employeeId)` — disable user account after settlement
- `exportReport(filters)` — Excel export

**Controller:** `exit.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/exit/resignations` | `view-exits` | List resignations |
| GET | `/exit/resignations/my` | `view-own-exits` | My resignation |
| GET | `/exit/resignations/:id` | `view-exits` | Single resignation |
| POST | `/exit/resignations` | `submit-resignation` | Submit resignation |
| POST | `/exit/resignations/:id/approve` | `manage-exits` | Approve |
| POST | `/exit/resignations/:id/reject` | `manage-exits` | Reject |
| POST | `/exit/resignations/:id/withdraw` | `submit-resignation` | Withdraw |
| GET | `/exit/clearance/:resignationId` | `manage-exits` | Clearance status |
| PATCH | `/exit/clearance/:resignationId/:department` | `manage-exits` | Update clearance |
| GET | `/exit/fnf/:resignationId` | `view-exits` | FnF details |
| POST | `/exit/fnf/:resignationId/compute` | `manage-exits` | Compute FnF |
| POST | `/exit/fnf/:resignationId/approve` | `manage-exits` | Approve FnF |
| POST | `/exit/fnf/:resignationId/disburse` | `manage-exits` | Disburse |
| GET | `/exit/interview/:resignationId` | `view-exits` | Get interview |
| POST | `/exit/interview/:resignationId` | `submit-resignation` | Submit interview |
| GET | `/exit/analytics` | `manage-exits` | Analytics |
| GET | `/exit/pending` | `manage-exits` | Pending actions |
| GET | `/exit/report` | `manage-exits` | Export report |

**Validation:** `exit.validation.ts`

**Tests:**
- Resignation lifecycle (submit → approve → clearance → FnF → complete)
- Notice period calculation
- Clearance checklist completion workflow
- FnF calculation (leave encashment, notice deduction, gratuity)
- Resignation withdrawal within deadline
- Exit interview submission
- Auto deactivation logic

### Client Plan

**Module:** `client/src/features/exit-management/`

**Pages:**
- `ExitDashboardPage.tsx` — stats, pending items calendar
- `ResignationsPage.tsx` — list with filters
- `MyResignationPage.tsx` — employee's resignation status
- `ResignationFormPage.tsx` — submit resignation
- `ResignationDetailPage.tsx` — full detail with clearance progress
- `ClearancePage.tsx` — checklist with department status
- `FnFPage.tsx` — settlement breakdown
- `ExitInterviewPage.tsx` — interview form
- `ExitAnalyticsPage.tsx` — trends and reports

**Components:**
- `ClearanceProgressBar.tsx`
- `ClearanceDepartmentItem.tsx`
- `FnFBreakdownCard.tsx`
- `ResignationStatusBadge.tsx`
- `ExitTimeline.tsx`
- `NoticePeriodCalculator.tsx`

**Hooks:**
- `useResignations.ts`
- `useExitMutations.ts`
- `useClearance.ts`
- `useFnF.ts`
- `useExitInterview.ts`
- `useExitAnalytics.ts`

**Services:** `exitService.ts`

**Route:** `/exit/*` (inside AppLayout)

### Fallbacks
- **FnF disputes:** Allow HR to manually override any FnF line item with reason
- **Clearance bypass:** Manager can waive specific clearance items
- **Notice buyback:** Calculate prorated amount based on remaining notice days
- **Reversal:** If employee withdraws after approval, reverse clearance steps where possible
- **Integration failures:** FnF requires data from attendance, leave, asset, loan modules — handle missing data with warnings

---

## 5.2 Contractor Management

### Overview
Manage external contractors, contract laborers, and consultants separately from regular employees. Track contracts, renewals, billing, license expiry, and compliance.

### Configuration (Settings)
- `contractorConfig` section in `CompanySettings`:
  - `contractorManagementEnabled` (Boolean, default: true)
  - `autoGenerateContractorCode` (Boolean, default: true)
  - `contractorCodePrefix` (String, default: 'CTR')
  - `contractorCodePadding` (Number, default: 4)
  - `autoRenewReminderDays` (Number, default: 30)
  - `licenseExpiryReminderDays` (Number, default: 45)
  - `contractCategories` ([String], default: ['Security', 'Catering', 'Cleaning', 'IT', 'Consulting', 'Maintenance', 'Transport', 'Other'])
  - `paymentTerms` (String, default: 'monthly') — monthly|weekly|per-project|milestone
  - `enablePoTracking` (Boolean, default: false)
  - `enableBilling` (Boolean, default: true)

### Server Plan

**Model: Contractor** (new model)
Fields: `contractorCode` (String, unique, auto-generated), `name` (String), `companyName` (String), `contactPerson` (String), `email` (String), `phone` (String), `address` (String), `category` (String), `gstNumber` (String), `panNumber` (String), `licenseNumber` (String), `licenseExpiry` (Date), `isActive` (Boolean), `notes` (String), `createdBy` (ref User)

**Model: Contract** (new model)
Fields: `contractNumber` (String, auto-generated), `contractor` (ref Contractor), `title` (String), `description` (String), `startDate` (Date), `endDate` (Date), `value` (Number), `paymentTerms` (String), `billingCycle` (String), `status` (draft|active|expired|terminated|renewed), `autoRenew` (Boolean), `autoRenewNoticeDays` (Number), `poRequired` (Boolean), `poNumber` (String), `documents` ([{ name, url }]), `termsAndConditions` (String), `assignedDepartments` ([String]), `approvedBy` (ref User), `approvedAt` (Date), `terminationReason` (String)

**Model: ContractWorker** (new model) — individuals deployed by contractor
Fields: `contract` (ref Contract), `contractor` (ref Contractor), `name` (String), `photo` (String), `idProofType` (String), `idProofNumber` (String), `designation` (String), `startDate` (Date), `endDate` (Date), `dailyWage` (Number), `monthlyRate` (Number), `isActive` (Boolean), `isPresent` (Boolean — daily tracking optional)

**Model: ContractorInvoice** (new model)
Fields: `invoiceNumber` (String, auto-generated), `contract` (ref Contract), `contractor` (ref Contractor), `period` ({ from, to }), `totalAmount` (Number), `taxAmount` (Number), `netAmount` (Number), `status` (draft|submitted|approved|paid), `invoiceDate` (Date), `dueDate` (Date), `paidAt` (Date), `paymentRef` (String), `lineItems` ([{ description, quantity, rate, amount }]), `notes` (String)

**Service:** `contractor.service.ts`
- `createContractor(data)` — create with auto-code
- `getContractors(filters)` — list with category/status filters
- `getContractorById(id)` — with contracts
- `updateContractor(id, data)` — update
- `toggleActive(id)` — activate/deactivate
- `createContract(data)` — contract creation
- `getContracts(filters)` — list contracts
- `getContractById(id)` — with workers, invoices
- `renewContract(id, newEndDate)` — extend/renew
- `terminateContract(id, reason)` — terminate
- `addWorker(contractId, data)` — add contract worker
- `removeWorker(workerId)` — deactivate worker
- `getWorkers(contractId)` — list workers
- `createInvoice(data)` — generate invoice
- `getInvoices(filters)` — list invoices
- `approveInvoice(invoiceId)` — approve for payment
- `markPaid(invoiceId, paymentRef)` — mark as paid
- `getExpiringContracts()` — for reminder cron
- `getExpiringLicenses()` — for license reminder
- `getStats()` — counts by status, total contract value

**Controller:** `contractor.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/contractors` | `view-contractors` | List contractor |
| GET | `/contractors/:id` | `view-contractors` | Contractor detail |
| POST | `/contractors` | `manage-contractors` | Create |
| PATCH | `/contractors/:id` | `manage-contractors` | Update |
| PATCH | `/contractors/:id/toggle` | `manage-contractors` | Toggle active |
| GET | `/contractors/:id/contracts` | `view-contractors` | Contractor's contracts |
| GET | `/contracts` | `view-contractors` | List contracts |
| GET | `/contracts/:id` | `view-contractors` | Contract detail |
| POST | `/contracts` | `manage-contractors` | Create contract |
| PATCH | `/contracts/:id` | `manage-contractors` | Update contract |
| POST | `/contracts/:id/renew` | `manage-contractors` | Renew |
| POST | `/contracts/:id/terminate` | `manage-contractors` | Terminate |
| GET | `/contracts/:id/workers` | `view-contractors` | List workers |
| POST | `/contracts/:id/workers` | `manage-contractors` | Add worker |
| DELETE | `/contracts/:id/workers/:workerId` | `manage-contractors` | Remove worker |
| GET | `/invoices` | `view-contractors` | List invoices |
| GET | `/invoices/:id` | `view-contractors` | Invoice detail |
| POST | `/invoices` | `manage-contractors` | Create invoice |
| PATCH | `/invoices/:id/approve` | `manage-contractors` | Approve |
| PATCH | `/invoices/:id/pay` | `manage-contractors` | Mark paid |
| GET | `/contractors/expiring` | `manage-contractors` | Expiring contracts |
| GET | `/contractors/stats` | `manage-contractors` | Dashboard stats |

**Validation:** `contractor.validation.ts`

**Tests:**
- Contractor CRUD
- Contract lifecycle (draft → active → expired/terminated → renewed)
- Contract worker management
- Invoice lifecycle (draft → submitted → approved → paid)
- Expiry detection for contracts and licenses

### Client Plan

**Module:** `client/src/features/contractors/`

**Pages:**
- `ContractorsPage.tsx` — list with category/status filters
- `ContractorDetailPage.tsx` — full detail with contracts tab
- `ContractorFormPage.tsx` — create/edit
- `ContractsPage.tsx` — list with status/dates
- `ContractDetailPage.tsx` — workers, invoices, documents tabs
- `ContractFormPage.tsx` — create/edit contract
- `WorkersPage.tsx` — worker list per contract
- `InvoicesPage.tsx` — invoice list with filters
- `InvoiceFormPage.tsx` — create invoice
- `InvoiceDetailPage.tsx` — detail with approval flow
- `ContractorDashboardPage.tsx` — stats overview

**Components:**
- `ContractorStatusBadge.tsx`
- `ContractStatusBadge.tsx`
- `WorkerCard.tsx`
- `InvoiceStatusBadge.tsx`
- `ExpiryAlertBadge.tsx`
- `ContractTimeline.tsx`

**Hooks:**
- `useContractors.ts`
- `useContracts.ts`
- `useWorkers.ts`
- `useInvoices.ts`
- `useContractorMutations.ts`
- `useContractorStats.ts`

**Services:** `contractorService.ts`

**Route:** `/contractors/*` (inside AppLayout)

### Fallbacks
- **License expiry:** Auto-disable contractor when license expires; notify 45 days before
- **Contract expiry:** Auto-change status to expired; notify HR 30 days before
- **Worker attendance:** Optional daily attendance tracking can be added later
- **Invoice disputes:** Allow partial payment with notes

---

## Development Rules (Phase 5)

1. **Exit Management** must integrate with **6 existing modules** — verify each integration point:
   - `Employee` — deactivate on exit
   - `Attendance` — verify last working day
   - `Leave` — calculate encashment
   - `Asset` — verify all assets returned in clearance
   - `Loan` — deduct outstanding in FnF
   - `Payroll` — final salary, FnF disbursement
2. **Contractor Management** should be entirely separate from Employee module (use separate DB collections)
3. **Exit Management** is the most complex feature — implement incrementally (resignation → clearance → FnF → interview)
4. **Both features must be independently disableable** via Settings
5. **All mutations must be audited**
6. **FnF reversals** must include full audit trail
