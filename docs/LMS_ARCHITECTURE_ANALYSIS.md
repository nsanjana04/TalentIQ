# TalentIQ Learning Intelligence — Architecture Analysis

**Document version:** 1.0  
**Date:** 2026-06-24  
**Status:** Analysis complete — awaiting `IMPLEMENT LMS MODULE` approval  
**Author role:** Enterprise HRTech / LMS architecture review

---

## Executive Summary

TalentIQ already contains a **substantial v1 Learning Administration module** — not a greenfield build. The parent-child assignment model (`CourseAssignmentBatch` → `CourseAssignmentUser`), four-tier level engine (`CourseLevelTier`: BASIC → EXPERT), preview/create APIs, admin UI shell, employee assignment API, RBAC permissions, notifications, audit logs, and 20×4 enterprise seed courses are **in place**.

The work required to reach Workday/SAP SuccessFactors/Cornerstone parity is primarily **hardening, gap-filling, and UI elevation** — not duplicating existing tables or rewriting the assignment pipeline from scratch.

**Recommendation:** Extend the existing module in isolated layers. Do **not** create parallel assignment tables (`OpenCourseAssignment`, `LearningResourceAssignment` serve different domains and must remain separate).

---

## 1. Current LMS Architecture

### 1.1 What Already Exists

| Layer | Status | Key paths |
|-------|--------|-----------|
| Database schema | ✅ Core complete | `prisma/schema.prisma` — `Course`, `CourseLevel`, `CourseAssignmentBatch`, `CourseAssignmentUser` |
| Seed data | ✅ 20 courses × 4 levels | `prisma/seed-learning-admin-courses.ts`, invoked from `prisma/seed.ts` |
| Assignment resolver | ✅ Audience + duplicate + prerequisite | `lib/learning-admin/assignment-resolver.ts` |
| Repository | ✅ Admin queries | `repositories/learning-admin.repository.ts` |
| Service | ✅ Preview, create, dashboard, progress | `services/learning-admin.service.ts` |
| Validations | ✅ Zod schemas | `lib/validations/learning-admin.ts` |
| Types | ✅ DTOs | `types/learning-admin.ts` |
| Admin APIs | ✅ 15+ routes | `app/api/admin/learning/**` |
| Employee APIs | ✅ My assignments | `app/api/learning/my-assignments/route.ts` |
| Admin UI | ✅ 11 routes wired | `app/(dashboard)/admin/learning/**` |
| Assignment wizard | ✅ 5-step, API-backed | `components/learning-admin/course-assignment-wizard.tsx` |
| RBAC | ✅ 8 granular learning permissions | `lib/rbac/permissions.ts`, `lib/rbac/permission-matrix.ts` |
| Screen registry | ✅ `admin-learning` screen | `lib/screens/screen-definitions.ts` |
| Notifications | ✅ On assign + remind | `services/notification.service.ts` via `learningAdminService` |
| Audit logs | ✅ On create/update/remind | `services/audit.service.ts` via `learningAdminService` |
| LRS / xAPI | ✅ Separate track | `types/learning-lrs.ts`, `app/api/learning/lrs/**` |
| Tests | ⚠️ Minimal (3 service tests) | `__tests__/learning-admin/assignment.service.test.ts` |

### 1.2 Existing Tables (Learning Domain)

#### Core course catalog
| Table | Purpose |
|-------|---------|
| `courses` | Admin-managed course catalog (`adminStatus`, `category`, `skillsCovered`, modules via `course_modules`) |
| `course_levels` | Exactly 4 tiers per course (BASIC/INTERMEDIATE/ADVANCED/EXPERT) |
| `course_modules` / `lessons` | Content structure for internal course player |
| `course_enrollments` | Enrollment records (upserted on assignment) |

#### Assignment engine (target architecture — already present)
| Table | Purpose |
|-------|---------|
| `course_assignment_batches` | Parent: admin assignment action (audience, due date, counters) |
| `course_assignment_users` | Child: per-user learning requirement |

