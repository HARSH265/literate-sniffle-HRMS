# Training – End‑User Guide
---
## 1. Overview
The **Training** module lets HR administrators create training programs, enroll employees, track progress, and issue certificates. Programs can be categorized, scheduled, and include assessments.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View training catalog / progress | `view-training` |
| Create / edit training programs | `manage-training` |
| Enroll employees / self‑enroll | `view-own-training` / `enroll-training` |
| View certificates | `view-own-training` |

If you lack permission the UI hides the corresponding tabs and API calls return **403**.

## 3. Related Settings
- **trainingConfig.maxEnrollments** – Maximum participants per program.
- **trainingConfig.requireApproval** – Whether enrollment requires manager approval.
- **trainingConfig.certificateTemplate** – PDF template used for generated certificates.

These settings are edited in **Settings → Training**.

## 4. UI Pages & Workflow
- **Training Catalog** (`/training`): List of active programs with filters (category, status, date). Buttons: **Enroll** (self‑enroll) or **Request Enrollment** (if approval required).
- **Program Detail** (`/training/:id`): Shows syllabus, schedule, trainer, enrolled participants, and progress tracker.
- **Create / Edit Program** (`/training/new` & `/training/:id/edit`): Form to define title, description, start/end dates, categories, assessment criteria, and upload resources.
- **My Enrollments** (`/training/my`): Employee view of enrolled programs, progress bars, and downloadable certificates.
- **Certificates** (`/training/:id/certificate`): Generate PDF certificate upon completion.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/training` | List training programs | `view-training` |
| POST | `/training` | Create a new program | `manage-training` |
| GET | `/training/:id` | Get program details | `view-training` |
| PATCH | `/training/:id` | Update program | `manage-training` |
| DELETE | `/training/:id` | Delete program | `manage-training` |
| POST | `/training/:id/enroll` | Enroll current user | `enroll-training` |
| POST | `/training/:id/approve` | Approve enrollment request (manager) | `manage-training` |
| GET | `/training/:id/certificate` | Download completion certificate | `view-own-training` |

## 6. Edge Cases & Gotchas
- **Enrollment limits** – Once `maxEnrollments` is reached, the **Enroll** button is disabled.
- **Approval workflow** – If `requireApproval` is true, enrollment requests appear in the manager’s pending approvals list.
- **Certificate generation** – Certificates are generated on‑demand; ensure the employee has completed all required modules.
- **Program archiving** – Past programs can be archived (hidden from catalog) but remain accessible for audit.

## 7. Quick Actions Summary
- **Browse Catalog** → Training → filter → **Enroll**.
- **Create Program** → Admin → **New Program** → fill form → **Create**.
- **Track Progress** → My Enrollments → view progress bars.
- **Download Certificate** → completed program → **Certificate** button.

*Generated on **2026‑06‑12***