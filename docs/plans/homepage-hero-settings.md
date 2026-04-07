# Homepage Hero Settings — Plan

**Branch:** `feat/homepage-hero-settings`
**Base:** `feat/agentic-search` (depends on `HomeHero.tsx` and `Hero.tsx` introduced there)

---

## Context

The homepage currently shows a dark gradient placeholder. Shop owners have no way to configure the hero. This plan adds a full hero media configuration system supporting two modes — **image/carousel** or **video** (mutually exclusive) — with a 40/60 form/preview admin UI in Storefront Settings and storefront rendering for both modes.

**Mode boundary:** The admin UI makes the choice explicit — shop owner picks *either* image/carousel *or* video. Not both. The `homepageHeroType` field drives which upload UI is shown and how the storefront renders.

**Key constraints:**
- `/api/upload` is images-only (5 MB). Video upload needs a dedicated new route (`/api/upload/video`) using the existing `"hero"` BlobFolder (already defined in `lib/blob.ts`), with a 100 MB limit and `video/*` MIME validation.
- **LCP / Core Web Vitals**: raw `<video autoPlay>` blocks first paint — the video file must download before anything paints. Mitigation: require a `videoPosterUrl` (a static image uploaded alongside the video); set `poster` attribute + `preload="none"` on the `<video>` element so the poster paints immediately and the video streams in behind it. For carousel, only the first slide gets `priority` on `<Image>`; remaining slides lazy-load.

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for homepage-hero-settings` | — |
| 1 | `feat: extend site-settings with hero media keys and data mapping` | Low |
| 2 | `feat: add hero-media settings API and video upload endpoint` | Low |
| 3 | `feat: update Hero component to support carousel and video modes` | Medium |
| 4 | `feat: add HeroSettingsSection admin UI with 40/60 preview split` | Medium |
| 5 | `feat: wire hero settings into homepage and storefront settings page` | Low |

---

## Acceptance Criteria

### UI (verified by screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Homepage Hero section appears in `/admin/settings/storefront` with Image / Carousel / Video tabs | Screenshot: `/admin/settings/storefront` at 1280px | Section visible with 3 tabs; Image tab active by default |
| AC-UI-2 | Image tab shows single `ImageField` upload + heading + tagline fields + hint text | Screenshot: Image tab at 1280px | Upload button, two text fields, hint text visible |
| AC-UI-3 | Carousel tab shows `ImageListField` (multi-image, 2–6 slides) + heading + tagline + hint | Screenshot: Carousel tab at 1280px | Add/remove/reorder controls visible; "2–6 images" hint shown |
| AC-UI-4 | Video tab shows video file upload field + heading + tagline + hint | Screenshot: Video tab at 1280px | Upload button with "video/* max 100 MB" hint; text fields visible |
| AC-UI-5 | Preview panel (right, 60%) shows live hero preview matching the active tab | Screenshot: each tab at 1280px | Preview updates when tab changes; image/carousel/video rendered correctly |
| AC-UI-6 | Layout stacks vertically on mobile (form above, preview below) | Screenshot: `/admin/settings/storefront` at 375px | Single column; form above preview |
| AC-UI-7 | Homepage renders a single image hero when `homepageHeroType = "image"` | Screenshot: homepage at 1280px after saving a test image | Hero image fills width; heading/tagline overlay visible |
| AC-UI-8 | Homepage renders a scrolling carousel when `homepageHeroType = "carousel"` | Screenshot: homepage at 1280px after saving 2+ slides | Carousel dots visible; first slide shown |
| AC-UI-9 | Homepage renders a video hero when `homepageHeroType = "video"` | Screenshot: homepage at 1280px after saving a test video URL | `<video>` element rendered; autoplay/muted/loop attributes set |
| AC-UI-10 | Heading overlay falls back to store name when `homepageHeroHeading` is blank | Code review: `HomeHero.tsx` prop resolution | `heading={settings.homepageHeroHeading || settings.storeName}` |
| AC-UI-11 | Dark gradient fallback still shown when no hero media is configured | Screenshot: homepage at 1280px with no hero settings saved | Gradient visible (no broken img/video element) |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | `GET /api/admin/settings/hero-media` returns all 5 hero fields with defaults | Code review: `app/api/admin/settings/hero-media/route.ts` | Returns `{ homepageHeroType, homepageHeroSlides, homepageHeroVideoUrl, homepageHeroHeading, homepageHeroTagline }` |
| AC-FN-2 | `PUT /api/admin/settings/hero-media` upserts all 5 keys via `prisma.siteSettings.upsert` | Code review: route handler | Each key has its own upsert call; admin auth required |
| AC-FN-3 | `POST /api/upload/video` accepts `video/*` MIME types up to 100 MB, stores in `"hero"` folder | Code review: `app/api/upload/video/route.ts` | Accepts `.mp4`, `.webm`; rejects `image/*`; rejects files >100 MB |
| AC-FN-4 | `POST /api/upload/video` rejects non-video files with 400 | Code review: route validation | Returns `{ error: "File must be a video" }` for image uploads |
| AC-FN-5 | `homepageHeroSlides` stored as JSON string, parsed in `mapSettingsRecord` | Code review: `lib/site-settings.ts` | `JSON.parse(record.homepage_hero_slides || "[]")` with `|| []` fallback |
| AC-FN-6 | All 5 new keys added to `publicSettingsKeys` in `lib/data.ts` | Code review: `lib/data.ts` | Array includes `"homepage_hero_type"`, `"homepage_hero_slides"`, etc. |
| AC-FN-7 | `Hero.tsx` renders `<video autoPlay muted loop playsInline>` when `type="video"` | Code review: `app/(site)/_components/content/Hero.tsx` | Correct element with all four attributes |
| AC-FN-8 | `Hero.tsx` renders `ScrollCarousel` with slide images when `type="carousel"` | Code review: `Hero.tsx` carousel branch | `ScrollCarousel` wraps one `<Image>` per slide; `autoplay` enabled |
| AC-FN-9 | `HeroSettingsSection` calls `uploadAll()` before `PUT /api/admin/settings/hero-media` on save | Code review: `HeroSettingsSection.tsx` save handler | Upload step runs first; URLs in payload are blob URLs |

### Regression (verified by test suite + screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | Existing storefront settings (product menu, add-ons headings) still render and save | Screenshot: `/admin/settings/storefront` at 1280px | All pre-existing sections visible; no layout regressions |
| AC-REG-2 | Homepage `RecommendationsSection` and `FeaturedProducts` still render below hero | Screenshot: homepage at 1280px | Both sections present below the hero |
| AC-REG-3 | `npm run precheck` passes clean | Run `npm run precheck` | 0 TypeScript errors, 0 ESLint errors |
| AC-REG-4 | `npm run test:ci` passes | Run `npm run test:ci` | All existing tests pass, 0 failures |

---

## UX Flows

| Flow | Question | Answer |
|------|----------|--------|
| Save | What happens after clicking Save? | Files upload first (spinner on button), then settings PUT fires, toast shows "Hero saved", preview refreshes |
| Type switch | Does switching tabs lose unsaved data? | No — each tab's state is preserved in component state; only the active type is saved on submit |
| Error | Upload or save fails? | Toast shows "Failed to save hero settings" with error detail; button re-enables |
| Empty | No images added in carousel tab? | Dashed empty state with "Add your first slide" button; Save disabled until ≥1 image |
| Loading | While saving? | Save button shows `<Loader2>` spinner and is disabled; tabs also disabled |

---

## Implementation Details

### Commit 1: site-settings data layer

**Files:**
- `lib/site-settings.ts` — add to `SiteSettings` interface, `defaultSettings`, `mapSettingsRecord`
- `lib/data.ts` — add 5 new keys to `publicSettingsKeys`

```typescript
// lib/site-settings.ts additions to SiteSettings interface
homepageHeroType: "image" | "carousel" | "video"
homepageHeroSlides: Array<{ url: string; alt: string }>
homepageHeroVideoUrl: string
homepageHeroVideoPosterUrl: string  // required for LCP — static image shown before video loads
homepageHeroHeading: string         // blank = fall back to storeName
homepageHeroTagline: string

// mapSettingsRecord additions
homepageHeroType: (record.homepage_hero_type as SiteSettings["homepageHeroType"]) || "image",
homepageHeroSlides: safeParseJSON(record.homepage_hero_slides, []),
homepageHeroVideoUrl: record.homepage_hero_video_url || "",
homepageHeroVideoPosterUrl: record.homepage_hero_video_poster_url || "",
homepageHeroHeading: record.homepage_hero_heading || "",
homepageHeroTagline: record.homepage_hero_tagline || "",
```

Add a `safeParseJSON<T>(raw: string | undefined, fallback: T): T` helper inline in `site-settings.ts`.

---

### Commit 2: API routes

**Files:**
- `app/api/admin/settings/hero-media/route.ts` — GET + PUT (follows add-ons route pattern)
- `app/api/upload/video/route.ts` — POST video upload (mirrors `/api/upload` but `video/*`, 100 MB, `"hero"` folder)

```typescript
// hero-media route — GET returns 5 fields, PUT upserts each
const HERO_KEYS = {
  type: "homepage_hero_type",
  slides: "homepage_hero_slides",
  videoUrl: "homepage_hero_video_url",
  heading: "homepage_hero_heading",
  tagline: "homepage_hero_tagline",
} as const

// video upload route
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB
if (!file.type.startsWith("video/")) { return 400 }
uploadToBlob({ file, filename: file.name, folder: "hero" })
```

---

### Commit 3: Hero component updates

**Files:**
- `app/(site)/_components/content/Hero.tsx` — add `type`, `slides`, `videoUrl`, `tagline` props
- `app/(site)/_components/content/HomeHero.tsx` — pass hero settings through

```typescript
// Hero.tsx new props
interface HeroProps {
  heading?: string
  tagline?: string
  type?: "image" | "carousel" | "video"
  imageUrl?: string    // single image (type="image")
  imageAlt?: string
  slides?: Array<{ url: string; alt: string }>  // type="carousel"
  videoUrl?: string    // type="video"
  videoPosterUrl?: string  // type="video" — static poster for fast LCP
  caption?: string
  className?: string
}

// Render logic:
// type="video"   → <video autoPlay muted loop playsInline preload="none"
//                    poster={videoPosterUrl} className="object-cover absolute inset-0 h-full w-full" />
//                  poster paints on first frame; video streams behind it — no LCP penalty
// type="carousel" → <ScrollCarousel autoplay autoplayDelay={5000} showDots>
//                    slides.map((s, i) => <Image {...s} priority={i === 0} />) // only first slide preloaded
// type="image"   → existing <Image priority> behavior (unchanged)
// fallback (no media) → existing gradient (unchanged)
// tagline renders as <p> below heading inside overlay div
```

---

### Commit 4: HeroSettingsSection admin UI

**Files:**
- `app/admin/settings/storefront/_components/HeroSettingsSection.tsx` (new)

**Layout:** `grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8`
- Left (form): two-option selector (`Image / Slides` vs `Video`), per-mode upload UI, shared heading + tagline fields, hint callout
- Right (preview): `<Hero>` component rendered at natural width with a fixed height cap (`max-h-64`), label "Preview"

**Mode selector UX:** Two `<Tabs>` — "Image / Slides" and "Video". Switching tabs shows the relevant upload UI; the other mode's data is preserved in state but not submitted. Only the active mode is saved.

**"Image / Slides" tab:**
- Radio or segmented control: "Single Image" vs "Slideshow (2–6)"
- Single Image: one `ImageField` upload
- Slideshow: `ImageListField` (minImages: 2, maxImages: 6)

**State management:**
- `mode`: `"media" | "video"` — tab state (maps to `homepageHeroType` as `"image"` | `"carousel"` | `"video"`)
- `mediaSubtype`: `"image" | "carousel"` — radio within the media tab
- `heading`, `tagline`: string state
- Carousel/Image: `useMultiImageUpload({ minImages: 1, maxImages: 6 })`
- Video: local `{ file: File | null; previewUrl: string; savedUrl: string }` state — upload via `fetch('/api/upload/video', ...)`
- Poster: `useImageUpload()` — standard image upload for the video poster frame
- `isSaving`: boolean
- `saveHero()`: async — upload pending files first, then PUT to `/api/admin/settings/hero-media`

**Hint text (per mode):**
- Single Image: "Recommended: 1920×600px, JPEG/WebP, max 5 MB"
- Slideshow: "2–6 slides, 1920×600px each, max 5 MB per image — auto-scrolls every 5 s"
- Video: "MP4 or WebM, 16:9 ratio, max 100 MB. **Poster image required** — shown while video loads (prevents slow first paint)"

**Loads on mount:** `GET /api/admin/settings/hero-media` → populates all state fields

---

### Commit 5: Wire into homepage and storefront settings page

**Files:**
- `app/(site)/page.tsx` — `<HomeHero>` already calls `getPublicSiteSettings()`; update props passed to `HomeHero`
- `app/(site)/_components/content/HomeHero.tsx` — destructure new settings fields, pass to `Hero`
- `app/admin/settings/storefront/page.tsx` — import and render `<HeroSettingsSection>` above existing sections

---

## Files Changed (9 modified, 4 new — 6 new setting keys)

| File | Commit | Status |
|------|--------|--------|
| `lib/site-settings.ts` | 1 | Modified |
| `lib/data.ts` | 1 | Modified |
| `app/api/admin/settings/hero-media/route.ts` | 2 | **New** |
| `app/api/upload/video/route.ts` | 2 | **New** |
| `app/(site)/_components/content/Hero.tsx` | 3 | Modified |
| `app/(site)/_components/content/HomeHero.tsx` | 3, 5 | Modified |
| `app/admin/settings/storefront/_components/HeroSettingsSection.tsx` | 4 | **New** |
| `app/admin/settings/storefront/page.tsx` | 5 | Modified |
| `app/(site)/page.tsx` | 5 | Modified |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to `feat/homepage-hero-settings` branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 24 }`
3. Extract ACs into `docs/plans/homepage-hero-settings-ACs.md`
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human → human fills **Reviewer** column
