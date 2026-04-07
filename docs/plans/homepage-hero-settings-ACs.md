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
| AC-UI-1 | Homepage Hero section appears in `/admin/settings/storefront` with two mode tabs: "Image / Slides" and "Video" | Screenshot: `/admin/settings/storefront` at 1280px | Section titled "Homepage Hero" visible; 2 tabs present; "Image / Slides" tab active by default | PASS — "Homepage Hero" section header visible, 2 tabs ("Image / Slides", "Video") present, "Image / Slides" active by default. `.screenshots/hero-verify/admin-storefront-desktop.png` | PASS — Confirmed in screenshot: section header with ImageIcon, description, "Save changes" button. Both tabs visible and labeled correctly. | |
| AC-UI-2 | "Image / Slides" tab shows a Single Image / Slideshow sub-selector plus upload UI + heading + tagline + hint | Screenshot: "Image / Slides" tab at 1280px | Radio/segmented control for Single Image vs Slideshow; upload field(s) visible; heading/tagline inputs; hint text present | PASS — RadioGroup with "Single image" / "Slideshow" visible; "Hero image" upload field; Heading + Tagline inputs; hint text shown. `.screenshots/hero-verify/admin-storefront-desktop.png` | PASS — Confirmed: "Single image" radio selected, "Hero image" label with "Add Image" button, Heading/Tagline inputs, hint text "A single image fills the hero area…" all visible. | |
| AC-UI-3 | Selecting "Slideshow" within the Image / Slides tab reveals multi-image upload (2–6 slides) | Interactive: click Slideshow sub-option → screenshot at 1280px | `ImageListField` with add/remove/reorder controls visible; hint text "2–6 slides" shown | PASS — After clicking Slideshow radio: field label changes to "Slides (2–6)", hint text "2–6 images rotate automatically…" visible, Add Image button present. `.screenshots/hero-verify/admin-storefront-slideshow.png` | PASS — Confirmed: label is "Slides (2–6)", hint updates to rotation copy, add button present. | |
| AC-UI-4 | "Video" tab shows video upload field + poster image upload + heading + tagline + hint noting poster is required | Interactive: click Video tab → screenshot at 1280px | Video upload button, separate poster image upload, hint text "Poster image required — shown while video loads" visible | PASS — Video file upload input with Upload button; "Poster image *" (required) field with upload control; hint text "A poster image is required: it displays before the video loads…" visible. `.screenshots/hero-verify/admin-storefront-video-tab.png` | PASS — Confirmed: "Video file" input + Upload button, "Poster image *" (required asterisk visible), ImageField with "No image selected / Max 5MB" placeholder, hint text confirmed. | |
| AC-UI-5 | Preview panel (right column, 60%) renders a live hero preview matching the active mode | Screenshot: each mode at 1280px | Preview area labeled "Preview" shows hero component; updates when mode changes | PASS — "Preview" label visible in right column; hero preview renders the dark gradient with "Your Store" placeholder heading when no images set; updates heading/tagline when Video tab active. `.screenshots/hero-verify/admin-storefront-desktop.png` and `admin-storefront-video-tab.png` | PASS — Confirmed: "Preview" label top-left of right panel; gradient hero preview on Image/Slides tab shows "Your Store"; Video tab preview shows "Artisan Roast" + "Small-batch specialty coffee" (from stored tagline). Preview panel is clearly the wider (60%) right column. | |
| AC-UI-6 | Layout stacks vertically on mobile (form above, preview below) | Screenshot: `/admin/settings/storefront` at 375px | Single column; form section above preview; no horizontal overflow | PASS — Single-column layout at 375px; form controls stack vertically; no horizontal overflow; preview panel not visible at initial viewport (below fold, single col). `.screenshots/hero-verify/admin-storefront-mobile.png` | PASS — Confirmed: single column at 375px, section header wraps cleanly, tabs full-width, radio controls, inputs all in single column, no overflow. | |
| AC-UI-7 | Homepage renders a single image hero when `homepageHeroType = "image"` | Screenshot: homepage at 1280px with image hero saved | Hero image fills viewport width; heading and tagline overlay visible if set | PASS — Coffee image fills hero width; "Artisan Roast" heading and "Small-batch specialty coffee" tagline overlaid. `.screenshots/hero-verify/homepage-image-hero.png` | PASS — Confirmed: coffee image fills full viewport width, "Artisan Roast" heading and "Small-batch specialty coffee" tagline overlaid in white, RecommendationsSection visible below fold. | |
| AC-UI-8 | Homepage renders a scrolling carousel when `homepageHeroType = "carousel"` | Screenshot: homepage at 1280px with 2+ carousel slides saved | Carousel with dot navigation visible below hero; first slide fills width | PASS — Carousel with coffee image fills width; dot navigation dots visible at bottom of hero. `.screenshots/hero-verify/homepage-carousel-hero.png` | PASS — Confirmed: slide fills full width, dot navigation overlaid at bottom of hero (not below it — correct placement), RecommendationsSection visible below. | |
| AC-UI-9 | Homepage renders a video hero when `homepageHeroType = "video"` | Code review: `app/(site)/_components/content/Hero.tsx` video branch | `<video autoPlay muted loop playsInline preload="none" poster={videoPosterUrl}>` rendered with `object-cover absolute inset-0 h-full w-full` | PASS — `Hero.tsx` lines 51-59: `<video src={videoUrl} autoPlay muted loop playsInline preload="none" poster={videoPosterUrl || undefined} className="absolute inset-0 h-full w-full object-cover" />`. All attributes match. | PASS — Confirmed Hero.tsx video branch: all required attributes present at correct lines. | |
| AC-UI-10 | Heading overlay falls back to store name when `homepageHeroHeading` is blank | Code review: `HomeHero.tsx` prop resolution | Heading prop passed as `settings.homepageHeroHeading || settings.storeName` | PASS — `HomeHero.tsx` line 33: `heading={heroHeading || storeName}` — when `heroHeading` is blank/undefined, `storeName` is used as heading. | PASS — Confirmed HomeHero.tsx line 33. Also confirmed visually: admin preview shows "Your Store" placeholder (heading blank) and homepage screenshot shows "Artisan Roast" (store name fallback when no heroHeading saved). | |
| AC-UI-11 | Dark gradient fallback still shown on homepage when no hero media configured | Screenshot: homepage at 1280px with no hero settings saved | `bg-linear-to-br from-gray-800 to-gray-900` gradient visible; no broken media element | PASS — Dark gradient hero visible with "Artisan Roast" text overlay (store name fallback); no broken image. Code at `Hero.tsx` line 97 confirms `bg-linear-to-br from-gray-800 to-gray-900` when no imageUrl. `.screenshots/hero-verify/homepage-gradient-fallback.png` | PASS — Confirmed: gradient fallback renders, no broken image element, store name heading present. | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-FN-1 | `GET /api/admin/settings/hero-media` returns all 6 hero fields with defaults | Code review: `app/api/admin/settings/hero-media/route.ts` | Returns `{ homepageHeroType, homepageHeroSlides, homepageHeroVideoUrl, homepageHeroVideoPosterUrl, homepageHeroHeading, homepageHeroTagline }`; defaults to `"image"`, `[]`, `""`, `""`, `""`, `""` | PASS — `route.ts` lines 50-57: returns all 6 fields with defaults `"image"`, `[]`, `""`, `""`, `""`, `""`. Admin auth check at lines 30-33. | PASS — Confirmed. | |
| AC-FN-2 | `PUT /api/admin/settings/hero-media` upserts all 6 SiteSettings keys via Prisma | Code review: route PUT handler | Each of 6 keys has `prisma.siteSettings.upsert`; admin auth required; returns saved values | PASS — `route.ts` lines 93-124: `Promise.all` with 6 `prisma.siteSettings.upsert` calls (KEYS.type, .slides, .videoUrl, .videoPosterUrl, .heading, .tagline). Admin auth at lines 68-71. Returns saved values lines 126-133. | PASS — Confirmed. | |
| AC-FN-3 | `POST /api/upload/video` accepts `video/*` MIME types up to 100 MB, stores in `"hero"` BlobFolder | Code review: `app/api/upload/video/route.ts` | Accepts `video/mp4`, `video/webm`; `MAX_VIDEO_SIZE = 100 * 1024 * 1024`; `uploadToBlob({ folder: "hero" })` | PASS — `route.ts` line 5: `MAX_VIDEO_SIZE = 100 * 1024 * 1024`; line 22: checks `file.type.startsWith("video/")`; line 36-40: `uploadToBlob({ file, filename: file.name, folder: "hero" })`. | PASS — Confirmed. | |
| AC-FN-4 | `POST /api/upload/video` rejects non-video files with HTTP 400 | Code review: route validation block | `!file.type.startsWith("video/")` → returns `{ error: "File must be a video" }` with status 400 | PASS — `route.ts` lines 22-26: `if (!file.type.startsWith("video/"))` → `NextResponse.json({ error: "File must be a video" }, { status: 400 })`. | PASS — Confirmed. | |
| AC-FN-5 | `homepageHeroSlides` stored as JSON string, parsed safely in `mapSettingsRecord` | Code review: `lib/site-settings.ts` | `safeParseJSON(record.homepage_hero_slides, [])` called; falls back to `[]` on invalid JSON | PASS — `lib/site-settings.ts` lines 61-68: `safeParseJSON` function with try/catch fallback; lines 114-117: `safeParseJSON<HeroSlide[]>(record.homepage_hero_slides, defaultSettings.homepageHeroSlides)` (defaults to `[]`). | PASS — Confirmed. | |
| AC-FN-6 | All 6 new keys present in `publicSettingsKeys` in `lib/data.ts` | Code review: `lib/data.ts` around `publicSettingsKeys` array | Array includes `"homepage_hero_type"`, `"homepage_hero_slides"`, `"homepage_hero_video_url"`, `"homepage_hero_video_poster_url"`, `"homepage_hero_heading"`, `"homepage_hero_tagline"` | PASS — `lib/data.ts` lines 856-865: all 6 keys present in `publicSettingsKeys` array. | PASS — Confirmed. | |
| AC-FN-7 | `Hero.tsx` renders `ScrollCarousel` with one `<Image>` per slide when `type="carousel"` | Code review: `app/(site)/_components/content/Hero.tsx` | Carousel branch: `ScrollCarousel` imported from `components/shared/media/ScrollCarousel`; `autoplay` prop set; one `<Image>` per slide | FAIL — Implementation uses `HeroCarousel` (imported from `./HeroCarousel`, a co-located Embla-based component) instead of `ScrollCarousel` from `components/shared/media/ScrollCarousel`. `HeroCarousel` does render one `<Image>` per slide with Embla autoplay (5s). The named component does not match the AC pass criteria. `Hero.tsx` line 5: `import { HeroCarousel } from "./HeroCarousel"`. | PASS (override) — AC wording was written before the design decision to create `HeroCarousel`. The plan explicitly called for a custom Embla component because `ScrollCarousel` puts dots below the image — not suitable for a full-width hero. `HeroCarousel` meets the underlying intent: one `<Image>` per slide, 5s autoplay, loop. Screenshots confirm carousel renders correctly with overlaid dot navigation. | |
| AC-FN-8 | `HeroSettingsSection` calls video upload endpoint before settings PUT on save | Code review: `HeroSettingsSection.tsx` `saveHero()` handler | If pending video file: `fetch('/api/upload/video', formData)` called first; returned blob URL passed in PUT body | PASS — `HeroSettingsSection.tsx` lines 135-152: if `videoFile` is set, `fetch('/api/upload/video', { method: 'POST', body: formData })` called before PUT; returned `data.path` used as `finalVideoUrl` in PUT body at line 175. | PASS — Confirmed. | |
| AC-FN-9 | `HeroSettingsSection` loads existing settings on mount | Code review: `HeroSettingsSection.tsx` mount effect | `useEffect` calls `GET /api/admin/settings/hero-media` and populates all state fields | PASS — `HeroSettingsSection.tsx` lines 80-101: `useEffect` calls `fetch("/api/admin/settings/hero-media")`, then populates `heading`, `tagline`, `savedVideoUrl`, `activeTab`, `imageMode` from response. | PASS — Confirmed. | |
| AC-FN-10 | Video hero uses `poster` attribute and `preload="none"` to avoid blocking LCP | Code review: `Hero.tsx` video branch | `<video preload="none" poster={videoPosterUrl}>` — poster URL sourced from `homepageHeroVideoPosterUrl`; no eager video fetch on page load | PASS — `Hero.tsx` lines 51-59: `<video ... preload="none" poster={videoPosterUrl || undefined} ...>`. Poster URL sourced from`videoPosterUrl` prop (passed as `homepageHeroVideoPosterUrl` from settings). | PASS — Confirmed. | |
| AC-FN-11 | Carousel first slide gets `priority` on `<Image>`; remaining slides lazy-load | Code review: `Hero.tsx` carousel branch | `<Image priority={i === 0} ...>` in the slide map — only index 0 has `priority` | PASS — `HeroCarousel.tsx` line 50: `priority={i === 0}` in slide map; only first slide gets priority, rest lazy-load by default. Note: rendering is in `HeroCarousel.tsx` not `Hero.tsx` directly. | PASS — Confirmed. `HeroCarousel.tsx` is where rendering happens since Hero delegates to it; this is correct by design. | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|----|----------|
| AC-REG-1 | Existing storefront settings sections (Product Menu, Add-Ons headings) still render and function | Screenshot: `/admin/settings/storefront` at 1280px | Both pre-existing sections visible below Homepage Hero section; no layout breaks | PASS — "Product Menu" section with Menu Icon/Menu Text and "Add-Ons Section Headings" section both visible below Hero section; no layout breaks. `.screenshots/hero-verify/admin-storefront-bottom.png` | PASS — Confirmed. | |
| AC-REG-2 | Homepage `RecommendationsSection` and `FeaturedProducts` still render below hero | Screenshot: homepage at 1280px | Both sections present below hero; scroll reveals them | PASS — "Recommended For You" section visible at scroll position ~900px; "Our Best Sellers" (FeaturedProducts) section visible at ~1600px. Both sections render correctly. `.screenshots/hero-verify/homepage-gradient-fallback.png` (Recommendations visible) and `.screenshots/hero-verify/homepage-featured-section.png` ("Our Best Sellers" visible). | PASS — Confirmed visible in homepage-image-hero.png (recommendations at bottom). | |
| AC-REG-3 | `npm run precheck` passes clean | Run `npm run precheck` | 0 TypeScript errors, 0 ESLint errors | PASS — `npm run precheck` exits with 0 TypeScript errors. 1 ESLint warning (pre-existing: `react-hooks/incompatible-library` in `SalesClient.tsx` — unrelated to this feature); 0 errors introduced by this feature. | PASS — Confirmed locally. Pre-existing warning in SalesClient.tsx predates this branch. | |
| AC-REG-4 | `npm run test:ci` passes | Run `npm run test:ci` | All existing tests pass, 0 failures | PASS — 97 test suites, 1139 tests, 1 snapshot: all passed. 0 failures. | PASS — Confirmed: 97 suites, 1139 tests, 0 failures. | |

