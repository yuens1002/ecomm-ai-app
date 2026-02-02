# Database Backup & Restore System

## Overview

This system provides reliable backup and restore functionality for your Neon PostgreSQL database, essential for safe database migrations and disaster recovery.

## Quick Start

### Safe Migration Workflow (Recommended)

The easiest way to perform a migration with automatic backup:

```powershell
npm run db:safe-migrate
```

This interactive script will:

1. ✅ Backup all database data
2. ✅ Run pending migrations
3. ✅ Optionally restore data (you'll be prompted)

### Manual Commands

#### Backup Database

```powershell
npm run db:backup
```

Creates two backup files:

- `dev-tools/backups/db-backup-{timestamp}.json` - Timestamped backup
- `dev-tools/backups/db-backup-latest.json` - Latest backup (for easy restoration)

#### Restore Database

```powershell
# Restore from latest backup
npm run db:restore

# Restore from specific backup
npx tsx dev-tools/restore-database.ts db-backup-2025-11-25T12-30-45-123Z.json
```

## Use Cases

### 1. Before Schema Migration

**Scenario**: Adding new fields to your database schema

```powershell
# 1. Backup current data
npm run db:backup

# 2. Create migration
npx prisma migrate dev --name add_new_field

# 3. If something goes wrong, restore
npm run db:restore
```

### 2. Before Adding Settings

**Scenario**: Adding new site settings that need to be populated

```powershell
# Automated workflow
npm run db:safe-migrate
```

The script will:

- Backup existing data
- Run migration
- Ask if you want to restore data (useful if migration adds new required fields)

### 3. Testing Data Changes

**Scenario**: Testing a data transformation script

```powershell
# 1. Backup
npm run db:backup

# 2. Run your transformation script
npx tsx scripts/transform-data.ts

# 3. If results are bad, restore
npm run db:restore
```

### 4. Disaster Recovery

**Scenario**: Production database corruption or accidental deletion

```powershell
# List available backups
dir dev-tools/backups

# Restore from specific backup
npx tsx dev-tools/restore-database.ts db-backup-2025-11-25T10-00-00-000Z.json
```

## How It Works

### Backup Process

1. Connects to Neon database via Prisma
2. Fetches all records from all tables
3. Saves to JSON with proper timestamping
4. Creates both timestamped and "latest" versions

**Tables backed up**:

- Users & Authentication (user, account, session, verificationToken)
- Addresses
- Products (product, productImage, productVariant, category, categoriesOnProducts)
- Orders (order, orderItem)
- Subscriptions (subscription, subscriptionItem)
- Newsletter (newsletterSubscriber)
- Settings (siteSettings, socialLink)
- Analytics (userActivity)

### Restore Process

1. Reads backup file (JSON)
2. Connects to database
3. Restores tables in correct order (respects foreign keys)
4. Uses `createMany` with `skipDuplicates` for safety
5. Reports summary of restored records

**Restoration order** (important for foreign key constraints):

```text
user → account → session → address → category → product →
categoriesOnProducts → productVariant → order → orderItem →
subscription → siteSettings → socialLink → userActivity
```

## Important Notes

### ✅ What This System Does

- **Complete data backup**: All tables and records
- **Automated restoration**: Restores in correct order
- **Multiple backups**: Timestamped files prevent overwriting
- **Safe operations**: `skipDuplicates` prevents conflicts
- **Error handling**: Clear error messages and recovery instructions

### ⚠️ What This System Doesn't Do

- **Schema backup**: Doesn't backup table structure (handled by Prisma migrations)
- **Real-time sync**: Manual operation, not continuous
- **Production-ready**: Use Neon's built-in backups for production

### 🔒 Security Considerations

- Backup files contain sensitive data (emails, addresses, etc.)
- Files are stored locally in `dev-tools/backups/` (gitignored)
- **Never commit backup files to Git**
- For production, use Neon's Point-in-Time Recovery (PITR)

## Schema Change Compatibility

### ✅ Safe Scenarios (Restore Works Automatically)

**1. Adding new fields with defaults**

```json

// Before
model Product {
  id    String
  name  String
}

// After - NEW FIELD
model Product {
  id        String
  name      String
  featured  Boolean @default(false)
}
```

✅ Backup has old data → Migration adds field → Restore inserts old data, Prisma applies default

**2. Adding new tables**

```json

// NEW MODEL
model NewsletterSubscriber {
  id       String
  email    String
  isActive Boolean
}
```

✅ Backup has no newsletterSubscriber data → Migration creates table → Restore skips (no data)

**3. Removing fields**

```json

// Before
model Product {
  oldField String
}

// After - REMOVED
model Product {
  // oldField removed
}
```

✅ Backup has oldField data → Migration drops column → Restore ignores oldField (not in schema)

**4. Adding optional fields**

```json

model Product {
  description String?  // Optional, no default needed
}
```

✅ Works same as adding fields with defaults

**5. Making optional field required (with default)**

```json

// Before
model Product {
  featured Boolean?
}

// After
model Product {
  featured Boolean @default(false)
}
```

✅ Backup has nulls → Migration adds default → Restore works

### ⚠️ Requires Extra Steps

**1. Changing field types incompatibly**

```json

// Before
model Product {
  price Int
}

// After
model Product {
  price String  // Type changed
}
```

⚠️ Backup has integers → Restore fails → Write transformation script AFTER restore

**2. Renaming fields**

```json

// Before
model Product {
  productName String
}

// After
model Product {
  name String  // Renamed
}
```

⚠️ Appears as remove + add → Data lost → Use raw SQL migration to rename column

**3. Complex data transformations**

```json

// Before
model Product {
  deliverySchedule String  // "Every 2 weeks"
}

// After
model Product {
  billingInterval      BillingInterval
  billingIntervalCount Int
}
```

⚠️ Needs data parsing/transformation → Write custom migration script

**4. Adding required field without default**

```json

model Product {
  sku String  // Required, no default
}
```

⚠️ Restore fails (missing required value) → Add default OR populate data manually

### 💡 Why It Works

The restore system uses **Prisma's `createMany`**:

```json

await prisma[table].createMany({
  data: records,
  skipDuplicates: true,
});
```

Prisma automatically:

- ✅ Ignores fields in backup that don't exist in new schema
- ✅ Applies default values for new required fields
- ✅ Skips tables with no backup data
- ✅ Prevents duplicate key conflicts with `skipDuplicates`

### 📋 Pre-Migration Checklist

Before running `npm run db:safe-migrate`, verify:

- [ ] New required fields have `@default()` or are optional (`?`)
- [ ] Field renames use raw SQL `ALTER TABLE ... RENAME COLUMN`
- [ ] Type changes have transformation plan
- [ ] Complex migrations have separate data scripts

## Backup File Structure

```json

{
  "timestamp": ["2025-11-25T12:30:45.123Z"],
  "user": [
    { "id": "...", "email": "...", ... }
  ],
  "product": [
    { "id": "...", "name": "...", ... }
  ],
  ...
}
```

## Troubleshooting

### Migration Failed After Backup

```powershell
# Restore immediately
npm run db:restore
```

### Restore Fails with Foreign Key Errors

The script restores in the correct order, but if you see FK errors:

1. Check if schema has changed significantly
2. May need to restore tables individually
3. Consider using Prisma's reset: `npx prisma migrate reset`

### Backup File Not Found

```powershell
# Check available backups
dir dev-tools\backups

# Use specific backup
npx tsx dev-tools/restore-database.ts db-backup-YYYY-MM-DDTHH-MM-SS-SSSZ.json
```

### Database Connection Errors

Ensure your `.env.local` has correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

## Best Practices

1. **Always backup before migrations**

   ```powershell
   npm run db:backup
   npx prisma migrate dev --name your_migration

```

2. **Keep multiple backups**
   - Timestamped files are kept automatically
   - Manually archive important backups before major changes

3. **Test restoration regularly**
   - Create test database
   - Practice restore process
   - Verify data integrity

4. **Document schema changes**
   - Add comments to migrations
   - Note any manual data transformations needed

5. **Use safe-migrate for complex changes**
   ```powershell
   npm run db:safe-migrate
```

## Production Considerations

**For Production environments**:

- Use Neon's built-in backup features (PITR)
- Set up automated backup schedules
- Store backups in secure cloud storage
- Test disaster recovery procedures
- Consider read replicas for high availability

**This backup system is designed for**:

- Development environments
- Local testing
- Quick rollbacks during development
- Data preservation during schema changes

## File Locations

- Backup scripts: `dev-tools/backup-database.ts`, `dev-tools/restore-database.ts`
- Safe migrate: `dev-tools/safe-migrate.ts`
- Backups stored: `dev-tools/backups/` (gitignored)
- Latest backup: `dev-tools/backups/db-backup-latest.json`

## npm Scripts Reference

```powershell
# Backup database
npm run db:backup

# Restore from latest backup
npm run db:restore

# Interactive backup + migrate + restore workflow
npm run db:safe-migrate
```
