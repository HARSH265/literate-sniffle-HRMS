# Documentation Scanning & Authoring Guide

## 📌 Purpose of Scanning Modules

1. **Create a Complete, Self‑Contained User Guide** – By systematically scanning each module we capture:
   - What the module **does** (business responsibilities).
   - How it **exposes** functionality (REST endpoints, UI pages, hooks).
   - **Data structures** (Mongoose schemas, TypeScript interfaces).
   - **Interactions** with other modules, especially the **Settings** singleton.
   - Required **permissions** and any **role‑based** constraints.
2. **Enable Future Automation** – A uniform scanning process lets us generate documentation programmatically (e.g., scripts that pull route definitions, schema fields, etc.).
3. **Prevent Gaps** – The checklist ensures no entity, flag, or configuration detail is omitted (e.g., OT multiplier, code prefix, accrual day of month, CLC type, etc.).

---

## 🧭 Scanning Rules

### 1. Server‑Side Modules (`server/src/modules/*`)
| Step | What to Look For | How to Record |
|------|----------------|--------------|
| **Identify entry points** | `controller.ts` functions, `service.ts` methods, `routes.ts` definitions. | List each endpoint (method + path), short purpose, required permissions, request/response schema snippets. |
| **Map data models** | Model file in `server/src/models/` referenced by the module. | Capture schema fields, types, defaults, enums, indexes, and any virtuals. |
| **Capture business logic** | Service functions that compute payroll, OT, LOP, etc. | Note key formulas (e.g., OT multiplier, per‑day calculation method, rounding rules) and constants used from `config/constants.ts`. |
| **Link to Settings** | Look for references to `CompanySettings` or `settingsService`. | Document which `settings` sub‑object the module consumes (e.g., `payrollConfig`, `attendanceConfig`). |
| **Identify permissions** | Use of `authorize(...)` or `hasPermission` in the controller. | List each permission string required by the endpoint. |
| **Cross‑module imports** | `import … from '../../other-module/…'`. | Note which other modules are consumed (e.g., `employees` used by `payroll`). |
| **Error handling & validation** | `validate.middleware.ts` usage, Zod schemas. | Record validation schema fields and constraints. |
| **Side‑effects** | Event emitters, socket notifications, background jobs. | Summarize side‑effects (e.g., `socket.emit('attendanceUpdated')`). |

### 2. Client‑Side Feature Modules (`client/src/features/*`)
| Step | What to Look For | How to Record |
|------|----------------|--------------|
| **Page components** | Files ending in `Page.tsx` (or `.tsx` with route registration). | Document route path, UI purpose, key UI sections, and any lazy loading. |
| **Hooks & services** | `hooks/…` and `services/…` files. | List API endpoints they call, data shape (TypeScript types), caching strategy (React Query keys). |
| **Core UI usage** | Import of `core/components/*` (e.g., `StatusBadge`, `DataTable`). | Note which shared components are used and any custom props. |
| **Permission checks** | `usePermission` calls or `<ProtectedRoute>` wrappers. | List required permissions for the feature. |
| **Settings consumption** | Calls to `settingsService` or reads of `CompanySettings` via API. | Record which settings sections affect the UI (e.g., `attendanceConfig.qrKioskEnabled`). |
| **Cross‑feature imports** | `import … from '../../other-feature/…'`. | Capture dependencies (e.g., ESS pages importing `AnnouncementsWidget`). |
| **State management** | Zustand stores (`authStore`, `uiStore`). | Note any store values read/written in the feature. |
| **Side‑effects** | Socket usage (`socketClient`), notifications. | Summarize side‑effects. |

