# TalentIQ Learning Intelligence — API Contracts

**Document version:** 1.0  
**Date:** 2026-06-24  
**Base URL:** `/api`  
**Auth:** Session cookie / Bearer token (existing TalentIQ auth middleware)

---

## Conventions

- All admin routes under `/api/admin/learning/*` require authenticated session.
- RBAC checked via `requirePermission()` — see `docs/LMS_RBAC_AND_SECURITY.md`.
- Errors: `{ "error": { "code": string, "message": string } }` via `AppError`.
- Dates: ISO 8601 strings in JSON; `YYYY-MM-DD` accepted for due dates.
- Pagination: `{ page, pageSize, total, items }` where applicable.

---

## Existing APIs (Current Contract)

### POST `/api/admin/learning/assignments/preview`

**Permission:** `learning.assignments.create` OR `courses.manage`

**Request:**
```json
{
  "courseId": "clx...",
  "courseLevelId": "clx...",
  "targetType": "DEPARTMENT",
  "targetId": "clx..."
}
```

**Response 200:**
```json
{
  "targetType": "DEPARTMENT",
  "targetLabel": "Engineering",
  "usersAffected": 42,
  "duplicateUsers": [{ "id": "...", "firstName": "...", "lastName": "...", "email": "...", "departmentName": "..." }],
  "inactiveUsersSkipped": [],
  "prerequisiteWarnings": [{ "userId": "...", "userName": "...", "message": "..." }],
  "finalAssignableUsers": [{ "id": "...", "firstName": "...", "lastName": "...", "email": "...", "departmentName": "..." }]
}
```

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | Invalid body / inactive course |
| 403 | Missing permission |
| 404 | Course level not found |

---

### POST `/api/admin/learning/assignments`

**Permission:** `learning.assignments.create`  
**Role gate:** Learning manager role (ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, TEAM_LEADER, INSTRUCTOR)

**Request:**
```json
{
  "courseId": "clx...",
  "courseLevelId": "clx...",
  "targetType": "TEAM",
  "targetId": "clx...",
  "dueDate": "2026-09-30",
  "priority": "HIGH",
  "notes": "Q3 compliance push",
  "reminderSchedule": "7,3,1"
}
```

**Response 201:** `AssignmentBatchDetail` (see types below)

**Errors:**
| Code | Condition |
|------|-----------|
| 400 | No eligible users after validation |
| 403 | Non-learning-manager role |

---

### GET `/api/admin/learning/assignments`

**Permission:** `learning.assignments.view` OR `learning.assignments.create` OR `courses.manage`

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Default 1 |
| pageSize | number | Default 20, max 100 |
| courseId | string | Filter |
| courseLevelId | string | Filter |
| departmentId | string | Filter users in dept |
| userId | string | Filter |
| status | enum | Batch status |
| targetType | enum | Audience type |
| dueBefore | ISO date | |
| dueAfter | ISO date | |

