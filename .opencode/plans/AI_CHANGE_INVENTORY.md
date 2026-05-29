# AI Change Inventory

Generated after an interrupted AI session to reconstruct what changed from the Git working tree.

## Current Scope

- Tracked files modified: 132
- Tracked diff size: about 14,309 insertions and 4,413 deletions
- Untracked files/directories: many new feature modules, tests, models, and planning docs
- Main plan found: `.opencode/plans/phase-3-people-development/README.md`

## High-Level Feature Areas Added

- Phase 3 People Development
  - Performance management
  - Training and development
- Employee self-service mobile experience
- Announcements
- Helpdesk tickets
- Assets
- Documents
- Shift swaps and shift preferences
- Kiosk device management
- Broader test infrastructure for client and server

## New Client Feature Folders

- `client/src/features/performance/`
- `client/src/features/training/`
- `client/src/features/employee-self-service/`
- `client/src/features/announcements/`
- `client/src/features/helpdesk/`
- `client/src/features/assets/`
- `client/src/features/documents/`
- `client/src/features/shift-swaps/`
- `client/src/features/kiosk/services/`

## New Server Feature Folders

- `server/src/modules/performance/`
- `server/src/modules/training/`
- `server/src/modules/ess/`
- `server/src/modules/announcements/`
- `server/src/modules/helpdesk/`
- `server/src/modules/assets/`
- `server/src/modules/documents/`
- `server/src/modules/shift-swap/`

## New Server Models

- `Announcement.model.ts`
- `Asset.model.ts`
- `Document.model.ts`
- `EmployeeSkill.model.ts`
- `EssChangeRequest.model.ts`
- `PerformanceCycle.model.ts`
- `PerformanceFeedback.model.ts`
- `PerformanceReview.model.ts`
- `ShiftPreference.model.ts`
- `ShiftSwap.model.ts`
- `Skill.model.ts`
- `Ticket.model.ts`
- `TrainingEnrollment.model.ts`
- `TrainingProgram.model.ts`

## Important Integration Files Modified

- `client/src/App.tsx`
  - Added routes for ESS, announcements, helpdesk, assets, documents, shift swaps, performance, and training.
  - Added mobile-aware authenticated redirect behavior.
- `server/src/app.ts`
  - Mounted new API route groups for ESS, announcements, helpdesk, assets, documents, shift swaps, performance, and training.
  - Added audit middleware to many routes.
- `client/src/core/constants/permissions.ts`
  - Added new permissions for ESS, shift swaps, assets, documents, performance, and training.
- `server/src/core/permissions/permissions.config.ts`
  - Added matching server-side permissions.
- `client/package.json` and `server/package.json`
  - Added test scripts and test dependencies.
- `client/vite.config.ts`
  - Added PWA/plugin/dev-server related changes.

## Recent Manual Fixes After Recovery Began

- `client/.env`
  - Changed API base URL to `/api/v1` for mobile/LAN use through Vite proxy.
- `client/src/core/api/apiClient.ts`
  - Avoided forced logout/page reload for failed login and refresh requests.
- `client/src/features/auth/pages/LoginPage.tsx`
  - Show real server/network login errors instead of hiding everything behind a generic message.
- `client/src/features/employee-self-service/pages/EssShiftPreferencePage.tsx`
  - Fixed incorrect/missing Ant Design import.
- `client/src/features/performance/components/CreateCycleModal.tsx`
  - Fixed Select values using `id || _id`.
- Training Select fixes:
  - `client/src/features/training/pages/CertificationsPage.tsx`
  - `client/src/features/training/pages/SkillGapPage.tsx`
  - `client/src/features/training/pages/SkillMatrixPage.tsx`
  - `client/src/features/training/pages/TrainingEnrollmentsPage.tsx`
  - `client/src/features/training/components/EnrollEmployeeModal.tsx`

## Verification So Far

- `client`: `npm run build` passes.
- `server`: `npm run build` does not pass yet. Known blockers include TypeScript errors in assets, documents, tests, helpdesk, TOTP, and missing Vitest globals/types.

## Suggested Recovery Order

1. Stabilize server build errors.
2. Run focused route smoke tests for new modules.
3. Review route/API contract mismatches between client and server for performance and training.
4. Commit recovery-safe chunks by feature area.
5. Only then consider removing or reverting incomplete modules.
