# TalentIQ Learning Intelligence — Test Plan

**Document version:** 1.0  
**Date:** 2026-06-24  
**Prerequisite:** `docs/LMS_ARCHITECTURE_ANALYSIS.md`, `docs/LMS_API_CONTRACTS.md`  
**Gate:** Execute after `IMPLEMENT LMS MODULE` approval

---

## Purpose

Validate the Learning Intelligence / LMS assignment module to enterprise production standards. Tests cover assignment resolution, RBAC, preview/create parity, employee experience, overdue lifecycle, notifications, audit logs, and dashboard accuracy.

**Current baseline:** 3 unit tests in `__tests__/learning-admin/assignment.service.test.ts`. This plan defines the full target suite.

---

## Test Strategy

| Layer | Tool | Location |
|-------|------|----------|
| Unit — resolver | Vitest | `__tests__/learning-admin/assignment-resolver.test.ts` |
| Unit — service | Vitest (mocked repo) | `__tests__/learning-admin/assignment.service.test.ts` |
| Unit — repository | Vitest + test DB or Prisma mock | `__tests__/learning-admin/assignment.repository.test.ts` |
| Integration — API | Vitest + supertest or `fetch` against test server | `__tests__/api/admin/learning/*.test.ts` |
| Integration — employee API | Vitest | `__tests__/api/learning/my-assignments.test.ts` |
| E2E (optional) | Playwright | `e2e/learning-admin.spec.ts` |

### Test data prerequisites

- Seed 20 courses × 4 levels (`prisma/seed-learning-admin-courses.ts`)
- At least 3 departments, 2 teams, 5+ active users, 1 inactive user
- Roles: ADMIN, HR_MANAGER, EMPLOYEE with known credentials (`docs/SEED_CREDENTIALS.md`)
- Optional: demo assignment batches for regression (dev seed only)

### Fixtures

```typescript
// __tests__/fixtures/learning-admin.ts
export const FIXTURE_COURSE_ID = "...";      // Cyber Security Fundamentals
export const FIXTURE_LEVEL_BASIC_ID = "...";
export const FIXTURE_DEPT_ENGINEERING_ID = "...";
export const FIXTURE_INACTIVE_USER_ID = "...";
export const FIXTURE_ADMIN_SESSION = { userId: "...", role: "ADMIN" };
export const FIXTURE_EMPLOYEE_SESSION = { userId: "...", role: "EMPLOYEE" };
```

---

## Acceptance Test Matrix

Each row maps to product acceptance criteria. **Priority:** P0 = release blocker, P1 = should-have, P2 = nice-to-have.

### Assignment engine

| ID | Test case | Priority | Type | Expected result |
|----|-----------|----------|------|-----------------|
| A-01 | Assign course to single user | P0 | Integration | Batch created; 1 `CourseAssignmentUser`; notification sent |
| A-02 | Assign course to department | P0 | Integration | All active dept users assigned; inactive skipped |
| A-03 | Assign course to team | P0 | Integration | Team members assigned |
| A-04 | Assign course to role (RBAC role) | P0 | Integration | Users with role assigned |
| A-05 | Assign course to organization | P0 | Integration | All active org users assigned |
| A-06 | Duplicate assignment blocked | P0 | Unit + Integration | Active assignment exists → user in `duplicateUsers`; not re-created |
| A-07 | Inactive users skipped | P0 | Unit + Integration | Inactive in `inactiveUsersSkipped`; not in `finalAssignableUsers` |
| A-08 | Prerequisite warning shown | P0 | Unit | INTERMEDIATE without BASIC complete → warning message |
| A-09 | Prerequisite block enforced | P0 | Unit + Integration | `BLOCK_UNTIL_PREVIOUS_COMPLETE` → user excluded from final list |
| A-10 | Preview count matches create count | P0 | Integration | `finalAssignableUsers.length` === rows created |
| A-11 | Inactive course cannot be assigned | P0 | Integration | 400 BAD_REQUEST on preview/create |
| A-12 | Create is transactional | P0 | Integration | Failure mid-create rolls back batch + users |
| A-13 | Assign to multiple users (USERS) | P1 | Integration | `targetIds[]` resolves union, deduped |
| A-14 | Assign to multiple departments | P1 | Integration | `DEPARTMENTS` or `targetIds[]` |
| A-15 | Assign to location | P2 | Integration | LOCATION audience resolves correct users |
| A-16 | Rules persisted on batch | P1 | Integration | `rules` JSON stored and returned on detail |
| A-17 | Skipped users counted on batch | P1 | Integration | `skippedUsers` = inactive + duplicate + blocked |

### RBAC & security

