# TalentIQ — Entity Relationship Diagram

> PostgreSQL schema defined in [`prisma/schema.prisma`](../prisma/schema.prisma)

## Overview

The TalentIQ data model supports the full workforce intelligence lifecycle:

**Employee → Job Role → Experience Level → Required Skills → Learning Roadmap → Assessment → Certification → Promotion Readiness**

## High-Level Domain Map

```mermaid
erDiagram
    direction TB

    %% RBAC
    Role ||--o{ User : assigns
    Role ||--o{ RolePermission : has
    Permission ||--o{ RolePermission : granted_via
    User ||--o{ UserPermission : overrides
    Permission ||--o{ UserPermission : targets

    %% Organization
    Department ||--o{ Team : contains
    Department ||--o{ User : employs
    Department ||--o{ JobRole : defines
    Team ||--o{ User : members
    User ||--o| Team : leads

    %% Career
    JobRole ||--o{ User : assigned_to
    ExperienceLevel ||--o{ User : assigned_to
    JobRole ||--o{ RoleSkillRequirement : requires
    ExperienceLevel ||--o{ RoleSkillRequirement : at_level
    Skill ||--o{ RoleSkillRequirement : needed
    SkillLevel ||--o{ RoleSkillRequirement : min_level

    %% Skills
    SkillCategory ||--o{ Skill : groups
    SkillCategory ||--o| SkillCategory : parent
    User ||--o{ EmployeeSkill : possesses
    Skill ||--o{ EmployeeSkill : tracked
    SkillLevel ||--o{ EmployeeSkill : proficiency

    %% Learning
    User ||--o{ Course : instructs
    Course ||--o{ CourseModule : contains
    CourseModule ||--o{ Lesson : contains
    User ||--o{ CourseEnrollment : enrolls
    Course ||--o{ CourseEnrollment : enrolled_in
    User ||--o{ LearningRoadmap : owns
    LearningRoadmap }o--o{ Course : includes

    %% Assessments
    Course ||--o{ Assessment : may_include
    Assessment ||--o{ AssessmentQuestion : contains
    User ||--o{ AssessmentAttempt : takes
    Assessment ||--o{ AssessmentAttempt : attempted

    %% Certifications
    CertificateTemplate ||--o{ Certificate : issues
    User ||--o{ Certificate : earns
    Course ||--o{ Certificate : via_course
    Assessment ||--o{ Certificate : via_assessment

    %% System
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : performs
    User ||--o{ RefreshToken : sessions
```

## RBAC

```mermaid
erDiagram
    Role {
        string id PK
        string name
        string slug UK
        string description
        boolean is_system
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Permission {
        string id PK
        string key UK
        string name
        string module
        string description
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    RolePermission {
        string id PK
        string role_id FK
        string permission_id FK
        datetime created_at
    }

    UserPermission {
        string id PK
        string user_id FK
        string permission_id FK
        enum effect
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Role ||--o{ RolePermission : ""
    Permission ||--o{ RolePermission : ""
    User ||--o{ UserPermission : ""
    Permission ||--o{ UserPermission : ""
```

| Constraint | Description |
|------------|-------------|
| `roles.slug` | Unique system role identifier (EMPLOYEE, ADMIN, etc.) |
| `permissions.key` | Unique permission key (e.g. `skills:read`) |
| `role_permissions(role_id, permission_id)` | Unique composite — no duplicate grants |
| `user_permissions(user_id, permission_id)` | Unique composite — one override per permission |

## Organization & Users

```mermaid
erDiagram
    Department {
        string id PK
        string name
        string code UK
        string parent_id FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Team {
        string id PK
        string name
        string code UK
        string department_id FK
        string leader_id FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    User {
        string id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string role_id FK
        string department_id FK
        string team_id FK
        string job_role_id FK
        string experience_level_id FK
        string manager_id FK
        boolean is_active
        datetime last_login_at
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Department ||--o| Department : parent
    Department ||--o{ Team : ""
    Department ||--o{ User : ""
    Team ||--o{ User : members
    User ||--o| User : manager
    User ||--o| Team : leads
```

| Index | Columns |
|-------|---------|
| `users_email` | `email` |
| `users_role_id` | `role_id` |
| `users_department_id` | `department_id` |
| `users_deleted_at` | `deleted_at` |

## Career & Skills

```mermaid
erDiagram
    JobRole {
        string id PK
        string title
        string code UK
        string department_id FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    ExperienceLevel {
        string id PK
        string name
        string code UK
        int rank
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    SkillCategory {
        string id PK
        string name
        string slug UK
        string parent_id FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Skill {
        string id PK
        string name
        string slug UK
        string category_id FK
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    SkillLevel {
        string id PK
        string name
        string code UK
        int rank
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    EmployeeSkill {
        string id PK
        string user_id FK
        string skill_id FK
        string skill_level_id FK
        string verified_by_id FK
        datetime verified_at
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    RoleSkillRequirement {
        string id PK
        string job_role_id FK
        string experience_level_id FK
        string skill_id FK
        string required_skill_level_id FK
        boolean is_mandatory
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    SkillCategory ||--o| SkillCategory : parent
    SkillCategory ||--o{ Skill : ""
    User ||--o{ EmployeeSkill : ""
    Skill ||--o{ EmployeeSkill : ""
    SkillLevel ||--o{ EmployeeSkill : ""
    JobRole ||--o{ RoleSkillRequirement : ""
    ExperienceLevel ||--o{ RoleSkillRequirement : ""
    Skill ||--o{ RoleSkillRequirement : ""
    SkillLevel ||--o{ RoleSkillRequirement : required
```

