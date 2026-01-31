# Marketing Content Architecture Decision

## Context

During v0.26.0 development, we needed to make marketing copy (section headings, CTAs, descriptions) configurable to support full white-label capability. The question arose: should this content be stored as feature-specific models or as generic site settings?

## Analysis

### Option A: Feature-Based Models

Create dedicated database models for each feature section:

```json

model FeaturedSection {
  id          String  @id @default(cuid())
  heading     String  @default("Our Small Batch Collection")
  isEnabled   Boolean @default(true)
  order       Int     @default(0)
}

model RecommendationsSection {
  id                      String  @id @default(cuid())
  personalizedHeading     String  @default("Recommended For You")
  trendingHeading         String  @default("Trending Now")
  trendingDescription     String  @default("Discover what other coffee lovers are enjoying")
  exploreAllText          String  @default("Explore All Coffees")
  isEnabled               Boolean @default(true)
}
```

**Pros:**

- Can enable/disable entire sections
- Supports multiple instances (e.g., multiple featured sections)
- Feature-specific configuration (order, filters, max items)
- Dedicated admin UI per feature
- More structured and type-safe

**Cons:**

- More complex database schema
- Requires more admin UI development
- Harder to manage for simple text changes
- Migration path more complex if expanding features

### Option B: Generic SiteSettings (Chosen)

Extend existing `SiteSettings` key-value table with marketing content:

```json

model SiteSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

Settings keys:

- `homepage_featured_heading`
- `homepage_recommendations_trending_heading`
- `homepage_recommendations_trending_description`
- `homepage_recommendations_personalized_heading`
- `homepage_recommendations_explore_all_text`
- `footer_categories_heading`
- `footer_quick_links_heading`

**Pros:**

- Leverages existing infrastructure (already built for branding)
- Simple key-value storage
- Easy to add/modify settings
- Single "Marketing Content" admin tab
- Consistent with existing branding approach
- Lightweight and performant

**Cons:**

- No type safety at database level
- Can't easily enable/disable sections
- Single instance only (but that's all we need now)
- Less structured for complex features

## Decision

**We chose Option B: Generic SiteSettings**

### Rationale

1. **Current Requirements**: We only need 1:1 mapping of text to homepage sections—no multiple instances or complex feature configuration needed.

2. **Consistency**: We already successfully implemented store branding (name, logo, tagline) using `SiteSettings`. Maintaining this pattern keeps the codebase predictable.

3. **Simplicity**: These are purely cosmetic text changes. Adding database models would be over-engineering for the current use case.

4. **Developer Experience**: Simpler to implement, test, and maintain. One admin UI section vs. multiple feature-specific UIs.

5. **Migration Path**: Easy to migrate to Option A later if requirements change (multiple featured sections, complex feature flags, etc.). The reverse migration would be harder.

6. **Naming Convention**: Used scoped prefixes (`homepage_`, `footer_`) to keep settings organized and allow future expansion without conflicts.

## Implementation Details

### Settings Added

- `homepage_featured_heading` - Featured products section heading
- `homepage_recommendations_trending_heading` - Trending recommendations heading
- `homepage_recommendations_trending_description` - Trending recommendations subheading
- `homepage_recommendations_personalized_heading` - Personalized recommendations heading
- `homepage_recommendations_explore_all_text` - CTA text to view all products
- `footer_categories_heading` - Footer categories section heading
- `footer_quick_links_heading` - Footer quick links section heading

### Components Updated

- `FeaturedProducts.tsx` - Uses `useSiteSettings()` for heading
- `RecommendationsSection.tsx` - Uses `useSiteSettings()` for all dynamic text
- `SiteFooter.tsx` - Fetches marketing settings server-side
- `FooterCategories.tsx` - Accepts heading as prop

### Infrastructure

- Extended `SiteSettings` interface in `useSiteSettings.ts`
- Updated `/api/settings/public` to include marketing content
- Added seed data with default values matching original hardcoded text
- Maintained caching and performance characteristics

## Benefits Delivered

- **Full white-label capability** for homepage marketing copy
- **No code changes needed** to customize section headings
- **Scoped naming convention** (`homepage_`, `footer_`) for future expansion
- **Maintains consistent architecture** with existing branding system

## Future Considerations

If we need to add:

- Multiple featured sections per page
- Section enable/disable functionality
- Complex feature configuration (filters, limits, ordering)
- Section-specific analytics or A/B testing

Then we should revisit Option A (feature-based models) for those specific features while keeping simple text settings in `SiteSettings`.

---

**Decision Date**: November 26, 2025  
**Version**: v0.26.0  
**Status**: Implemented
