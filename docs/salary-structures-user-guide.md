# Salary Structures – End‑User Guide
---
## 1. Overview
The **Salary Structures** module defines the template for how an employee's salary is composed: basic pay, allowances (HRA, conveyance, medical, etc.), deductions (PF, ESI, TDS), and variable components. Structures are assigned to employees and drive payroll calculations.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View salary structures | `process-payroll` |
| Create / edit / delete salary structures | `manage-payroll-config` |
| View employee salary structure | `process-payroll` |

If you lack permission the Salary Structures page is hidden.

## 3. Related Settings
No dedicated settings; structures are managed entirely through the UI.

## 4. UI Pages & Workflow
- **Salary Structures List** (`/salary-structures`): Table of all structures with columns: Name, Components count, Default flag, Status. Actions: **Add**, **Edit**, **Delete**.
- **Create / Edit Structure** (`/salary-structures/new` & `/salary-structures/:id/edit`): Form with:
  - **Structure Name** – e.g., "Standard Worker", "Manager Grade".
  - **Components** – List of salary components, each with: Name, Type (Fixed/Variable/Earning/Deduction), Formula/Amount, Default Value.
  - **Default** – Toggle to mark as the default structure for new employees.
- **Structure Detail** (`/salary-structures/:id`): Shows full component breakdown, effective dates, and assigned employees.
- **Assign to Employee** – Via the Employee edit page → Salary & Benefits section → select a structure.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/salary-structures` | List all salary structures | `process-payroll` |
| GET | `/salary-structures/:id` | Get structure details | `process-payroll` |
| POST | `/salary-structures` | Create a new structure | `manage-payroll-config` |
| PATCH | `/salary-structures/:id` | Update a structure | `manage-payroll-config` |
| DELETE | `/salary-structures/:id` | Delete a structure | `manage-payroll-config` |
| GET | `/salary-structures/employee/:employeeId` | Get structure for a specific employee | `process-payroll` |

## 6. Edge Cases & Gotchas
- **Default structure** – Only one structure can be marked as default; setting a new default removes the flag from the previous one.
- **Deletion guard** – A structure cannot be deleted if it is currently assigned to active employees.
- **Component formulas** – Formulas can reference other components (e.g., HRA = 40% of Basic). Circular references are rejected.

## 7. Quick Actions Summary
- **Add Structure** → Salary Structures → **Add** → define components → **Create**.
- **Edit Structure** → list → **Edit** → modify → **Save**.
- **Delete Structure** → list → **Delete** → confirm (only if unassigned).
- **Assign** → Employee edit → Salary section → select structure → **Save**.

*Generated on **2026‑06‑12***