| Constraint | Description |
|------------|-------------|
| `employee_skills(user_id, skill_id)` | One proficiency record per skill per employee |
| `role_skill_requirements(job_role_id, experience_level_id, skill_id)` | Unique skill requirement per role/level |

## Learning & Assessments

```mermaid
erDiagram
    Course {
        string id PK
        string title
        string slug UK
        string instructor_id FK
        int duration_minutes
        boolean is_published
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    CourseModule {
        string id PK
        string course_id FK
        string title
        int sort_order
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Lesson {
        string id PK
        string module_id FK
        string title
        string content
        string video_url
        int sort_order
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    LearningRoadmap {
        string id PK
        string user_id FK
        string job_role_id FK
        string experience_level_id FK
        string title
        enum status
        datetime target_date
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    CourseEnrollment {
        string id PK
        string user_id FK
        string course_id FK
        enum status
        int progress
        datetime enrolled_at
        datetime completed_at
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Assessment {
        string id PK
        string title
        string course_id FK
        enum type
        int passing_score
        int time_limit_minutes
        boolean is_published
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    AssessmentQuestion {
        string id PK
        string assessment_id FK
        string question
        enum type
        json options
        int points
        int sort_order
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    AssessmentAttempt {
        string id PK
        string assessment_id FK
        string user_id FK
        enum status
        int score
        json answers
        datetime started_at
        datetime submitted_at
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Course ||--o{ CourseModule : ""
    CourseModule ||--o{ Lesson : ""
    User ||--o{ LearningRoadmap : ""
    LearningRoadmap }o--o{ Course : ""
    User ||--o{ CourseEnrollment : ""
    Course ||--o{ CourseEnrollment : ""
    Course ||--o{ Assessment : ""
    Assessment ||--o{ AssessmentQuestion : ""
    User ||--o{ AssessmentAttempt : ""
    Assessment ||--o{ AssessmentAttempt : ""
```

| Constraint | Description |
|------------|-------------|
| `course_enrollments(user_id, course_id)` | One enrollment per user per course |
| `courses.slug` | URL-safe unique identifier |

## Certifications & Notifications

```mermaid
erDiagram
    CertificateTemplate {
        string id PK
        string name
        string template_html
        int validity_days
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Certificate {
        string id PK
        string user_id FK
        string template_id FK
        string course_id FK
        string assessment_id FK
        string certificate_number UK
        datetime issued_at
        datetime expires_at
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    Notification {
        string id PK
        string user_id FK
        enum type
        string title
        string message
        boolean is_read
        datetime read_at
        string action_url
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    CertificateTemplate ||--o{ Certificate : ""
    User ||--o{ Certificate : ""
    Course ||--o{ Certificate : ""
    Assessment ||--o{ Certificate : ""
    User ||--o{ Notification : ""
```

## Audit & System

```mermaid
erDiagram
    AuditLog {
        string id PK
        enum action
        string entity_type
        string entity_id
        string actor_id FK
        json metadata
        string ip_address
        string user_agent
        datetime created_at
    }

    SystemSetting {
        string id PK
        string key UK
        string value
        enum value_type
        boolean is_public
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }

    RefreshToken {
        string id PK
        string token UK
        string user_id FK
        datetime expires_at
        datetime revoked_at
        datetime created_at
    }

    User ||--o{ AuditLog : actor
    User ||--o{ RefreshToken : ""
```

> **Note:** `AuditLog` is append-only (no `updated_at`, no soft delete) to preserve audit trail integrity.

## Soft Delete Strategy

Models with `deleted_at` support soft deletion:

| Domain | Models |
|--------|--------|
| RBAC | Role, Permission, UserPermission |
| Organization | Department, Team |
| Users | User |
| Career | JobRole, ExperienceLevel |
| Skills | SkillCategory, Skill, SkillLevel, EmployeeSkill, RoleSkillRequirement |
| Learning | Course, CourseModule, Lesson, LearningRoadmap, CourseEnrollment |
| Assessments | Assessment, AssessmentQuestion, AssessmentAttempt |
| Certifications | CertificateTemplate, Certificate |
| Notifications | Notification |
| System | SystemSetting |

Query pattern: `WHERE deleted_at IS NULL`

## Model Count

| Category | Models |
|----------|--------|
| RBAC | Role, Permission, RolePermission, UserPermission |
| Organization | Department, Team |
| Identity | User, RefreshToken |
| Career | JobRole, ExperienceLevel |
| Skills | SkillCategory, Skill, SkillLevel, EmployeeSkill, RoleSkillRequirement |
| Learning | Course, CourseModule, Lesson, LearningRoadmap, CourseEnrollment |
| Assessments | Assessment, AssessmentQuestion, AssessmentAttempt |
| Certifications | CertificateTemplate, Certificate |
| Notifications | Notification |
| System | AuditLog, SystemSetting |
| **Total** | **28 models** |

## Migrations

```bash
# Apply migrations
npm run db:migrate

# Seed reference data
npm run db:seed
```

Migration files are stored in [`prisma/migrations/`](../prisma/migrations/).