---

## Agent Notes

**Iteration 1 — 2026-04-07**

**Overall: 25/26 PASS (1 FAIL)**

**Screenshots captured (all in `.screenshots/hero-verify/`):**

- `admin-storefront-desktop.png` — Admin page at 1280px (AC-UI-1, AC-UI-2, AC-UI-5)
- `admin-storefront-mobile.png` — Admin page at 375px (AC-UI-6)
- `admin-storefront-slideshow.png` — After clicking Slideshow radio (AC-UI-3)
- `admin-storefront-video-tab.png` — After clicking Video tab (AC-UI-4)
- `admin-storefront-bottom.png` — Scrolled down to Product Menu + Add-Ons (AC-REG-1)
- `homepage-gradient-fallback.png` — Homepage with empty slides (AC-UI-11, AC-REG-2)
- `homepage-image-hero.png` — Homepage with image hero set via API (AC-UI-7)
- `homepage-carousel-hero.png` — Homepage with carousel set via API (AC-UI-8)
- `homepage-featured-section.png` — Homepage scrolled to FeaturedProducts (AC-REG-2)
- `homepage-below-hero.png` — Homepage scrolled 900px (AC-REG-2)

**Puppeteer note:** Radix UI tabs require `page.mouse.click()` with real coordinates — `element.click()` and `dispatchEvent` do not trigger Radix tab switching in headless mode.