### 3. Settings Module (`server/src/models/CompanySettings.model.ts` & UI sections)
1. **Enumerate every sub‑object** – `companyInfo`, `payrollConfig`, `attendanceConfig`, `allowanceConfig`, `emailConfig`, `authConfig`, `notificationConfig`, `employeeCodeConfig`, `departmentCodeConfig`, `employeeDefaults`, `leaveConfig`, `reportsConfig`, `loanConfig`, `statutoryConfig`, `employeeSelfService`, `announcementConfig`, `helpdeskConfig`, `assetConfig`, `documentConfig`, `shiftSwapConfig`, `travelConfig`, `gratuityConfig`, `performanceConfig`, `trainingConfig`.
2. **For each field** capture:
   - **Name**
   - **Type** (String, Number, Boolean, Enum, Array, Mixed)
   - **Default value** (if any)
   - **Constraints** (min/max, required, enum options)
   - **UI location** (which Settings section component renders it)
   - **Purpose** – short paragraph explaining the business meaning.
   - **Relationships** – which other modules read this field.
3. **Special entities** – Document derived calculations (e.g., `payrollConfig.unfinalizeWindowDays` derived from `payrollLockDays`).
4. **Validation** – Note Zod schemas (if any) used for the settings update.

---

## 📄 Documentation Template for Each Module
> Use the same Markdown structure for **every** module so that later you can generate a unified user guide.

```markdown
# <Module Name>

## Overview
A concise description of the module’s purpose and high‑level responsibilities.

## Key Responsibilities
- Bullet list of primary functions (e.g., *process payroll runs*, *manage employee records*).

## API Endpoints (Server Modules Only)
| Method | Path | Description | Permissions | Request Schema | Response Schema |
|--------|------|-------------|-------------|----------------|----------------|
| GET    | /api/v1/payroll      | List payroll runs | `view-payroll` | N/A | `PayrollRun[]` |
| POST   | /api/v1/payroll/run | Trigger a payroll run | `process-payroll` | `PayrollRunCreateDTO` | `PayrollRun` |
*Add a short code example using curl or fetch.*

## Data Model (Mongoose / TypeScript)
```ts
export interface <ModelName> {
  // field: type; // description
  name: string; // employee name, required
  // …
}
```
*Explain any virtuals or indexes.*

## Relationships & Dependencies
- **Uses Settings**: `<settings.subObject>`
- **Consumes Models**: `<ModelA>`, `<ModelB>`
- **Exports to Modules**: `<moduleX>` (e.g., `employees` provides data for `payroll`).

## Permissions
List all permission strings required to access the module’s endpoints or UI pages.

## Example Usage
```bash
# curl example for creating a payroll run
curl -X POST https://api.mycompany.com/api/v1/payroll/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month":"2026-06","runDate":"2026-06-30"}'
```

## UI Screens (Client Features Only)
- **Page route**: `/payroll`
- **Main components**: `PayrollPage`, `PayrollDetailsPage`
- **Key UI elements**: Status badges, action buttons, table columns.

## Edge Cases & Gotchas
- Mention special behaviours (e.g., *Payroll can only be finalized after `payrollLockDays`*).
- Known limitations or required pre‑conditions.

## FAQ
1. **How do I change the OT multiplier?** – Update `payrollConfig.overtimeMultiplier` via Settings → Payroll.
2. **Can I edit a finalized payroll?** – No, the UI disables the Edit button after the un‑finalize window expires.

## See Also
- Link to related modules (e.g., `Employee`, `Attendance`).
- Link to the Settings documentation section.
```

---

## 🛠️ How to Use This Guide
1. **Run the scanning checklist** for a module (server or client) using the tables above.
2. **Populate the template** with the collected information.
3. **Store the completed markdown** under `docs/<module‑name>.md` (or a similar structure).
4. **Link all module docs** from a central `README.md` or a generated site (e.g., Docusaurus, MkDocs).
5. **Update regularly** – whenever a new endpoint, UI page, or settings field is added, repeat the scan for that module.

---

## 🎯 Goal
By following this guide you will produce a **comprehensive, searchable, and up‑to‑date user guide** that covers:
- Every API surface
- All UI workflows
- All configurable settings (including OT multiplier, code prefixes, frequency, effective‑from dates, CLC types, accrual day of month, etc.)
- Inter‑module data flows
- Permission requirements

> **Never leave a field undocumented** – if you discover a setting that is not listed here, add a row to the *Settings* section of this guide immediately.

---

*Generated on `$(Get-Date -Format "yyyy-MM-dd HH:mm")`*