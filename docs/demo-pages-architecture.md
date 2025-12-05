# Demo Pages Architecture

## Context

We are in active development of an e-commerce platform for coffee shop owners. The app is not yet in production with real users.

## The Two Types of Pages

### 1. Demo Pages (Developer Use Case)

**Purpose:** Showcase features and functionality during development

**Characteristics:**

- Created by developers for demos, testing, and stakeholder presentations
- Use simple static content (HTML in `content` field)
- Don't require the full CMS block system
- Examples: About Us, Cafe Info, Brewing Guides, FAQ
- Temporary - exist to demonstrate the app's capabilities

**Rendering:**

- Stored in `Page.content` field as HTML string
- Rendered with simple `dangerouslySetInnerHTML` or converted to a basic block
- Fast to create, easy to update

### 2. Shop Owner Pages (Production Use Case)

**Purpose:** Actual CMS functionality for end users (coffee shop owners)

**Characteristics:**

- Created by shop owners through the admin interface
- Use the flexible block system (hero, richText, images, galleries, etc.)
- Full layout options (SINGLE_COLUMN, TWO_COLUMN, LOCATION_INFO, etc.)
- Examples: Custom pages that shop owners will create for their businesses
- Production feature - the real product we're building

**Rendering:**

- Stored as blocks in the `Block` table
- Rendered through `PageContent` → layout renderers → block components
- Flexible, powerful, but requires more setup

## Why This Matters

**We don't need to expose the static content system to shop owners.** The block-based CMS is the product feature they'll use. The static demo pages are just scaffolding for development.

## Current Implementation

```
Page Model:
  ├── content: String         // For demo pages (developer use)
  ├── blocks: Block[]         // For CMS pages (shop owner use)
  └── type: PageType          // Determines layout renderer
```

**Rendering Logic (PageContent.tsx):**

```typescript
if (blocks.length === 0) {
  // Option A: Show "Content coming soon" (current)
  // Option B: Fallback to page.content if it exists (hybrid)
  // Option C: Auto-convert content to richText block (implicit)
}
```

## Architectural Decision

### Option: Hybrid Fallback (Recommended for Development)

**Implementation:**

1. If `blocks.length > 0` → render with block system (shop owner path)
2. If `blocks.length === 0` AND `page.content` exists → render static content (demo path)
3. If both empty → show "Content coming soon"

**Benefits:**

- Demo pages work immediately with simple HTML content
- Block system available when needed for testing/demos
- Clean separation of concerns
- No migration needed during development

**Code Change:**

```typescript
// PageContent.tsx
export function PageContent({ blocks, pageType, pageTitle, legacyContent }: PageContentProps) {
  const layoutRenderer = getLayoutRenderer(pageType);

  // No blocks? Check for legacy static content
  if (blocks.length === 0) {
    if (legacyContent) {
      return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight mb-8">{pageTitle}</h1>
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: legacyContent }}
          />
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{pageTitle}</h1>
        <p className="text-xl text-muted-foreground">Content coming soon.</p>
      </div>
    );
  }

  return <>{layoutRenderer(blocks)}</>;
}
```

## Future Migration Path

**When Ready for Production:**

1. Convert important demo pages to blocks (or delete them)
2. Deprecate `Page.content` field in schema
3. Remove fallback rendering logic
4. All pages use block system only

**Migration Script:**

```typescript
// dev-tools/migrate-static-to-blocks.ts
// Converts page.content HTML into richText blocks
```

## Summary

- **Demo pages** = temporary developer content using `content` field
- **CMS pages** = production feature using blocks system
- **Keep both paths during development** for flexibility
- **Remove static content path before production launch**
- **Shop owners never see or need the static content option**

---

_Last Updated: December 5, 2025_
