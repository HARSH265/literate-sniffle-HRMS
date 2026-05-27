# Phase 3: People Development

## Features
1. Performance Management System
2. Training & Development

---

## 3.1 Performance Management System

### Overview
Full performance review cycle management. Supports goal setting (OKRs/KPIs), self-assessment, manager assessment, 360 feedback, rating scales, review periods, and appraisal history. Configurable review templates and workflows.

### Configuration (Settings)
- `performanceConfig` section in `CompanySettings`:
  - `performanceEnabled` (Boolean, default: true)
  - `reviewFrequency` (String, default: 'quarterly') — quarterly|half-yearly|yearly
  - `reviewPeriodStartMonth` (Number, default: 4) — April (financial year start)
  - `selfReviewRequired` (Boolean, default: true)
  - `managerReviewRequired` (Boolean, default: true)
  - `enable360Feedback` (Boolean, default: false)
  - `ratingScale` (String, default: '1-5') — 1-3|1-5|1-10
  - `goalCreationDeadlineDays` (Number, default: 15) — days from review start to set goals
  - `reviewSubmissionDeadlineDays` (Number, default: 30)
  - `allowEmployeeGoalSetting` (Boolean, default: true)
  - `autoCloseAfterDays` (Number, default: 60)
  - `ratingLabels` (Object) — configurable labels per rating level

### Server Plan

**Model: PerformanceReview** (new model)
Fields: `employee` (ref Employee), `reviewPeriod` ({ year (Number), quarter (Number), label (String) }), `status` (draft|goals-set|self-review|manager-review|completed|appealed), `goals` ([{ title, description, weight (%), targetValue, actualValue, category, selfRating, managerRating, comments }]), `selfReview` ({ rating (Number), overallComment, strengths (String), improvements (String), submittedAt }), `managerReview` ({ rating (Number), overallComment, strengths (String), improvements (String), submittedAt, reviewer (ref User) }), `overallRating` (Number), `finalRating` (Number), `isAppealed` (Boolean), `appealReason` (String), `appealResolution` (String), `reviewerNotes` (String), `reviewCycle` (ref PerformanceCycle)

**Model: PerformanceCycle** (new model)
Fields: `year` (Number), `quarter` (Number), `label` (String), `startDate` (Date), `goalDeadline` (Date), `selfReviewDeadline` (Date), `managerReviewDeadline` (Date), `closureDate` (Date), `status` (upcoming|active|closed), `participants` ([ref Employee])

**Model: PerformanceFeedback** (new model — for 360)
Fields: `review` (ref PerformanceReview), `fromEmployee` (ref Employee), `relationship` (peer|subordinate|other), `rating` (Number), `comments` (String), `submittedAt` (Date)

**Service:** `performance.service.ts`
- `initiateCycle(cycleData)` — create performance cycle, notify participants
- `getMyReviews(employeeId)` — employee's current/past reviews
- `getReviewById(id)` — full review detail
- `setGoals(reviewId, goals)` — employee sets goals
- `submitSelfReview(reviewId, data)` — self assessment
- `submitManagerReview(reviewId, data)` — manager assessment
- `getPendingReviews(managerId)` — reviews pending manager action
- `getTeamReviews(managerId)` — all team reviews for manager
- `requestFeedback(reviewId, fromEmployeeId)` — request 360 feedback
- `submitFeedback(reviewId, data)` — submit peer feedback
- `appealReview(reviewId, reason)` — employee appeals rating
- `resolveAppeal(reviewId, resolution)` — HR resolves appeal
- `finalizeReview(reviewId)` — calculate final rating, close review
- `getCycleProgress(cycleId)` — completion stats
- `getAllCycles()` — list cycles

**Controller:** `performance.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/performance/reviews` | `view-performance` | List reviews |
| GET | `/performance/reviews/my` | `view-own-performance` | My reviews |
| GET | `/performance/reviews/pending` | `manage-performance` | Pending reviews |
| GET | `/performance/reviews/team` | `manage-performance` | Team reviews |
| GET | `/performance/reviews/:id` | `view-performance` | Single review |
| PATCH | `/performance/reviews/:id/goals` | `manage-own-performance` | Set goals |
| PATCH | `/performance/reviews/:id/self-review` | `manage-own-performance` | Submit self-review |
| PATCH | `/performance/reviews/:id/manager-review` | `manage-performance` | Submit mgr review |
| POST | `/performance/reviews/:id/appeal` | `manage-own-performance` | Appeal rating |
| POST | `/performance/reviews/:id/resolve-appeal` | `manage-performance` | Resolve appeal |
| POST | `/performance/reviews/:id/finalize` | `manage-performance` | Finalize |
| GET | `/performance/cycles` | `view-performance` | List cycles |
| POST | `/performance/cycles` | `manage-performance` | Create cycle |
| PATCH | `/performance/cycles/:id` | `manage-performance` | Update cycle |
| GET | `/performance/cycles/:id/progress` | `manage-performance` | Cycle progress |
| GET | `/performance/feedback/:reviewId` | `view-performance` | Get feedback |
| POST | `/performance/feedback/:reviewId` | `request-feedback` | Submit feedback |

