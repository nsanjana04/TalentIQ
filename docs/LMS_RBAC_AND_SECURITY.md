# TalentIQ Learning Intelligence — RBAC & Security

**Document version:** 1.0  
**Date:** 2026-06-24  
**Prerequisite:** `docs/LMS_ARCHITECTURE_ANALYSIS.md`

---

## Security Model Overview

TalentIQ uses a **three-layer access model** for the Learning Intelligence module:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Authentication (session / JWT)                  │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Permission check (requirePermission middleware) │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Screen registry (sidebar + route visibility)    │
└─────────────────────────────────────────────────────────┘
```

Additionally, assignment **create** enforces a **role slug gate** (`isLearningManagerRole`) — this is a known inconsistency documented below.

---

## Current Permission Keys

From `lib/rbac/permissions.ts`:

| Constant | Key | Module |
|----------|-----|--------|
| `LEARNING_ENROLL` | `learning.enroll` | learning |
| `LEARNING_ASSIGN` | `learning.assign` | learning |
| `LEARNING_TEAM_VIEW` | `learning.team.view` | learning |
| `LEARNING_COURSES_VIEW` | `learning.courses.view` | learning |
| `LEARNING_COURSES_MANAGE` | `learning.courses.manage` | learning |
| `LEARNING_ASSIGNMENTS_VIEW` | `learning.assignments.view` | learning |
| `LEARNING_ASSIGNMENTS_CREATE` | `learning.assignments.create` | learning |
| `LEARNING_ASSIGNMENTS_UPDATE` | `learning.assignments.update` | learning |
| `LEARNING_ASSIGNMENTS_CANCEL` | `learning.assignments.cancel` | learning |
| `LEARNING_PROGRESS_VIEW` | `learning.progress.view` | learning |
| `LEARNING_REPORTS_EXPORT` | `learning.reports.export` | learning |

Related cross-module permissions:
| Key | Used for |
|-----|----------|
| `courses.view` | Employee learning access |
| `courses.manage` | Legacy admin course access (fallback on several APIs) |
| `certificates.manage` | Certificate issuance |
| `certificates.self.view` | Employee own certificates |
| `auditlogs.view` | Audit timeline on assignment detail |

---

## Requested vs Existing Permission Mapping

The product spec lists granular permissions. Map to implementation:

| Spec permission | Implementation | Action |
|-----------------|----------------|--------|
| `learning.courses.view` | ✅ `LEARNING_COURSES_VIEW` | — |
| `learning.courses.create` | `LEARNING_COURSES_MANAGE` | Split or alias |
| `learning.courses.update` | `LEARNING_COURSES_MANAGE` | Split or alias |
| `learning.courses.archive` | `LEARNING_COURSES_MANAGE` | Split or alias |
| `learning.levels.manage` | `LEARNING_COURSES_MANAGE` | Split or alias |
| `learning.assignments.view` | ✅ exists | — |
| `learning.assignments.create` | ✅ exists | — |
| `learning.assignments.update` | ✅ exists | — |
| `learning.assignments.cancel` | ✅ exists | — |
| `learning.assignments.remind` | ❌ missing | **Add** or use `update` |
| `learning.progress.view` | ✅ exists | — |
| `learning.analytics.view` | ❌ missing | **Add** or alias to `progress.view` |
| `learning.reports.export` | ✅ exists | — |
| `learning.certificates.issue` | `certificates.manage` | Cross-module |

### Recommended additions to `permissions.ts`

```typescript
LEARNING_ASSIGNMENTS_REMIND: "learning.assignments.remind",
LEARNING_ANALYTICS_VIEW: "learning.analytics.view",
LEARNING_COURSES_CREATE: "learning.courses.create",
LEARNING_COURSES_UPDATE: "learning.courses.update",
LEARNING_COURSES_ARCHIVE: "learning.courses.archive",
LEARNING_LEVELS_MANAGE: "learning.levels.manage",
LEARNING_CERTIFICATES_ISSUE: "learning.certificates.issue",
```

**Decision for implementation:** Add new keys AND grant them alongside existing `manage` permissions in `permission-matrix.ts` to avoid breaking existing role configs.

---

## Role Permission Matrix (Current)

From `lib/rbac/permission-matrix.ts` — `LEARNING_ADMIN_PERMISSIONS`:

Granted to: **ADMIN**, **HR_MANAGER**, **DEPARTMENT_MANAGER**, **TEAM_LEADER**

```
learning.courses.view
learning.courses.manage
learning.assignments.view
learning.assignments.create
learning.assignments.update
learning.assignments.cancel
learning.progress.view
learning.reports.export
```

### Employee role
```
learning.enroll
courses.view
certificates.self.view
assessments.take
```

### Instructor role
Employee + `LEARNING_ADMIN_PERMISSIONS` (via INSTRUCTOR_EXTRA screens)

### CEO role
No learning admin permissions by default — executive analytics only

---

## Learning Manager Role Gate

File: `constants/learning-manager-roles.ts`

```typescript
export const LEARNING_MANAGER_ROLES = [
  RoleSlug.ADMIN,
  RoleSlug.HR_MANAGER,
  RoleSlug.DEPARTMENT_MANAGER,
  RoleSlug.TEAM_LEADER,
] as const;
```

**Note:** INSTRUCTOR has admin-learning screen access but is NOT in `LEARNING_MANAGER_ROLES` — **bug/inconsistency**.

### Recommendation
Remove role slug gate; rely solely on `learning.assignments.create` permission. INSTRUCTOR role should receive that permission if they can access admin learning.

---

## Screen Registry

From `lib/screens/screen-definitions.ts`:

| Screen key | Route | Required permission |
|------------|-------|---------------------|
| `learning-pathways` | `/learning` | `learning.view` |
| `courses` | `/courses` | `courses.view` |
| `certifications` | `/certifications` | `certificates.view` |
| `admin-learning` | `/admin/learning` | `learning.assignments.create` |

### Screens to add (proposed)

| Screen key | Route | Permission | Sidebar |
|------------|-------|------------|---------|
| `learning-my-courses` | `/learning/my-courses` | `learning.enroll` | Yes (employee) |
| `admin-learning-courses` | `/admin/learning/courses` | `learning.courses.view` | No (sub-nav) |
| `admin-learning-assignments` | `/admin/learning/assignments` | `learning.assignments.view` | No (sub-nav) |

Sub-routes under `/admin/learning/*` are protected by layout + API permissions; separate sidebar entries optional.

---

## Route Permission Guards

From `lib/rbac/routePermissions.ts`:

```typescript
{ path: ROUTES.LEARNING, permissions: [COURSES_VIEW, LEARNING_ENROLL], mode: "any" }
{ path: ROUTES.ADMIN_LEARNING, permissions: [LEARNING_COURSES_VIEW, LEARNING_COURSES_MANAGE, COURSES_MANAGE], mode: "any" }
```

### Routes to add guards

| Path | Permissions |
|------|-------------|
| `/learning/my-courses` | `learning.enroll` OR `courses.view` |
| `/admin/learning/assignments/new` | `learning.assignments.create` |
| `/admin/learning/reports` | `learning.reports.export` |

---

## API Permission Matrix

| Endpoint | Required permission(s) | Mode |
|----------|------------------------|------|
| POST preview | `learning.assignments.create`, `courses.manage` | any |
| POST create assignment | `learning.assignments.create` + role gate | all |
| GET list assignments | `view`, `create`, `courses.manage` | any |
| PATCH assignment | `learning.assignments.update` | — |
| POST remind | `learning.assignments.update` (→ `remind`) | — |
| POST cancel | `learning.assignments.cancel` | — |
| GET dashboard | `progress.view`, `courses.view`, `courses.manage` | any |
| GET courses | `courses.view`, `courses.manage` | any |
| POST create course | `courses.manage` (→ `courses.create`) | — |
| GET my-assignments | authenticated self | — |
| GET export | `learning.reports.export` | — |

---

## Security Rules (Business Logic)

These MUST be enforced server-side — never trust frontend:

| Rule | Enforcement location |
|------|---------------------|
| No inactive course assignment | `previewAssignment` — checks `adminStatus === ACTIVE` |
| No inactive user assignment | `assignment-resolver.ts` — filters `isActive: true` |
| Duplicate active assignments blocked | `findDuplicateAssignments` + DB partial unique index |
| Prerequisite block | `filterBlockedByPrerequisite` when `unlockRule === BLOCK_UNTIL_PREVIOUS_COMPLETE` |
| Preview before create | `createAssignment` re-runs preview internally |
| Employee sees only own assignments | `getMyAssignments(userId)` scoped to session user |
| Admin cannot assign to deleted users | Resolver checks `deletedAt: null` |
| Audit on all admin actions | `auditService.log()` in service layer |
| Notifications on assign/remind | `notificationService.notify()` |

---

## Data Access Scoping

| Actor | Scope |
|-------|-------|
| Employee | Own `CourseAssignmentUser` rows only |
| Team Leader | Assign to own team members (recommended future scope) |
| Department Manager | Assign within department (recommended future scope) |
| HR Manager / Admin | Organization-wide |

**Current state:** No row-level scoping — any learning manager can assign to any audience. 

**Recommendation (Phase 7b):** Add optional scope check:
- `DEPARTMENT_MANAGER` → can only target own department subtree
- `TEAM_LEADER` → can only target own team

Not in initial implementation unless required.

---

## Audit Log Requirements

Every action must call `auditService.log()`:

| Action | AuditAction | entityType | metadata |
|--------|-------------|------------|----------|
| Course created | CREATE | Course | `{ title, slug }` |
| Course updated | UPDATE | Course | changed fields |
| Course archived | UPDATE | Course | `{ adminStatus: INACTIVE }` |
| Assignment previewed | EXPORT | CourseAssignmentBatch | `{ courseId, targetType, finalCount }` |
| Assignment created | CREATE | CourseAssignmentBatch | `{ userCount, targetType }` |
| Assignment cancelled | UPDATE | CourseAssignmentBatch | `{ status: CANCELLED }` |
| Due date extended | UPDATE | CourseAssignmentBatch | `{ dueDate, previousDueDate }` |
| Reminder sent | UPDATE | CourseAssignmentBatch | `{ action: remind, recipientCount }` |
| User exempted | UPDATE | CourseAssignmentUser | `{ userId, reason }` |
| Certificate issued | CREATE | Certificate | `{ userAssignmentId, courseId }` |
| Permission denied | PERMISSION_DENIED | — | `{ route, permission }` |

Preview audit is optional but recommended for compliance (SOC2/ISO audit trail).

---

## Notification Security

- Notifications contain no PII beyond user name in message
- `actionUrl` must be relative paths only (no external URLs)
- Deep links validated against user's assignment ownership before player access

---

## Input Validation Security

| Vector | Mitigation |
|--------|------------|
| SQL injection | Prisma parameterized queries |
| Mass assignment | Zod schemas whitelist fields |
| Org-wide assign DoS | Rate limit POST assignments; paginate user creation in chunks |
| IDOR on assignment detail | Verify admin permission; employee routes scoped to session |
| XSS in course description | Sanitize HTML on render (existing pattern) |

---

## Secrets & Configuration

No LMS-specific secrets. Uses:
- `DATABASE_URL` — PostgreSQL
- Existing session/JWT config

Optional future:
- `LMS_REMINDER_CRON_SECRET` — for scheduled job auth
- `LMS_EXPORT_MAX_ROWS` — env cap for export (default 10000)

---

## RBAC Seed Changes (Implementation Checklist)

When implementing, update in order:

1. `lib/rbac/permissions.ts` — add new permission constants + labels
2. `prisma/seed.ts` — upsert Permission records
3. `lib/rbac/permission-matrix.ts` — grant to roles
4. `lib/screens/screen-definitions.ts` — add screens
5. `lib/screens/screen-permissions.ts` — add aliases
6. `lib/rbac/routePermissions.ts` — add route guards
7. Re-run screen seed / role permission sync

---

## Compliance Considerations

| Requirement | TalentIQ approach |
|-------------|-----------------|
| SOX audit trail | AuditLog table + assignment actions |
| GDPR data minimization | Preview returns only necessary user fields |
| Right to erasure | User soft-delete; assignments retained for compliance (anonymize option TBD) |
| Mandatory training proof | CourseAssignmentUser + Certificate + AuditLog |

---

## Threat Model Summary

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Unauthorized assignment create | Medium | High | RBAC + role gate |
| Duplicate assignment race | Low | Medium | DB partial unique index |
| Preview count manipulation | Low | High | Server-only calculation |
| Employee accessing others' assignments | Low | High | Session-scoped queries |
| Mass notification spam | Low | Medium | Rate limits on remind |
| Export data exfiltration | Medium | Medium | `learning.reports.export` permission |

---

## Testing RBAC

See `docs/LMS_TEST_PLAN.md` — sections:
- Non-admin blocked from assignment APIs
- Employee cannot access admin routes
- Permission denied returns 403 with audit log
- Screen hidden when permission missing

Reference existing matrix: `docs/RBAC_TEST_MATRIX.md` — extend with learning admin rows.
