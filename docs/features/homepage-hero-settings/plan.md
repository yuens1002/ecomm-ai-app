# Homepage Hero Settings — Plan

**Branch:** `feat/homepage-hero-settings`
**Base:** `feat/agentic-search` (depends on `Hero.tsx` and `HomeHero.tsx` introduced there)
**Status:** Verified — 26/26 ACs passed
**ACs doc:** `docs/plans/homepage-hero-settings-ACs.md`

---

## Context

The homepage hero was a dark gradient placeholder — shop owners had no way to configure it.
This feature adds a complete hero media configuration system reachable from
`/admin/settings/storefront`. Shop owners choose between two mutually exclusive modes:

- **Image / Slides** — a single static image, or a 2–10 image slideshow with autoplay
- **Video** — a looping background video with a required poster image

A 40/60 form/preview split panel gives instant visual feedback. Settings persist via the
existing `SiteSettings` key-value table and are served to the public homepage at render time.

---

## Mode Boundary

The admin UI presents **two tabs** — not three. "Single image" vs "slideshow" is a radio
within the Image / Slides tab. This makes the image ↔ video choice the primary decision,
and the carousel detail a secondary one.

| `homepageHeroType` | Tab | Radio |
|--------------------|-----|-------|
| `"image"` | Image / Slides | Single image |
| `"carousel"` | Image / Slides | Slideshow |
| `"video"` | Video | — |

---

## Commit Schedule

| # | Commit | Risk |
|---|--------|------|
| 1 | `feat: extend site-settings with hero media keys and data mapping` | Low |
| 2 | `feat: add hero-media settings API and video upload endpoint` | Low |
| 3 | `feat: carousel and video hero variants` | Medium |
| 4 | `feat: hero settings admin UI with image/slides and video modes` | Medium |
| 5 | `feat: wire hero settings to homepage and storefront admin` | Low |

---

## LCP / Performance Constraints

Raw `<video autoPlay>` blocks first paint — the browser cannot paint until the video file
begins downloading. Two mitigations are enforced:

1. **Video poster required** — a static image (`homepageHeroVideoPosterUrl`) is uploaded
   alongside any video. The `<video poster={...} preload="none">` attribute combination makes
   the browser paint the poster immediately and stream the video behind it.
2. **Carousel priority** — only the first carousel slide gets `<Image priority>`. Remaining
   slides lazy-load. This limits the LCP impact to one image, the same as a single-image hero.

---

## Key Files

| File | Role |
|------|------|
| `lib/site-settings.ts` | `HeroSlide` type, `SiteSettings` hero fields, `safeParseJSON`, `mapSettingsRecord` |
| `lib/data.ts` | `publicSettingsKeys` — 6 new keys exposed to the homepage |
| `app/api/admin/settings/hero-media/route.ts` | GET + PUT for all 6 hero settings keys |
| `app/api/upload/video/route.ts` | Video upload — 100 MB limit, `video/*` MIME, `"hero"` BlobFolder |
| `app/(site)/_components/content/HeroCarousel.tsx` | Embla carousel with overlaid dots + autoplay |
| `app/(site)/_components/content/Hero.tsx` | Unified hero — image / carousel / video branches |
| `app/(site)/_components/content/HomeHero.tsx` | Homepage composition — CTA + hero props |
| `app/admin/settings/storefront/_components/HeroSettingsSection.tsx` | Admin form + live preview |
| `app/admin/settings/storefront/page.tsx` | Renders `HeroSettingsSection` above existing sections |
| `app/(site)/page.tsx` | Passes hero settings from `getPublicSiteSettings()` to `HomeHero` |

---

## Settings Data Model

Six new `SiteSettings` keys:

| DB key | Type | Default |
|--------|------|---------|
| `homepage_hero_type` | `"image" \| "carousel" \| "video"` | `"image"` |
| `homepage_hero_slides` | JSON string → `HeroSlide[]` | `[]` |
| `homepage_hero_video_url` | string | `""` |
| `homepage_hero_video_poster_url` | string | `""` |
| `homepage_hero_heading` | string (max 120) | `""` |
| `homepage_hero_tagline` | string (max 200) | `""` |

Slides are stored as a JSON string (the existing `SiteSettings` schema is key-value strings).
`safeParseJSON` in `lib/site-settings.ts` provides a typed, null-safe parse with `[]` fallback.

---

## Admin UI

`HeroSettingsSection` is a client component that:

1. Calls `GET /api/admin/settings/hero-media` on mount to load saved values
2. Uses `useMultiImageUpload` (deferred upload) for slides, `useImageUpload` for the poster
3. Manages video file selection manually (no hook — different upload route)
4. On save: uploads pending files first → PUT settings to DB
5. Renders a live `<Hero>` preview in the right panel using current form state

Layout: `grid grid-cols-1 lg:grid-cols-[2fr_3fr]` — stacks on mobile, 40/60 split at `lg`.

---

## Decisions

**Why a custom `HeroCarousel` instead of reusing `ScrollCarousel`?**
`ScrollCarousel` renders dot navigation below the image. The hero requires dots overlaid at the
bottom of the image — identical to how a full-screen hero carousel works on every major
e-commerce site. `HeroCarousel` is a thin Embla wrapper (same library the project already uses)
with this layout difference.

**Why a dedicated `/api/upload/video` route?**
The existing `/api/upload` is images-only with a 5 MB limit. Videos need 100 MB and
`video/*` MIME validation. Sharing the route would require conditional logic and MIME
sniffing for a fundamentally different file type.

**Why is `Hero.tsx` a client component?**
`HeroSettingsSection` (a client component) imports `Hero` for the live preview panel.
Client components cannot import server components. `Hero` has no server-only APIs, so
the `"use client"` boundary is safe and SSR still renders the initial HTML.

**Why branch from `feat/agentic-search` instead of `main`?**
`HomeHero.tsx` and the initial `Hero.tsx` were introduced on `feat/agentic-search`. Branching
from there avoids a merge conflict cascade and keeps the two features' histories clean until
both are merged together into `main`.