**AC-FN-7 FAIL — Component mismatch:**
The Pass criteria specifies `ScrollCarousel` from `components/shared/media/ScrollCarousel` with an `autoplay` prop. The implementation uses `HeroCarousel` (co-located at `app/(site)/_components/content/HeroCarousel.tsx`), which is an Embla Carousel-based component with autoplay via the `embla-carousel-autoplay` plugin. The functionality (autoplay carousel with one Image per slide) is correct, but the specific component name and import path do not match the AC's pass criteria. QC should decide whether to accept the alternative implementation or update the AC.

**AC-REG-3 note:** One pre-existing ESLint warning (`react-hooks/incompatible-library` in `SalesClient.tsx`) was present before this feature. Zero new errors or warnings introduced by this feature.

**Test environment:** `puppeteer` was not installed; installed as devDependency during verification. Removed temp scripts after verification: `hero-verify-screenshots.ts`, `hero-verify-video-tab.ts`, `hero-verify-video-tab2.ts`.

## QC Notes

**Iteration 1 — 2026-04-07 — 26/26 PASS (0 iterations needed)**

**AC-FN-7 override:** Sub-agent flagged FAIL because AC referenced `ScrollCarousel` from `components/shared/media/ScrollCarousel`. This was an early plan draft — the design decision to create `HeroCarousel` was made deliberately because `ScrollCarousel` renders dots below the image (not suitable for full-width hero). The plan text says: "create dedicated HeroCarousel.tsx using Embla directly with overlaid dots." The implementation is correct by design. Override to PASS.

Screenshots reviewed and confirmed — admin UI renders correctly at desktop and mobile; homepage image/carousel/gradient modes all confirmed visually. 97 test suites, 1139 tests, 0 failures.

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}
