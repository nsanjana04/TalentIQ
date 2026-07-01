# TalentIQ Learning Intelligence — Database Design

**Document version:** 1.0  
**Date:** 2026-06-24  
**Status:** Design only — no migration created  
**Prerequisite:** `docs/LMS_ARCHITECTURE_ANALYSIS.md`

---

## Design Philosophy

1. **Extend existing tables** — `CourseAssignmentBatch` and `CourseAssignmentUser` already match the required parent-child model.
2. **Additive migrations only** — no breaking changes to existing learning, LRS, or open-course tables.
3. **Enums over strings** where status/target type is finite; **JSON** for flexible assignment rules.
4. **Partial unique indexes** for duplicate prevention at DB layer.
5. **Denormalized counters** on batch for dashboard performance — maintained by service, not triggers (initially).

---

## Current Schema (Baseline)

Already in `prisma/schema.prisma`:

```prisma
enum CourseLevelTier {
  BASIC
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum AssignmentTargetType {
  USER
  DEPARTMENT
  TEAM
  ROLE
  ORGANIZATION
}

enum CourseAssignmentStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  OVERDUE
  CANCELLED
}

model Course { ... }           // lines 821-860
model CourseLevel { ... }      // lines 989-1014
model CourseAssignmentBatch { ... }  // lines 1016-1046
model CourseAssignmentUser { ... }   // lines 1048-1077
```

---

## Proposed Enum Changes

### CourseAssignmentStatus — add values

```prisma
enum CourseAssignmentStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  OVERDUE
  FAILED        // NEW — assessment failed, max retakes exceeded
  CANCELLED
  EXEMPTED      // NEW — admin exempted user from requirement
}
```

**Migration note:** Existing rows unaffected. Update `ACTIVE_ASSIGNMENT_STATUSES` in `types/learning-admin.ts` to exclude `FAILED`, `EXEMPTED`, `CANCELLED`.

### AssignmentTargetType — add values

```prisma
enum AssignmentTargetType {
  USER
  USERS           // NEW — explicit multi-user (targetIds in JSON)
  DEPARTMENT
  DEPARTMENTS     // NEW — multi-department
  TEAM
  ROLE
  LOCATION        // NEW — requires Location model or department sub-type
  ORGANIZATION
}
```

**Alternative (preferred for flexibility):** Keep enum as-is; add `targetIds String[] @default([])` on batch for multi-select audiences. Single `targetId` remains for backward compatibility.

---

## Table: `courses` — Extensions

### Current fields
`id`, `title`, `slug`, `description`, `category`, `skillsCovered`, `adminStatus`, `instructorId`, `createdById`, `durationMinutes`, `isPublished`, `deletedAt`, timestamps

### Proposed new columns

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `business_function` | `String?` | null | e.g. "Engineering", "HR", "Sales" |
| `is_mandatory` | `Boolean` | `false` | Catalog flag; assignments can override |
| `certificate_enabled` | `Boolean` | `false` | Course-level cert availability |
| `prerequisite_rules` | `Json?` | null | `{ "requiredCourseIds": [], "requiredLevelTiers": {} }` |
| `updated_by_id` | `String?` | null | FK → `users.id` |
| `open_enrollment` | `Boolean` | `false` | If true, employees can self-enroll without assignment |

### Prisma diff (conceptual)

```prisma
model Course {
  // ... existing fields ...
  businessFunction   String?   @map("business_function")
  isMandatory        Boolean   @default(false) @map("is_mandatory")
  certificateEnabled Boolean   @default(false) @map("certificate_enabled")
  prerequisiteRules  Json?     @map("prerequisite_rules")
  openEnrollment     Boolean   @default(false) @map("open_enrollment")
  updatedById        String?   @map("updated_by_id")

  updatedBy User? @relation("CourseUpdater", fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([businessFunction])
  @@index([isMandatory])
}
```

---

## Table: `course_levels` — Extensions

### Current fields
`tier`, `name`, `description`, `durationHours`, `learningObjectives`, `passingScore`, `orderNumber`, `unlockRule`, `certificateEnabled`

### Proposed new columns

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `assessment_required` | `Boolean` | `false` | Level requires passing assessment |
| `prerequisite_level_id` | `String?` | null | Self-FK; explicit prior level (redundant with orderNumber but clearer) |
| `certificate_template_id` | `String?` | null | FK → `certificate_templates.id` |
| `display_order` | `Int` | same as `orderNumber` | Alias for UI (or rename in app layer only) |

### Prisma diff (conceptual)

```prisma
model CourseLevel {
  // ... existing fields ...
  assessmentRequired    Boolean  @default(false) @map("assessment_required")
  prerequisiteLevelId   String?  @map("prerequisite_level_id")
  certificateTemplateId String?  @map("certificate_template_id")

  prerequisiteLevel   CourseLevel?         @relation("LevelPrerequisite", fields: [prerequisiteLevelId], references: [id], onDelete: SetNull)
  dependentLevels     CourseLevel[]        @relation("LevelPrerequisite")
  certificateTemplate CertificateTemplate? @relation(fields: [certificateTemplateId], references: [id], onDelete: SetNull)

  @@index([prerequisiteLevelId])
  @@index([certificateTemplateId])
}
```