#### Progress & LRS
| Table | Purpose |
|-------|---------|
| `lesson_progress` | Per-lesson completion |
| `course_progress` | Aggregated course progress |
| `learning_events` | xAPI/LRS event store |
| `assessment_progress` / `assessment_attempts` | Quiz/assessment tracking |
| `certificate_progress` / `certificates` | Certificate lifecycle |

#### Parallel assignment systems (different domain — do NOT merge)
| Table | Purpose |
|-------|---------|
| `open_course_assignments` | External/open-course links (YouTube, Udemy, etc.) |
| `learning_resource_assignments` | Ad-hoc resource links |

#### Organization / audience resolution
| Table | Purpose |
|-------|---------|
| `users` | `departmentId`, `teamId`, `roleId`, `isActive` |
| `departments` | Hierarchical org units |
| `teams` | Team membership |
| `roles` | RBAC roles (used as assignment audience type `ROLE`) |

### 1.3 Existing APIs

#### Admin — Assignment engine
| Method | Route | Permission gate |
|--------|-------|-----------------|
| POST | `/api/admin/learning/assignments/preview` | `learning.assignments.create` OR `courses.manage` |
| POST | `/api/admin/learning/assignments` | `learning.assignments.create` |
| GET | `/api/admin/learning/assignments` | view/create/courses.manage |
| GET | `/api/admin/learning/assignments/[id]` | view/create/courses.manage |
| PATCH | `/api/admin/learning/assignments/[id]` | update |
| POST | `/api/admin/learning/assignments/[id]/remind` | update |
| POST | `/api/admin/learning/assignments/[id]/cancel` | cancel |

#### Admin — Catalog & pickers
| Method | Route |
|--------|-------|
| GET | `/api/admin/learning/courses` |
| GET | `/api/admin/learning/courses/[courseId]/levels` |
| GET | `/api/admin/learning/assignable-users` |
| GET | `/api/admin/learning/departments` |
| GET | `/api/admin/learning/teams` |
| GET | `/api/admin/learning/roles` |

#### Admin — Analytics
| Method | Route |
|--------|-------|
| GET | `/api/admin/learning/dashboard` |
| GET | `/api/admin/learning/progress` |
| GET | `/api/admin/learning/department-progress` |
| GET | `/api/admin/learning/overdue` |

#### Employee
| Method | Route |
|--------|-------|
| GET | `/api/learning/my-assignments` |

### 1.4 Existing UI Pages

| Route | Component | API wired |
|-------|-----------|-----------|
| `/admin/learning` | `LearningAdminDashboardPanel` | ✅ |
| `/admin/learning/courses` | `CoursesAdminPanel` | ✅ (search param gap) |
| `/admin/learning/courses/[id]/levels` | `CourseLevelsPageContent` | ✅ |
| `/admin/learning/assignments` | `AssignmentsAdminPanel` | ✅ |
| `/admin/learning/assignments/new` | `CourseAssignmentWizard` | ✅ |
| `/admin/learning/assignments/[id]` | `AssignmentDetailPanel` | ✅ |
| `/admin/learning/progress` | `LearningProgressPanel` | ✅ |
| `/admin/learning/department-progress` | `DepartmentProgressPanel` | ✅ |
| `/admin/learning/overdue` | `OverdueAssignmentsPanel` | ✅ |
| `/admin/learning/reports` | Static link hub | ❌ mock |
| `/admin/learning/certificates` | Redirect → `/certifications` | redirect |
| `/learning` | Roadmap + LRS hybrid | hybrid |
| `/learning/open-courses/[id]` | Open course player | ✅ |

**Orphaned but built:** `components/learning/assigned-courses-panel.tsx` — wired to `/api/learning/my-assignments` but not mounted on any page.

### 1.5 Existing RBAC Permissions

Defined in `lib/rbac/permissions.ts`:

| Permission key | Label |
|----------------|-------|
| `learning.courses.view` | View Learning Courses |
| `learning.courses.manage` | Manage Learning Courses |
| `learning.assignments.view` | View Course Assignments |
| `learning.assignments.create` | Create Course Assignments |
| `learning.assignments.update` | Update Course Assignments |
| `learning.assignments.cancel` | Cancel Course Assignments |
| `learning.progress.view` | View Learning Progress |
| `learning.reports.export` | Export Learning Reports |
| `learning.enroll` | Enroll in Learning |
| `learning.assign` | Assign Learning (legacy) |
| `learning.team.view` | View Team Learning |