**Validation:** `performance.validation.ts`

**Tests:**
- Full review lifecycle (goals → self → manager → complete)
- Deadline enforcement
- Rating calculation
- 360 feedback flow
- Appeal workflow
- Cycle management

### Client Plan

**Module:** `client/src/features/performance/`

**Pages:**
- `PerformanceDashboardPage.tsx` — overview, upcoming reviews, cycle progress
- `MyReviewsPage.tsx` — employee's review list
- `ReviewDetailPage.tsx` — full review with goals, ratings, comments
- `GoalSettingPage.tsx` — set/update goals with weight distribution
- `SelfReviewPage.tsx` — self-assessment form
- `ManagerReviewPage.tsx` — manager assessment form
- `TeamReviewsPage.tsx` — manager's team overview
- `ReviewCyclePage.tsx` — admin cycle management
- `FeedbackPage.tsx` — 360 feedback form
- `AppealPage.tsx` — appeal form

**Components:**
- `GoalCard.tsx` — individual goal display
- `GoalForm.tsx` — goal input with weight slider
- `RatingScale.tsx` — configurable rating input
- `ReviewTimeline.tsx` — visual timeline of review stages
- `ReviewStatusBadge.tsx`
- `CycleProgressBar.tsx`

**Hooks:**
- `usePerformanceReviews.ts`
- `usePerformanceMutations.ts`
- `usePerformanceCycles.ts`
- `usePerformanceFeedback.ts`
- `useTeamReviews.ts`

**Services:** `performanceService.ts`

**Route:** `/performance/*` (inside AppLayout)

### Fallbacks
- **Missed deadlines:** Auto-escalate to HR/manager chain
- **Incomplete reviews:** Generate report before cycle closure of pending reviews
- **Rating disputes:** Appeal workflow with HR as final arbiter
- **Goals not set:** Auto-create placeholder goals if employee doesn't set by deadline

---

## 3.2 Training & Development

### Overview
Manage training programs, course assignments, employee enrollments, completion tracking, and skill matrix. Supports internal and external training, certifications, and expiry tracking.

### Configuration (Settings)
- `trainingConfig` section in `CompanySettings`:
  - `trainingEnabled` (Boolean, default: true)
  - `autoEnrollByDesignation` (Boolean, default: false)
  - `certificationExpiryReminderDays` (Number, default: 30)
  - `allowSelfEnrollment` (Boolean, default: true)
  - `maxSelfEnrollmentsPerEmployee` (Number, default: 3)
  - `trainingCategories` ([String], default: ['Technical', 'Soft Skills', 'Compliance', 'Safety', 'Leadership', 'Other'])
  - `trainingModes` ([String], default: ['Classroom', 'Online', 'On-the-Job', 'External'])
  - `skillCategories` ([String], default: ['Technical', 'Functional', 'Behavioral'])

### Server Plan

**Model: TrainingProgram** (new model)
Fields: `title` (String), `description` (String), `category` (String), `mode` (String), `duration` ({ value (Number), unit (hours|days|weeks) }), `maxParticipants` (Number), `startDate` (Date), `endDate` (Date), `trainer` (String), `location` (String), `cost` (Number), `status` (planned|in-progress|completed|cancelled), `certificationOffered` (Boolean), `certificationValidForDays` (Number), `prerequisites` ([String]), `tags` ([String]), `createdBy` (ref User), `materials` ([{ name, url }])

**Model: TrainingEnrollment** (new model)
Fields: `training` (ref TrainingProgram), `employee` (ref Employee), `enrolledAt` (Date), `status` (enrolled|in-progress|completed|dropped|certified), `completionDate` (Date), `score` (Number), `feedback` (String), `rating` (Number), `certificationExpiry` (Date), `certificationNumber` (String), `certificateFile` ({ url, name })

**Model: Skill** (new model)
Fields: `name` (String), `category` (String), `description` (String), `isActive` (Boolean)

**Model: EmployeeSkill** (new model)
Fields: `employee` (ref Employee), `skill` (ref Skill), `proficiencyLevel` (beginner|intermediate|advanced|expert), `yearsOfExperience` (Number), `lastUsedAt` (Date), `certified` (Boolean), `certificationExpiry` (Date), `source` (self-reported|manager-assigned|training-completed)

