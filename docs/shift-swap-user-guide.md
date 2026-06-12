# Shift Swaps – End‑User Guide
---
## 1. Overview
The **Shift Swaps** feature lets employees request to exchange their scheduled shifts with coworkers. Managers can approve or reject swap requests. The system ensures no conflicts with attendance rules or statutory limits.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View shift‑swap list / details | `view-shift-swaps` |
| Request a shift swap | `request-shift-swap` |
| Approve / reject swap requests | `manage-shift-swaps` |
| View own swap preferences | `view-own-shifts` |

If you lack permission the UI hides the respective sections and API calls return **403 Unauthorized**.

## 3. Related Settings
- **shiftSwapConfig.maxPendingRequests** – Maximum number of pending swap requests per employee.
- **shiftSwapConfig.allowCrossDepartment** – Whether swaps across departments are permitted.
- **shiftSwapConfig.autoApprove** – If true, swaps are auto‑approved when both parties consent.

## 4. UI Pages & Workflow
- **Shift Swaps List** (`/shift-swaps`): Shows incoming requests, outgoing requests, and status (pending, approved, rejected).
- **Request Swap** (`/shift-swaps/new`): Choose your shift, select a target employee, optionally propose a new shift for them, add a reason, and submit.
- **Swap Preferences** (`/shift-swaps/preferences`): Set preferred shifts, blackout dates, and auto‑accept rules.
- **Manager Approval** (`/shift-swaps/approvals`): Managers see pending swaps for their team, can approve or reject with comments.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/shift-swaps` | List all swap requests (filter by status) | `view-shift-swaps` |
| POST | `/shift-swaps` | Create a new swap request | `request-shift-swap` |
| PATCH | `/shift-swaps/:id` | Update request (e.g., cancel) | `request-shift-swap` |
| POST | `/shift-swaps/:id/approve` | Approve request | `manage-shift-swaps` |
| POST | `/shift-swaps/:id/reject` | Reject request | `manage-shift-swaps` |
| GET | `/shift-swaps/preferences` | Get user swap preferences | `view-own-shifts` |
| POST | `/shift-swaps/preferences` | Save preferences | `view-own-shifts` |

## 6. Edge Cases & Gotchas
- **Conflict detection** – The system checks that the swap does not create overlapping shifts or violate max‑hours rules.
- **Cancellation** – Requesters can cancel a pending swap; once approved it cannot be cancelled.
- **Notification** – Both parties receive email/SMS notifications on request creation, approval, or rejection.
- **Cross‑department** – If disabled, swaps are limited to employees within the same department.

## 7. Quick Actions Summary
- **Request Swap** → **Shift Swaps** tab → **New Swap** → select your shift, target employee, optional new shift → **Submit**.
- **Approve/Reject** → Manager view → select request → **Approve** or **Reject** with comment.
- **Set Preferences** → **Preferences** tab → choose preferred shifts, blackout dates → **Save**.
- **Cancel Request** → **Outgoing** list → **Cancel** button.

*Generated on **2026‑06‑12***