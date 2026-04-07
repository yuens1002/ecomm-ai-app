# Homepage Hero Settings — Architecture

## Data Flow

```
Admin saves settings
        │
        ▼
HeroSettingsSection.handleSave()
  ├─ uploadAllSlides()  →  POST /api/upload        →  Vercel Blob "hero/" folder
  ├─ uploadPosterFile() →  POST /api/upload        →  Vercel Blob "hero/" folder
  ├─ fetch video        →  POST /api/upload/video  →  Vercel Blob "hero/" folder
  └─ PUT /api/admin/settings/hero-media
        │
        ▼
prisma.siteSettings.upsert × 6 keys
        │
        ▼
Homepage request (SSR)
        │
getPublicSiteSettings()
  └─ prisma.siteSettings.findMany(publicSettingsKeys)
  └─ mapSettingsRecord() → SiteSettings
        │
        ▼
<HomeHero ... heroType heroSlides heroVideoUrl ... />
  └─ <Hero type="image|carousel|video" ... />
       ├─ "image"    → <Image fill priority />
       ├─ "carousel" → <HeroCarousel slides={slides} />
       └─ "video"    → <video preload="none" poster={posterUrl} />
```

---

## Component Hierarchy

```
app/(site)/page.tsx  (Server Component)
└── HomeHero  (Server Component)
    └── Hero  ("use client")
        ├── [image mode]   next/image <Image priority>
        ├── [carousel mode] HeroCarousel  ("use client")
        │     └── useEmblaCarousel + Autoplay plugin
        └── [video mode]   <video preload="none" poster>

app/admin/settings/storefront/page.tsx  ("use client")
└── HeroSettingsSection  ("use client")
    ├── useMultiImageUpload (slides)
    ├── useImageUpload (poster)
    ├── ImageListField
    ├── ImageField
    └── Hero  (live preview, same component as storefront)
```

---

## Settings Keys

All stored in the `SiteSettings` table as string key-value pairs.

| Key | Parsed as | Public |
|-----|-----------|--------|
| `homepage_hero_type` | `"image" \| "carousel" \| "video"` | Yes |
| `homepage_hero_slides` | `HeroSlide[]` via `safeParseJSON` | Yes |
| `homepage_hero_video_url` | string | Yes |
| `homepage_hero_video_poster_url` | string | Yes |
| `homepage_hero_heading` | string | Yes |
| `homepage_hero_tagline` | string | Yes |

"Public" means the key is in `lib/data.ts → publicSettingsKeys`, making it available to
`getPublicSiteSettings()` without admin auth. All six are public — the homepage SSR needs them.

---

## Upload Routes

| Route | Accepts | Limit | BlobFolder | Auth |
|-------|---------|-------|------------|------|
| `POST /api/upload` | `image/*` | 5 MB | `"hero"` (or page slug) | Admin |
| `POST /api/upload/video` | `video/*` | 100 MB | `"hero"` | Admin |

Both routes accept an `oldPath` form field. If the old path is a Vercel Blob URL, the old
file is deleted after the new upload succeeds.

---

## `HeroCarousel` vs `ScrollCarousel`

The project's general-purpose `ScrollCarousel` renders dot navigation **below** the image
in the document flow. Hero carousels require dots **overlaid** at the bottom of the image
(absolute-positioned inside the relative container). `HeroCarousel` is a dedicated Embla
wrapper that satisfies this requirement without modifying the shared component.

Both use Embla (`embla-carousel-react`) — `HeroCarousel` adds the `Autoplay` plugin with
`stopOnInteraction: true` and `stopOnMouseEnter: true`.

---

## LCP Strategy

| Mode | LCP element | Strategy |
|------|-------------|----------|
| Image | `<Image>` | `priority` prop → `<link rel="preload">` in `<head>` |
| Carousel | First slide `<Image>` | `priority={i === 0}` only; remaining slides omit `priority` |
| Video | `<img>` (poster) | `<video preload="none" poster={url}>` — browser paints poster, streams video |

No mode blocks first paint on a cold page load.
