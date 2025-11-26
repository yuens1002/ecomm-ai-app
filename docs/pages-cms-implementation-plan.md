# Pages CMS Implementation Plan - v0.27.0

**Branch**: `feat/pages-cms-with-ai-wizard`  
**Started**: November 26, 2025  
**Target**: v0.27.0

---

## Scope

Build a simple, AI-powered content management system for informational pages with these features:

1. **Page Model** - Database schema with parent/child hierarchy
2. **AI Q&A Wizard** - Interview flow to generate About page content
3. **Admin CRUD** - Create, read, update, delete pages
4. **Rich Text Editor** - TipTap integration for content editing
5. **Dynamic Routes** - `/pages/[...slug]` for rendering pages
6. **Initial Content** - Seed 3 pages: About, Café, Brewing Guides

---

## Implementation Checklist

### Phase 1: Database & Models ✅ / ❌

- [ ] Add `Page` model to Prisma schema
- [ ] Create database migration
- [ ] Run migration
- [ ] Update seed file with example pages
- [ ] Test seed data

**Files to modify:**

- `prisma/schema.prisma`
- `prisma/seed.ts`

**Acceptance Criteria:**

- Page table exists with all fields
- Can seed About, Café, and Brewing Guides pages
- Parent/child relationships work correctly

---

### Phase 2: Frontend Dynamic Route ✅ / ❌

- [ ] Create `/app/pages/[...slug]/page.tsx`
- [ ] Build PageRenderer component
- [ ] Style with Tailwind prose classes
- [ ] Handle child pages display (grid)
- [ ] Add SEO metadata generation
- [ ] Handle 404 for unpublished/missing pages

**Files to create:**

- `app/pages/[...slug]/page.tsx`
- `components/page-renderer.tsx` (optional)

**Acceptance Criteria:**

- Can visit `/pages/about` and see content
- Hero image displays if present
- Child pages show as grid at bottom
- SEO meta tags populated
- 404 for unpublished pages

---

### Phase 3: Admin Pages List & CRUD ✅ / ❌

#### 3a. Pages List View

- [ ] Create `/app/admin/pages/page.tsx`
- [ ] Display all pages in table/list
- [ ] Show publish status, last updated
- [ ] Filter by published/draft
- [ ] Search by title
- [ ] Add "New Page" button with options:
  - Create manually
  - Create with AI wizard (About page)

**Files to create:**

- `app/admin/pages/page.tsx`

**Acceptance Criteria:**

- List shows all pages with status
- Can filter and search
- Links to edit/view/delete work

#### 3b. Manual Page Creation

- [ ] Create `/app/admin/pages/new/page.tsx`
- [ ] Form with all fields (title, slug, parent, hero image, content, meta description)
- [ ] Slug auto-generates from title (editable)
- [ ] Parent page dropdown
- [ ] Hero image upload (use existing FileUpload component)
- [ ] Rich text editor (TipTap)
- [ ] Show in footer checkbox
- [ ] Save draft / Publish buttons

**Files to create:**

- `app/admin/pages/new/page.tsx`
- `components/admin/TipTapEditor.tsx` (rich text editor wrapper)

**Dependencies:**

- Install TipTap: `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link`

**Acceptance Criteria:**

- Can create page manually
- Slug validation (unique, URL-safe)
- Draft saves without publishing
- Hero image uploads successfully

#### 3c. Page Edit

- [ ] Create `/app/admin/pages/[id]/edit/page.tsx`
- [ ] Same form as create, pre-populated
- [ ] Show publishing status indicator
- [ ] Add "View Live" button (if published)
- [ ] Add "Delete" button with confirmation
- [ ] Save changes / Publish updates

**Files to create:**

- `app/admin/pages/[id]/edit/page.tsx`

**Acceptance Criteria:**

- Can edit existing page
- Changes save correctly
- Can change publish status
- Delete works with confirmation

---

### Phase 4: AI About Page Wizard ✅ / ❌

#### 4a. Wizard UI

