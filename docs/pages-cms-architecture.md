# Pages CMS Architecture Decision

## Date
November 26, 2025

## Context

The application needs a flexible content management system for informational pages (About, Café/Location, How-To Guides, FAQ) that:
- Allows store owners to create/edit content without code changes
- Supports white-label customization
- Works for 95% of specialty coffee e-commerce stores
- Can scale to include blog functionality later
- Must ship quickly for launch

## Problem Statement

Store owners need 3-5 informational pages beyond product listings:
1. **About Us** - Brand story, values, founder information
2. **Locations** - Café info, hours, map (if physical location)
3. **How-To Guides** - Brewing methods, care instructions, coffee education
4. **FAQ** - Common customer questions
5. **(Future) Blog** - Articles, news, announcements

Current state: Static React components require code changes for content updates.

## Options Considered

### Option A: Full Block-Based CMS
**Description**: Complex page builder with reusable content blocks (Hero, Grid, Tabs, Accordion, Timeline, etc.)

**Pros:**
- Maximum flexibility for page layouts
- Reusable components across pages
- Visual drag-and-drop editing capability
- Supports complex layouts (multi-column, nested content)
- Future-proof for advanced use cases

**Cons:**
- 2-3 week development timeline
- Complex admin UI (steeper learning curve)
- Overkill for most store owners' needs
- Harder to maintain
- Risk of scope creep

**Estimated Timeline**: 2-3 weeks

---

### Option B: Template-Based Pages
**Description**: Pre-built page templates with fill-in-the-blank sections

**Pros:**
- Fast to implement
- Easy for store owners to use
- Predictable layouts
- Low maintenance

**Cons:**
- Limited flexibility
- Requires new templates for each page type
- Hard to customize beyond templates
- Difficult to add new page types later

**Estimated Timeline**: 1 week

---

### Option C: Simple Rich Content Pages (SELECTED)
**Description**: Minimal page model with rich text editor + optional hero image + parent/child hierarchy

**Pros:**
- Fast to implement (3-4 days)
- Store owners already understand rich text editing
- Flexible enough for most content types
- Parent/child support enables sub-pages (brewing guides)
- Easy to extend later (add blocks, blog features)
- Low complexity = low maintenance
- Foundation for future CMS features

**Cons:**
- No pre-built layout components (yet)
- Store owners need basic HTML/formatting knowledge
- Less visual control than block-based system

**Estimated Timeline**: 3-4 days

---

## Decision: Option C - Simple Rich Content Pages

### Rationale

1. **Time Constraint**: Need to ship application soon; 3-4 days vs 2-3 weeks is critical
2. **User Needs**: 95% of coffee shops need simple text + images, not complex layouts
3. **Extensibility**: Architecture supports future enhancements (blocks, blog) without rewrite
4. **Risk**: Low technical risk, familiar UX patterns
5. **Validation**: Can test with real users and add complexity based on feedback

### Database Schema

```prisma
model Page {
  id              String   @id @default(cuid())
  slug            String   @unique  // about, cafe, brewing-v60
  title           String             // "About Us", "V60 Brewing Guide"
  
  // Content
  heroImage       String?            // Optional hero image URL
  content         String   @db.Text  // HTML or Markdown
  
  // Hierarchy (for sub-pages)
  parentId        String?
  parent          Page?    @relation("PageHierarchy", fields: [parentId], references: [id])
  children        Page[]   @relation("PageHierarchy")
  
  // Navigation
  showInFooter    Boolean  @default(false)
  footerOrder     Int?
  
  // SEO
  metaDescription String?
  
  // Publishing
  isPublished     Boolean  @default(false)
  publishedAt     DateTime?
  
  // AI Generation metadata (see AI wizard doc)
  generatedBy      String?   // "ai" | "manual"
  generationPrompt Json?     // Store Q&A answers for regeneration
  generatedAt      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([slug])
  @@index([parentId])
}
```

### Features Included

#### Phase 1: Core Pages System (v0.27.0)
- Page CRUD (Create, Read, Update, Delete)
- Rich text editor (TipTap)
- Hero image upload
- Parent/child page hierarchy
- SEO metadata
- Publish/draft status
- Footer navigation integration
- Dynamic `/pages/[...slug]` route

#### Phase 2: AI About Page Generator (v0.27.0)
- Interactive Q&A wizard for About page creation
- AI-powered content generation via Gemini
- Review & edit workflow
- See `ai-about-page-generator.md` for details

#### Future Enhancements (Post-Launch)
- Blog functionality (Post model extending Page concept)
- Advanced blocks (Accordion, Tabs, Timeline)
- Visual page builder
- Page templates
- Version history
- Multi-language support

### Use Cases Enabled

#### 1. About Page (`/pages/about`)
- Hero image (founder photo or café interior)
- Rich text with headings, paragraphs, inline images
- Generated via AI wizard or manual creation

#### 2. Café Location (`/pages/cafe`)
- Hero image (café exterior/interior)
- Address, hours (formatted as table)
- Embedded map (Google Maps iframe)
- Photo gallery
- "What to Expect" narrative section

#### 3. How-To Guides (`/pages/brewing`)
**Parent page** with overview and links to methods

**Child pages**:
- `/pages/brewing/v60` - V60 Pour Over guide
- `/pages/brewing/french-press` - French Press guide
- `/pages/brewing/espresso` - Espresso guide
- `/pages/brewing/cold-brew` - Cold Brew guide

