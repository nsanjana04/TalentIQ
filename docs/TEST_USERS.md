# Rugged Monitoring TalentIQ — Test Users (3 roles)

Default password for all seeded accounts: **`TalentIQ@2026`**

## Role-based test accounts

| Role | Name | Email | Password |
|------|------|-------|----------|
| Employee | Anna Kowalski | employee@talentiq.com | TalentIQ@2026 |
| Manager | Michael Torres | manager@talentiq.com | TalentIQ@2026 |
| Admin | Jordan Hayes | admin@talentiq.com | TalentIQ@2026 |

## How to test sign in / sign out

1. Open `/login`
2. Sign in with any account above
3. Confirm redirect to `/dashboard`
4. Click **Sign out** in the header
5. Confirm redirect to `/login` and protected routes require authentication again

## Bootstrap

```bash
npm run db:seed:auth
# or full bootstrap (RBAC + screens)
npm run bootstrap
```
