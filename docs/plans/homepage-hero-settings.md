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
| 6 | `feat: video hero storefront controls — mute + play/pause` | Low |
| 7 | `feat: hero delete buttons, demo mode guard, seed data, UX refinements` | Low |

---

## Acceptance Criteria

### UI (verified by screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Homepage Hero section appears in `/admin/settings/storefront` with `OptionCardGroup` card selector (Image or Slideshow / Video) | Screenshot: `/admin/settings/storefront` at 1280px | Section titled "Homepage Hero" visible; two card options "Image or Slideshow" and "Video" present; "Image or Slideshow" selected by default |
| AC-UI-2 | "Image or Slideshow" card shows `ImageListField` upload UI (no sub-selector radio); heading + tagline inputs visible | Screenshot: "Image or Slideshow" card selected at 1280px | `ImageListField` with add/reorder/delete controls; heading/tagline inputs; no radio sub-selector |
| AC-UI-3 | Slideshow mode auto-detected — when ≥2 images are uploaded, label auto-updates; no manual radio needed | Code review: `HeroSettingsSection.tsx` auto-detect effect | `useEffect` sets `imageMode = "slideshow"` when `imageListFieldImages.length > 1`; label text changes accordingly |
| AC-UI-4 | "Video" card shows video file upload field + poster image upload field; **no heading/tagline inputs** visible in video mode | Interactive: click "Video" card → screenshot at 1280px | Video upload input + Upload icon button; poster `ImageField`; heading/tagline section NOT visible |
| AC-UI-5 | Preview panel (right column, 60%) renders a live hero preview matching the active mode | Screenshot: each mode at 1280px | Preview area labeled "Preview" shows hero component; updates when mode changes |
| AC-UI-6 | Layout stacks vertically on mobile (form above, preview below) | Screenshot: `/admin/settings/storefront` at 375px | Single column; form section above preview; no horizontal overflow |
| AC-UI-7 | Homepage renders a single image hero when `homepageHeroType = "image"` | Screenshot: homepage at 1280px after saving a test image | Hero image fills width; heading/tagline overlay visible |
| AC-UI-8 | Homepage renders a scrolling carousel when `homepageHeroType = "carousel"` | Screenshot: homepage at 1280px after saving 2+ slides | Carousel with overlaid dot navigation visible; first slide shown |
| AC-UI-9 | Homepage renders a video hero when `homepageHeroType = "video"` | Code review: `app/(site)/_components/content/VideoHero.tsx` | `<video muted autoPlay loop playsInline>` rendered; mute + play/pause toggle buttons in bottom-right corner |
| AC-UI-10 | Heading overlay falls back to store name when `homepageHeroHeading` is blank | Code review: `HomeHero.tsx` prop resolution | `heading={heroHeading \|\| storeName}` |
| AC-UI-11 | Dark gradient fallback still shown on homepage when no hero media configured | Screenshot: homepage at 1280px with no hero settings saved | Gradient visible; no broken media element |
| AC-UI-12 | Save button shows **amber dot** when form is dirty, **green dot** when saved (no unsaved changes) | Interactive: load page → observe dot color; edit field → observe dot change | Green dot on load; amber dot appears immediately after any field change |
| AC-UI-13 | Heading/tagline section hidden when "Video" mode is selected; visible when "Image or Slideshow" is selected | Interactive: toggle between modes → screenshot | Section present for Image/Slideshow mode; section absent from DOM for Video mode |
| AC-UI-14 | Delete buttons always rendered for all media types (video file, poster, images), disabled when no content to delete | Screenshot: admin UI with no media uploaded | Three delete buttons visible; all disabled (no content); enabled once a file is uploaded |
| AC-UI-15 | Video hero on storefront shows two icon buttons (mute/unmute + play/pause) at bottom-right corner | Code review: `app/(site)/_components/content/VideoHero.tsx` | `VolumeX`/`Volume2` icon button and `Pause`/`Play` icon button rendered at bottom-right; default state: muted + playing |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | `GET /api/admin/settings/hero-media` returns all 6 hero fields with defaults | Code review: `app/api/admin/settings/hero-media/route.ts` | Returns `{ homepageHeroType, homepageHeroSlides, homepageHeroVideoUrl, homepageHeroVideoPosterUrl, homepageHeroHeading, homepageHeroTagline }`; defaults to `"image"`, `[]`, `""`, `""`, `""`, `""` |
| AC-FN-2 | `PUT /api/admin/settings/hero-media` upserts all 6 SiteSettings keys via Prisma | Code review: route PUT handler | Each of 6 keys has `prisma.siteSettings.upsert`; admin auth required; returns saved values |
| AC-FN-3 | `POST /api/upload/video` accepts `video/*` MIME types up to 100 MB, stores in `"hero"` BlobFolder | Code review: `app/api/upload/video/route.ts` | Accepts `video/mp4`, `video/webm`; rejects `image/*`; rejects files >100 MB |
| AC-FN-4 | `POST /api/upload/video` rejects non-video files with HTTP 400 | Code review: route validation block | `!file.type.startsWith("video/")` → returns `{ error: "File must be a video" }` with status 400 |
| AC-FN-5 | `homepageHeroSlides` stored as JSON string, parsed safely in `mapSettingsRecord` | Code review: `lib/site-settings.ts` | `safeParseJSON(record.homepage_hero_slides, [])` called; falls back to `[]` on invalid JSON |
| AC-FN-6 | All 6 new keys present in `publicSettingsKeys` in `lib/data.ts` | Code review: `lib/data.ts` around `publicSettingsKeys` array | Array includes all 6 hero keys |
| AC-FN-7 | `Hero.tsx` delegates carousel rendering to `HeroCarousel.tsx` (Embla-based, co-located) | Code review: `Hero.tsx` carousel branch | `HeroCarousel` renders one `<Image>` per slide with 5s autoplay; dots overlaid inside hero |
| AC-FN-8 | `HeroSettingsSection` calls video upload endpoint before settings PUT on save | Code review: `HeroSettingsSection.tsx` `handleSave()` | If pending video file: `fetch('/api/upload/video', formData)` runs first; returned URL used in PUT body |
| AC-FN-9 | `HeroSettingsSection` loads existing settings on mount via `GET /api/admin/settings/hero-media` | Code review: `HeroSettingsSection.tsx` mount effect | `useEffect` populates all state fields from API response |
| AC-FN-10 | Video hero uses `poster` attribute and `preload="none"` to avoid blocking LCP | Code review: `Hero.tsx` video branch | `<video preload="none" poster={videoPosterUrl}>` — no eager video fetch on page load |
| AC-FN-11 | Carousel first slide gets `priority` on `<Image>`; remaining slides lazy-load | Code review: `HeroCarousel.tsx` slide map | `priority={i === 0}` in slide map |
| AC-FN-12 | `DELETE /api/upload/video?path=...` deletes blob file and returns `{ success: true }` | Code review: `app/api/upload/video/route.ts` DELETE handler | Calls `deleteFromBlob(path)`; requires admin auth; returns `{ success: true }` on success; 400 if path missing or non-blob; 401 if unauthenticated |
| AC-FN-13 | IS_DEMO guard on save, delete-video, and delete-poster — shows amber toast instead of performing the action | Code review: `HeroSettingsSection.tsx` `handleSave`, `handleDeleteVideo`, `handleClearPoster` | All three handlers check `IS_DEMO` first; if true, `toast({ variant: "demo" })` and return early; no API calls made |
| AC-FN-14 | Auto alt text generated from filename when image is selected — different per image, no manual input | Code review: `useImageUpload.ts` `handleImageListFieldFileSelect` | `autoAlt` derived by stripping extension + replacing separators + capitalizing first char; set on `alt` field of that image entry; no alt text input shown |
| AC-FN-15 | Seed data includes hero settings — `homepage_hero_type`, `homepage_hero_video_url`, `homepage_hero_video_poster_url`, `homepage_hero_slides`, `homepage_hero_heading`, `homepage_hero_tagline` | Code review: `prisma/seed.ts` | 6 hero keys seeded with `update: {}` (create-if-not-exists, no-op on update); video URL from `SEED_HERO_VIDEO_URL` env var; poster URL from `SEED_HERO_POSTER_URL` env var |

