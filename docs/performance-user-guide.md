# Performance – End‑User Guide
---
## 1. Overview
The **Performance** module enables managers and HR staff to create review cycles, set goals, collect 360° feedback, and calculate performance scores for employees. It integrates with the employee profile and can trigger salary adjustments based on outcomes.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View performance dashboard / employee scores | `view-performance` |
| Create / edit performance cycles | `manage-performance` |
| Submit self‑evaluation / peer feedback | `view-performance` |
| Approve / finalize reviews | `manage-performance` |
| View own performance data | `view-own-performance` |
| Edit own performance data | `manage-own-performance` |

If you lack permission, the UI hides the corresponding sections and API calls return **403**.

## 3. Related Settings
- **performanceConfig.reviewPeriodMonths** – Length of a review cycle.
- **performanceConfig.rankingMethod** – `numeric` (0‑5) or `letter` (A‑F).
- **performanceConfig.allowSelfEvaluation** – Enable employees to submit their own evaluation.

## 4. UI Pages & Workflow
- **Performance Dashboard** (`/performance`): Overview of active review cycles, upcoming deadlines, and summary scores.
- **Create Review Cycle** (`/performance/new`): Define cycle name, start/end dates, participating departments, and weightings for criteria.
- **Employee Review** (`/performance/:cycleId/employee/:empId`): Manager view to rate employee on criteria, add comments, and submit.
- **Self‑Evaluation** (`/performance/:cycleId/self`): Employee fills out their own evaluation.
- **360° Feedback** (`/performance/:cycleId/feedback/:empId`): Collect peer feedback.
- **Finalize Cycle** (`/performance/:cycleId/finalize`): Lock scores, generate reports, optionally trigger salary adjustments.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/performance/cycles` | List review cycles | `view-performance` |
| POST | `/performance/cycles` | Create a new cycle | `manage-performance` |
| GET | `/performance/cycles/:id` | Get cycle details | `view-performance` |
| PATCH | `/performance/cycles/:id` | Update cycle | `manage-performance` |
| DELETE | `/performance/cycles/:id` | Delete cycle (if no reviews) | `manage-performance` |
| POST | `/performance/:cycleId/employee/:empId/ratings` | Submit manager rating | `manage-performance` |
| POST | `/performance/:cycleId/self` | Submit self‑evaluation | `view-performance` |
| POST | `/performance/:cycleId/feedback/:empId` | Submit peer feedback | `view-performance` |
| POST | `/performance/:cycleId/finalize` | Finalize cycle | `manage-performance` |

## 6. Edge Cases & Gotchas
- **Late submissions** – The system can automatically extend deadlines or send reminders.
- **Weighting changes** – Changing weights after scores are submitted requires cycle re‑open.
- **Data visibility** – Employees can only see their own scores unless granted `view-performance` at a higher level.

## 7. Quick Actions Summary
- **Create Cycle** → Dashboard → **New Cycle** → define parameters → **Create**.
- **Rate Employee** → Cycle → employee row → **Rate** → submit.
- **Self‑Evaluate** → Cycle → **Self‑Eval** tab → fill → submit.
- **Finalize** → Cycle → **Finalize** button → lock scores and generate reports.

*Generated on **2026‑06‑12***