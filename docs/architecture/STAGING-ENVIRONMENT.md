# Staging Environment Setup

This document describes the staging environment configuration for testing changes before production.

## Architecture Overview

| Component | Production | Staging |
|-----------|------------|---------|
| GitHub Branch | `main` | `staging` |
| Neon Database | Main branch | `staging` branch |
| Vercel | Production deployment | Preview deployment |
| URL | artisanroast.app | Auto-generated preview URL |

## Setup Instructions

### 1. GitHub Branch

The `staging` branch should mirror `main`. To sync:

```bash
git checkout staging
git merge main
git push origin staging
```

### 2. Neon Database Branch

1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Select your project
3. Click **Branches** → **New Branch**
4. Configure:
   - **Name:** `staging`
   - **Parent branch:** `main` (or your primary branch)
   - **Include data:** Yes (to copy existing data)
5. Click **Create Branch**

**Important:** Free tier branches expire after 24 hours. To extend:

- Go to branch → Settings → Modify or disable expiration

### 3. Vercel Environment Variables

1. Go to Vercel → Project Settings → Environment Variables
2. Add/update `DATABASE_URL` for **Preview** environment:
   - Copy the connection string from Neon staging branch
   - Use the **pooled** connection string (with `-pooler` in hostname)
   - Format: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

**Common issues:**

- No quotes around the value
- No extra spaces or newlines
- Remove `channel_binding=require` if present (Prisma doesn't support it)

### 4. Trigger Deployment

After setting up environment variables:

- Push to `staging` branch, OR
- Click "Redeploy" in Vercel dashboard

## Workflow

### Testing a Feature

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feat/my-feature

# 2. Develop and test locally

# 3. Push to staging for preview testing
git checkout staging
git merge feat/my-feature
git push origin staging

# 4. Test on staging preview URL

# 5. If approved, merge to main
git checkout main
git merge feat/my-feature
git push origin main
```

### Testing Migrations

The staging database is isolated from production:

1. Create migration locally
2. Push to staging branch
3. Vercel build runs `prisma migrate deploy` on staging DB
4. Verify migration works on staging
5. Merge to main for production deployment

## Maintenance

### Syncing Staging with Main

```bash
git checkout staging
git merge main
git push origin staging
```

### Refreshing Staging Database

If staging data gets stale or corrupted:

1. Delete the Neon staging branch
2. Create a new branch from main (inherits fresh data)
3. Update `DATABASE_URL` in Vercel if connection string changed

### Branch Expiration (Free Tier)

Neon free tier branches expire after 24 hours. Options:

1. **Extend manually** - Neon dashboard → Branch → Settings
2. **Upgrade plan** - Paid plans have longer/no expiration
3. **Recreate as needed** - Quick to set up from main branch

## Troubleshooting

### "Invalid URL" Error

- Check DATABASE_URL has no quotes or hidden characters
- Remove `channel_binding=require` parameter
- Ensure connection string is from Neon (not local)

### "DATABASE_URL is required" Error

- Verify DATABASE_URL is set for Preview environment in Vercel
- Check it's not set to Production only

### Migrations Not Applied

- Check Vercel build logs for migration output
- Verify `DIRECT_URL` is set if using connection pooling
- Run `npx prisma migrate status` locally pointing to staging DB

## Related Documentation

- [UPGRADE-PATH.md](./UPGRADE-PATH.md) - Migration and upgrade procedures
- [Neon Branching Docs](https://neon.tech/docs/introduction/branching)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