### Regression (verified by test suite + screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | Existing storefront settings sections still render and function | Screenshot: `/admin/settings/storefront` at 1280px | Product Menu and Add-Ons sections visible below Homepage Hero; no layout breaks |
| AC-REG-2 | Homepage `RecommendationsSection` and `FeaturedProducts` still render below hero | Screenshot: homepage at 1280px | Both sections present below hero |
| AC-REG-3 | `npm run precheck` passes clean | Run `npm run precheck` | 0 TypeScript errors, 0 ESLint errors |
| AC-REG-4 | `npm run test:ci` passes | Run `npm run test:ci` | All existing tests pass, 0 failures |
| AC-REG-5 | Video upload route DELETE unit tests pass | Test run: `npm run test:ci -- --testPathPattern=upload/video` | 13 tests pass: DELETE success, missing path (400), non-blob URL (400), unauthenticated (401), server error (500); POST success, old-path cleanup, no cleanup (non-blob/absent), wrong type (400), too large (400), no file (400), unauthenticated (401) |

---

## UX Flows

| Flow | Question | Answer |
|------|----------|--------|
| Save | What happens after clicking Save? | Files upload first (spinner on button), then settings PUT fires, toast shows "Hero settings saved", green dot appears |
| Mode switch | Does switching modes lose unsaved data? | No — each mode's state is preserved in component state; only the active mode type is saved on submit |
| Delete media | What happens when a delete button is clicked? | Immediate blob DELETE + DB PUT (spinner on Save button during operation); toast confirms removal |
| Error | Upload or save fails? | Toast shows destructive error; button re-enables |
| Empty | No images added in image-slides mode? | Add Image button present; Save allowed (hero type will be `"image"` with no slides — shows gradient fallback) |
| Loading | While saving or deleting? | Save button shows `<Loader2>` spinner and is disabled |
| Demo mode | Save or delete in demo? | Amber `variant: "demo"` toast shown; no API calls made |

