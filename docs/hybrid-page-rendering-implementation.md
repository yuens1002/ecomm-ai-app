# Hybrid Page Rendering Implementation

## Overview

Implement fallback rendering for pages that have static HTML content but no blocks. This allows demo pages to display their `content` field while keeping the block system as the primary rendering path.

## Goals

- ✅ Pages with blocks render using the block system (primary path)
- ✅ Pages without blocks fallback to `content` field if it exists (demo path)
- ✅ Empty pages show "Content coming soon" message
- ✅ No changes to admin UI or page creation flow
- ✅ Easy to remove later when migrating to blocks-only

## Implementation Steps

### 1. Update Page Query in Route

**File:** `app/(site)/pages/[...slug]/page.tsx`

**Change:** Include `content` field when fetching page

```typescript
async function getPage(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isPublished: true },
        orderBy: { createdAt: "asc" },
      },
    },
    // Add content field to select
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      content: true, // ← Add this
      isPublished: true,
      metaDescription: true,
      children: true,
    },
  });

  return page;
}
```

**Note:** Currently uses `include`, need to switch to `select` or explicitly request all fields

### 2. Pass Content to PageContent Component

**File:** `app/(site)/pages/[...slug]/page.tsx`

**Change:** Pass `page.content` to `PageContent`

```typescript
export default async function Page({ params, searchParams }: PageProps) {
  // ... existing code ...

  return (
    <div className="min-h-screen bg-background">
      <PreviewBannerSetter show={showPreviewBanner} />

      <PageContent
        blocks={visibleBlocks}
        pageType={page.type}
        pageTitle={page.title}
        legacyContent={page.content}  // ← Add this
      />

      {/* Child Pages Grid */}
      {/* ... existing code ... */}
    </div>
  );
}
```

### 3. Update PageContent Interface and Logic

**File:** `app/(site)/pages/[...slug]/PageContent.tsx`

**Changes:**

```typescript
interface PageContentProps {
  blocks: Block[];
  pageType: PageType;
  pageTitle: string;
  legacyContent?: string | null;  // ← Add this
}

export function PageContent({
  blocks,
  pageType,
  pageTitle,
  legacyContent
}: PageContentProps) {
  const layoutRenderer = getLayoutRenderer(pageType);

  // No blocks? Check for legacy static content
  if (blocks.length === 0) {
    // Fallback to static HTML content if it exists
    if (legacyContent && legacyContent.trim()) {
      return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight mb-8">
            {pageTitle}
          </h1>
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: legacyContent }}
          />
        </div>
      );
    }

    // No blocks and no content - show empty state
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {pageTitle}
        </h1>
        <p className="text-xl text-muted-foreground">
          Content coming soon.
        </p>
      </div>
    );
  }

  // Has blocks - use block system (primary path)
  return <>{layoutRenderer(blocks)}</>;
}
```

## Testing Checklist

### Test Cases

- [ ] **Page with blocks only** → Renders using block system
- [ ] **Page with content only** → Renders static HTML with prose styling
- [ ] **Page with both blocks and content** → Renders blocks (blocks take priority)
- [ ] **Empty page (no blocks, no content)** → Shows "Content coming soon"
- [ ] **Legacy demo pages (About, Cafe, FAQ)** → Display existing content
- [ ] **New CMS pages** → Work as expected with blocks
- [ ] **Dark mode** → Prose styling adapts correctly
- [ ] **Mobile responsive** → Content displays properly on all screens

### Manual Testing

1. Visit `/pages/about` → Should show static content if it exists
2. Visit `/pages/brewing-guides` → Should show "Content coming soon"
3. Create new page with blocks → Should use block system
4. Edit existing page, add blocks → Should switch to block rendering
5. Check child pages grid → Still works regardless of rendering mode

## Edge Cases

### Content Sanitization

- Static HTML content is rendered with `dangerouslySetInnerHTML`
- Already stored in database (trusted content)
- Created by developers, not user input
- Consider adding HTML sanitization library if needed later

### Layout Types

- Legacy content ignores `page.type` (doesn't use layout renderers)
- Always renders in simple container with prose styling
- If specific layout needed, should use blocks instead

### SEO Implications

- Both rendering paths support the same metadata
- No impact on `generateMetadata()` function
- Both paths render semantic HTML

## Future Migration Path

When ready to remove legacy content support:

### Phase 1: Audit

```typescript
// dev-tools/audit-legacy-content.ts
// Find all pages with content but no blocks
const pagesWithLegacyContent = await prisma.page.findMany({
  where: {
    content: { not: null },
  },
  include: {
    _count: {
      select: { blocks: true },
    },
  },
});

// Filter pages with content but zero blocks
const legacyPages = pagesWithLegacyContent.filter(
  (p) => p._count.blocks === 0 && p.content
);
```

### Phase 2: Migrate

```typescript
// dev-tools/migrate-static-to-blocks.ts
// Convert page.content HTML into richText blocks
for (const page of legacyPages) {
  await prisma.block.create({
    data: {
      pageId: page.id,
      type: "richText",
      order: 0,
      content: {
        html: page.content,
      },
    },
  });
}
```

### Phase 3: Remove

1. Remove `legacyContent` prop from `PageContent`
2. Remove fallback rendering logic
3. Optional: Remove `content` field from schema (breaking change)
4. Update documentation

## Acceptance Criteria

- ✅ Existing demo pages display their static content
- ✅ New pages with blocks use block system
- ✅ Empty pages show appropriate message
- ✅ No regression in block-based page rendering
- ✅ No performance impact
- ✅ Dark mode works correctly
- ✅ Mobile responsive
- ✅ SEO metadata unchanged

## Files to Modify

1. `app/(site)/pages/[...slug]/page.tsx` - Update query and props
2. `app/(site)/pages/[...slug]/PageContent.tsx` - Add fallback logic

## Estimated Effort

- **Implementation:** 30 minutes
- **Testing:** 20 minutes
- **Total:** ~1 hour

## Dependencies

None - uses existing infrastructure

## Notes

- This is a temporary solution for development
- Should be removed before production launch
- Does not expose legacy content system to admin UI
- Shop owners will only see and use the block system

---

**Status:** Backlog  
**Priority:** Low (quality of life improvement)  
**Created:** December 5, 2025
