# Audit Report: Loans Module

**Date:** May 25, 2026  
**Files audited:** 12 (5 server, 3 models, 4 client)

---

## Route Inventory

### Loan Types

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| GET | /api/v1/loans/loan-types | authenticate | view-loans | none |
| GET | /api/v1/loans/loan-types/:id | authenticate | view-loans | none |
| POST | /api/v1/loans/loan-types | authenticate | manage-loans | createLoanTypeSchema |
| PATCH | /api/v1/loans/loan-types/:id | authenticate | manage-loans | updateLoanTypeSchema |
| DELETE | /api/v1/loans/loan-types/:id | authenticate | manage-loans | none |

### Loan Applications

| Method | Path | Auth | Authorize | Validation |
|--------|------|------|-----------|------------|
| POST | /api/v1/loans/apply | authenticate | apply-loan | applyLoanSchema |
| GET | /api/v1/loans | authenticate | view-loans | none |
| GET | /api/v1/loans/:id | authenticate | view-loans | none |
| PATCH | /api/v1/loans/:id/approve | authenticate | manage-loans | approveLoanSchema |
| PATCH | /api/v1/loans/:id/disburse | authenticate | manage-loans | disburseLoanSchema |
| PATCH | /api/v1/loans/:id/cancel | authenticate | apply-loan | none |
| GET | /api/v1/loans/employee/:employeeId/summary | authenticate | view-loans | none |

**Total routes:** 12 all with authenticate + authorize. No missing authorization middleware.

---

## Issues Found

### RED CRITICAL

**1. X PUT vs PATCH - NO MISMATCH FOUND**  
Client uses apiClient.patch() for all mutation calls:
- updateLoanType -> apiClient.patch() (server: PATCH /loan-types/:id)
- approveLoan -> apiClient.patch() (server: PATCH /:id/approve)
- disburseLoan -> apiClient.patch() (server: PATCH /:id/disburse)
- cancelLoan -> apiClient.patch() (server: PATCH /:id/cancel)

All client HTTP methods match their corresponding server routes. No critical issue.

**2. X Missing authorize() on routes - NONE FOUND**  
All 12 routes have an explicit authorize() call. The router.use(authenticate) applies to all routes. No route is exposed without permission checks.

---

### YELLOW MEDIUM

**3. X updateLoanType does NOT set updatedBy**  
File: server/src/modules/loans/loans.service.ts, line 38-43

The userId parameter is received from the controller but is only used for the audit log. It is never merged into the dollar-set update. The data object (from req.body) would only contain fields the client sent, never updatedBy. The LoanType model (server/src/models/LoanType.model.ts) has no updatedBy field in its schema.

Fix: Add updatedBy to LoanType schema and merge into the update data.

---

**4. X applyLoanSchema does not validate employee field**  
File: server/src/modules/loans/loans.validation.ts, lines 21-26

The schema validates loanType, amount, tenure, and purpose but does not include employee or employeeId. The service uses data.employee || data.employeeId to look up the employee. Since employee is not in the Zod schema, Zod strips it from the parsed output.

Fix: Add employee: z.string().min(1, Employee is required) to applyLoanSchema.

---

**5. X approveLoanSchema strips level - multi-level approval broken**  
File: server/src/modules/loans/loans.validation.ts, lines 28-31

The service function approveLoan accepts a level parameter (defaulting to 1) to support multi-level approval. The Zod schema does not include level, so Zod strips it as an unknown field. Multi-level approval can never be triggered through the API.

Fix: Add level: z.number().int().min(1).optional() to approveLoanSchema.

---

**6. X Duplicate loan type code on update not handled**  
File: server/src/modules/loans/loans.service.ts, lines 38-43

createLoanType checks for duplicate codes before creating, but updateLoanType does no uniqueness check. Updating a code to an existing one causes an unhandled MongoError 500.

Fix: Add a duplicate code check in updateLoanType, excluding the current document ID.