---

## Implementation Details

### Commit 1: site-settings data layer

**Files:**

- `lib/site-settings.ts` — add to `SiteSettings` interface, `defaultSettings`, `mapSettingsRecord`
- `lib/data.ts` — add 6 new keys to `publicSettingsKeys`

```typescript
// lib/site-settings.ts additions to SiteSettings interface
homepageHeroType: "image" | "carousel" | "video"
homepageHeroSlides: Array<{ url: string; alt: string }>
homepageHeroVideoUrl: string
homepageHeroVideoPosterUrl: string  // required for LCP — static image shown before video loads
homepageHeroHeading: string         // blank = fall back to storeName
homepageHeroTagline: string
```

---

### Commit 2: API routes

**Files:**

- `app/api/admin/settings/hero-media/route.ts` — GET + PUT
- `app/api/upload/video/route.ts` — POST + DELETE (100 MB, `video/*`, `"hero"` folder)

---

### Commit 3: Hero component updates

**Files:**

- `app/(site)/_components/content/Hero.tsx` — add `type`, `slides`, `videoUrl`, `videoPosterUrl`, `tagline` props; delegates video to `VideoHero`
- `app/(site)/_components/content/VideoHero.tsx` — **new**: client component wrapping `<video>` with mute + play/pause controls
- `app/(site)/_components/content/HeroCarousel.tsx` — **new**: Embla-based carousel with overlaid dots, autoplay
- `app/(site)/_components/content/HomeHero.tsx` — pass hero settings through

```typescript
// VideoHero.tsx — mute + play/pause controls
"use client";
const videoRef = useRef<HTMLVideoElement>(null);
const [muted, setMuted] = useState(true);
const [playing, setPlaying] = useState(true);
// Renders: <video muted autoPlay loop playsInline>
// Bottom-right overlay: VolumeX/Volume2 + Pause/Play icon buttons
```