| ID | Test case | Priority | Type | Expected result |
|----|-----------|----------|------|-----------------|
| R-01 | Non-admin blocked from create | P0 | Integration | EMPLOYEE → 403 on POST assignments |
| R-02 | Non-admin blocked from preview | P0 | Integration | EMPLOYEE → 403 on POST preview |
| R-03 | View assignments requires permission | P0 | Integration | Missing `learning.assignments.view` → 403 |
| R-04 | Cancel requires cancel permission | P1 | Integration | Missing `learning.assignments.cancel` → 403 |
| R-05 | Export requires export permission | P1 | Integration | Missing `learning.reports.export` → 403 |
| R-06 | Employee cannot access admin assignment detail | P0 | Integration | 403 on GET `/api/admin/learning/assignments/[id]` |
| R-07 | Employee my-assignments scoped to self | P0 | Integration | Returns only session user's rows |
| R-08 | IDOR on my-assignment detail | P1 | Integration | Other user's assignmentId → 403/404 |

### Employee experience

| ID | Test case | Priority | Type | Expected result |
|----|-----------|----------|------|-----------------|
| E-01 | Employee sees assigned course | P0 | Integration | GET my-assignments includes new assignment |
| E-02 | Employee does not see unassigned courses | P0 | Integration | Courses not in assignment list (unless open enrollment) |
| E-03 | Assignment shows level, due date, status | P0 | Integration | DTO fields populated |
| E-04 | Progress percent returned | P1 | Integration | Matches `CourseAssignmentUser.progressPercent` |
| E-05 | Certificate badge when completed | P1 | Integration | `certificate` object present when issued |
| E-06 | Continue/deep link opens player | P1 | E2E | `/learning/course/[assignmentId]` loads |

### Admin lifecycle

| ID | Test case | Priority | Type | Expected result |
|----|-----------|----------|------|-----------------|
| L-01 | Overdue status updates | P0 | Unit + Integration | Past due + NOT_STARTED → OVERDUE after sync |
| L-02 | Cancellation works | P0 | Integration | Batch + active user rows → CANCELLED |
| L-03 | Reminder creates notification | P0 | Integration | `notificationService.notify` called per pending user |
| L-04 | Extend due date updates all users | P1 | Integration | Batch + user `dueDate` updated |
| L-05 | Exempt user | P1 | Integration | User status → EXEMPTED; audit logged |
| L-06 | Reassign course | P2 | Integration | New user assignment row created |
| L-07 | Course CRUD — create | P1 | Integration | Course + 4 levels auto-created |
| L-08 | Course archive blocked with active assignments | P1 | Integration | 409 CONFLICT |

### Analytics & reports

| ID | Test case | Priority | Type | Expected result |
|----|-----------|----------|------|-----------------|
| D-01 | Dashboard metrics update after assignment | P0 | Integration | `totalAssignments` increments |
| D-02 | Dashboard completion rate accurate | P1 | Integration | Matches completed/total ratio |
| D-03 | Department progress reflects completions | P1 | Integration | Dept row `completed` increments |
| D-04 | Course analytics endpoint | P1 | Integration | Per-course completion rate correct |
| D-05 | CSV export assignments | P1 | Integration | Valid CSV, correct row count |
| D-06 | PDF export departments | P2 | Integration | File download, 200 status |

### Notifications & audit

| ID | Test case | Priority | Type | Expected result |
|----|-----------|----------|------|-----------------|
| N-01 | Assignment creates notification per user | P0 | Unit | `notify` called N times |
| N-02 | Notification deep link valid | P1 | Unit | `actionUrl` points to assignment route |
| N-03 | Audit on assignment create | P0 | Unit | `auditService.log` CREATE on batch |
| N-04 | Audit on cancel | P1 | Unit | UPDATE with CANCELLED |
| N-05 | Audit on remind | P1 | Unit | UPDATE with action remind |
| N-06 | Audit on exempt | P1 | Unit | UPDATE on CourseAssignmentUser |
| N-07 | Manager escalation notification | P2 | Integration | Sent after N days overdue |
| N-08 | Certificate issued notification | P2 | Integration | SUCCESS type on completion |

---

## Unit Tests — Assignment Resolver

File: `__tests__/learning-admin/assignment-resolver.test.ts`