Granted to ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, TEAM_LEADER, INSTRUCTOR via `lib/rbac/permission-matrix.ts`.

**Additional gate:** `createAssignment` requires learning-manager **role slug** (`constants/learning-manager-roles.ts`) — not permission alone.

### 1.6 Notification & Audit Support

| Action | Notification | Audit |
|--------|-------------|-------|
| Assignment created | ✅ Per-user `ACTION_REQUIRED` | ✅ `CREATE` on `CourseAssignmentBatch` |
| Reminder sent | ✅ Per pending user `WARNING` | ✅ `UPDATE` with `{ action: "remind" }` |
| Due date extended | ❌ | ✅ `UPDATE` |
| Assignment cancelled | ❌ | ✅ `UPDATE` |
| Preview | ❌ | ❌ |
| Certificate issued | ❌ (not wired to assignment completion) | ❌ |
| Overdue escalation | ❌ (no scheduler) | ❌ |
| Manager notification | ❌ | ❌ |

Deep links today point to `ROUTES.LEARNING` — not assignment-specific URLs.

---

## 2. Gaps vs Enterprise Requirements

| Requirement | Status | Gap detail |
|-------------|--------|------------|
| 20+ courses | ✅ | Seeded in `seed-learning-admin-courses.ts` |
| 4 levels per course | ✅ | `CourseLevelTier` enum + seed |
| Assign to single user | ✅ | `AssignmentTargetType.USER` |
| Assign to multiple users | ⚠️ | No `USERS` type; admin must run separate batches or extend resolver |
| Assign to department | ✅ | `DEPARTMENT` |
| Assign to multiple departments | ⚠️ | No `DEPARTMENTS` plural type |
| Assign to team | ✅ | `TEAM` |
| Assign to role | ✅ | `ROLE` (RBAC role, not job role) |
| Assign to location | ❌ | No `Location` model or `LOCATION` enum value |
| Assign to organization | ✅ | `ORGANIZATION` |
| Assignment preview | ✅ | Backend calculates all counts |
| Duplicate prevention | ⚠️ | App-level only; no DB unique index; race window |
| Due dates | ✅ | On batch + user rows |
| Overdue tracking | ⚠️ | `syncOverdueStatuses()` on read; batch counters stale |
| Progress tracking | ⚠️ | `progressPercent` on user assignment; not synced from LRS/player |
| Certificates | ⚠️ | Level has `certificateEnabled`; no auto-issue on completion |
| Reports | ❌ | Permission exists; no export API or UI |
| Notifications | ⚠️ | Assign + manual remind only |
| Audit logs | ⚠️ | Create/update/remind; missing preview, exempt, certificate |
| Assignment rules engine | ❌ | No JSON rules column (retake, auto-next-level, escalation) |
| Course catalog admin CRUD | ⚠️ | List + levels view; no create/edit/archive API in admin learning |
| Wizard Step 4 rules | ⚠️ | Due date + priority + notes only |
| Employee My Learning page | ⚠️ | API exists; dedicated `/learning/my-courses` route missing |
| Batch counters | ❌ | `completedUsers`/`overdueUsers`/`assignedUsers`/`skippedUsers` not maintained |
| Statuses FAILED/EXEMPTED | ❌ | Enum has NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED only |
| Score on assignment | ❌ | Not on `CourseAssignmentUser` |
| `assignmentName` on batch | ❌ | Not in schema |
| Prerequisite warnings in UI | ❌ | Computed server-side; wizard review step doesn't render them |
| Transactional create | ❌ | Batch + users not in single DB transaction |
| Org-scale assignment | ⚠️ | `listAssignableUsers` capped at 200; preview may miss users |
| Enterprise UI components | ⚠️ | Monolithic wizard; spec-named components absent |

---

## 3. Reuse Plan

### 3.1 Reuse — Do Not Duplicate