**Service:** `training.service.ts`
- `createProgram(data)` — create training program
- `getPrograms(filters)` — list with category/status/date filters
- `getProgramById(id)` — single with enrollments
- `updateProgram(id, data)` — update program details
- `cancelProgram(id)` — cancel, notify enrolled
- `enrollEmployee(trainingId, employeeId)` — enroll, check capacity
- `batchEnroll(trainingId, employeeIds)` — bulk enroll
- `dropEnrollment(enrollmentId, reason)` — drop employee
- `markCompleted(enrollmentId, data)` — mark completion, issue cert
- `recordAttendance(trainingId, date, employeeIds)` — daily attendance
- `getMyEnrollments(employeeId)` — employee's training history
- `getPendingEnrollments(employeeId)` — upcoming training
- `getSkills(employeeId)` — employee's skill matrix
- `updateSkill(employeeId, skillId, data)` — update proficiency
- `getSkillGapAnalysis(designationId)` — compare employee skills vs required skills
- `getExpiringCertifications()` — for reminder cron
- `getStats()` — counts, completion rate, popular categories

**Controller:** `training.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/training/programs` | `view-training` | List programs |
| GET | `/training/programs/:id` | `view-training` | Program detail |
| POST | `/training/programs` | `manage-training` | Create program |
| PATCH | `/training/programs/:id` | `manage-training` | Update program |
| DELETE | `/training/programs/:id` | `manage-training` | Cancel program |
| GET | `/training/enrollments/my` | `view-own-training` | My enrollments |
| GET | `/training/enrollments/:id` | `view-training` | Enrollment detail |
| POST | `/training/enrollments` | `enroll-training` | Self-enroll |
| POST | `/training/enrollments/batch` | `manage-training` | Batch enroll |
| PATCH | `/training/enrollments/:id/complete` | `manage-training` | Mark complete |
| PATCH | `/training/enrollments/:id/drop` | `manage-training` | Drop enrollment |
| GET | `/training/skills` | `view-training` | All skills |
| GET | `/training/skills/my` | `view-own-training` | My skills |
| GET | `/training/skills/employee/:employeeId` | `view-training` | Employee skills |
| GET | `/training/skills/gap/:designationId` | `manage-training` | Skill gap analysis |
| POST | `/training/skills/employee/:employeeId` | `manage-training` | Update skills |
| GET | `/training/stats` | `manage-training` | Dashboard stats |

**Validation:** `training.validation.ts`

**Tests:**
- Training CRUD
- Enrollment lifecycle (enrolled → in-progress → completed/certified)
- Capacity enforcement
- Self-enrollment limits
- Skill matrix CRUD
- Expiring certification detection

### Client Plan

**Module:** `client/src/features/training/`

**Pages:**
- `TrainingDashboardPage.tsx` — overview, upcoming, completion stats
- `TrainingProgramsPage.tsx` — list with filters, calendar view
- `TrainingProgramDetailPage.tsx` — full detail with enrollment list
- `TrainingProgramFormPage.tsx` — create/edit program
- `MyTrainingPage.tsx` — employee's training/enrollments
- `TrainingEnrollPage.tsx` — self-enroll form
- `SkillMatrixPage.tsx` — skill grid for employees
- `SkillGapPage.tsx` — skill gap analysis
- `CertificationsPage.tsx` — expiring/active certifications

**Components:**
- `TrainingCard.tsx`
- `EnrollmentStatusBadge.tsx`
- `SkillMatrixGrid.tsx` — heatmap-style grid
- `SkillBadge.tsx`
- `TrainingCalendar.tsx` — calendar view of programs

**Hooks:**
- `useTrainingPrograms.ts`
- `useTrainingEnrollments.ts`
- `useTrainingMutations.ts`
- `useSkills.ts`
- `useSkillGap.ts`
- `useTrainingStats.ts`

**Services:** `trainingService.ts`

**Route:** `/training/*` (inside AppLayout)

### Fallbacks
- **Over-enrollment:** Auto-waitlist when maxParticipants reached
- **Cancelled training:** Auto-notify all enrolled employees; offer alternative
- **Certification expiry:** Cron job to notify employee + manager 30 days before
- **Skill gap auto-suggest:** Suggest training programs based on skill gaps

---

## Development Rules (Phase 3)

1. **Performance Management** requires a new `employee-manager` relationship — verify Employee model can support manager hierarchy
2. **Training enrollments** must check against employee's current workload (no overlap with scheduled shifts)
3. **Both features** depend on Employee model — must ensure no breaking changes
4. **Data migration:** Existing employees get default skill level "unknown"
5. **Compliance note:** Performance review data should be immutable once finalized
6. **All features must have Settings toggles** for independent disable
7. **All mutations must be audited**
