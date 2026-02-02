# Database Seed Scripts

This directory contains modular database seeding scripts for the Artisan Roast application.

## Structure

- `index.ts` - Main orchestrator that runs all seed modules in order
- `settings.ts` - Site settings and configuration
- `categories.ts` - Product categories and labels
- `products.ts` - Coffee products with variants and pricing
- `users.ts` - Demo users and admin accounts
- `cms-pages.ts` - CMS pages with blocks (About, Café, FAQ, etc.)
- `synthetic-data.ts` - Realistic user behavior data for testing

## Usage

### Full Seed (Recommended)

Run all seed modules in the correct order:

```bash

npm run seed
```

### Selective Seeding

You can also run individual modules by importing them:

```typescript

import { seedProducts } from "./prisma/seed/products";

// In your script
await seedProducts(prisma);
```

## Seed Order

The modules run in this specific order to maintain data dependencies:

1. **Settings** - Creates site configuration and labels
2. **Categories** - Creates category structure (depends on settings)
3. **Products** - Creates products (depends on categories)
4. **Users** - Creates demo users
5. **CMS Pages** - Creates pages and blocks (depends on settings)
6. **Synthetic Data** - Creates realistic user activities, orders, and newsletter data (depends on users and products)

## Environment Variables

- `SEED_LOCATION_TYPE` - Set to "SINGLE" or "MULTI" to control café page layout
- `DATABASE_URL` - Database connection string (required)

## Data Types

### Products

- 30 specialty coffee products
- Multiple roast levels (light, medium, dark)
- Various origins and blends
- Subscription and one-time purchase options

### Users

- Demo user accounts
- Admin user for testing
- Sample customer profiles

### CMS Pages

- About page with hero, stats, and content blocks
- Café page with location information
- FAQ page with categorized questions
- Dynamic content based on location type setting

### Synthetic Data

- User activities and session tracking
- Realistic order history with line items
- Newsletter subscribers
- Anonymous user behavior patterns
- Comprehensive testing data for analytics and recommendations

## Development Notes

- All seed data uses `upsert` operations for safe re-running
- Images use placeholder URLs for demo purposes
- Block content is structured for the CMS editor
- Categories support hierarchical organization

## Troubleshooting

If seeding fails:

1. Check database connection
2. Ensure Prisma schema is up to date
3. Verify environment variables
4. Check for foreign key constraint issues

For partial seeding, comment out modules in `index.ts` and run individual functions.

## Seed Maintenance & Integrity Plan

- **Single source of truth:** Keep seed logic/data inside `prisma/seed/*.ts`; selective scripts should import these exports (no duplicate data files).
- **Selective seeding:** Use targeted scripts under `dev-tools/` that import specific seeders. Example (café only):
  - Command: `SEED_LOCATION_TYPE=SINGLE npx tsx dev-tools/seed-cafe-page.ts` (omit env var to use stored setting).
  - Source: `dev-tools/seed-cafe-page.ts` imports `seedCafePage` from `prisma/seed/cms-pages.ts`.
- **Before schema changes:** run a backup (`npm run db:backup`) and, if migrating, prefer `npm run db:safe-migrate` to capture/restore data if needed.
- **After schema changes:**
  1. Run `prisma generate` and migrations.
  2. Re-run seeds (full or selective) and fix any type errors or constraint issues immediately.
- **Validation loop:** After seeding, run lightweight checks (e.g., `npx tsx dev-tools/check-cafe-page.ts`) to confirm critical pages/blocks exist.
- **Environment flags:** Use `SEED_LOCATION_TYPE` to test SINGLE vs MULTI café layouts without editing seed code.
- **Idempotency:** All seeds use `upsert`; rerun is safe. Keep deterministic data to reduce drift.
- **Drift awareness:** If production data diverges from seed defaults, avoid running full seeds there; use selective scripts with caution.

## Restoring from Backup

- **Latest backup:** `npm run db:restore` restores from `dev-tools/backups/db-backup-latest.json` (auto written by `npm run db:backup` or `npm run build:safe`).
- **Specific backup:** `npx tsx dev-tools/restore-database.ts db-backup-2025-...json` to target a file inside `dev-tools/backups/`.
- **What happens:** Data is inserted table-by-table in FK-safe order using `createMany` with `skipDuplicates`. Existing rows remain; missing rows are rehydrated.
- **Environment:** Requires `DATABASE_URL` (e.g., in `.env.local`) and Neon WebSocket support; fails fast if the backup file is missing.
- **Safety:** Intended for lower envs. On production, validate the backup file and consider a read-only snapshot first.

## CI / Build-Time Integrity Hooks

- **Check backup coverage:** `npm run check:backup-models` ensures the backup table list matches current Prisma models (fast fail on schema drift).
- **Safe build option:** `npm run build:safe` runs backup coverage check → full backup → `npm run build`. Use this in CI or before deployments when you want a fresh backup and schema alignment verification.

## Testing Seeds by Module

- **Cafe only:** `SEED_LOCATION_TYPE=SINGLE npx tsx dev-tools/seed-cafe-page.ts` (or MULTI by default). Then verify with `npx tsx dev-tools/check-cafe-page.ts`.
- **CMS pages (all):** `npx tsx prisma/seed/index.ts` after temporarily commenting other modules in `index.ts` (if needed) or just rerun full seed.
- **Products/users/settings:** Create similar selective scripts that import the exported seeders (e.g., `seedProducts`, `seedUsers`, `seedSettings`). Pattern: import seeder, run, disconnect.
- **Synthetic data:** Rerun only after products/users exist; otherwise it will fail on FK references.
- **Smoke test after any seed:** hit key pages (about, cafe, faq) or use quick TS check scripts to ensure required blocks/pages exist.

## Known Limitations / When Seeds May Fail

- **Schema drift:** Adding/removing fields or changing enums without updating seed data will throw validation/constraint errors. Update seed inputs alongside schema changes.
- **Missing dependencies:** Synthetic data depends on users/products; CMS depends on settings. Running them out of order or with commented dependencies will fail.
- **Prod data safety:** Full seed overwrites page blocks (deleteMany + recreate). Do not run full CMS seeds on production unless you intend to reset that content.
- **Env/config:** Wrong or missing `DATABASE_URL`, or incorrect `SEED_LOCATION_TYPE` can cause failures or unexpected layouts.
- **Non-deterministic additions:** Avoid random values in seeds; otherwise repeated runs can introduce drift or uniqueness conflicts.