**Response 200:**
```json
{
  "items": [/* AssignmentBatchSummary[] */],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

### GET `/api/admin/learning/assignments/[id]`

**Response 200:** `AssignmentBatchDetail`

---

### PATCH `/api/admin/learning/assignments/[id]`

**Permission:** `learning.assignments.update`

**Request (partial):**
```json
{
  "dueDate": "2026-10-15",
  "status": "CANCELLED",
  "notes": "Superseded by new batch",
  "priority": "NORMAL"
}
```

---

### POST `/api/admin/learning/assignments/[id]/remind`

**Permission:** `learning.assignments.update`

**Response 200:**
```json
{ "reminded": 15 }
```

---

### POST `/api/admin/learning/assignments/[id]/cancel`

**Permission:** `learning.assignments.cancel`

**Response 200:** `AssignmentBatchDetail` (cancelled)

---

### GET `/api/admin/learning/dashboard`

**Permission:** `learning.progress.view` OR `learning.courses.view` OR `courses.manage`

**Response 200:** `LearningAdminDashboard`

---

### GET `/api/admin/learning/courses`

**Query:** `search`, `category`, `status`, `page`, `pageSize`

**Response 200:**
```json
{
  "items": [/* AdminCourseSummary[] */],
  "total": 20,
  "page": 1,
  "pageSize": 20
}
```

---

### GET `/api/admin/learning/courses/[courseId]/levels`

**Response 200:** `AdminCourseLevel[]`

---

### GET `/api/admin/learning/assignable-users`

**Query:** `search`

**Response 200:** `AssignableUser[]` (max 200 today — to be removed)

---

### GET `/api/admin/learning/departments|teams|roles`

**Response 200:** `AssignableDepartment[]` | `AssignableTeam[]` | `AssignableRole[]`

---

### GET `/api/admin/learning/progress`

**Response 200:** `LearningProgressRow[]`

---

### GET `/api/admin/learning/department-progress`

**Response 200:** `DepartmentProgressRow[]`

---

### GET `/api/admin/learning/overdue`

**Response 200:** Overdue user assignment rows

---

### GET `/api/learning/my-assignments`

**Auth:** Any authenticated user (self-scoped)

**Response 200:** `MyCourseAssignment[]`

---

## Proposed APIs (To Implement)

### POST `/api/admin/learning/assignments/preview` — v2 Extension

**Additional request fields:**
```json
{
  "targetIds": ["clx...", "clx..."],
  "dueDate": "2026-09-30",
  "rules": {
    "allowRetake": true,
    "autoAssignNextLevel": false,
    "blockIfPrerequisiteMissing": true,
    "certificateOnCompletion": true,
    "notifyManager": true,
    "escalationDaysAfterOverdue": 7,
    "reminderSchedule": { "daysBeforeDue": [7, 3, 1], "sendOverdueDaily": false }
  }
}
```

**Additional response fields:**
```json
{
  "alreadyCompletedUsers": [{ "id": "...", "firstName": "...", "lastName": "...", "email": "...", "departmentName": "..." }],
  "finalCount": 38,
  "skippedCount": 4,
  "duplicateCount": 2,
  "inactiveCount": 1,
  "prerequisiteBlockedCount": 1,
  "estimatedImpact": {
    "totalLearningHours": 152,
    "certificateEligible": 38
  }
}
```

**Rules:**
- `finalCount` === `finalAssignableUsers.length` — frontend MUST display `finalCount` from API
- Frontend MUST NOT compute eligibility

---

### POST `/api/admin/learning/assignments` — v2 Extension

**Additional request fields:**
```json
{
  "assignmentName": "Q3 Security — Engineering",
  "targetIds": ["..."],
  "rules": { /* same as preview */ }
}
```

**Response 201:**
```json
{
  "batchId": "clx...",
  "assigned": 38,
  "skipped": 4,
  "duplicates": 2,
  "batch": { /* AssignmentBatchDetail */ }
}
```

**Idempotency (recommended):**
Header: `Idempotency-Key: <uuid>` — return existing batch if key seen within 24h.

---

### POST `/api/admin/learning/courses`

**Permission:** `learning.courses.manage`

**Request:**
```json
{
  "title": "New Course",
  "slug": "new-course",
  "description": "...",
  "category": "Security",
  "businessFunction": "IT",
  "skillsCovered": ["Security"],
  "durationMinutes": 240,
  "isMandatory": false,
  "certificateEnabled": true,
  "prerequisiteRules": null,
  "openEnrollment": false
}
```

**Response 201:** Course object + auto-created 4 levels (BASIC→EXPERT)

---

### PATCH `/api/admin/learning/courses/[courseId]`

**Permission:** `learning.courses.manage`

**Request:** Partial course fields + level updates optional

**Response 200:** Updated course

---

### POST `/api/admin/learning/courses/[courseId]/archive`

**Permission:** `learning.courses.manage`

**Effect:** Sets `adminStatus: INACTIVE`, `isPublished: false`

**Response 200:** `{ "id": "...", "adminStatus": "INACTIVE" }`

**Rule:** Cannot archive if active assignments exist (409 CONFLICT)

---

### PATCH `/api/admin/learning/courses/[courseId]/levels/[levelId]`

**Permission:** `learning.courses.manage`

**Request:**
```json
{
  "description": "...",
  "durationHours": 6,
  "passingScore": 75,
  "learningObjectives": ["..."],
  "unlockRule": "BLOCK_UNTIL_PREVIOUS_COMPLETE",
  "certificateEnabled": true,
  "assessmentRequired": true,
  "certificateTemplateId": "clx..."
}
```

---

### POST `/api/admin/learning/assignments/[id]/extend-due-date`

**Permission:** `learning.assignments.update`

**Request:**
```json
{
  "dueDate": "2026-11-01",
  "notifyUsers": true,
  "reason": "Project delay"
}
```

**Response 200:** `AssignmentBatchDetail`

**Side effects:** Updates batch + all non-completed user rows; notification if `notifyUsers`; audit log

---

### POST `/api/admin/learning/assignments/[id]/exempt/[userAssignmentId]`

**Permission:** `learning.assignments.update`

**Request:**
```json
{
  "reason": "Already certified externally"
}
```

**Response 200:**
```json
{
  "userAssignmentId": "...",
  "status": "EXEMPTED"
}
```

---

### POST `/api/admin/learning/assignments/[id]/reassign`

**Permission:** `learning.assignments.create`

**Request:**
```json
{
  "userIds": ["..."],
  "dueDate": "2026-12-01"
}
```

**Response 201:** New user assignment rows (same batch or new batch — TBD in implementation)

---

### GET `/api/admin/learning/analytics/courses`

**Permission:** `learning.progress.view`

**Response 200:**
```json
{
  "items": [
    {
      "courseId": "...",
      "courseTitle": "...",
      "levelId": "...",
      "levelTier": "BASIC",
      "assignedCount": 120,
      "completedCount": 85,
      "completionRate": 71,
      "averageDurationHours": 3.8,
      "failureRate": 2,
      "overdueCount": 8,
      "averageScore": 82
    }
  ]
}
```

---

### GET `/api/admin/learning/reports/export`

**Permission:** `learning.reports.export`

**Query:**
| Param | Values |
|-------|--------|
| report | `assignments`, `progress`, `departments`, `overdue` |
| format | `csv`, `pdf` |
| courseId | optional filter |
| departmentId | optional filter |
| dueBefore | optional |

**Response 200:** File download (`Content-Disposition: attachment`)

---

### GET `/api/learning/my-assignments/[id]`

**Auth:** Self only

**Response 200:**
```json
{
  "id": "...",
  "courseId": "...",
  "courseTitle": "...",
  "courseLevelId": "...",
  "levelName": "Basic",
  "levelTier": "BASIC",
  "dueDate": "...",
  "status": "IN_PROGRESS",
  "progressPercent": 45,
  "playerUrl": "/courses/clx...?assignmentId=...",
  "certificate": {
    "available": true,
    "issued": false,
    "downloadUrl": null
  },
  "rules": {
    "allowRetake": true
  }
}
```

---

## Type Definitions (Reference)

From `types/learning-admin.ts`:

```typescript
interface AssignmentBatchSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  courseLevelId: string;
  levelName: string;
  levelTier: CourseLevelTier;
  targetType: AssignmentTargetType;
  targetLabel: string;
  assignedByName: string;
  assignedAt: string;
  dueDate: string;
  status: CourseAssignmentStatus;
  totalUsers: number;
  completedUsers: number;
  overdueUsers: number;
  progressPercent: number;
}

