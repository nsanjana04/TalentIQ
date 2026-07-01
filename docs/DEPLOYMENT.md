# TalentIQ — Deployment Guide

Production deployment guide for TalentIQ (Next.js 15 + PostgreSQL + Redis).

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20 LTS |
| PostgreSQL | 16+ |
| Redis | 7+ (recommended for rate limiting & caching) |
| Docker | 24+ (optional) |

---

## Environment Variables

Copy `.env.example` to `.env.production` and configure:

### Required

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://user:pass@host:5432/talentiq?schema=public
JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_REFRESH_SECRET=<openssl rand -base64 64>
```

### Recommended

```bash
REDIS_URL=redis://redis:6379
CORS_ALLOWED_ORIGINS=https://your-domain.com
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
LOG_LEVEL=info
```

### Optional (AWS S3)

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=talentiq-uploads
```

---

## Deployment Options

### Option A: Docker Compose (recommended for VPS)

```bash
# 1. Set secrets
export POSTGRES_PASSWORD=<strong-password>
export JWT_ACCESS_SECRET=<64-char-secret>
export JWT_REFRESH_SECRET=<64-char-secret>
export NEXT_PUBLIC_APP_URL=https://your-domain.com

# 2. Start stack
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 4. Seed (first deploy only)
docker compose -f docker-compose.prod.yml exec app npm run db:seed
```

### Option B: Standalone Node

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

### Option C: Vercel + Managed PostgreSQL

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Use Neon/Supabase/RDS for `DATABASE_URL`
4. Use Upstash Redis for `REDIS_URL`
5. Deploy — `prisma migrate deploy` runs in build step if configured

---

## Health Checks

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /api/health/live` | Liveness | 200 always |
| `GET /api/health/ready` | Readiness | 200 when DB connected |
| `GET /api/health` | Full status | 200/503 with dependency details |

Configure load balancer:
- **Liveness:** `/api/health/live` every 30s
- **Readiness:** `/api/health/ready` every 10s

---

## Database Migrations

```bash
# Production — never use migrate dev
npx prisma migrate deploy

# Verify status
npx prisma migrate status
```

---

## Security Features (enabled by default)

| Feature | Implementation |
|---------|----------------|
| Rate limiting | Middleware + Redis/memory fallback |
| Security headers | Helmet-equivalent (CSP, HSTS, X-Frame-Options) |
| CORS | Configurable via `CORS_ALLOWED_ORIGINS` |
| CSRF | Double-submit cookie + `X-CSRF-Token` header |
| Input validation | Zod schemas on API routes |
| SQL injection | Prisma ORM parameterized queries |
| XSS | React escaping + CSP + `lib/security/sanitize.ts` |
| Logging | Pino structured logs |
| Monitoring | Sentry (when `SENTRY_DSN` set) |

---

## CI/CD

GitHub Actions workflows:

- **`.github/workflows/ci.yml`** — lint, build, migrate, audit on PR/push
- **`.github/workflows/deploy.yml`** — manual deploy trigger

---

## Reverse Proxy (Nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/ssl/certs/talentiq.crt;
    ssl_certificate_key /etc/ssl/private/talentiq.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Rollback

```bash
# Docker
docker compose -f docker-compose.prod.yml down
docker tag talentiq:previous talentiq:latest
docker compose -f docker-compose.prod.yml up -d

# Database — restore from backup if migration failed
pg_restore -d talentiq backup.dump
```

---

## Post-Deploy Verification

1. `curl https://your-domain.com/api/health/ready`
2. Login with admin credentials
3. Verify RBAC, dashboard, and settings pages load
4. Check Sentry for errors
5. Review audit logs in Settings → Audit Tracking