Each guide includes:
- Hero image (brewing method photo)
- Equipment list
- Step-by-step instructions
- Tips & tricks
- Embedded YouTube video (optional)

#### 4. FAQ (`/pages/faq`)
- Rich text with formatted Q&A pairs
- Organized by sections (Shipping, Subscriptions, Returns)
- (Future: Convert to Accordion block for better UX)

### Menu Page Decision

**Question**: Should café menu be a dedicated model or just a page?

**Decision**: Start with **Page** (Option 1), upgrade later if needed

**Rationale**:
- Most stores have static menus that rarely change
- Rich text is sufficient for drinks/prices
- Can add structured `MenuItem` model later if:
  - Store needs to update prices frequently
  - Menu appears in multiple locations
  - Daily specials/availability tracking needed

**Menu as Page Example**:
```
/pages/menu
Hero: Café photo
Content: 
  <h2>Espresso Drinks</h2>
  <ul>
    <li><strong>Cappuccino</strong> - $4.50</li>
    <li><strong>Latte</strong> - $4.75</li>
  </ul>
```

### Migration Strategy

#### About Page Migration
**Option A: Hard Cut (Recommended)**
1. Create Page model
2. Build admin UI
3. Create "About" page content via admin (or AI wizard)
4. Update `/about/page.tsx` to fetch from Page model
5. Delete old static component code

**Timeline**: 2-3 days  
**Risk**: Low (just swapping data source)

#### Option B: Keep Current About, New Pages Only
1. Leave `/about` as-is (static)
2. New pages use `/pages/[slug]` route
3. Migrate About later (post-launch)

**Timeline**: 1-2 days  
**Risk**: Near zero, but creates tech debt

**Choice**: Option A (clean migration)

### Admin UI Flow

```
/admin/pages
  - List all pages (published/draft)
  - Filter by status, search by title
  - [+ New Page] → Choose:
    * Create from scratch
    * Use AI wizard (About page only initially)

/admin/pages/new
  - Title
  - Slug (auto-generated, editable)
  - Parent page (dropdown)
  - Hero image upload
  - Rich text editor (TipTap)
  - Meta description
  - Show in footer (checkbox)
  - [Save Draft] [Publish]

/admin/pages/[id]/edit
  - Same as new, with:
    * View live button
    * Delete button
    * Publishing status indicator
```

### Frontend Rendering

```typescript
// app/pages/[...slug]/page.tsx
- Dynamic route handles: /pages/about, /pages/brewing/v60, etc.
- Fetches page by slug from database
- Renders hero image (if present)
- Renders HTML content with prose styling
- Shows child pages as grid if parent
- 404 if not found or not published
```

## Implementation Plan

### Phase 1: Database & Models (Day 1)
- [ ] Add Page model to schema
- [ ] Create migration
- [ ] Run migration
- [ ] Seed with example pages

### Phase 2: Frontend Route (Day 1-2)
- [ ] Create `/pages/[...slug]/page.tsx`
- [ ] Build page renderer component
- [ ] Style with prose classes
- [ ] Handle child pages display
- [ ] Add metadata generation

### Phase 3: Admin CRUD (Day 2-3)
- [ ] Pages list view (`/admin/pages`)
- [ ] Create page form (`/admin/pages/new`)
- [ ] Edit page form (`/admin/pages/[id]/edit`)
- [ ] Integrate TipTap rich text editor
- [ ] Hero image upload with FileUpload component
- [ ] Publish/draft toggle
- [ ] Delete functionality

### Phase 4: AI Wizard (Day 3-4)
- [ ] Q&A wizard UI (`/admin/pages/new/wizard`)
- [ ] AI generation API route
- [ ] Review & edit screen
- [ ] See `ai-about-page-generator.md` for details

### Phase 5: Migration & Testing (Day 4)
- [ ] Migrate About page content
- [ ] Update About route to use Page model
- [ ] Test all pages, navigation, SEO
- [ ] TypeScript check, build test

## Future Enhancements (Post-Launch)

### Blog System (v0.30.0+)
```prisma
model Post {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  excerpt     String?
  content     String   @db.Text
  coverImage  String?
  
  // Blog-specific
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  tags        String[]
  category    String?
  
  isPublished Boolean  @default(false)
  publishedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Features**:
- Post list with pagination
- Tag/category filtering
- Author profiles
- RSS feed
- Comments (optional)
- Social sharing

### Advanced Blocks (v0.31.0+)
Add `PageBlock` model and renderer:
- Accordion
- Tabs
- Timeline
- Table
- Image Gallery
- Video Embed
- Product Showcase

### Visual Editor (v0.32.0+)
- Drag & drop interface
- Live preview
- Block library
- Page templates

## Success Metrics

**Launch (v0.27.0)**:
- [ ] Store owners can create About page via AI wizard in < 10 minutes
- [ ] 3+ informational pages live (About, Café, Brewing)
- [ ] Zero code deploys needed for content updates
- [ ] Page load time < 1 second
- [ ] Mobile-responsive rendering

**Post-Launch**:
- Track admin usage (pages created, AI wizard completion rate)
- Survey store owners on ease of use
- Monitor page view analytics
- Gather feature requests for blocks/blog

---

**Status**: Approved for implementation  
**Timeline**: 3-4 days (Phase 1-4)  
**Version**: v0.27.0  
**Next Steps**: Create feature branch `feat/pages-cms-with-ai-wizard`