interface AssignmentBatchDetail extends AssignmentBatchSummary {
  notes: string | null;
  priority: string | null;
  reminderSchedule: string | null;
  userAssignments: UserAssignmentSummary[];
}

interface LearningAdminDashboard {
  totalCourses: number;
  totalAssignments: number;
  completionRate: number;
  overdueAssignments: number;
  departmentCompletionRate: number;
  coursesByLevel: { level: string; count: number }[];
  assignmentsByAudience: { targetType: AssignmentTargetType; count: number }[];
  recentAssignments: AssignmentBatchSummary[];
}
```

---

## API ↔ Service Mapping

| Route | Service method |
|-------|----------------|
| POST preview | `learningAdminService.previewAssignment` |
| POST assignments | `learningAdminService.createAssignment` |
| GET assignments | `learningAdminService.listAssignments` |
| GET assignments/[id] | `learningAdminService.getAssignment` |
| PATCH assignments/[id] | `learningAdminService.updateAssignment` |
| POST remind | `learningAdminService.remindAssignment` |
| POST cancel | `learningAdminService.cancelAssignment` |
| GET dashboard | `learningAdminService.getDashboard` |
| GET progress | `learningAdminService.getLearningProgress` |
| GET department-progress | `learningAdminService.getDepartmentProgress` |
| GET overdue | `learningAdminService.getOverdueAssignments` |
| GET my-assignments | `learningAdminService.getMyAssignments` |

---

## Validation Schemas (Zod)

File: `lib/validations/learning-admin.ts`

### To add:

```typescript
export const assignmentRulesSchema = z.object({
  allowRetake: z.boolean().default(true),
  autoAssignNextLevel: z.boolean().default(false),
  blockIfPrerequisiteMissing: z.boolean().default(true),
  certificateOnCompletion: z.boolean().default(true),
  notifyManager: z.boolean().default(false),
  escalationDaysAfterOverdue: z.number().int().min(1).nullable().optional(),
  reminderSchedule: z.object({
    daysBeforeDue: z.array(z.number().int().min(0)).default([7, 3, 1]),
    sendOverdueDaily: z.boolean().default(false),
  }).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category: z.string().optional(),
  businessFunction: z.string().optional(),
  skillsCovered: z.array(z.string()).default([]),
  durationMinutes: z.number().int().positive().optional(),
  isMandatory: z.boolean().default(false),
  certificateEnabled: z.boolean().default(false),
  openEnrollment: z.boolean().default(false),
});
```

---

## Rate Limiting Recommendations

| Endpoint | Limit | Reason |
|----------|-------|--------|
| POST preview | 30/min per user | Expensive user resolution |
| POST assignments | 10/min per user | Prevents accidental org-wide spam |
| GET export | 5/min per user | Large file generation |

---

## Webhook Events (Future)

For integrations (Workday/SuccessFactors sync):

| Event | Payload |
|-------|---------|
| `learning.assignment.created` | batchId, userIds[], courseId, levelId, dueDate |
| `learning.assignment.completed` | userAssignmentId, userId, score, completedAt |
| `learning.certificate.issued` | certificateId, userId, courseId |

Not in initial scope — document for Phase 16.
