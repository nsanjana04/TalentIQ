# TalentIQ — Project Context

> **This document is the source of truth for the entire application.**

## Project Name

**TalentIQ**

## Tagline

AI-Powered Workforce Intelligence Platform

## Mission

TalentIQ is an enterprise Workforce Intelligence Platform that combines:

1. Skill Matrix
2. Learning Management
3. Career Progression
4. Assessments
5. Certifications
6. Workforce Analytics
7. Talent Intelligence
8. Promotion Readiness
9. AI Recommendations

## Core Flow

```
Employee
  → Role
  → Experience Level
  → Required Skills
  → Learning Roadmap
  → Assessment
  → Certification
  → Promotion Readiness
```

## Roles (this project — 3 only)

- **Employee** — individual contributor
- **Manager** — team / department oversight
- **Admin** — full system administration

## Architecture

### Frontend

- Next.js 15
- TypeScript
- Tailwind
- Shadcn UI
- React Query
- Zustand

### Backend

- Next.js Route Handlers
- Prisma ORM

### Database

- PostgreSQL

### Storage

- AWS S3

### Authentication

- JWT
- Refresh Tokens

### Authorization

- RBAC

### Deployment

- Vercel
- PostgreSQL
