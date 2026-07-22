# TalentIQ Learning Intelligence — Implementation Plan

**Document version:** 1.0  
**Date:** 2026-06-24  
**Prerequisite:** `docs/LMS_ARCHITECTURE_ANALYSIS.md`  
**Gate:** Do not start until user approves with `IMPLEMENT LMS MODULE`

---

## Guiding Principles

1. **Extend, don't duplicate** — reuse `CourseAssignmentBatch`, `CourseAssignmentUser`, existing services and hooks.
2. **Isolate blast radius** — changes confined to `/admin/learning/**`, `/learning/my-courses/**`, and learning-admin service layer. Do not modify open-course, LRS, or roadmap modules unless syncing progress.
3. **Backend is source of truth** — preview counts, eligibility, duplicate detection always server-side.
4. **Database-driven** — courses, levels, screens, permissions from DB seeds; no hardcoded sidebar or course lists in UI.
5. **Incremental delivery** — each phase is independently deployable and testable.

---

## Phase Overview

| Phase | Name | Duration est. | Depends on |
|-------|------|---------------|------------|
| 0 | Pre-flight fixes | 0.5 day | — |
| 1 | Database | 1 day | — |
| 2 | Seed data | 0.5 day | Phase 1 |
| 3 | Repository layer | 1 day | Phase 1 |
| 4 | Service layer | 1.5 days | Phase 3 |
| 5 | Preview + Create APIs | 0.5 day | Phase 4 |
| 6 | Remaining APIs | 1 day | Phase 4 |
| 7 | RBAC + screens | 0.5 day | Phase 1 |
| 8 | Admin UI — Command Center | 1 day | Phase 5 |
| 9 | Admin UI — Catalog | 1 day | Phase 6 |
| 10 | Admin UI — Assignment Wizard | 2 days | Phase 5 |
| 11 | Admin UI — Assignment Management | 1 day | Phase 6 |
| 12 | Employee My Learning | 1 day | Phase 6 |
| 13 | Notifications + audit | 1 day | Phase 4 |
| 14 | Reports + export | 1 day | Phase 6 |
| 15 | Tests | 2 days | All |

**Total estimate:** ~15 engineering days (single senior engineer)

---

## Phase 0 — Pre-flight Fixes (No Schema)

Fix existing bugs before adding features:

| Task | File | Detail |
|------|------|--------|
| Fix preview user resolution | `services/learning-admin.service.ts:216` | Replace `listAssignableUsers()` with `findUsersByIds(finalIds)` |
| Wire course search | `components/learning-admin/courses-admin-panel.tsx` | Pass `search` to `useAdminLearningCourses` |
| Render prerequisite warnings | `components/learning-admin/course-assignment-wizard.tsx` | Show `preview.prerequisiteWarnings` in review step |
| Mount employee panel | New page `/learning/my-courses` | Import `AssignedCoursesPanel` |
| Expose extend due date | `components/learning-admin/assignment-detail-panel.tsx` | Use existing `useAssignmentMutations().extendDueDate` |

**Exit criteria:** Preview count accurate for org-wide audience; wizard shows all warning types.

---

## Phase 1 — Database

See `docs/LMS_DATABASE_DESIGN.md` for full specification.

### Tasks
1. Add enum values: `FAILED`, `EXEMPTED` to `CourseAssignmentStatus`
2. Add enum values: `USERS`, `DEPARTMENTS`, `LOCATION` to `AssignmentTargetType` (or `targetIds Json` approach)
3. Add columns to `courses`, `course_levels`, `course_assignment_batches`, `course_assignment_users`
4. Add partial unique index on active assignments
5. Optional: `locations` table + `users.location_id`
6. Optional: `course_assignment_reminders` for reminder history
7. Run `prisma migrate dev --name lms_assignment_hardening`

### Migration safety
- All changes additive (nullable columns, new enum values)
- No drops or renames on existing columns
- Backfill script for batch counters (Phase 3)

