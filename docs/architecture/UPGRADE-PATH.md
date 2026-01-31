# Upgrade Path Documentation

This document outlines how database migrations and upgrades are applied across different deployment types, and how to test the upgrade path.

## Upgrade Paths by Deployment Type

| Deployment Type | How Migrations Run | When |
|-----------------|-------------------|------|
| **Vercel (demo)** | Auto via `vercel-build` → `prisma migrate deploy` | Every deployment |
| **Self-hosted** | Manual: `npx prisma migrate deploy` or `npm run build` | Before starting updated app |
| **Docker** | Manual or via entrypoint script | Container startup or manual |

---

## Detailed Upgrade Procedures

### Vercel Deployments

Migrations run automatically during the build process:

```text

# vercel-build script (from package.json)
DATABASE_URL=$DIRECT_URL PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT=180000 node scripts/build-resilient.js
```

**What happens:**

1. `DIRECT_URL` (non-pooled Neon connection) is used for migrations
2. `prisma migrate deploy` runs with retry logic
3. `prisma generate` regenerates the client
4. Next.js build runs

**No action required** - upgrades are automatic on push to main.

---

### Self-Hosted Deployments

Users upgrading a self-hosted instance should:

```bash

# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Run migrations (choose one)
npx prisma migrate deploy          # Just migrations
# OR
npm run build                      # Migrations + full build

# 4. Restart the application
pm2 restart artisan-roast          # or however you run it
```

**Critical:** Migrations must run BEFORE the new code starts, otherwise Prisma client will reference columns that don't exist.

---

### Docker Deployments

#### Option 1: Manual Migration

```bash

# After pulling new image
docker compose exec app npx prisma migrate deploy
docker compose restart app
```

#### Option 2: Entrypoint Script (Recommended)

Add to your Docker entrypoint or compose command:

```dockerfile
# In Dockerfile or docker-compose.yml
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

Or in `docker-compose.yml`:

```bash

services:
  app:
    command: sh -c "npx prisma migrate deploy && npm start"
```

**Note:** Ensure `DATABASE_URL` in `.env.docker` points to a direct (non-pooled) connection for migrations.

---

## Testing the Upgrade Path

### Method 1: Local Simulation (Quick)

Use your local `artisan_roast` database to simulate an upgrade:

```text

# 1. Ensure local DB is "behind" (missing recent migrations)
#    Or manually drop a test column to simulate older state

# 2. Check migration status
npx prisma migrate status

# 3. Run the upgrade
npx prisma migrate deploy

# 4. Verify
npx prisma migrate status  # Should show "Database schema is up to date!"
```

### Method 2: Docker Simulation (Closest to Real)

```typescript

# 1. Start fresh Docker instance with older image/state
docker compose up -d db
docker compose exec db psql -U postgres -c "CREATE DATABASE artisan_test;"

# 2. Point to test database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_test"

# 3. Apply older migration state (e.g., reset to specific migration)
npx prisma migrate resolve --applied "20260101000000_some_old_migration"

# 4. Now simulate upgrade
npx prisma migrate deploy

# 5. Verify all migrations applied
npx prisma migrate status
```

### Method 3: Staging Environment

For production-critical testing:

1. Create a staging branch of Neon database (Neon supports branching)
2. Deploy to Vercel preview
3. Verify migrations applied correctly
4. Check app functionality

---

## Creating a Test Migration

To test the upgrade path with a real schema change:

```bash

# 1. Create a branch
git checkout -b test/upgrade-path-verification

# 2. Add a test column to schema.prisma
# Example: Add a test field to an existing model

# 3. Create the migration
npx prisma migrate dev --name test_upgrade_path

# 4. Commit and push
git add -A
git commit -m "test: add test column for upgrade verification"
git push origin test/upgrade-path-verification

# 5. Test the upgrade path using methods above

# 6. After verification, delete the test branch (don't merge)
git checkout main
git branch -D test/upgrade-path-verification
```

---

## `npm run upgrade` Command

A dedicated upgrade command for self-hosted users:

```bash
npm run upgrade
```

**What it does:**

1. Shows current version
2. Checks database migration status
3. Applies pending migrations (if any)
4. Regenerates Prisma client
5. Clears Next.js cache

**Example output (with pending migrations):**

```text
========================================
   Artisan Roast Upgrade
========================================

Current version: 0.79.0

Checking database migration status...

Found 3 pending migration(s).

Applying database migrations...

$ npx prisma migrate deploy
...
All migrations have been successfully applied.

Migrations applied successfully.

Regenerating Prisma client...

========================================
   Upgrade complete!
========================================

Next steps:
  1. Run: npm run build
  2. Run: npm start (or restart your process manager)
```

**Example output (already up to date):**

```text
========================================
   Artisan Roast Upgrade
========================================

Current version: 0.79.0

Checking database migration status...

Database is already up to date.

Regenerating Prisma client...

========================================
   Upgrade complete!
========================================
```

---

## Rollback Procedures

### If Migration Fails

```text

# 1. Check which migration failed
npx prisma migrate status

# 2. Fix the issue in the migration file or schema

# 3. Mark migration as rolled back (if needed)
npx prisma migrate resolve --rolled-back "20260130000000_failed_migration"

# 4. Retry
npx prisma migrate deploy
```

### Database Backup/Restore

```bash

# Backup before upgrade (recommended)
npm run db:backup

# Restore if needed
npm run db:restore
```

---

## Checklist for Release with DB Changes

Before merging a PR with schema changes:

- [ ] Migration file created (`npx prisma migrate dev --name descriptive_name`)
- [ ] Migration tested locally against fresh database
- [ ] Migration tested against existing data (no data loss)
- [ ] Rollback procedure documented (if complex migration)
- [ ] CHANGELOG updated with migration notes
- [ ] Self-hosted upgrade instructions reviewed

After merging to main:

- [ ] Vercel deployment succeeded (check build logs for migration output)
- [ ] Production app functional (smoke test)
- [ ] Consider GitHub Release notes for breaking changes

---

## Related Documentation

- [INSTALLATION.md](../../.archive/INSTALLATION.md) - Initial setup and DB toggle instructions
- [FILE-RESTRUCTURE-CHECKLIST.md](./FILE-RESTRUCTURE-CHECKLIST.md) - Verification checklist
- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