---

**7. X Client always passes limit=100 - defeats server pagination**  
File: client/src/features/loans/pages/LoansPage.tsx, line 26

The server default limit is 20, but the client hard-codes limit=100. Server-side pagination is effectively disabled. Records beyond 100 are invisible.

Fix: Remove limit: 100 to use server pagination defaults.

---

**8. X Negative page causes negative skip - unhandled edge case**  
File: server/src/modules/loans/loans.service.ts, lines 204-206

const skip = (page - 1) * limit - if a client sends page=0, skip = -20. Mongoose .skip(-20) is undefined behavior.

Fix: Add Math.max(0, ...) or validate page >= 1.

---

### GREEN MINOR

**9. X listLoanTypes has no pagination**  
Returns all loan types without skip/limit. Low impact since loan types are few.

Fix: Add optional page/limit params.

---

**10. X updateLoanType uses findByIdAndUpdate - bypasses middleware**  
Bypasses Mongoose pre(save) hooks and does not trigger full validation.

---

**11. X Redundant code uppercasing - Zod + Mongoose both uppercase**  
Both Zod and Mongoose transform code to uppercase. Harmless but redundant.

---

**12. X Race condition in applyLoan - active loan check not atomic**  
Between the count query and create, concurrent requests can both pass the check, exceeding maxActiveLoans.

Fix: Use a MongoDB transaction or atomic conditional update.

---

**13. X Client-side EMI calculation duplicates server logic**  
EMI calculation is duplicated across LoansPage and LoanApplyPage, mirroring the server-side function.

Fix: Extract to a shared utility or expose a server endpoint.

---

## Edge Cases Checked

| Scenario | Status |
|----------|--------|
| Duplicate loan type code on create | Handled (findOne check + unique index) |
| Duplicate loan type code on update | NOT handled throws uncaught MongoError 500 |
| Delete loan type with active loans | Blocked with active loan count check |
| Delete loan type that does not exist | 404 error |
| Non-existent loan type ID on get/update | 404 error |
| Non-existent loan ID on get/approve/disburse/cancel | 404 error |
| Apply with inactive loan type | 400 error |
| Apply with inactive employee | 400 error |
| Apply amount below minimum | 400 error |
| Apply amount above maximum | 400 error |
| Apply tenure below minimum | 400 error |
| Apply tenure above maximum | 400 error |
| Employee with max active loans exceeded | 400 error |
| Zero interest rate EMI calculation | Handled (flat division by tenure) |
| Approve non-applied loan | 400 error |
| Disburse non-approved loan | 400 error |
| Cancel non-applied/approved loan | 400 error |
| Missing employee in apply payload | NOT validated Zod schema missing employee |
| Page=0 or page=-1 in listLoans | NOT handled produces negative skip |
| Client limit=100 exceeds actual records | First 100 only rest invisible |
| Multi-level approval via API | Broken level stripped by Zod |
| Race condition concurrent loan applications | Not atomic can exceed maxActiveLoans |
| Search with special regex characters | No search endpoint in loans (N/A) |

---

## Summary

| Severity | Count | Key Findings |
|----------|-------|-------------|
| Critical | 0 | No PUT/PATCH mismatches no missing authorize() calls |
| Medium | 5 | employee not validated in apply schema; level stripped in approve schema; duplicate code on update unhandled; client hardcodes limit=100; negative page causes negative skip |

UpdatedBy field added to LoanType model. |
| Minor | 5 | listLoanTypes lacks pagination; findByIdAndUpdate bypasses hooks; redundant uppercasing; race condition in applyLoan; client-side EMI logic duplicated |

**Overall assessment:** The Loans module is well-structured with thorough authorization and validation on most routes. The critical issues found in other modules (PUT/PATCH mismatches, missing authorization) are absent here. The main concerns are validation gaps (employee, level), missing updatedBy tracking on LoanType, and the clients hardcoded limit=100 that bypasses server pagination.