- [ ] Create `/app/admin/pages/new/wizard/page.tsx`
- [ ] Build 10 question components (one per screen)
- [ ] Progress indicator (step X of 10, section indicators)
- [ ] Form validation per question
- [ ] Save answers to state
- [ ] Back/Next navigation
- [ ] Character counters for textareas
- [ ] File upload for founder photo

**Questions to implement** (see `ai-wizard-questions-reference.md`):

1. Founding inspiration (textarea, 500 chars)
2. Year founded + milestones (text + textarea)
3. Founder name, title, photo (text + text + file)
4. Core values (multi-select checkboxes)
5. Unique differentiator (textarea, 400 chars)
6. Roasting philosophy (textarea, 300 chars, optional)
7. Sourcing locations (text, 200 chars)
8. Physical location (radio + conditional fields)
9. Brand personality (dropdown)
10. Brand quote (textarea, 200 chars, optional)

**Files to create:**

- `app/admin/pages/new/wizard/page.tsx`
- `components/admin/wizard/QuestionCard.tsx`
- `components/admin/wizard/ProgressIndicator.tsx`
- `lib/types/wizard.ts` (TypeScript interfaces)

**Acceptance Criteria:**

- Can navigate through all 10 questions
- Validation prevents advancing with invalid data
- Progress indicator shows current position
- Back button works (except step 1)
- Answers stored correctly

#### 4b. AI Generation API

- [ ] Create `/app/api/admin/pages/generate-about/route.ts`
- [ ] Build system prompt and user prompt templates
- [ ] Integrate Gemini API
- [ ] Generate 3 variations (story-first, values-first, product-first)
- [ ] Clean HTML output (remove markdown fences)
- [ ] Error handling and retries
- [ ] Return all 3 variations + original prompt

**Files to create:**

- `app/api/admin/pages/generate-about/route.ts`
- `lib/prompts/about-page-generator.ts` (prompt templates)

**Acceptance Criteria:**

- API receives answers and returns 3 HTML variations
- Generation completes in < 15 seconds
- Error handling returns useful messages
- Prompts stored for regeneration

#### 4c. Variation Selector & Review

- [ ] Create variation selector UI (after generation)
- [ ] Display 3 variations with titles/descriptions
- [ ] Preview each variation (line-clamp)
- [ ] "Use This One" buttons
- [ ] "Regenerate" option
- [ ] Redirect to edit page with selected content
- [ ] Pre-populate title, slug, hero image if uploaded

**Files to create:**

- `components/admin/wizard/VariationSelector.tsx`

**Acceptance Criteria:**

- Shows all 3 variations clearly
- Can select one and proceed to edit
- Regeneration works
- Selected content loads in editor

---

### Phase 5: Migration & Testing ✅ / ❌

#### 5a. About Page Migration

- [ ] Create About page content via AI wizard (demo)
- [ ] Update `/app/about/page.tsx` to fetch from Page model
- [ ] Keep fallback to static content (with feature flag)
- [ ] Add `ENABLE_DYNAMIC_ABOUT` environment variable
- [ ] Test both modes (static and dynamic)

**Files to modify:**

- `app/about/page.tsx`
- `.env.local` (add flag)

**Acceptance Criteria:**

- About page works with dynamic content
- Can toggle via environment variable
- Fallback works if page not found

#### 5b. Integration Testing

- [ ] TypeScript compilation (`npm run typecheck`)
- [ ] Build test (`npm run build`)
- [ ] Create all 3 initial pages via admin:
  - About page (via wizard)
  - Café page (manual)
  - Brewing Guides parent page (manual)
- [ ] Test navigation from footer
- [ ] Test SEO meta tags
- [ ] Test mobile responsive

**Acceptance Criteria:**

- No TypeScript errors
- Production build succeeds
- All pages render correctly
- SEO tags present
- Mobile layout works

---

## Dependencies to Install

