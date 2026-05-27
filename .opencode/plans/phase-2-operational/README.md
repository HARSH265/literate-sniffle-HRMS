# Phase 2: Operational Management

## Features
1. Asset Management
2. Document Repository
3. Shift Swap / Preferences

---

## 2.1 Asset Management

### Overview
Track company assets (laptops, monitors, tools, uniforms, ID cards, vehicles) issued to employees. Supports allocation, return, maintenance tracking, and asset history.

### Configuration (Settings)
- `assetConfig` section in `CompanySettings`:
  - `assetManagementEnabled` (Boolean, default: true)
  - `autoGenerateAssetCode` (Boolean, default: true)
  - `assetCodePrefix` (String, default: 'AST')
  - `assetCodePadding` (Number, default: 4)
  - `allowMultipleAllocation` (Boolean, default: false) — can one asset be allocated to multiple employees?
  - `maintenanceReminderDays` (Number, default: 90)
  - `categories` ([String], default: ['Laptop', 'Monitor', 'Keyboard', 'Mobile', 'Tool', 'Uniform', 'Vehicle', 'Other'])
  - `conditions` ([String], default: ['New', 'Good', 'Fair', 'Damaged'])

### Server Plan

**Model: Asset** (new model)
Fields: `assetCode` (String, unique, auto-generated), `name` (String), `category` (String), `description` (String), `serialNumber` (String), `brand` (String), `model` (String), `purchaseDate` (Date), `purchasePrice` (Number), `condition` (String), `status` (available|allocated|maintenance|retired), `location` (String), `assignedTo` (ref Employee), `assignedAt` (Date), `returnedAt` (Date), `notes` (String), `history` ([{ employee, action (allocated|returned|maintenance|retired), date, notes }]), `createdBy` (ref User)

**Service:** `asset.service.ts`
- `create(data)` — auto-generate asset code
- `getAll(filters)` — list with category/status/employee filters
- `getById(id)` — single with history
- `update(id, data)` — update asset details
- `allocate(assetId, employeeId, notes)` — assign to employee, create history entry
- `return(assetId, notes)` — return from employee, update condition
- `markMaintenance(assetId, notes)` — mark under maintenance
- `retire(assetId, notes)` — mark as retired/disposed
- `getEmployeeAssets(employeeId)` — all assets assigned to an employee
- `getStats()` — counts by status, category
- `getHistory(assetId)` — full allocation history

**Controller:** `asset.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/assets` | `view-assets` | List assets |
| GET | `/assets/stats` | `view-assets` | Dashboard stats |
| GET | `/assets/employee/:employeeId` | `view-assets` | Employee's assets |
| GET | `/assets/:id` | `view-assets` | Single asset |
| GET | `/assets/:id/history` | `view-assets` | Asset history |
| POST | `/assets` | `manage-assets` | Create asset |
| PATCH | `/assets/:id` | `manage-assets` | Update asset |
| POST | `/assets/:id/allocate` | `manage-assets` | Allocate to employee |
| POST | `/assets/:id/return` | `manage-assets` | Return from employee |
| POST | `/assets/:id/maintenance` | `manage-assets` | Mark maintenance |
| POST | `/assets/:id/retire` | `manage-assets` | Retire asset |

**Validation:** `asset.validation.ts`