**Exit criteria:** Migration applies cleanly; `prisma generate` succeeds; existing tests pass.

---

## Phase 2 — Seed Data

### Tasks
1. Update `prisma/seed-learning-admin-courses.ts`:
   - Add `businessFunction`, `isMandatory`, `certificateEnabled`, `prerequisiteRules` per course
   - Link levels to `certificateTemplateId` where applicable
   - Set `assessmentRequired` on ADVANCED/EXPERT levels
2. Ensure exactly 20 courses × 4 levels after seed
3. Add demo assignment batches for QA (optional, dev only)
4. Update `scripts/seed-learning-admin-only.ts` for standalone re-seed
5. Document seed credentials in `docs/SEED_CREDENTIALS.md` (learning admin test users)

**Exit criteria:** `npm run db:seed` produces 20 active courses, 80 levels; admin dashboard shows correct course count.

---

## Phase 3 — Repository Layer

Extend `repositories/learning-admin.repository.ts`:

| Method | Purpose |
|--------|---------|
| `findUsersByIds(ids: string[])` | Fix preview user fetch (no 200 cap) |
| `createAssignmentTransactional(batch, users[])` | `$transaction` wrapper |
| `syncBatchCounters(batchId)` | Recount completed/overdue/assigned from user rows |
| `syncAllBatchCounters()` | Nightly or on-demand |
| `findActiveAssignment(userId, courseLevelId)` | Duplicate check helper |
| `exemptUserAssignment(id, actorId, reason)` | Set EXEMPTED status |
| `issueCertificateForAssignment(userAssignmentId)` | Bridge to certificates repo |
| `listCourseAnalytics()` | Course/level completion stats |
| `createCourse` / `updateCourse` / `archiveCourse` | Catalog CRUD |
| `exportAssignmentsCsv(filters)` | Report data |
| `resolveLocationUsers(locationId)` | If LOCATION added |

**Exit criteria:** Repository methods unit-tested; transactional create verified.

---

## Phase 4 — Service Layer

Extend `services/learning-admin.service.ts`:

| Method | Changes |
|--------|---------|
| `previewAssignment` | Accept `targetIds[]`, `rules`; return `alreadyCompletedUsers`, `estimatedImpact`, `finalCount` |
| `createAssignment` | Transactional; persist `skippedUsers`, `rules`; audit preview hash |
| `updateAssignment` | Notify users on due date extension |
| `exemptUser` | New |
| `reassignUser` | New |
| `syncAssignmentProgress(userId, courseId)` | Called from course player on lesson complete |
| `completeAssignment(userAssignmentId, score)` | Set COMPLETED, issue certificate if enabled |
| `getCourseAnalytics` | New dashboard feed |
| `exportReport(format, filters)` | CSV/PDF |
| `createCourse` / `updateCourse` / `archiveCourse` | Catalog admin |

Extend `lib/learning-admin/assignment-resolver.ts`:
- Support `USERS` (multi-ID), `DEPARTMENTS` (multi-ID), `LOCATION`
- Deduplicate across multi-target resolution

**Exit criteria:** Service methods match API contracts in `docs/LMS_API_CONTRACTS.md`.

---

## Phase 5 — Preview + Create APIs

| Route | Work |
|-------|------|
| `POST /api/admin/learning/assignments/preview` | Extend body schema; add audit log (optional) |
| `POST /api/admin/learning/assignments` | Return `{ batchId, assigned, skipped, duplicates }` |

**Exit criteria:** Integration test — preview count === create count.

---

## Phase 6 — Remaining APIs

| Route | Method | New/Update |
|-------|--------|------------|
| `/api/admin/learning/courses` | POST | Create course |
| `/api/admin/learning/courses/[id]` | PATCH | Update course |
| `/api/admin/learning/courses/[id]/archive` | POST | Archive |
| `/api/admin/learning/assignments/[id]/extend-due-date` | POST | Explicit route |
| `/api/admin/learning/assignments/[id]/exempt/[userId]` | POST | Exempt |
| `/api/admin/learning/assignments/[id]/reassign` | POST | Reassign |
| `/api/admin/learning/analytics/courses` | GET | Course analytics |
| `/api/admin/learning/reports/export` | GET | CSV/PDF |
| `/api/learning/my-assignments` | GET | Add certificate + player link |
| `/api/learning/my-assignments/[id]` | GET | Assignment detail for employee |