```bash
# TipTap rich text editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder

# Additional extensions (if needed)
npm install @tiptap/extension-heading @tiptap/extension-bold @tiptap/extension-italic
```

---

## Database Schema

```prisma
model Page {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String

  // Content
  heroImage       String?
  content         String   @db.Text

  // Hierarchy
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

  // AI Generation
  generatedBy      String?
  generationPrompt Json?
  generatedAt      DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([slug])
  @@index([parentId])
}
```

---

## File Structure

```
app/
  about/
    page.tsx                           [MODIFIED - fetch from Page model]
  pages/
    [...slug]/
      page.tsx                         [NEW - dynamic route renderer]
  admin/
    pages/
      page.tsx                         [NEW - list all pages]
      new/
        page.tsx                       [NEW - manual creation form]
        wizard/
          page.tsx                     [NEW - AI wizard]
      [id]/
        edit/
          page.tsx                     [NEW - edit form]
  api/
    admin/
      pages/
        generate-about/
          route.ts                     [NEW - AI generation endpoint]

components/
  admin/
    TipTapEditor.tsx                   [NEW - rich text editor]
    wizard/
      QuestionCard.tsx                 [NEW - wizard question component]
      ProgressIndicator.tsx            [NEW - progress bar]
      VariationSelector.tsx            [NEW - choose AI variation]

lib/
  prompts/
    about-page-generator.ts            [NEW - AI prompt templates]
  types/
    wizard.ts                          [NEW - wizard TypeScript types]

prisma/
  schema.prisma                        [MODIFIED - add Page model]
  seed.ts                              [MODIFIED - seed pages]
```

---

## Testing Plan

### Unit Tests (Optional for v0.27.0)

- Slug generation from title
- Prompt building from wizard answers
- HTML sanitization

### Integration Tests

- [ ] Create page via admin → renders at `/pages/slug`
- [ ] AI wizard → generates content → saves as page
- [ ] Edit page → changes appear live
- [ ] Delete page → 404 on frontend
- [ ] Parent/child pages → grid displays correctly

### Manual Testing Checklist

- [ ] Create About page via wizard with all fields filled
- [ ] Create About page via wizard with minimum fields
- [ ] Create Café page manually
- [ ] Create Brewing Guides parent page
- [ ] Edit page and verify changes
- [ ] Delete draft page
- [ ] Publish draft page
- [ ] Unpublish published page
- [ ] Test footer navigation to pages
- [ ] Test SEO tags in page source
- [ ] Test hero image display
- [ ] Test child pages grid
- [ ] Mobile responsive on all pages

---

## Risks & Mitigations

| Risk                          | Impact | Mitigation                                   |
| ----------------------------- | ------ | -------------------------------------------- |
| TipTap integration complexity | Medium | Use starter kit, defer advanced features     |
| AI generation quality         | High   | Test prompts extensively, allow regeneration |
| Slug conflicts                | Low    | Validate uniqueness, show error message      |
| Large content performance     | Low    | Use `@db.Text`, consider pagination later    |
| Migration breaking About page | Medium | Feature flag with fallback                   |

---

## Success Criteria

- [ ] Can create About page via AI in < 10 minutes
- [ ] Generated content requires < 20% editing
- [ ] Manual page creation takes < 5 minutes
- [ ] All pages load in < 1 second
- [ ] No TypeScript errors
- [ ] Production build succeeds
- [ ] Mobile responsive
- [ ] SEO tags present

---

## Timeline Estimate

- **Phase 1** (Database): 0.5 day
- **Phase 2** (Frontend route): 0.5 day
- **Phase 3** (Admin CRUD): 1.5 days
- **Phase 4** (AI wizard): 1.5 days
- **Phase 5** (Migration & testing): 0.5 day

**Total**: 4-5 days

---

## Next Steps

1. ✅ Create feature branch
2. ✅ Create implementation plan (this doc)
3. ⏭️ Start Phase 1: Add Page model to schema
4. ⏭️ Create migration and run
5. ⏭️ Update seed file

**Ready to start Phase 1!**
