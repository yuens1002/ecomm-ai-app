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
