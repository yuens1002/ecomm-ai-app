# File Restructure Verification Checklist

Use this checklist to verify the file structure reorganization works correctly.

## Automated Checks

Run these commands - all should pass:

```bash
npm run typecheck    # TypeScript compilation
npm run lint         # ESLint
npm run test:ci      # All tests (599 tests)
npm run build        # Production build
```

## Manual Smoke Tests

### Public Site (`/`)

- [ ] **Homepage** loads correctly
  - [ ] Header renders (logo, navigation, cart icon)
  - [ ] Hero section displays
  - [ ] Featured products show
  - [ ] Footer renders with links

- [ ] **Category page** (`/[category]`)
  - [ ] Products display in grid
  - [ ] Category menu columns work in header dropdown

- [ ] **Product page** (`/products/[slug]`)
  - [ ] Product images load (carousel if multiple)
  - [ ] Variant selector works
  - [ ] Add to cart works
  - [ ] Recommendations section shows

- [ ] **Cart**
  - [ ] Cart sheet opens
  - [ ] Items display correctly
  - [ ] Add-on suggestions show (if configured)

- [ ] **AI Features** (if enabled)
  - [ ] Chat Barista opens and responds
  - [ ] Voice Barista works (if VAPI configured)

- [ ] **Auth**
  - [ ] Login page loads
  - [ ] Signup page loads
  - [ ] OAuth buttons work (Google/GitHub)
  - [ ] Password reset flow works

- [ ] **Account** (logged in)
  - [ ] Orders page shows order history
  - [ ] Order detail page works

### Admin Dashboard (`/admin`)

- [ ] **Dashboard** loads
  - [ ] Admin shell renders (sidebar, top nav)
  - [ ] Breadcrumbs work
  - [ ] Mobile drawer works on small screens

- [ ] **Orders** (`/admin/orders`)
  - [ ] Order list loads
  - [ ] Status filters work
  - [ ] Ship/Pickup actions work

- [ ] **Products** (`/admin/products`)
  - [ ] Product list loads
  - [ ] Product form opens
  - [ ] Image upload works
  - [ ] Variant management works

- [ ] **Product Menu** (`/admin/product-menu`)
  - [ ] Menu Builder loads
  - [ ] Tree view renders
  - [ ] Table views work
  - [ ] Drag and drop works
  - [ ] Context menu works

- [ ] **Pages/CMS** (`/admin/pages`)
  - [ ] Page list loads
  - [ ] Page editor opens
  - [ ] Rich text editor works
  - [ ] Block editing works (Hero, FAQ, Hours, etc.)
  - [ ] Image fields upload correctly
  - [ ] AI assist generates content

- [ ] **Settings** (`/admin/settings`)
  - [ ] Settings pages load
  - [ ] Form fields work
  - [ ] Save buttons work

## Import Path Verification

Verify no old import paths remain:

```bash
# Should return NO results:
grep -r "components/app-components" app/ components/ --include="*.tsx" --include="*.ts"
grep -r "components/admin/dashboard" app/ --include="*.tsx" --include="*.ts"
grep -r "components/blocks" app/ --include="*.tsx" --include="*.ts"
grep -r "@/components/ui/app" app/ components/ --include="*.tsx" --include="*.ts"
```

## Directory Structure Verification

Confirm these directories exist and contain the right files:

```
app/(site)/_components/
├── account/         # OrdersClient
├── ai/              # ChatBarista, VoiceBarista, AiHelperModal
├── cart/            # ShoppingCart, AddOnCard, CartAddOnsSuggestions
├── category/        # CategoryClientPage
├── content/         # Hero, HeroSection, HoursCard, StatCard, etc.
├── layout/          # SiteHeader, SiteFooter, SiteBanner, etc.
├── navigation/      # CategoryMenuColumns, FooterCategories, UserMenu
└── product/         # ProductCard, FeaturedProducts, Thumbnail, etc.

app/(site)/_hooks/
├── use-vapi.ts
└── useSiteBanner.tsx

app/admin/_components/
├── cms/
│   ├── blocks/      # All block components
│   ├── editors/     # PageEditor, RichTextEditor, TipTapEditor
│   └── fields/      # ImageField, IconPicker, NameSlugField, etc.
├── dashboard/       # AdminShell, AdminBreadcrumb, AdminTopNav, etc.
├── dialogs/         # DialogShell, AiAssistDialog, BlockEditDialog
├── forms/           # PageTitle, SaveButton, SettingsField, etc.
└── shared/          # UpdateBanner, FeedbackDialog

app/admin/_hooks/
├── useImageUpload.ts
└── useSlugGenerator.ts

components/
├── auth/            # LoginForm, SignIn, PasswordFields, etc.
├── providers/       # SessionProvider, ThemeProvider
├── shared/
│   ├── icons/       # DynamicIcon
│   └── media/       # ImageCarousel, ScrollCarousel, CarouselDots
├── ui/              # shadcn/ui primitives
│   └── forms/       # FormHeading, FormInputField, etc. (shared form components)
└── ai-assist/       # AI assist components

lib/
├── config/          # admin-nav.ts, app-settings.ts
└── services/        # stripe.ts, resend.ts
```

## Database Toggle Verification

Test switching between local and Neon databases:

1. **Switch to Local:**
   - Edit `.env.local`: uncomment local URL, comment Neon URL, set `DATABASE_ADAPTER="standard"`
   - Restart `npm run dev`
   - Verify admin orders shows local data

2. **Switch to Neon:**
   - Edit `.env.local`: comment local URL, uncomment Neon URL, comment out `DATABASE_ADAPTER`
   - Restart `npm run dev`
   - Hard refresh browser (`Ctrl+Shift+R`)
   - Verify admin orders shows Neon data

## Post-Verification

After all checks pass:

```bash
git add -A
git commit -m "refactor: complete file structure reorganization"
```

---

## Future: Upgrade Path Testing

TODO: Document and test the upgrade path for self-hosted instances:

1. Spin up fresh Docker instance with older schema
2. Create mock migration
3. Run upgrade commands
4. Verify migration applied

See `.archive/INSTALLATION.md` for current upgrade documentation.