### Level-module linkage (future)
If levels need distinct lesson sets (not shared course modules):
- Option A: Add `course_level_id` nullable FK on `course_modules` (level-scoped modules)
- Option B: Junction table `course_level_modules (course_level_id, module_id, sort_order)`

**Recommendation:** Phase 2 — Option A when player supports level-scoped content. Current seed uses shared modules per course.

---

## Table: `course_assignment_batches` — Extensions

### Current fields
`courseId`, `courseLevelId`, `targetType`, `targetId`, `assignedByUserId`, `dueDate`, `totalUsers`, `completedUsers`, `overdueUsers`, `status`, `priority`, `notes`, `reminderSchedule`, `assignedAt`

### Proposed new columns

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `assignment_name` | `String?` | null | Admin-friendly batch label |
| `assigned_users` | `Int` | `0` | Successfully assigned (may differ from totalUsers if partial) |
| `skipped_users` | `Int` | `0` | Inactive + duplicate + prerequisite blocked |
| `target_ids` | `String[]` | `[]` | Multi-audience IDs |
| `rules` | `Json?` | null | Structured assignment rules (see below) |

### Rules JSON schema

```typescript
interface AssignmentRules {
  allowRetake: boolean;
  autoAssignNextLevel: boolean;
  blockIfPrerequisiteMissing: boolean;
  certificateOnCompletion: boolean;
  notifyManager: boolean;
  escalationDaysAfterOverdue: number | null;
  reminderSchedule: {
    daysBeforeDue: number[];  // e.g. [7, 3, 1]
    sendOverdueDaily: boolean;
  };
}
```

### Batch status semantics

Batch `status` currently mirrors user status — clarify:
- Batch status = aggregate: `NOT_STARTED` (no completions), `IN_PROGRESS`, `COMPLETED` (all done), `CANCELLED`
- Compute from user rows via `syncBatchCounters()`

### Prisma diff (conceptual)

```prisma
model CourseAssignmentBatch {
  // ... existing fields ...
  assignmentName String?  @map("assignment_name")
  assignedUsers  Int      @default(0) @map("assigned_users")
  skippedUsers   Int      @default(0) @map("skipped_users")
  targetIds      String[] @default([]) @map("target_ids")
  rules          Json?

  @@index([assignmentName])
}
```

---

## Table: `course_assignment_users` — Extensions

### Current fields
`batchId`, `courseId`, `courseLevelId`, `userId`, `assignedByUserId`, `dueDate`, `status`, `progressPercent`, `startedAt`, `completedAt`, `lastActivityAt`

### Proposed new columns

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `score` | `Int?` | null | Assessment score on completion |
| `certificate_issued_at` | `DateTime?` | null | When cert was issued for this assignment |
| `certificate_id` | `String?` | null | FK → `certificates.id` |
| `exempted_at` | `DateTime?` | null | |
| `exempted_by_id` | `String?` | null | FK → users |
| `exempt_reason` | `String?` | null | |
| `failed_at` | `DateTime?` | null | |
| `cancelled_at` | `DateTime?` | null | |

### Prisma diff (conceptual)

```prisma
model CourseAssignmentUser {
  // ... existing fields ...
  score               Int?      @map("score")
  certificateIssuedAt DateTime? @map("certificate_issued_at")
  certificateId       String?   @map("certificate_id")
  exemptedAt          DateTime? @map("exempted_at")
  exemptedById        String?   @map("exempted_by_id")
  exemptReason        String?   @map("exempt_reason")
  failedAt            DateTime? @map("failed_at")
  cancelledAt         DateTime? @map("cancelled_at")

  certificate Certificate? @relation(fields: [certificateId], references: [id], onDelete: SetNull)
  exemptedBy  User?        @relation("AssignmentExemptor", fields: [exemptedById], references: [id], onDelete: SetNull)

  @@index([certificateId])
}
```

### Duplicate prevention — partial unique index

**Raw SQL migration (PostgreSQL):**

```sql
CREATE UNIQUE INDEX course_assignment_users_active_unique
ON course_assignment_users (user_id, course_level_id)
WHERE status IN ('NOT_STARTED', 'IN_PROGRESS', 'OVERDUE');
```

Prisma does not natively support partial indexes — add via `prisma migrate` custom SQL in migration file.

---

## New Table: `locations` (Optional — Phase 1b)

Only required if LOCATION audience is first-class:

```prisma
model Location {
  id          String    @id @default(cuid())
  name        String
  code        String    @unique
  description String?
  parentId    String?   @map("parent_id")
  deletedAt   DateTime? @map("deleted_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  parent   Location?  @relation("LocationHierarchy", fields: [parentId], references: [id])
  children Location[] @relation("LocationHierarchy")
  users    User[]

  @@map("locations")
}
```

Add to `User`:
```prisma
locationId String? @map("location_id")
location   Location? @relation(fields: [locationId], references: [id])
```

**Alternative without new table:** Map LOCATION audience to `Department` nodes tagged as physical locations via `Department.code` prefix (e.g. `LOC-*`) — zero schema change.