**Exit criteria:** All routes RBAC-protected; OpenAPI-style contracts documented.

---

## Phase 7 — RBAC + Screens

See `docs/LMS_RBAC_AND_SECURITY.md`.

1. Add missing permissions to `lib/rbac/permissions.ts`
2. Seed permissions in `prisma/seed.ts`
3. Update `lib/rbac/permission-matrix.ts` role grants
4. Add screen definitions for:
   - `admin-learning-courses` (optional child screen)
   - `admin-learning-assignments`
   - `learning-my-courses` (employee)
5. Update `lib/rbac/routePermissions.ts` for new routes
6. Consider removing dual role-slug gate — use permissions only

**Exit criteria:** RBAC test matrix updated; non-admin blocked in API tests.

---

## Phase 8 — Admin UI: Learning Command Center

Route: `/admin/learning`

### Components to build/refactor
- `LearningKpiCard` — extract from `ExecutiveMetricCard` usage
- `DepartmentProgressHeatmap` — new
- `OverdueEscalationQueue` — new table widget
- `CourseCompletionTrend` — chart (reuse analytics chart primitives)
- `RecentAssignmentActivity` — enhance existing list

### Data
- Wire `departmentCompletionRate` (already in API, not rendered)
- Add `/api/admin/learning/dashboard` date range query param (optional)

**Exit criteria:** 6 KPI cards, 3 visualization widgets, skeleton/empty/error states.

---

## Phase 9 — Admin UI: Course Catalog

Route: `/admin/learning/courses`, `/admin/learning/courses/[id]`

### Components
- `CourseCatalogGrid` — card grid with level badges
- `CoursePreviewDrawer` — right-side drawer
- `CourseFormDialog` — create/edit
- Archive confirmation dialog

### Features
- Filters: category, status, mandatory/optional
- Search wired to API
- Per-card: assignment count, completion rate, certificate flag

**Exit criteria:** Full CRUD without mock data.

---

## Phase 10 — Admin UI: Assignment Wizard

Route: `/admin/learning/assignments/new`

### Decompose monolith into:
```
components/learning-admin/wizard/
  assignment-wizard.tsx          # orchestrator
  wizard-step-indicator.tsx
  course-selector-step.tsx
  level-selector-step.tsx        # CourseLevelCard × 4
  audience-selector-step.tsx     # AudienceSelector tabs
  rules-config-step.tsx          # ReminderSchedulePanel, toggles
  review-confirm-step.tsx        # AssignmentSummaryPanel + AssignmentRiskWarnings
  assignment-summary-panel.tsx   # sticky right panel
```

### Step requirements
| Step | Must show |
|------|-----------|
| 1 Course | Search, category filter, metadata, assignment count |
| 2 Level | 4 cards with duration, passing score, prerequisite, certificate |
| 3 Audience | Tabs: Users, Departments, Teams, Roles, Locations, Organization; live preview count from API |
| 4 Rules | Due date, priority, reminders, retake, auto-next-level, block prerequisite, cert, manager notify, escalation |
| 5 Review | Full summary + confirm; no create without preview |

**Exit criteria:** Admin always sees impacted users before confirm; prerequisite/duplicate/inactive warnings visible.

---

## Phase 11 — Admin UI: Assignment Management

Routes: `/admin/learning/assignments`, `/admin/learning/assignments/[id]`

### Components
- `AssignmentDataTable` — tabs (All, User, Department, Overdue, Completed, Cancelled)
- `AssignmentPreviewDrawer`
- `AuditTimeline`
- Row actions: View, Remind, Extend, Cancel, Export