| Asset | Path | Rationale |
|-------|------|-----------|
| Assignment batch model | `CourseAssignmentBatch` + `CourseAssignmentUser` | Matches required parent-child architecture |
| Level engine | `CourseLevel` + `CourseLevelTier` | 4-tier enum already enforced via `@@unique([courseId, tier])` |
| Audience resolver | `lib/learning-admin/assignment-resolver.ts` | Extend for LOCATION/USERS; do not rewrite |
| Admin service | `services/learning-admin.service.ts` | Single orchestration point |
| Admin repository | `repositories/learning-admin.repository.ts` | Extend queries; add counter sync |
| Validations | `lib/validations/learning-admin.ts` | Extend schemas |
| Types | `types/learning-admin.ts` | Extend DTOs |
| Hooks | `hooks/use-learning-admin.ts` | Extend; all panels already consume |
| RBAC permissions | `lib/rbac/permissions.ts` | Add missing keys; don't rename existing |
| Permission matrix | `lib/rbac/permission-matrix.ts` | Extend role grants |
| Screen registry | `lib/screens/screen-definitions.ts` | Add child screens if needed |
| Routes constants | `constants/routes.ts` | Already has admin learning routes |
| Notifications | `services/notification.service.ts` | Reuse `notify()` |
| Audit | `services/audit.service.ts` | Reuse `log()` |
| Seed courses | `prisma/seed-learning-admin-courses.ts` | Extend metadata fields after schema change |
| Enrollment bridge | `upsertEnrollment()` in repository | Links assignment → course player |
| LRS progress | `CourseProgressRecord`, `LearningEvent` | Sync assignment `progressPercent` from here |
| Certificates | `Certificate`, `CertificateTemplate` | Issue on assignment completion |

### 3.2 Do NOT Merge (Separate Domains)

| Table | Reason |
|-------|--------|
| `open_course_assignments` | External URL courses — different content model |
| `learning_resource_assignments` | Ad-hoc links — not structured levels |
| `course_enrollments` | Keep as player/enrollment bridge; assignments are the compliance record |
| `learning_roadmaps` | Career planning — orthogonal to mandatory assignment |

### 3.3 Refactor Targets (Not New Tables)

| Issue | Fix location |
|-------|--------------|
| Preview user list cap bug | `learning-admin.service.ts` line 216 — query users by ID set, not `listAssignableUsers()` |
| Stale batch counters | Add `syncBatchCounters(batchId)` in repository; call on progress/completion |
| Monolithic wizard | Extract components under `components/learning-admin/wizard/` |
| Orphan employee panel | Mount `AssignedCoursesPanel` on `/learning/my-courses` |

---

## 4. Required Schema Changes

See `docs/LMS_DATABASE_DESIGN.md` for full DDL plan. Summary:

### 4.1 Extend `courses`
- `business_function` (String?)
- `is_mandatory` (Boolean, default false)
- `certificate_enabled` (Boolean, default false) — course-level flag
- `prerequisite_rules` (Json?) — course-level rules
- `updated_by_id` (FK → users)

### 4.2 Extend `course_levels`
- `assessment_required` (Boolean)
- `prerequisite_level_id` (FK → course_levels, self-ref)
- `certificate_template_id` (FK → certificate_templates, optional)

### 4.3 Extend `course_assignment_batches`
- `assignment_name` (String?)
- `assigned_users` (Int, default 0)
- `skipped_users` (Int, default 0)
- `rules` (Json?) — reminder schedule, auto-next-level, allow retake, escalation days, etc.

### 4.4 Extend `course_assignment_users`
- `score` (Int?)
- `certificate_issued_at` (DateTime?)
- `exempted_at` / `exempted_by_id` / `exempt_reason`
- Partial unique index: `(user_id, course_level_id) WHERE status IN active statuses`

### 4.5 Extend enums
- `AssignmentTargetType`: add `USERS`, `DEPARTMENTS`, `LOCATION` (or use `target_ids Json` for multi-select)
- `CourseAssignmentStatus`: add `FAILED`, `EXEMPTED`

### 4.6 New table (optional — location audience)
- `locations` (id, name, code, parent_id) + `users.location_id` — **only if Location is a first-class org dimension**

Alternative for LOCATION without new table: derive from `Department.code` prefix or `SystemSetting` location map.