---

### Commit 4: HeroSettingsSection admin UI

**Files:**

- `app/admin/settings/storefront/_components/HeroSettingsSection.tsx` (new)

**Layout:** `grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8`

**Enable toggle:** `Switch` at top of form panel — "Show hero on homepage". When off and saved, `{settings.homepageHeroEnabled && <HomeHero .../>}` skips the hero entirely on the storefront. Stored as string `"true"` / `"false"` in SiteSettings; absent key defaults to enabled (`!== "false"`).

**Mode selector:** `OptionCardGroup` (card-radio) with two options:

- "Image or Slideshow" — upload 1–10 images, mode auto-detected from count
- "Video" — video file + poster image required

**"Image or Slideshow" panel:**

- `ImageListField` (`minImages: 0`, `maxImages: 10`) — add/remove/reorder
- No radio sub-selector — mode auto-detected: 1 image → `type="image"`, ≥2 → `type="carousel"`
- Heading + tagline inputs (only shown in this mode)

**"Video" panel:**

- Video file: readonly `Input` + icon-only `Upload` button + icon-only `Trash2` delete button
- Poster: `ImageField` with `onClear` (Trash2 delete button)
- No heading/tagline inputs

**Delete behavior:**

- All delete buttons always rendered; disabled when no content
- Click → immediate blob `DELETE` + `PUT /api/admin/settings/hero-media` to clear the field
- IS_DEMO guard: amber toast, no API call

**Alt text:** Auto-generated from filename in `handleImageListFieldFileSelect`; no manual input shown

**Save button:** Amber dot = dirty, green dot = clean

---

### Commit 5: Wire into homepage and storefront settings page

**Files:**

- `app/(site)/page.tsx` — props flow through to `HomeHero`
- `app/(site)/_components/content/HomeHero.tsx` — passes all hero settings to `Hero`
- `app/admin/settings/storefront/page.tsx` — imports and renders `<HeroSettingsSection>`

---

### Commit 7: Seed data

**Files:**

- `prisma/seed.ts` — hero settings seeded with `update: {}` (create-if-not-exists, no-op on re-seed)

```typescript
// env vars (set before running seed on demo):
// SEED_HERO_VIDEO_URL  — blob URL of demo video
// SEED_HERO_POSTER_URL — blob URL of demo poster image
```

---

## Files Changed (11 modified, 6 new — 7 new setting keys)

| File | Commit | Status |
|------|--------|--------|
| `lib/site-settings.ts` | 1 | Modified |
| `lib/data.ts` | 1 | Modified |
| `app/api/admin/settings/hero-media/route.ts` | 2 | **New** |
| `app/api/upload/video/route.ts` | 2 | **New** |
| `app/api/upload/video/__tests__/route.test.ts` | 2 | **New** |
| `app/(site)/_components/content/Hero.tsx` | 3 | Modified |
| `app/(site)/_components/content/VideoHero.tsx` | 3 | **New** |
| `app/(site)/_components/content/HeroCarousel.tsx` | 3 | **New** |
| `app/(site)/_components/content/HomeHero.tsx` | 3, 5 | Modified |
| `app/admin/settings/storefront/_components/HeroSettingsSection.tsx` | 4 | **New** |
| `app/admin/settings/storefront/page.tsx` | 5 | Modified |
| `app/(site)/page.tsx` | 5 | Modified |
| `app/admin/_components/cms/fields/ImageField.tsx` | 7 | Modified |
| `app/admin/_components/cms/fields/ImageCard.tsx` | 7 | Modified |
| `app/admin/_hooks/useImageUpload.ts` | 7 | Modified |
| `prisma/seed.ts` | 7 | Modified |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to `feat/homepage-hero-settings` branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 32 }`
3. Extract ACs into `docs/plans/homepage-hero-settings-ACs.md`
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail → fix → re-verify ALL ACs
6. When all pass → hand off ACs doc to human → human fills **Reviewer** column
