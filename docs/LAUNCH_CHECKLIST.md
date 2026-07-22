# TalentIQ — Launch Checklist

Use this checklist before going live with TalentIQ.

---

## Infrastructure

- [ ] Production PostgreSQL provisioned (16+, backups enabled)
- [ ] Redis provisioned (rate limiting + caching)
- [ ] SSL/TLS certificate installed (HTTPS only)
- [ ] DNS configured and propagated
- [ ] Load balancer health checks configured (`/api/health/live`, `/api/health/ready`)
- [ ] Firewall rules restrict DB/Redis to app network only
- [ ] Docker images built from `production` target (non-root user)

## Secrets & Environment

- [ ] `JWT_ACCESS_SECRET` rotated (min 32 chars, unique per environment)
- [ ] `JWT_REFRESH_SECRET` rotated (min 32 chars, unique per environment)
- [ ] `DATABASE_URL` uses strong password
- [ ] `POSTGRES_PASSWORD` not using default `talentiq_secret`
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain
- [ ] `REDIS_URL` configured
- [ ] `SENTRY_DSN` configured
- [ ] Seed admin password changed from default
- [ ] `.env` files not committed to git
- [ ] AWS/SMTP credentials stored in secrets manager

## Database

- [ ] `npx prisma migrate deploy` executed successfully
- [ ] Seed data reviewed (remove test accounts if needed)
- [ ] Database backup taken before launch
- [ ] Connection pooling configured (PgBouncer if high traffic)

## Security

- [ ] Rate limiting verified on `/api/auth/login`
- [ ] CSRF tokens issued on login and sent by API client
- [ ] Security headers present (check with [securityheaders.com](https://securityheaders.com))
- [ ] CORS origins restricted to production domain
- [ ] RBAC permissions reviewed for all roles
- [ ] Audit logging enabled (Settings → Audit Tracking)
- [ ] `npm audit` reviewed — no critical vulnerabilities

## Application

- [ ] `npm run build` passes in CI
- [ ] All modules tested: Dashboard, Learning, Courses, Assessments, Certificates, Analytics, Settings
- [ ] Email delivery configured (SMTP settings in Settings → Email)
- [ ] Certificate verification public route works (`/verify/certificate/[token]`)
- [ ] Error pages render (401, 403, 404)
- [ ] Mobile/responsive layout verified

## Monitoring & Observability

- [ ] Sentry receiving test error events
- [ ] Pino logs shipping to log aggregator (CloudWatch, Datadog, etc.)
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot, etc.)
- [ ] Alerting rules for 5xx errors and health check failures
- [ ] Disk/memory alerts on app and database servers

## Performance

- [ ] Lighthouse score > 80 on dashboard page
- [ ] API response times < 500ms for dashboard overview
- [ ] Redis cache hit rate monitored
- [ ] CDN configured for static assets (if applicable)

## Documentation & Support

- [ ] Admin credentials documented securely
- [ ] Runbook shared with ops team (`docs/DEPLOYMENT.md`)
- [ ] Support email configured (`org.support_email` in Settings)
- [ ] On-call rotation defined

## Go / No-Go

- [ ] Stakeholder sign-off obtained
- [ ] Rollback plan tested
- [ ] Launch communication sent to users
- [ ] **GO** — Deploy to production

---

**Launch date:** _______________  
**Signed off by:** _______________