```typescript
describe("resolveTargetUsers", () => {
  it("resolves USER target to single active user");
  it("returns inactive user in inactiveSkipped, empty userIds");
  it("resolves DEPARTMENT to all active dept members");
  it("resolves TEAM to team members only");
  it("resolves ROLE to users with RBAC role");
  it("resolves ORGANIZATION to all active users");
  it("throws NOT_FOUND for invalid targetId");
  it("deduplicates when targetIds overlap (multi-select)");
});

describe("findDuplicateAssignments", () => {
  it("returns users with NOT_STARTED assignment on same level");
  it("returns users with IN_PROGRESS assignment");
  it("returns users with OVERDUE assignment");
  it("ignores COMPLETED assignments");
  it("ignores CANCELLED assignments");
});

describe("findPrerequisiteWarnings", () => {
  it("returns empty for BASIC level");
  it("warns when previous level not completed");
  it("blocks when unlockRule is BLOCK_UNTIL_PREVIOUS_COMPLETE");
});

describe("filterBlockedByPrerequisite", () => {
  it("passes all users when unlockRule is null");
  it("removes blocked users when rule is BLOCK_UNTIL_PREVIOUS_COMPLETE");
});
```

---

## Unit Tests — Service Layer

File: `__tests__/learning-admin/assignment.service.test.ts` (extend existing)

```typescript
describe("previewAssignment", () => {
  it("rejects inactive course");
  it("uses findUsersByIds not listAssignableUsers (no 200 cap)");
  it("returns finalCount matching finalAssignableUsers.length");
  it("includes alreadyCompletedUsers when implemented");
});

describe("createAssignment", () => {
  it("blocks duplicate active assignments in preview");       // exists
  it("rejects when no eligible users");                      // exists
  it("rejects non-learning-manager");                        // exists
  it("creates batch with correct totalUsers");
  it("calls upsertEnrollment per user");
  it("logs audit CREATE");
  it("sends notification per assigned user");
  it("uses transactional repository method");
});

describe("remindAssignment", () => {
  it("notifies only NOT_STARTED, IN_PROGRESS, OVERDUE users");
  it("skips COMPLETED users");
});

describe("syncAssignmentProgress", () => {
  it("updates progressPercent from course player completion");
  it("sets COMPLETED when progress reaches 100");
  it("issues certificate when rules.certificateOnCompletion");
});
```

---

## Integration Tests — Admin API

File: `__tests__/api/admin/learning/assignments.test.ts`

### Setup pattern

```typescript
beforeAll(async () => {
  await seedTestLearningData();
  adminCookie = await loginAs("admin@talentiq.test");
  employeeCookie = await loginAs("employee@talentiq.test");
});

afterEach(async () => {
  await cleanupTestAssignments(); // delete batches created in test
});
```

### Critical path: preview → create parity

```typescript
it("A-10: preview count matches created assignment count", async () => {
  const previewBody = {
    courseId: FIXTURE_COURSE_ID,
    courseLevelId: FIXTURE_LEVEL_BASIC_ID,
    targetType: "DEPARTMENT",
    targetId: FIXTURE_DEPT_ENGINEERING_ID,
    dueDate: "2026-12-31",
  };

  const preview = await post("/api/admin/learning/assignments/preview", previewBody, adminCookie);
  expect(preview.status).toBe(200);
  const finalCount = preview.body.finalAssignableUsers.length;

  const create = await post("/api/admin/learning/assignments/preview", { ...previewBody, ... }, adminCookie);
  // fix: use POST /assignments not preview
  const created = await post("/api/admin/learning/assignments", previewBody, adminCookie);
  expect(created.status).toBe(201);
  expect(created.body.batch.userAssignments.length).toBe(finalCount);
});
```

### RBAC smoke

```typescript
it("R-01: employee cannot create assignment", async () => {
  const res = await post("/api/admin/learning/assignments", validBody, employeeCookie);
  expect(res.status).toBe(403);
});
```

---

## Integration Tests — Employee API

File: `__tests__/api/learning/my-assignments.test.ts`

```typescript
it("E-01: employee sees assigned course after admin assignment", async () => {
  await assignCourseToUser(adminCookie, FIXTURE_EMPLOYEE_ID, FIXTURE_LEVEL_BASIC_ID);
  const res = await get("/api/learning/my-assignments", employeeCookie);
  expect(res.body.some((a) => a.courseLevelId === FIXTURE_LEVEL_BASIC_ID)).toBe(true);
});

it("E-02: employee does not see unassigned courses", async () => {
  const res = await get("/api/learning/my-assignments", employeeCookie);
  const unassignedCourseIds = await getUnassignedCourseIds(FIXTURE_EMPLOYEE_ID);
  for (const a of res.body) {
    expect(unassignedCourseIds).not.toContain(a.courseId);
  }
});
```

---

## Overdue Lifecycle Test

File: `__tests__/learning-admin/overdue-lifecycle.test.ts`

