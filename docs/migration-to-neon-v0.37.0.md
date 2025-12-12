# Migration Guide: Local PostgreSQL → Neon DB (v0.37.0)

## Overview
This guide covers migrating your Artisan Roast application from a local Docker PostgreSQL instance to Neon's serverless PostgreSQL for production deployment.

## Pre-Migration Checklist

- [ ] Verify local database is working correctly
- [ ] Run all tests: `npm test`
- [ ] Create database backup: `npm run db:backup`
- [ ] Verify backup coverage: `npm run check:backup-models`
- [ ] Commit all pending changes
- [ ] Tag current version: `v0.37.0`

## Step 1: Backup Local Database

```bash
# Create a timestamped backup
npm run db:backup

# Backup will be saved to: dev-tools/backups/backup-YYYY-MM-DD-HH-MM-SS.json
```

## Step 2: Set Up Neon Database

1. **Create Neon Project** (if not already done):
   - Go to https://console.neon.tech
   - Create a new project
   - Select your preferred region (closest to your users)
   - Note the connection string

2. **Get Connection Details**:
   - Connection string format: `postgresql://[user]:[password]@[endpoint]/[dbname]?sslmode=require`
   - Neon automatically includes WebSocket support in the endpoint URL

## Step 3: Update Environment Variables

1. **Update `.env.local`**:
```env
# Replace your local Docker connection
# OLD:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/artisan_roast?schema=public"

# NEW: Neon connection
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require"

# Set database adapter (Neon uses @neondatabase/serverless)
DATABASE_ADAPTER="neon"

# Optional: Neon-specific optimizations
# These are automatically detected when the URL contains "neon.tech"
```

2. **Environment-Specific Settings**:
```env
# Development
NODE_ENV=development

# Production (Vercel)
NODE_ENV=production
VERCEL_ENV=production
```

## Step 4: Run Migrations on Neon

```bash
# Generate Prisma Client for Neon adapter
npx prisma generate

# Push schema to Neon database
# This creates all tables, indexes, and constraints
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

## Step 5: Seed Neon Database

```bash
# Run full seed with all data
npm run seed

# Or seed specific modules
npm run seed:settings
npm run seed:categories
npm run seed:products
npm run seed:pages
```

### Seed Configuration Options

```env
# Control seed behavior
SEED_LOCATION_TYPE=SINGLE    # or MULTI for multiple café locations
SEED_WEIGHT_UNIT=imperial    # or metric
SEED_INCLUDE_MERCH=true      # Include merchandise products
```

## Step 6: Verify Migration

### 1. Check Database Connection
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT NOW();"
```

### 2. Verify Schema
```bash
# Open Prisma Studio
npm run studio

# Check:
# - All tables exist
# - Data is populated
# - Relationships are correct
```

### 3. Run Application Tests
```bash
# Run full test suite
npm test

# Run specific integration tests
npm test -- --testPathPattern=integration
```

### 4. Test Locally Against Neon
```bash
# Start dev server
npm run dev

# Test key features:
# - [ ] Browse products by category
# - [ ] Category navigation (header/footer/mobile)
# - [ ] Category label icons display
# - [ ] Expand/collapse categories
# - [ ] Search functionality
# - [ ] Add to cart
# - [ ] Checkout process
# - [ ] Admin panel access
```

## Step 7: Deploy to Production

### Option A: Vercel Deployment

1. **Set Environment Variables in Vercel**:
   - Go to your project settings
   - Add `DATABASE_URL` with Neon connection string
   - Add `DATABASE_ADAPTER=neon`
   - Add all other required env vars (Stripe, Auth, etc.)

2. **Deploy**:
```bash
# Via Vercel CLI
vercel --prod

# Or push to main branch (auto-deploy)
git checkout main
git merge feat/public-site-menu-display
git push origin main
```

### Option B: Manual Deployment

1. Build application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## Neon-Specific Considerations

### Connection Pooling
Neon handles connection pooling automatically. The Prisma adapter for Neon uses HTTP/WebSocket connections, which are more efficient than traditional connection pools.

### Query Performance
- Neon has slightly higher latency than local PostgreSQL (~10-50ms)
- Use `@neondatabase/serverless` adapter for optimal performance
- Enable Neon's autoscaling for better performance under load

### Backup Strategy
```bash
# Regular backups (add to cron/scheduled job)
npm run db:backup

# Store backups in cloud storage (S3, Vercel Blob, etc.)
# Or use Neon's built-in point-in-time recovery
```

### Branching (Neon Feature)
Neon supports database branching for each PR:
```bash
# Create a branch for development
neon branches create --project-id [project-id] --name dev-feature-x

# Use branch-specific connection string in PR preview
```

## Rollback Plan

If migration fails or issues arise:

### 1. Restore to Local Docker
```bash
# Switch back to local connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/artisan_roast?schema=public"

# Restore from backup if needed
npm run db:restore -- dev-tools/backups/backup-YYYY-MM-DD-HH-MM-SS.json
```

### 2. Verify Local Functionality
```bash
npm run dev
# Test all critical features
```

### 3. Investigate Issues
- Check Neon logs in console
- Review Prisma query logs
- Compare schema differences

## Post-Migration Tasks

- [ ] Update documentation with new database setup
- [ ] Configure backup automation (cron job or GitHub Actions)
- [ ] Set up monitoring for Neon database
- [ ] Update team documentation
- [ ] Test all API endpoints
- [ ] Monitor error logs for 24-48 hours
- [ ] Update `.env.example` with Neon connection template

## Common Issues & Solutions

### Issue: Connection timeout
**Solution**: Ensure `sslmode=require` is in connection string. Neon requires SSL.

### Issue: Prisma Client errors
**Solution**: Regenerate client: `npx prisma generate`

### Issue: Missing tables after migration
**Solution**: Run `npx prisma db push` or `npx prisma migrate deploy`

### Issue: Seed fails with foreign key errors
**Solution**: Check seed order in `prisma/seed/index.ts`. Dependencies: settings → categories → products → users → pages

### Issue: Slow queries
**Solution**: 
- Check indexes in schema.prisma
- Use Neon's query analyzer
- Consider enabling Neon's read replicas

## Support Resources

- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Project Backups**: `dev-tools/backups/`
- **Seed Documentation**: `prisma/seed/README.md`

## Version Compatibility

- **Node.js**: 18.x or higher
- **Prisma**: 6.1.0
- **@neondatabase/serverless**: ^0.10.7
- **@prisma/adapter-neon**: ^6.1.0

## Migration Complete! 🎉

Once verified, your application is now running on Neon's serverless PostgreSQL with:
- ✅ Weight-balanced category navigation
- ✅ Category label icons
- ✅ Full seed data
- ✅ All migrations applied
- ✅ Production-ready database
