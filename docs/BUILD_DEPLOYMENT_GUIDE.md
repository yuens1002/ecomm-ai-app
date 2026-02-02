# Build & Deployment Guide

## Quick Reference

### Local Development

```bash

npm run dev           # Start dev server
npm run build         # Full build with migrations (resilient with retries)
npm run build:safe    # Backup DB + validate + build (safest option)
npm run build:no-migrate  # Build without running migrations
```

### Staging/Production

```bash

npm run vercel-build  # Optimized for Vercel (uses DIRECT_URL, 3min timeout)
```

---

## Build Process Overview

The new **resilient build system** handles:

- ✅ **Automatic retries** for transient database issues
- ✅ **Exponential backoff** (5s, 10s, 15s between attempts)
- ✅ **Lock timeout** of 3 minutes (180s) for advisory lock acquisition
- ✅ **Direct URL usage** (bypasses 10-connection pooler limit)
- ✅ **Optional migrations** (can skip with `--no-migrate`)
- ✅ **Helpful error messages** with actionable steps

### Build Flow

```text
1. Validate environment variables
   ↓
2. Generate Prisma Client (always)
   ↓
3. Run database migrations (optional, with 3 retries)
   ↓
4. Build Next.js application (with 2 retries)
   ↓
✅ Success!
```

---

## Environment Setup

### Required Variables

```text

# Database - use DIRECT_URL for builds, DATABASE_URL for runtime
DATABASE_URL="postgresql://user:pwd@host-pooler...?connection_limit=10"    # Pooler (runtime)
DIRECT_URL="postgresql://user:pwd@host...?connect_timeout=30"             # Direct (builds)

# If only one is available, the build script uses fallback logic
```

### Vercel Configuration

**Settings → Environment Variables:**

```text

DATABASE_URL          = pooled-connection
DIRECT_URL           = direct-connection (for build phase)
```

**Settings → Build & Development:**

- Build Command: `npm run vercel-build`
- Output Directory: `.next`
- Root Directory: `.` (or `/` if monorepo)

---

## Troubleshooting

### "Advisory Lock" Timeout (Most Common)

**Problem:** Build hangs on `prisma migrate deploy`

**Solutions (in order):**

1. **Wait a few minutes**
   - Another build/operation might be holding the lock
   - Try again in 2-3 minutes

2. **Skip migrations at build time**

   ```bash
   npm run build:no-migrate
   # Then run migrations separately:
   npm run db:safe-migrate

```


3. **Check Neon dashboard**
   - https://console.neon.tech
   - Look for active queries or long-running transactions
   - Check connection count (should be < 10 in pooler)

4. **Increase timeout** (only if safe)
   ```bash
   BUILD_RETRIES=5 PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT=300000 npm run build
   # 300000ms = 5 minutes
```

### Database Connection Failed

**Problem:** Can't connect to database during build

**Solutions:**

1. **Verify environment variables**

   ```bash
   echo $DATABASE_URL
   echo $DIRECT_URL

```


2. **Test connection directly**

   ```bash
   npx prisma db execute --stdin < /dev/null
```

1. **Use direct URL instead of pooler**

   ```bash
   DIRECT_URL="postgresql://..." npm run build

```


### Next.js Build Timeout

**Problem:** Next.js build itself times out (separate from Prisma)

**Solutions:**

1. **Skip migrations** (reduces build time by ~30s)

   ```bash
   npm run build:no-migrate
```

1. **Increase Next.js build timeout** (in vercel.json)

   ```json
   {
     "buildCommand": "npm run vercel-build",
     "buildTimeout": 1800
   }

```


---

## CI/CD Integration

### GitHub Actions Example

```bash

name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - run: npm ci

      - name: Validate environment
        run: |
          if [ -z "$DATABASE_URL" ]; then
            echo "ERROR: DATABASE_URL not set"
            exit 1
          fi

      - name: Run tests
        run: npm run test:ci

      - name: Build with resilience
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT: "180000"
```

### GitLab CI Example

```bash

stages:
  - test
  - build

build_job:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  retry:
    max: 2
    when:
      - script_failure
  variables:
    DATABASE_URL: $DATABASE_URL
    DIRECT_URL: $DIRECT_URL
    PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT: "180000"
```

---

## Best Practices

### ✅ Do's

- ✅ Use **DIRECT_URL** for all build operations (GitHub Actions, Vercel, local CI)
- ✅ Set **PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT** to 180000ms (3 min) or higher
- ✅ **Separate migrations** from builds if you have frequent deployments
- ✅ **Test locally** before pushing: `npm run build:safe`
- ✅ **Monitor** Neon dashboard during deployments for connection issues

### ❌ Don'ts

- ❌ Use **pooler URL** for builds (only for app runtime)
- ❌ Run **multiple builds simultaneously** (they compete for advisory locks)
- ❌ Set advisory lock timeout < 60000ms (60 seconds)
- ❌ Commit migrations without testing: `npx prisma migrate dev` locally first

---

## Performance Tips

| Task                  | Time       | Notes                                 |
| --------------------- | ---------- | ------------------------------------- |
| Prisma generate       | ~2s        | Always required, fast                 |
| Database migration    | 5-30s      | Depends on schema changes, retry-safe |
| Next.js build         | 15-20s     | Longest step, parallelized            |
| **Total (no issues)** | **25-50s** | Fast path with no retries needed      |
| **Total (1 retry)**   | **40-80s** | With one migration retry (~15s delay) |

---

## Monitoring & Alerts

### Neon Monitoring

1. **Connection health**: <https://console.neon.tech/app/projects> → Monitoring
2. **Query performance**: Look for slow migrations
3. **Connection count**: Should spike during build, drop after

### Alerting (if using Neon Pro)

Set alerts for:

- High connection count (> 8/10)
- Query duration > 30s
- Failed connections

---

## FAQ

**Q: Should I always use DIRECT_URL?**
A: Yes for builds/migrations. For app runtime, use DATABASE_URL with pooler.

**Q: Can I run multiple builds at once?**
A: No - advisory locks will cause conflicts. Use CI/CD to serialize deployments.

**Q: What if migrations are slow?**
A: Consider running them separately: `npm run db:safe-migrate` before code deployment.

**Q: Why 180s lock timeout?**
A: Gives slow queries/migrations time to complete. Adjust down if you have fast migrations.

**Q: Can I deploy without migrations?**
A: Yes! Use `npm run build:no-migrate`, then run migrations in a separate step.

---

## Related Commands

```bash

# Database operations
npm run db:safe-migrate     # Run migrations with safety checks
npm run db:backup           # Backup database before operations
npm run db:restore          # Restore from backup
npm run db:smoke            # Test CRUD operations

# Validation
npm run typecheck           # TypeScript check
npm run lint                # ESLint check
npm run precheck            # typecheck + lint

# Testing
npm run test                # Jest (watch mode)
npm run test:ci             # Jest (CI mode, single run)
```

---

## Support

If builds continue to fail:

1. Check Neon dashboard: <https://console.neon.tech>
2. Review logs with: `BUILD_VERBOSE=true npm run build`
3. Try: `npm run db:safe-migrate` then `npm run build:no-migrate`
4. As last resort: `npm run db:restore` to rollback to last backup