### 4.7 New table (assignment rules audit trail — optional)
- `course_assignment_reminders` (batch_id, sent_at, sent_by, recipient_count) — for reminder history UI

---

## 5. Required API Changes

See `docs/LMS_API_CONTRACTS.md`. Summary:

| Priority | API | Action |
|----------|-----|--------|
| P0 | `POST .../assignments/preview` | Extend input: `targetIds[]`, `rules`; fix user resolution |
| P0 | `POST .../assignments` | Transactional create; store `skippedUsers`; return full preview echo |
| P0 | `GET .../courses` + POST/PATCH | Course CRUD (create, edit, archive) |
| P1 | `POST .../assignments/[id]/extend-due-date` | Expose existing service capability |
| P1 | `POST .../assignments/[id]/exempt/[userId]` | Exempt user from batch |
| P1 | `GET .../reports/export` | CSV/PDF export |
| P1 | `GET /api/learning/my-assignments` | Add certificate URL, deep link assignment id |
| P2 | Cron/worker: overdue sync + escalation notifications | Background job |
| P2 | `POST .../assignments/[id]/reassign` | Reassign failed/overdue users |

---

## 6. Required UI Changes

See `docs/LMS_IMPLEMENTATION_PLAN.md`. Summary:

| Page | Action |
|------|--------|
| `/admin/learning` | Add heatmap, escalation queue, trend chart, department risk KPI |
| `/admin/learning/courses` | Course grid cards, preview drawer, create/edit/archive dialogs |
| `/admin/learning/assignments/new` | Decompose wizard; add rules step; prerequisite warnings; sticky summary panel |
| `/admin/learning/assignments` | Tab filters, pagination, export actions |
| `/admin/learning/assignments/[id]` | Extend due date, exempt, audit timeline, reminder history |
| `/admin/learning/reports` | Wire export API |
| `/learning/my-courses` | **New route** — mount `AssignedCoursesPanel` |
| `/learning/course/[assignmentId]` | **New route** — assignment-scoped player entry |
| `/learning/certificates` | Employee certificate gallery (may reuse `/certifications`) |

Extract components: `LearningKpiCard`, `CourseLevelCard`, `AudienceSelector`, `AssignmentSummaryPanel`, `AssignmentRiskWarnings`, `AuditTimeline`, etc.

---

## 7. Required RBAC Changes

See `docs/LMS_RBAC_AND_SECURITY.md`. Summary:

Add permissions (some requested keys differ from existing naming — map carefully):

| Requested | Existing equivalent | Action |
|-----------|---------------------|--------|
| `learning.courses.view` | ✅ exists | — |
| `learning.courses.create` | use `learning.courses.manage` | alias or split |
| `learning.courses.update` | use `learning.courses.manage` | alias or split |
| `learning.courses.archive` | use `learning.courses.manage` | alias or split |
| `learning.levels.manage` | use `learning.courses.manage` | alias or split |
| `learning.assignments.*` | ✅ mostly exists | add `learning.assignments.remind` |
| `learning.analytics.view` | use `learning.progress.view` | alias or add |
| `learning.certificates.issue` | use `certificates.manage` | cross-module link |

Add screen registry entries for sub-routes if RBAC-gating individual admin pages.

---

## 8. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Duplicate table creation** | High | Reuse `CourseAssignmentBatch`/`CourseAssignmentUser`; document parallel systems |
| **Breaking existing learning module** | High | Feature-flag schema migrations; never alter `OpenCourse*` or LRS tables |
| **RBAC mismatch** | Medium | Permission + role slug dual gate confuses admins; unify on permissions only |
| **Route/sidebar inconsistency** | Medium | Single `admin-learning` sidebar entry hides sub-routes; add nav tabs (already in layout) |
| **Data migration** | Low | Additive columns only; backfill counters via script |
| **Test coverage** | High | Only 3 unit tests; integration tests needed before production |
| **Preview user cap bug** | High | Org-wide assign may silently drop users beyond 200 |
| **Non-transactional create** | Medium | Partial batch on failure leaves orphan batch row |
| **Progress desync** | Medium | Assignment `progressPercent` not updated from course player |
| **Scope creep from user note** | Medium | "Do not affect other services" — implement behind `/admin/learning` and `/learning/my-courses` only |

