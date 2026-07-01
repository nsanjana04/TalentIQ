# TalentIQ — Production Readiness Checklist

Ongoing checklist to maintain production quality after launch.

---

## Security Hardening

| Item | Status | Notes |
|------|--------|-------|
| JWT secrets rotated quarterly | ☐ | |
| Rate limiting active (auth + API) | ☐ | Redis-backed in prod |
| Helmet-equivalent headers (CSP, HSTS) | ☐ | `lib/security/headers.ts` |
| CORS restricted to known origins | ☐ | `CORS_ALLOWED_ORIGINS` |
| CSRF protection on mutations | ☐ | `X-CSRF-Token` header |
| Input validation (Zod) on all mutating APIs | ☐ | `lib/validations/*` |
| SQL injection protection (Prisma ORM) | ☐ | No `$queryRawUnsafe` |
| XSS protection (React + CSP + sanitize) | ☐ | `lib/security/sanitize.ts` |
| Password policy enforced | ☐ | Settings → Security |
| Session timeout configured | ☐ | `auth.session_timeout_minutes` |
| MFA roadmap documented | ☐ | `auth.mfa_enabled` flag |
| Dependency audit (`npm audit`) | ☐ | Weekly in CI |

## Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| PostgreSQL 16+ with automated backups | ☐ | Daily minimum |
| Redis 7+ for cache and rate limits | ☐ | `REDIS_URL` |
| Docker production image (non-root) | ☐ | `Dockerfile` target: production |
| Health checks: live + ready | ☐ | `/api/health/*` |
| TLS 1.2+ only | ☐ | Reverse proxy |
| Secrets in vault (not .env files) | ☐ | |

## Observability

| Item | Status | Notes |
|------|--------|-------|
| Sentry error tracking | ☐ | `SENTRY_DSN` |
| Pino structured logging | ☐ | `lib/logger/index.ts` |
| Audit log retention policy | ☐ | Settings → Audit (90 days default) |
| Request ID in API responses | ☐ | `X-Request-Id` header |
| Uptime monitoring | ☐ | External service |
| Log aggregation | ☐ | CloudWatch / ELK / Datadog |

## CI/CD

| Item | Status | Notes |
|------|--------|-------|
| GitHub Actions CI on PR | ☐ | `.github/workflows/ci.yml` |
| Lint + build gate | ☐ | |
| Migration check in CI | ☐ | `prisma migrate deploy` |
| Docker build on main | ☐ | |
| Deploy workflow documented | ☐ | `.github/workflows/deploy.yml` |
| Staging environment mirrors prod | ☐ | |

## Performance

| Item | Status | Notes |
|------|--------|-------|
| Next.js standalone output | ☐ | `output: "standalone"` |
| Gzip compression enabled | ☐ | `compress: true` |
| React Query client caching | ☐ | `staleTime` configured |
| Redis server-side caching | ☐ | `lib/cache/with-cache.ts` |
| Database indexes reviewed | ☐ | Prisma schema `@@index` |
| Connection pool sized appropriately | ☐ | |

## Data & Compliance

| Item | Status | Notes |
|------|--------|-------|
| Data retention policy set | ☐ | `system.data_retention_days` |
| Certificate compliance tracking | ☐ | Analytics module |
| User deactivation flow tested | ☐ | Admin → Users |
| Audit trail for permission changes | ☐ | RBAC service |
| GDPR/data export process defined | ☐ | |

## Disaster Recovery

| Item | Status | Notes |
|------|--------|-------|
| Database backup restore tested | ☐ | Quarterly drill |
| Rollback procedure documented | ☐ | `docs/DEPLOYMENT.md` |
| RTO/RPO defined | ☐ | |
| Incident response runbook | ☐ | |

## Review Schedule

| Review | Frequency | Last Completed |
|--------|-----------|----------------|
| Security audit | Monthly | |
| Dependency updates | Weekly | |
| Secret rotation | Quarterly | |
| Backup restore test | Quarterly | |
| Performance review | Monthly | |
| RBAC permission audit | Quarterly | |

---

**Maintained by:** _______________  
**Last updated:** _______________