**Tests:**
- CRUD operations
- Asset code generation
- Allocation/return lifecycle
- Status transition validation (can't allocate retired asset)
- Employee asset listing

### Client Plan

**Module:** `client/src/features/assets/`

**Pages:**
- `AssetsPage.tsx` — list with filters (category, status, assigned to), search
- `AssetDetailPage.tsx` — full view with history timeline
- `AssetFormPage.tsx` — create/edit asset
- `EmployeeAssetsPage.tsx` — assets by employee

**Components:**
- `AssetStatusBadge.tsx`
- `AssetHistoryTimeline.tsx`
- `AssetAllocateModal.tsx` — allocate to employee modal
- `AssetReturnModal.tsx`

**Hooks:**
- `useAssets.ts`
- `useAssetMutations.ts`
- `useEmployeeAssets.ts`
- `useAssetStats.ts`

**Services:** `assetService.ts`

**Route:** `/assets/*` (inside AppLayout)
- `/assets` — list
- `/assets/new` — create
- `/assets/:id` — detail
- `/assets/:id/edit` — edit

### Fallbacks
- **Duplicate serial:** Warn if serial number already exists in system
- **Orphan allocation:** Report assets assigned to inactive employees
- **Maintenance reminder:** Cron job notifies when assets due for maintenance

---

## 2.2 Document Repository

### Overview
Central document storage for company policies, employee documents (contracts, ID proofs, certificates), with versioning, category-based access, and expiry tracking.

### Configuration (Settings)
- `documentConfig` section in `CompanySettings`:
  - `documentRepoEnabled` (Boolean, default: true)
  - `maxFileSizeMb` (Number, default: 20)
  - `allowedFileTypes` ([String], default: ['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'png'])
  - `autoExpireReminderDays` (Number, default: 30) — remind before expiry
  - `enableVersioning` (Boolean, default: true)
  - `maxVersions` (Number, default: 10)
  - `categories` ([ { name, accessRoles } ], configurable per role)

### Server Plan

**Model: Document** (new model)
Fields: `title` (String), `description` (String), `category` (String), `file` ({ url (String), name (String), size (Number), mimeType (String) }), `employee` (ref Employee — null if company document), `isCompanyDocument` (Boolean), `version` (Number), `previousVersions` ([{ file, version, uploadedBy, uploadedAt }]), `tags` ([String]), `expiryDate` (Date), `expiryNotificationSent` (Boolean), `accessRoles` ([String]), `uploadedBy` (ref User), `downloadCount` (Number), `isActive` (Boolean)

**Service:** `document.service.ts`
- `upload(data, file)` — upload with Cloudinary, create record
- `getAll(filters)` — list with category/tag/employee filters, role-filtered
- `getById(id)` — single document with version history
- `update(id, data, file)` — create new version if file replaced
- `delete(id)` — soft delete
- `getEmployeeDocuments(employeeId)` — all documents related to employee
- `getCompanyDocuments()` — policies, templates
- `getExpiringDocuments()` — for reminder cron
- `getStats()` — counts by category
- `incrementDownload(id)` — track download count

**Controller:** `document.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/documents` | `view-documents` | List documents |
| GET | `/documents/company` | `view-documents` | Company docs |
| GET | `/documents/employee/:employeeId` | `view-documents` | Employee docs |
| GET | `/documents/expiring` | `view-documents` | Expiring docs |
| GET | `/documents/stats` | `view-documents` | Stats |
| GET | `/documents/:id` | `view-documents` | Single document |
| GET | `/documents/:id/download` | `view-documents` | Download (increment count) |
| POST | `/documents` | `manage-documents` | Upload document |
| PATCH | `/documents/:id` | `manage-documents` | Update metadata or new version |
| DELETE | `/documents/:id` | `manage-documents` | Delete document |

**Validation:** `document.validation.ts` — multipart file validation

**Tests:**
- File upload with validation
- Version creation
- Role-based access filtering
- Expiry reminder logic
- Employee document association

### Client Plan

**Module:** `client/src/features/documents/`

**Pages:**
- `DocumentsPage.tsx` — list with category tabs, search, grid/list toggle
- `DocumentDetailPage.tsx` — preview, metadata, version history, download
- `DocumentUploadPage.tsx` — upload form with category, tags, expiry

**Components:**
- `DocumentCard.tsx` — grid view card
- `DocumentTable.tsx` — list view
- `DocumentVersionList.tsx` — version history
- `DocumentCategoryFilter.tsx`
- `FileDropzone.tsx` — drag-drop upload area

**Hooks:**
- `useDocuments.ts`
- `useDocumentMutations.ts`
- `useDocumentUpload.ts`

**Services:** `documentService.ts`

**Route:** `/documents/*` (inside AppLayout)
- `/documents` — list
- `/documents/new` — upload
- `/documents/:id` — detail

### Fallbacks
- **Storage limit:** Track total storage used per category; warn when approaching limit
- **Expired documents:** Auto-mark as inactive; move to archive
- **Upload failure:** Retry with exponential backoff; log to server logs
- **Access control:** Non-employee docs visible only to authorized roles

---

## 2.3 Shift Swap / Preferences

### Overview
Allow employees to request shift swaps with colleagues. Managers can approve/reject. Supports recurring preferences and shift change history.

### Configuration (Settings)
- `shiftSwapConfig` section in `CompanySettings`:
  - `shiftSwapEnabled` (Boolean, default: true)
  - `requireManagerApproval` (Boolean, default: true)
  - `maxSwapsPerMonth` (Number, default: 3)
  - `swapDeadlineHours` (Number, default: 24) — must request before shift starts
  - `allowRecurringSwaps` (Boolean, default: false)
  - `notifyOnMatch` (Boolean, default: true)
  - `shiftPreferenceEnabled` (Boolean, default: false) — allow preference setting

### Server Plan

**Model: ShiftSwap** (new model)
Fields: `requestor` (ref Employee), `targetEmployee` (ref Employee, optional for preference), `fromShift` (ref Shift), `toShift` (ref Shift), `fromDate` (Date), `toDate` (Date), `reason` (String), `status` (pending|approved|rejected|cancelled), `approvedBy` (ref User), `approvedAt` (Date), `rejectionReason` (String), `isRecurring` (Boolean), `recurringUntil` (Date), `swapType` (one-time|recurring|preference)

**Model: ShiftPreference** (new model — optional)
Fields: `employee` (ref Employee, unique), `preferredShift` (ref Shift), `effectiveFrom` (Date), `effectiveTo` (Date, optional), `priority` (Number), `reason` (String), `approvedBy` (ref User)

**Service:** `shiftSwap.service.ts`
- `requestSwap(data)` — create request, check eligibility (max swaps, deadline)
- `approveSwap(id, approverId)` — approve and apply shift change to attendance
- `rejectSwap(id, approverId, reason)` — reject
- `cancelSwap(id, employeeId)` — cancel own request
- `getAll(filters)` — list with status/date filters
- `getMySwaps(employeeId)` — employee's own requests
- `getPendingApprovals(managerId)` — shifts needing approval
- `checkEligibility(employeeId)` — remaining swaps this month
- `findSwapMatch(requestorId, fromShift, fromDate)` — auto-match with employees on opposite shift
- `setPreference(employeeId, shiftId, ...)` — set shift preference
- `getPreference(employeeId)` — get preference

**Controller:** `shiftSwap.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/shift-swaps` | `view-shifts` | List all swaps |
| GET | `/shift-swaps/my` | `view-own-shifts` | My swaps |
| GET | `/shift-swaps/pending` | `manage-shifts` | Pending approvals |
| GET | `/shift-swaps/eligibility` | `view-own-shifts` | Remaining swaps |
| GET | `/shift-swaps/:id` | `view-shifts` | Single swap |
| POST | `/shift-swaps` | `request-shift-swap` | Request swap |
| POST | `/shift-swaps/:id/approve` | `manage-shifts` | Approve swap |
| POST | `/shift-swaps/:id/reject` | `manage-shifts` | Reject swap |
| POST | `/shift-swaps/:id/cancel` | `request-shift-swap` | Cancel swap |
| GET | `/shift-preferences` | `view-shifts` | Get my preference |
| PUT | `/shift-preferences` | `request-shift-swap` | Set preference |

**Validation:** `shiftSwap.validation.ts`

**Tests:**
- Swap request lifecycle
- Monthly limit enforcement
- Deadline validation (can't swap within 24h)
- Auto-match logic
- Manager approval flow

### Client Plan

**Module:** `client/src/features/shift-swaps/`

**Pages:**
- `ShiftSwapsPage.tsx` — list with status filters
- `ShiftSwapFormPage.tsx` — request swap with employee search
- `ShiftSwapApprovalsPage.tsx` — pending approvals for manager
- `ShiftPreferencesPage.tsx` — set preferred shift

**Components:**
- `ShiftSwapStatusBadge.tsx`
- `ShiftSwapCalendar.tsx` — visual shift calendar
- `EmployeeShiftCard.tsx` — shows employee's current shift

**Hooks:**
- `useShiftSwaps.ts`
- `useShiftSwapMutations.ts`
- `useShiftSwapEligibility.ts`
- `useShiftPreferences.ts`

**Services:** `shiftSwapService.ts`

**Integration:** On approval, update the impacted days' attendance shift assignment.

**Route:** `/shift-swaps/*` (inside AppLayout)

### Fallbacks
- **Swap reversal:** Allow manager to reverse a swap within 24h if scheduling conflict
- **Duplicate swap:** Check no overlapping swap requests for same date/employee
- **Notification:** Notify both requestor and target on approval

---

## Development Rules (Phase 2)

1. **Same rules as Phase 1** — Server model → service → controller → routes → client → tests → audit → verify
2. **Asset Management** — Must use existing Cloudinary file upload pattern for asset images
3. **Document Repository** — Must extend existing file upload middleware; documents must support both employee-specific and company-wide
4. **Shift Swap** — Must integrate with existing Attendance module; swap approval should auto-adjust attendance records
5. **All features must be independently disableable** via Settings toggle
6. **All mutations must be audited** via existing Audit service