---

## 9. Implementation Plan (Phases)

See `docs/LMS_IMPLEMENTATION_PLAN.md` for detailed phase breakdown.

| Phase | Scope |
|-------|-------|
| 1 — Database | Additive migrations, enums, indexes |
| 2 — Seed | Extend 20 courses with new metadata fields |
| 3 — Services | Fix preview bug, transactional create, counter sync, rules engine |
| 4 — APIs | CRUD courses, exempt, export, extend-due-date |
| 5 — UI | Wizard decomposition, My Learning page, dashboard polish |
| 6 — RBAC | New permissions, screen entries, route guards |
| 7 — Notifications | Overdue cron, manager escalation, certificate issued |
| 8 — Reports | CSV/PDF export |
| 9 — Tests | Full acceptance test matrix |

---

## 10. Acceptance Criteria

### Assignment engine
- [ ] Admin can preview assignment impact before confirm; frontend never computes final count
- [ ] Duplicate active assignments blocked (app + DB constraint)
- [ ] Inactive users skipped and counted in `skippedUsers`
- [ ] Prerequisite warnings shown in UI; block mode enforced server-side
- [ ] Preview count === created assignment count (integration test)
- [ ] All audience types resolve correctly (USER, DEPARTMENT, TEAM, ROLE, ORGANIZATION)
- [ ] Assignment create is atomic (batch + users in transaction)
- [ ] Audit log + notification on every assignment action

### Catalog
- [ ] 20+ active courses with 4 levels each (seed verified)
- [ ] Admin can create, edit, archive courses via API + UI
- [ ] Inactive courses cannot be assigned

### Employee experience
- [ ] Employee sees only assigned courses on My Learning
- [ ] Progress, due date, status, level badge displayed
- [ ] Certificate shown when completed and enabled

### Admin analytics
- [ ] Dashboard KPIs accurate (counters maintained)
- [ ] Department progress, overdue queue, course analytics functional
- [ ] Export CSV/PDF works with RBAC gate

### Security
- [ ] Every admin API checks RBAC
- [ ] Non-admin blocked from assignment APIs (test)
- [ ] Screen access respects permissions

### Quality
- [ ] Full test plan in `docs/LMS_TEST_PLAN.md` passes
- [ ] No mock-only UI on admin assignment flows
- [ ] Existing open-course and LRS modules unaffected

---

## Appendix A — File Inventory

```
prisma/schema.prisma                          # Source of truth
prisma/seed-learning-admin-courses.ts         # 20 enterprise courses
lib/learning-admin/assignment-resolver.ts     # Audience resolution
lib/learning-admin/assignment-policy.ts       # Policy banner rules
services/learning-admin.service.ts            # Business logic
repositories/learning-admin.repository.ts     # Data access
hooks/use-learning-admin.ts                   # React Query hooks
components/learning-admin/                    # Admin UI (15+ components)
app/api/admin/learning/                       # 23 API routes
app/(dashboard)/admin/learning/             # 11 page routes
types/learning-admin.ts                       # DTOs
types/learning-lrs.ts                         # LRS types (separate)
__tests__/learning-admin/                     # Tests (minimal)
```

## Appendix B — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin UI (/admin/learning)                   │
│  Dashboard │ Catalog │ Wizard │ Assignments │ Progress │ Reports│
└────────────────────────────┬────────────────────────────────────┘
                             │ hooks/use-learning-admin.ts
┌────────────────────────────▼────────────────────────────────────┐
│              app/api/admin/learning/*  (RBAC middleware)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              services/learning-admin.service.ts                    │
│   previewAssignment() ──► assignment-resolver.ts                   │
│   createAssignment()  ──► repository + notification + audit        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│         repositories/learning-admin.repository.ts                │
│   CourseAssignmentBatch ◄──► CourseAssignmentUser                  │
│   Course / CourseLevel / User / Department / Team / Role           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Employee: /api/learning/my-assignments → course player (/courses) │
│  LRS: learning_events → course_progress → sync assignment %        │
└─────────────────────────────────────────────────────────────────┘
```
