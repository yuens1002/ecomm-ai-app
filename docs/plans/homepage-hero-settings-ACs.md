# Homepage Hero Settings — AC Verification Report

**Branch:** `feat/homepage-hero-settings`
**Commits:** 5
**Iterations:** 0
**ACs:** 26 (11 UI · 11 FN · 4 REG)

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

> **How column — verification methods for UI ACs:**
>
> | Method | Format | Evidence required |
> |--------|--------|-------------------|
> | **Screenshot** | `Screenshot: {page/element at breakpoint}` | `.png` file path in Agent/QC columns |
> | **Interactive** | `Interactive: {click/hover} → screenshot` | `.png` file path in Agent/QC columns |
> | **Code review** | `Code review: {file}` | file:line refs (no screenshot needed) |

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-UI-1 | Homepage Hero section appears in `/admin/settings/storefront` with two mode tabs: "Image / Slides" and "Video" | Screenshot: `/admin/settings/storefront` at 1280px | Section titled "Homepage Hero" visible; 2 tabs present; "Image / Slides" tab active by default | | | |
| AC-UI-2 | "Image / Slides" tab shows a Single Image / Slideshow sub-selector plus upload UI + heading + tagline + hint | Screenshot: "Image / Slides" tab at 1280px | Radio/segmented control for Single Image vs Slideshow; upload field(s) visible; heading/tagline inputs; hint text present | | | |
| AC-UI-3 | Selecting "Slideshow" within the Image / Slides tab reveals multi-image upload (2–6 slides) | Interactive: click Slideshow sub-option → screenshot at 1280px | `ImageListField` with add/remove/reorder controls visible; hint text "2–6 slides" shown | | | |
| AC-UI-4 | "Video" tab shows video upload field + poster image upload + heading + tagline + hint noting poster is required | Interactive: click Video tab → screenshot at 1280px | Video upload button, separate poster image upload, hint text "Poster image required — shown while video loads" visible | | | |
| AC-UI-5 | Preview panel (right column, 60%) renders a live hero preview matching the active mode | Screenshot: each mode at 1280px | Preview area labeled "Preview" shows hero component; updates when mode changes | | | |
| AC-UI-6 | Layout stacks vertically on mobile (form above, preview below) | Screenshot: `/admin/settings/storefront` at 375px | Single column; form section above preview; no horizontal overflow | | | |
| AC-UI-7 | Homepage renders a single image hero when `homepageHeroType = "image"` | Screenshot: homepage at 1280px with image hero saved | Hero image fills viewport width; heading and tagline overlay visible if set | | | |
| AC-UI-8 | Homepage renders a scrolling carousel when `homepageHeroType = "carousel"` | Screenshot: homepage at 1280px with 2+ carousel slides saved | Carousel with dot navigation visible below hero; first slide fills width | | | |
| AC-UI-9 | Homepage renders a video hero when `homepageHeroType = "video"` | Code review: `app/(site)/_components/content/Hero.tsx` video branch | `<video autoPlay muted loop playsInline preload="none" poster={videoPosterUrl}>` rendered with `object-cover absolute inset-0 h-full w-full` | | | |
| AC-UI-10 | Heading overlay falls back to store name when `homepageHeroHeading` is blank | Code review: `HomeHero.tsx` prop resolution | Heading prop passed as `settings.homepageHeroHeading || settings.storeName` | | | |
| AC-UI-11 | Dark gradient fallback still shown on homepage when no hero media configured | Screenshot: homepage at 1280px with no hero settings saved | `bg-linear-to-br from-gray-800 to-gray-900` gradient visible; no broken media element | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `GET /api/admin/settings/hero-media` returns all 6 hero fields with defaults | Code review: `app/api/admin/settings/hero-media/route.ts` | Returns `{ homepageHeroType, homepageHeroSlides, homepageHeroVideoUrl, homepageHeroVideoPosterUrl, homepageHeroHeading, homepageHeroTagline }`; defaults to `"image"`, `[]`, `""`, `""`, `""`, `""` | | | |
| AC-FN-2 | `PUT /api/admin/settings/hero-media` upserts all 6 SiteSettings keys via Prisma | Code review: route PUT handler | Each of 6 keys has `prisma.siteSettings.upsert`; admin auth required; returns saved values | | | |
| AC-FN-3 | `POST /api/upload/video` accepts `video/*` MIME types up to 100 MB, stores in `"hero"` BlobFolder | Code review: `app/api/upload/video/route.ts` | Accepts `video/mp4`, `video/webm`; `MAX_VIDEO_SIZE = 100 * 1024 * 1024`; `uploadToBlob({ folder: "hero" })` | | | |
| AC-FN-4 | `POST /api/upload/video` rejects non-video files with HTTP 400 | Code review: route validation block | `!file.type.startsWith("video/")` → returns `{ error: "File must be a video" }` with status 400 | | | |
| AC-FN-5 | `homepageHeroSlides` stored as JSON string, parsed safely in `mapSettingsRecord` | Code review: `lib/site-settings.ts` | `safeParseJSON(record.homepage_hero_slides, [])` called; falls back to `[]` on invalid JSON | | | |
| AC-FN-6 | All 6 new keys present in `publicSettingsKeys` in `lib/data.ts` | Code review: `lib/data.ts` around `publicSettingsKeys` array | Array includes `"homepage_hero_type"`, `"homepage_hero_slides"`, `"homepage_hero_video_url"`, `"homepage_hero_video_poster_url"`, `"homepage_hero_heading"`, `"homepage_hero_tagline"` | | | |
| AC-FN-7 | `Hero.tsx` renders `ScrollCarousel` with one `<Image>` per slide when `type="carousel"` | Code review: `app/(site)/_components/content/Hero.tsx` | Carousel branch: `ScrollCarousel` imported from `components/shared/media/ScrollCarousel`; `autoplay` prop set; one `<Image>` per slide | | | |
| AC-FN-8 | `HeroSettingsSection` calls video upload endpoint before settings PUT on save | Code review: `HeroSettingsSection.tsx` `saveHero()` handler | If pending video file: `fetch('/api/upload/video', formData)` called first; returned blob URL passed in PUT body | | | |
| AC-FN-9 | `HeroSettingsSection` loads existing settings on mount | Code review: `HeroSettingsSection.tsx` mount effect | `useEffect` calls `GET /api/admin/settings/hero-media` and populates all state fields | | | |
| AC-FN-10 | Video hero uses `poster` attribute and `preload="none"` to avoid blocking LCP | Code review: `Hero.tsx` video branch | `<video preload="none" poster={videoPosterUrl}>` — poster URL sourced from `homepageHeroVideoPosterUrl`; no eager video fetch on page load | | | |
| AC-FN-11 | Carousel first slide gets `priority` on `<Image>`; remaining slides lazy-load | Code review: `Hero.tsx` carousel branch | `<Image priority={i === 0} ...>` in the slide map — only index 0 has `priority` | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | Existing storefront settings sections (Product Menu, Add-Ons headings) still render and function | Screenshot: `/admin/settings/storefront` at 1280px | Both pre-existing sections visible below Homepage Hero section; no layout breaks | | | |
| AC-REG-2 | Homepage `RecommendationsSection` and `FeaturedProducts` still render below hero | Screenshot: homepage at 1280px | Both sections present below hero; scroll reveals them | | | |
| AC-REG-3 | `npm run precheck` passes clean | Run `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | | | |
| AC-REG-4 | `npm run test:ci` passes | Run `npm run test:ci` | All existing tests pass, 0 failures | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here: blockers, evidence references, screenshots taken.}

## QC Notes

{Main thread writes fix notes here: what failed, what was changed, re-verification results.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}