---

## New Table: `course_assignment_reminders` (Optional)

For reminder history on assignment detail page:

```prisma
model CourseAssignmentReminder {
  id             String   @id @default(cuid())
  batchId        String   @map("batch_id")
  sentByUserId   String   @map("sent_by_user_id")
  recipientCount Int      @map("recipient_count")
  reminderType   String   @map("reminder_type") // MANUAL | SCHEDULED | ESCALATION
  sentAt         DateTime @default(now()) @map("sent_at")

  batch  CourseAssignmentBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  sentBy User                  @relation(fields: [sentByUserId], references: [id], onDelete: Restrict)

  @@index([batchId])
  @@index([sentAt])
  @@map("course_assignment_reminders")
}
```

---

## Entity Relationship (Target State)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────────┐
│   Course    │──1:N──│  CourseLevel │──1:N──│ CourseModule    │
│             │       │  (4 tiers)   │       │  → Lesson       │
└──────┬──────┘       └──────┬───────┘       └─────────────────┘
       │                     │
       │              ┌──────▼───────────────┐
       └──────────────│ CourseAssignmentBatch │
                      │  targetType/targetId  │
                      │  targetIds[]/rules    │
                      └──────┬───────────────┘
                             │ 1:N
                      ┌──────▼───────────────┐
                      │ CourseAssignmentUser  │
                      │  userId, status, %    │
                      │  score, certIssuedAt  │
                      └──────┬───────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         ┌────────┐   ┌────────────┐  ┌─────────────┐
         │  User  │   │ Certificate│  │ CourseEnroll│
         └────────┘   └────────────┘  └─────────────┘
```

---

## Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `course_assignment_users` | `(user_id, status)` | My Learning queries |
| `course_assignment_users` | `(batch_id, status)` | Batch detail filters |
| `course_assignment_users` | Partial unique on active | Duplicate prevention |
| `course_assignment_batches` | `(course_id, created_at DESC)` | Recent activity |
| `course_assignment_batches` | `(status, due_date)` | Overdue batch queries |
| `courses` | `(admin_status, category)` | Catalog filters |

---

## Data Migration / Backfill Scripts

Run after migration deploy:

### 1. Backfill batch counters
```sql
UPDATE course_assignment_batches b SET
  completed_users = (
    SELECT COUNT(*) FROM course_assignment_users u
    WHERE u.batch_id = b.id AND u.status = 'COMPLETED'
  ),
  overdue_users = (
    SELECT COUNT(*) FROM course_assignment_users u
    WHERE u.batch_id = b.id AND u.status = 'OVERDUE'
  ),
  assigned_users = (
    SELECT COUNT(*) FROM course_assignment_users u
    WHERE u.batch_id = b.id AND u.status NOT IN ('CANCELLED', 'EXEMPTED')
  );
```

### 2. Backfill course metadata from seed
Script: `scripts/backfill-course-metadata.ts` — set `businessFunction`, `isMandatory` from seed definitions.

### 3. Sync progress from LRS
Script: `scripts/sync-assignment-progress-from-lrs.ts` — one-time alignment of `progressPercent`.

---

## Tables Explicitly NOT Creating

| Proposed name | Reason to skip |
|---------------|----------------|
| `CourseAssignment` (flat) | `CourseAssignmentUser` already exists |
| `LearningAssignment` | Naming collision with resource assignments |
| `AssignmentAudience` | Audience stored on batch via targetType/targetIds |
| `CourseCatalog` | `Course` table is the catalog |
| Duplicate `CourseLevelDefinition` | `CourseLevel` is the level engine |

---

## Seed Data Contract

After Phase 2 seed, database must contain:

| Entity | Count | Validation query |
|--------|-------|------------------|
| Active courses | ≥ 20 | `SELECT COUNT(*) FROM courses WHERE admin_status='ACTIVE' AND deleted_at IS NULL` |
| Levels per course | 4 | `SELECT course_id, COUNT(*) FROM course_levels GROUP BY course_id HAVING COUNT(*) != 4` → 0 rows |
| Tier coverage | BASIC..EXPERT | `SELECT DISTINCT tier FROM course_levels` → 4 values |

Course list (from `seed-learning-admin-courses.ts`):
1. Cyber Security Fundamentals
2. Data Privacy and Security
3. Leadership Skills
4. Project Management
5. Data Analytics
6. AI Fundamentals
7. Machine Learning Basics
8. Cloud Computing
9. DevOps Essentials
10. Agile and Scrum
11. Communication Skills
12. Compliance Training
13. Workplace Safety
14. HR Policy Training
15. Customer Success
16. Sales Enablement
17. Product Management
18. Software Engineering Best Practices
19. Database Fundamentals
20. Business Intelligence

---

## Migration Naming Convention

```
YYYYMMDDHHMMSS_lms_course_catalog_extensions
YYYYMMDDHHMMSS_lms_assignment_batch_rules
YYYYMMDDHHMMSS_lms_assignment_user_cert_exempt
YYYYMMDDHHMMSS_lms_active_assignment_unique_index
YYYYMMDDHHMMSS_lms_locations_optional
```

Apply in order. Each migration independently revertible.