```typescript
it("L-01: overdue status updates on sync", async () => {
  const assignment = await createAssignmentWithDueDate(yesterday);
  await learningAdminRepository.syncOverdueStatuses();
  const updated = await prisma.courseAssignmentUser.findUnique({ where: { id: assignment.id } });
  expect(updated?.status).toBe("OVERDUE");
});
```

---

## Dashboard Metrics Test

```typescript
it("D-01: dashboard totalAssignments increments", async () => {
  const before = await getDashboard(adminCookie);
  await createAssignment(/* dept with 3 users */);
  const after = await getDashboard(adminCookie);
  expect(after.body.totalAssignments).toBe(before.body.totalAssignments + 3);
});
```

---

## Seed Validation Tests

File: `__tests__/learning-admin/seed-validation.test.ts`

Run against seeded database (CI job with `db:seed`):

```typescript
it("seed has at least 20 active courses", async () => {
  const count = await prisma.course.count({ where: { adminStatus: "ACTIVE", deletedAt: null } });
  expect(count).toBeGreaterThanOrEqual(20);
});

it("each course has exactly 4 levels", async () => {
  const courses = await prisma.course.findMany({ where: { deletedAt: null }, select: { id: true } });
  for (const c of courses) {
    const levels = await prisma.courseLevel.count({ where: { courseId: c.id, deletedAt: null } });
    expect(levels).toBe(4);
  }
});

it("all four tiers present per course", async () => {
  const tiers = ["BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"];
  // ...
});
```

---

## UI Test Checklist (Manual / Playwright)

| Screen | Check |
|--------|-------|
| Assignment wizard step 3 | Preview count from API displayed; not computed client-side |
| Assignment wizard step 5 | Duplicate/inactive/prerequisite warnings visible |
| Assignment wizard | Cannot confirm without successful preview |
| Admin assignments table | Tabs filter correctly |
| Assignment detail | Remind, extend, cancel actions work |
| My Learning | Progress bar, status badge, due date |
| Command center | KPI cards match API values |
| Empty states | No assignments → friendly empty state |
| Error states | API failure → toast + retry |
| Loading | Skeleton shown during fetch |

---

## Regression — Do Not Break

After any LMS change, verify these unrelated modules still pass:

| Module | Smoke test |
|--------|------------|
| Open courses | GET `/api/learning/open-courses` returns data |
| LRS events | POST `/api/learning/lrs/events` records event |
| Learning roadmap | GET `/api/learning/roadmap` returns paths |
| Course player | GET `/api/courses/[id]/player` loads |
| Resource assignments | POST open-course assign still works |

---

## CI Pipeline

```yaml
# Recommended CI steps
- run: npm run db:seed
- run: npm run test -- __tests__/learning-admin
- run: npm run test -- __tests__/api/admin/learning
- run: npm run test -- __tests__/api/learning/my-assignments
```

### Coverage targets

| Area | Target |
|------|--------|
| `lib/learning-admin/assignment-resolver.ts` | ≥ 90% |
| `services/learning-admin.service.ts` | ≥ 85% |
| `repositories/learning-admin.repository.ts` | ≥ 80% |
| Admin assignment API routes | ≥ 80% |

---

## Test Execution Commands

```bash
# All learning admin tests
npm run test -- __tests__/learning-admin

# Single test file
npm run test -- __tests__/learning-admin/assignment.service.test.ts

# Watch mode during development
npm run test -- __tests__/learning-admin --watch

# With coverage
npm run test -- __tests__/learning-admin --coverage
```

---

## Sign-off Criteria

Module is **test-complete** when:

- [ ] All P0 tests pass (A-01 through A-12, R-01 through R-03, R-06, R-07, E-01, E-02, L-01 through L-03, N-01, N-03, D-01)
- [ ] Preview count === create count verified in CI
- [ ] No regression in open-course / LRS / roadmap smoke tests
- [ ] Seed validation confirms 20×4 courses
- [ ] RBAC matrix extended in `docs/RBAC_TEST_MATRIX.md`
- [ ] Manual UI checklist signed off for wizard + My Learning

---

## Known Gaps (Pre-Implementation)

| Gap | Test blocked until |
|-----|-------------------|
| USERS/DEPARTMENTS multi-audience | Schema + resolver extension |
| LOCATION audience | Location model or dept-prefix mapping |
| FAILED/EXEMPTED statuses | Enum migration |
| Export API | Route implementation |
| `/learning/my-courses` page | Page route created |
| Transactional create | Repository `$transaction` wrapper |
| Preview 200-user cap bug | `findUsersByIds` fix |

Tests marked P2 should not block initial release if P0/P1 pass.