### Assignment detail
- Progress distribution chart
- Overdue learners list
- Reminder history
- Actions panel (extend, exempt, cancel, export)

**Exit criteria:** All batch actions functional via API.

---

## Phase 12 — Employee My Learning

Routes:
- `/learning/my-courses` — new page
- `/learning/course/[assignmentId]` — assignment-scoped entry to player

### Components
- Refactor `AssignedCoursesPanel` → `MyLearningGrid`
- `LearningProgressBar`
- Status badges (Not Started, In Progress, Completed, Overdue)
- Certificate badge + download link

### Integration
- Do not replace `/learning` roadmap — add nav tab or sidebar entry
- Deep link notifications to `/learning/course/[assignmentId]`

**Exit criteria:** Employee sees assigned courses only; Continue opens correct level player.

---

## Phase 13 — Notifications + Audit

### Notifications
| Event | Type | Deep link |
|-------|------|-----------|
| New assignment | ACTION_REQUIRED | `/learning/course/[id]` |
| Due reminder | WARNING | `/learning/course/[id]` |
| Overdue | WARNING | `/learning/course/[id]` |
| Manager escalation | ACTION_REQUIRED | `/admin/learning/assignments/[batchId]` |
| Certificate issued | SUCCESS | `/certifications` |
| Course completed | SUCCESS | `/learning/my-courses` |

### Audit events
| Action | entityType |
|--------|------------|
| course.created | Course |
| course.updated | Course |
| course.archived | Course |
| assignment.previewed | CourseAssignmentBatch |
| assignment.created | CourseAssignmentBatch |
| assignment.cancelled | CourseAssignmentBatch |
| due_date.extended | CourseAssignmentBatch |
| reminder.sent | CourseAssignmentBatch |
| user.exempted | CourseAssignmentUser |
| certificate.issued | Certificate |

### Scheduler (optional Phase 13b)
- Cron job or Vercel cron: `syncOverdueStatuses` + send reminders based on `rules.reminderSchedule`
- Manager escalation after N days overdue

**Exit criteria:** All actions in acceptance criteria produce audit + notification.

---

## Phase 14 — Reports + Export

Route: `/admin/learning/reports`

### Export types
- Assignment batch CSV
- User progress CSV
- Department progress PDF (summary)
- Overdue report CSV

Permission: `learning.reports.export`

**Exit criteria:** Download works; non-authorized user gets 403.

---

## Phase 15 — Tests

See `docs/LMS_TEST_PLAN.md`.

Run full suite before merge:
```bash
npm run test -- __tests__/learning-admin
npm run test -- __tests__/api/admin/learning  # to be created
```

---

## Recommended First Implementation Phase

**Start with Phase 0 + Phase 1 + Phase 3 (preview fix + schema + repository).**

Rationale:
1. Fixes a production bug (preview user cap) with zero UI change
2. Schema additions are additive and unblock all downstream work
3. Repository transactional create prevents data integrity issues before UI polish

After that: **Phase 5 (APIs) → Phase 10 (Wizard UI)** for highest user-visible value.

---

## Rollback Plan

| Phase | Rollback |
|-------|----------|
| Schema | Reverse migration; columns nullable — safe |
| API | Feature flag env `LMS_ASSIGNMENT_V2=false` — fall back to current routes |
| UI | Admin pages are additive; revert component PR |

---

## Dependencies & Integration Points

| System | Integration |
|--------|-------------|
| Course player | On lesson complete → `syncAssignmentProgress` |
| Certificate service | On assignment complete → `issueCertificate` |
| LRS | `LearningEvent` verb COMPLETED triggers progress sync |
| Notification service | Existing `notify()` — extend actionUrl |
| Audit service | Existing `log()` — extend metadata schema |
| Screen registry | Seed new screens on deploy |

---

## Out of Scope (This Module)

- SCORM package upload pipeline changes
- Open course assignment redesign
- Learning roadmap assignment dialog unification (future refactor)
- Mobile app API versioning
- Multi-tenant org isolation
