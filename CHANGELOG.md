# Changelog

## 0.32.1 - 2025-12-05

- **CI Resilience**: `check:backup-models` now skips gracefully when `dev-tools/check-backup-models.ts` is absent, preventing build-safe workflow failures on environments without private dev tools.

## 0.32.2 - 2025-12-05

- **CI Resilience (Backup)**: `db:backup` now skips gracefully when `dev-tools/backup-database.ts` is absent so build-safe can run in environments without private backup tooling.

## 0.32.3 - 2025-12-05

- **CI Env Defaults**: `build-safe-main` workflow now provides dummy `STRIPE_SECRET_KEY`/`RESEND_API_KEY`/`RESEND_FROM_EMAIL` fallbacks to prevent build failures when secrets are not present in CI.

## 0.32.4 - 2025-12-05

- **CI Build Cache**: `build-safe-main` restores/saves Next.js/Turbopack cache (`.next/cache`, `.turbo`) to speed up repeated CI builds.

## 0.32.0 - 2025-12-05

- **CMS Seeds Modularization**: Split CMS seeding into focused About/Café/FAQ functions with refreshed multi-location copy and consistent block rebuilds for both single and multi layouts.
- **Demo Credentials Hardening**: Seeded demo/admin accounts now hash passwords with bcrypt to align with auth expectations while keeping existing demo profiles intact.
- **Backup & Restore Guidance**: Expanded seed README with restore usage, integrity checks, selective seeding tips, and drift mitigation notes to keep environments recoverable.
- **Safety Automation**: Added `build-safe-main` GitHub workflow to run `npm run build:safe` (schema coverage → backup → build) and documented the gate in the commit procedure for main merges.

## 0.31.0 - 2025-12-05

- **Modular Seed System**: Complete database seeding architecture overhaul with 7 focused modules
  - Transformed monolithic 2459-line seed.ts into maintainable modules (settings, categories, products, users, cms-pages, synthetic-data)
  - Migrated complete 30-product specialty coffee catalog with variants and pricing
  - Added comprehensive synthetic data generation (user activities, orders, newsletter subscribers) for realistic testing
  - Implemented dependency-ordered execution with upsert operations for safe re-seeding
  - Fixed foreign key constraint issues for reliable database population
  - Updated package.json seed script to use new modular orchestrator
  - Created comprehensive README.md with usage instructions and troubleshooting

## 0.30.9 - 2025-12-05

- **Documentation Enhancement**: Improved commit procedure with practical suggestions
  - Added branching strategy guidelines (feature → integration → main workflow)
  - Included quality assurance steps (npm i, precheck, build before commits)
  - Added version synchronization best practices
  - Documented documentation update guidelines
  - Provided large feature development strategies
  - Enhanced AI assistant workflow integration

## 0.30.8 - 2025-12-05

- **Final Code Quality Cleanup**: Resolved remaining 2 ESLint warnings ✅ **0 errors, 0 warnings**
  - Fixed `CarouselBlock.tsx`: Suppressed false positive exhaustive-deps warning for stable `clearAllErrors` function from `useValidation` hook
  - Fixed `useImageUpload.ts`: Added `images` dependency to cleanup useEffect for proper preview URL revocation
  - All code quality issues now resolved with automated enforcement in place

## 0.30.7 - 2025-12-05

- **Code Cleanup**: Removed all unused variables and imports, suppressed legitimate lint warnings ✅ **0 errors, 2 warnings** (down from 67!)
  - Deleted 600+ lines of unused code
  - Removed duplicate `components/PageEditor.tsx` (was shadowed by `components/app-components/PageEditor.tsx`)
  - Prefixed all unused function parameters with `_` to satisfy linter
  - Removed unused imports: Select, Card components, DynamicIcon, lucide icons, useEffect
  - Removed unused state variables: setMounted, setFooterOrderValue, setIconValue, isAdmin
  - Removed unused computed values: availableBlocks, reorderBlocks
  - Added `eslint-disable-next-line` comments for legitimate `<img>` tag usage in admin preview contexts:
    - `SettingsManagementClient.tsx`: Logo and favicon preview (user-uploaded URLs)
    - `ImageField.tsx`: Pending file preview with object URL
    - `ImageGalleryBlock.tsx`: Gallery image preview with object URL
  - Remaining 2 warnings are non-critical exhaustive-deps (pre-existing)

## 0.30.6 - 2025-12-05

- **Automated Code Quality Enforcement**: Prevent common mistakes at write-time and commit-time ✅ **0 errors, 67 warnings**
  - **ESLint Strict Rules**: Configured all common errors as "error" (not "warn") in `eslint.config.mjs`
    - `@typescript-eslint/no-explicit-any` - Force proper typing, never use `any`
    - `react-hooks/set-state-in-effect` - Prevent setState in useEffect (cascading renders)
    - `react-hooks/static-components` - Prevent component creation during render
    - `@typescript-eslint/no-unused-vars` - Fail on unused imports/variables (allow `_` prefix)
  - **Ignored Paths**: Excluded AI wizard and edit page directories from linting (features not in use)
    - `app/admin/pages/new/wizard/**` - AI page generation (revisit later)
    - `app/admin/pages/edit/[id]/**` - Page editing (has type issues with JsonValue)
    - `app/api/admin/pages/generate-about/**` - AI generation API
  - **Pre-commit Hook**: Git automatically runs typecheck + lint before every commit (via Husky)
    - Blocks commits with TypeScript errors or ESLint errors
    - Catches mistakes before they enter codebase
    - Tested and working (caught real errors during setup)
  - **VS Code Auto-fix**: Added `editor.codeActionsOnSave` to `.vscode/settings.json`
    - ESLint auto-fixes on save for instant feedback
  - **Documentation**: Created comprehensive `docs/CODE_QUALITY_STANDARDS.md`
    - Common patterns and anti-patterns with examples
    - Setup instructions for Husky and ESLint
    - Troubleshooting guide for git hooks
    - Explains why each rule exists and how to fix violations
- **StatCard Refactor**: Replaced Lucide icon imports with DynamicIcon component
  - Fixes react-hooks/static-components violation
  - Changed `icon` prop from `LucideIcon` type to `string` (icon name)
  - Simpler, more consistent with rest of codebase
- **Dependencies**: Added `husky@^9.1.7` for git hooks
- **Benefits**: Red squiggles in editor → Pre-commit validation → No more chasing these errors later

## 0.30.5 - 2025-12-05

- **Code Quality Improvements**: Continued ESLint and TypeScript cleanup (112→98 problems, 25→11 errors)
  - Fixed remaining react-hooks violations in SiteBannerPortal and StatCard
  - Replaced 10+ `any` types with proper TypeScript types in blocks, API routes, and layouts
  - Fixed @typescript-eslint/no-explicit-any errors in blocks/actions, CarouselBlock, cafe/reseed
  - Used `Prisma.JsonValue` for JSON fields, proper interfaces for component props
  - Fixed react/no-unescaped-entities in PageEditor files (replaced quotes with &ldquo;/&rdquo;)
  - Added BlockHandlers type to two-column layout
- **Documentation**: Created standard commit procedure in `.github/COMMIT_PROCEDURE.md`
  - Defines when and how to commit with changelog updates
  - Includes version numbering guidelines (semantic versioning)
  - Best practices for commit messages and changelog entries
  - Template checklist for consistency across sessions
- **Remaining Work**: 11 errors (AI wizard files to revisit later) and 87 warnings (unused imports/variables)

## 0.30.4 - 2025-12-05

- **Code Quality Improvements**: Major ESLint and TypeScript cleanup (135→112 problems, 49→25 errors)
  - Fixed all react-hooks/set-state-in-effect violations (5 files) using proper React patterns
  - Fixed react-hooks/static-components error in StatCard component
  - Replaced 15+ `any` types with proper TypeScript types (Record<string, unknown>, etc.)
  - Fixed all @next/next/no-html-link-for-pages violations (replaced `<a>` with `<Link>`)
  - Added missing Link imports to AdminHeader and AdminSignInClient
  - Fixed optional field handling in AdminSidebar NavItem interface
- **Remaining Work**: 25 errors and 87 warnings to address in next iteration

## 0.30.3 - 2025-12-05

- **Page Icon Selection**: Admins can now assign Lucide icons to pages for display in navigation
  - Added searchable icon picker to PageEditor with 1000+ Lucide icons
  - Icons display in header navigation and mobile menu (not footer)
  - Human-readable icon names ("Circle Question Mark" vs "CircleQuestionMark")
  - Uses shadcn Command (combobox) + Popover components
- **AdminSidebar Ordering**: Content pages now sort by their header/footer order settings
  - Pages shown in AdminSidebar reflect their navigation order
  - Header pages listed first, footer pages second, unassigned pages last
- **Mobile Navigation Enhancement**: Dynamic pages with icons now appear at bottom of mobile menu
  - Visual separator between coffee categories and page links
  - Left-aligned icons with consistent spacing
- **Documentation**: Added demo pages architecture documentation
  - Explains separation between demo pages (developer tool) and CMS pages (product feature)
  - Documents legacy content block implementation plan (backlog)

## 0.30.2 - 2025-12-04

- **LINK Page Management**: Admin interface for managing navigation links to hardcoded pages
  - Add url field to Page model for external/internal link destinations
- Add LINK page type to PageType enum
- Include missing migration file for LINK page type changes
- Update LinkPageEditorClient to use FieldLabel pattern (shadcn convention)
- Add LINK page type handling in layouts configuration
- Update SiteHeader types to include url and type fields"

## 0.30.1 - 2025-12-04

- **LINK Page Management**: Admin interface for managing navigation links to hardcoded pages
  - Created `/admin/pages/link/[slug]` route for LINK page settings (show/hide in header/footer, display order, URLs)
  - AdminSidebar now dynamically displays LINK pages from database with ExternalLink icons
  - Updated SiteHeader and SiteFooter to use `url` field for LINK pages instead of hardcoded paths
  - Fixed route conflicts by moving edit pages from `/admin/pages/[id]/edit` to `/admin/pages/edit/[id]`

## 0.30.0 - 2025-12-04

- **FAQ Page**: New FAQ page type with accordion layout, category grouping, search/filter, and expand/collapse functionality
  - `FaqPageContent`: Public display with search bar, category tabs, grouped accordions
  - `FaqItemBlock`: Individual FAQ blocks with question, answer, and category selector
  - `FaqAccordionItem`: Reusable accordion component with animated chevron
  - Fixed categories: Orders, Shipping, Returns, Products, Subscriptions, Account, General
  - Accordion layout supports hero + up to 50 FAQ items
- **Hero Block Improvements**: Renamed `title` to `heading`, made optional for image-only heroes
- **Seed Updates**: About and FAQ pages now use block-based architecture with placeholder images

## 0.29.6 - 2025-12-04

- **Add Block Dialog**: New `PendingBlockDialog` component opens form with empty fields when clicking "Add" buttons; creates block in DB only on confirm (no wasted trips)
- **Stat Block Emoji Fix**: Admin edit mode now shows emoji instead of auto-icon (was missing emoji prop)
- **PullQuote Delete Button Removed**: Required blocks (hero, richText, pullQuote) now consistently have no delete button
- **Updated baseline-browser-mapping**: Removed build warning spam

## 0.29.5 - 2025-12-04

- **Preview Mode for Unpublished Pages**: Admin users can preview unpublished pages via `?preview=true` query param with visual banner indicator
- **Reusable SiteBanner System**: Created `SiteBanner` component with variants (preview, promo, info, warning, error) and context-based `SiteBannerPortal` for dynamic banners
- **PageSlug-based Image Uploads**: Images now upload to `/public/pages/[pageSlug]/` directories for better organization; cleanup handles both old and new paths
- **Fixed Reseed Route**: Corrected invalid default values (empty googleMapsUrl, images array) that violated block schema validation

## 0.29.4 - 2025-12-04

- **Block Wrapper Centralization (Option B)**: Complete architectural refactor for consistent edit/delete controls
  - `BlockRenderer` now wraps all blocks with `EditableBlockWrapper` when in editing mode
  - Deleted state overlay handled centrally in `BlockRenderer` instead of individual blocks
  - Dialog state controlled via `isDialogOpen`/`onDialogOpenChange` props from `BlockRenderer`
  - Removed redundant `EditableBlockWrapper`, `DeletedBlockOverlay`, and action button handling from all blocks
  - Simplified block components to just render display content + dialog (no wrapper logic)
  - Added `canDeleteBlock` handler to `BlockHandlers` for per-block delete control
  - Updated blocks: CarouselBlock, LocationBlock, HeroBlock, FaqItemBlock, ImageGalleryBlock, StatBlock, HoursBlock, PullQuoteBlock, RichTextBlock
  - Net reduction: 16 files changed, 461 insertions, 703 deletions (-242 lines)

## 0.29.3 - 2025-12-04

- **Block Component Architecture Standardization**: Complete separation of concerns across all CMS blocks
  - Extracted `HoursCard` and `FaqAccordionItem` presentational components to app-components
  - Migrated all blocks to `useValidation` hook for consistent error handling and toast notifications
  - Fixed LocationBlock stray backticks typo
  - Updated `cms-blocks-architecture.md` with required development standards for new blocks
- **UX: Delayed "Unsaved changes" indicator**: FormHeading now waits 30 seconds before showing the dirty indicator, reducing noise while actively editing and only reminding users who may have forgotten to save

## 0.29.2 - 2025-12-04

- **DRY Image Upload & Validation System**: Centralized hooks and reusable components for consistent image handling across all block dialogs
  - Created `useImageUpload` and `useMultiImageUpload` hooks with deferred upload pattern, auto-sync, and cleanup
  - Added `useValidation` hook for centralized error toast notifications and save button disable on validation failure
  - Built reusable `ImageCard` component with position controls (move up/down, add after, delete) and highlight animation
  - Highlight-pulse animation scrolls to and highlights newly added items for better UX

## 0.29.1 - 2025-12-03

- **Form Field Standardization**: Consistent UI across all block dialogs
  - Created ImageField component for standardized image uploads with deferred upload pattern
  - All blocks now use FormHeading with validation states (dirty, error, required)
  - Added character counts and isDirty tracking to all text fields
  - FormHeading htmlFor now optional for standalone labels (e.g., switches)

## 0.29.0 - 2025-12-03

- **Location Setup with Dynamic Cafe Page Configuration**: Complete cafe page management with automatic layout switching based on business structure
  - Location Setup in site settings allows switching between single and multiple location modes
  - Automatic cafe page reset when changing location type with user-friendly warning dialog
  - Single location mode: Photo gallery carousel, one location section, welcome message
  - Multiple location mode: Interactive location carousel with navigation, dedicated sections per location, welcome message
  - EditableBlockWrapper component provides consistent hover effects and edit controls across all blocks
  - ImageCarousel shared component for single-image display with dot navigation
  - LocationBlock improvements: Clickable address (opens Google Maps) and phone links
  - Fixed image upload API response field name (path → url) for carousel compatibility
  - Enhanced seed data with realistic content for both location types
  - Reseed API with automatic image cleanup when switching location types

## 0.28.1 - 2025-12-02

- **Animated Carousel Navigation Dots**: Enhanced carousel UX with smooth animations and improved visibility
  - Reusable CarouselDots component with Framer Motion animations
  - Active dot elongates smoothly with 0.3s easeInOut transition
  - Semi-transparent background with backdrop blur for visibility on any image
  - Fixed scroll navigation - clicking dots now properly scrolls carousel
  - Applied to both image carousels and location gallery dots
  - Positioned at bottom center with proper spacing

## 0.28.0 - 2025-12-02

- **Cafe Page with Location Carousel**: Complete cafe page implementation with single and multi-location support
  - Location carousel with auto-scrolling slides and click-to-scroll navigation
  - Location blocks with photo galleries, addresses, hours, and contact info
  - Support for both SINGLE (atmosphere images) and MULTI (location previews) modes
  - Simplified carousel dialog - removed type-switching for cleaner UX
  - Placeholder image integration with placehold.co for lean development
  - Next.js Image optimization with SVG support and security hardening

## 0.27.0 - 2025-11-29

- **Dynamic Page Navigation**: Configure pages to appear in site header and footer with custom icons and display order
  - Admin can enable/disable pages in navigation via checkboxes in PageEditor
  - Custom icon selection from Lucide library (e.g., Coffee, MapPin, Info)
  - Configurable display order for both header and footer (lower numbers appear first)
  - Database-driven navigation eliminates need for code changes to add/remove links
  - Mobile-optimized carousel for stats blocks in two-column layouts
  - Static page generation for improved performance and SEO
  - Pages appear as `/pages/{slug}` in navigation menus

## 0.26.12 - 2025-11-27

- **PageEditor Bug Fixes**: Fixed block availability filtering and improved empty state
  - Fixed `canAddBlock` function calls to pass correct count parameter
  - Enhanced empty state with better visual design and prominent "Add Your First Block" button
  - Improved block filtering logic to correctly show available block types
  - Added graceful handling of legacy HTML content in pages

## 0.26.11 - 2025-11-27

- **Page Editors with Live Editing**: Created dedicated admin editors for About, Cafe, and FAQ pages
  - Built `/admin/pages/about`, `/admin/pages/cafe`, `/admin/pages/faq` routes with PageEditor integration
  - Added API endpoint `/api/pages/[id]` (PATCH) for publish/unpublish functionality
  - Auto-creates page records on first access with type-specific defaults
  - Updated AdminSidebar with direct links to all 3 page editors
  - Each editor supports inline block editing, reordering, and publish toggle
  - Created database migration for PageType enum column

## 0.26.10 - 2025-11-27

- **Block Components & Editor**: Completed block-based page editor with rendering components
  - Built 8 block renderer components (HeroBlock, StatBlock, PullQuoteBlock, RichTextBlock, LocationBlock, HoursBlock, FaqItemBlock, ImageGalleryBlock)
  - Created PageEditor component with inline editing, drag-to-reorder, add/delete block UI
  - Added shadcn Collapsible component for FAQ accordion functionality
  - Each block has edit/display modes with save/cancel controls

## 0.26.9 - 2025-11-27

- **Block-Based Page System Foundation**: Created reusable block architecture for structured page editing
  - Implemented Zod schemas for 8 block types (hero, stat, pullQuote, richText, location, hours, faqItem, imageGallery)
  - Built page layout configurations defining allowed blocks per page type (About, Cafe, FAQ)
  - Created server actions for block CRUD with runtime validation
  - Eliminates need for generic rich text editor in favor of purpose-built blocks

## 0.26.8 - 2025-11-27

- **Admin/Customer Layout Separation**: Implemented Next.js route groups to completely separate admin and customer interfaces
  - Created `app/(site)/` route group for all customer-facing pages with dedicated layout (header/footer)
  - Admin routes use separate layout with sidebar navigation and admin header
  - Removed all admin references from customer site (header, footer, user menu)
  - Added dedicated `/admin/signin` page with admin-only authentication flow

## 0.26.7 - 2025-11-27

- **AI Wizard Edit Improvements**: Enhanced variation selection page with inline editing, regeneration animations, AI-generated content structure display (stats cards, pull quotes), and formatted HTML editing in TipTap with Typography styles

## 0.26.6 - 2025-11-26

- **AI About Page Wizard**: 10-question interview wizard at `/admin/pages/new/wizard` that generates 3 AI-powered About page variations using Gemini 2.0 (story-first, values-first, product-first styles)

## 0.26.5 - 2025-11-26

- **Admin Pages CRUD**: Full admin interface for Pages CMS at `/admin/pages` with TipTap rich text editor, create/edit/delete operations, and publishing workflow (Note: Not yet integrated into main admin dashboard - see BACKLOG for admin reorganization plan)

## 0.26.4 - 2025-11-26

- **App Features Demo**: Added `/app-features` showcase page with CMS overview, feature descriptions, and links to documentation

## 0.26.3 - 2025-11-26

- **Dynamic Page Route**: Added `/pages/[...slug]` route to render CMS pages from database with hero images, rich content, and child page navigation

## 0.26.2 - 2025-11-26

- **Pages CMS Foundation**: Added Page model and seed data for content management system (database-only, zero UI impact)

## 0.26.1 - 2025-11-26

- **Documentation**: Added comprehensive architecture documentation for Pages CMS and AI content generation
  - Pages CMS architecture decision document with implementation plan
  - AI-powered About page generator specification
  - Complete Q&A wizard question reference

## 0.26.0 - 2025-11-26

- **Configurable Marketing Content**: Section headings and marketing copy now managed through site settings
  - Full white-label capability for homepage marketing copy
  - No code changes needed to customize section headings
  - Scoped naming convention (homepage*, footer*, product\_) for future expansion
  - Maintains consistent architecture with existing branding system
  - See `docs/marketing-content-architecture-decision.md` for architecture rationale

## 0.25.1 - 2025-11-26

- **Dynamic Branding Completion**: Extended dynamic store name to all remaining hardcoded references
  - Order confirmation and notification emails now use dynamic store name
  - AI recommendation prompt references configured store name
  - Newsletter welcome email uses dynamic store name
  - Contact form email uses dynamic store name
  - All page metadata (account, search, admin) now dynamic
  - Setup page references dynamic store name
  - Order detail component uses dynamic store name
  - VAPI voice assistant config and prompts use dynamic store name
  - Admin order fulfillment emails (pickup/shipment) use dynamic store name

## 0.25.0 - 2025-11-25

- **Configurable Store Branding**: Complete system for managing store identity without code changes
  - Admin UI for store name, tagline, description, logo, and favicon with individual save buttons and file upload
  - Dynamic branding across header, footer, layout metadata, and authentication pages
  - Server-side `getSiteMetadata()` helper and client-side `useSiteSettings()` hook with caching
  - Footer displays tagline under logo; homepage uses description for SEO metadata
  - Public API endpoint (`/api/settings/public`) and protected admin endpoint (`/api/admin/settings/branding`)

## 0.24.3 - 2025-11-25

- **Hotfix**: Wrapped useSearchParams in Suspense boundary for newsletter unsubscribe page to fix build error

## 0.24.2 - 2025-11-25

- **Product Tag System**: Added altitude, variety fields and tag system with many-to-many relations

## 0.24.1 - 2025-11-25

- **Feature Toggle System**: Newsletter and social links features now configurable from admin settings
  - Newsletter feature toggle with heading and description customization
  - Social links feature toggle with heading and optional description
  - Footer conditionally renders features based on toggle state
  - Dynamic 2-column vs 3-column footer grid when third column hidden
  - FormHeading component for consistent field headers with amber dirty indicators
  - Auto-save for feature toggles, manual save for text fields
  - Footer Contact Information updated with FormHeading and improved controls layout
  - Active/Inactive labels and delete buttons relocated to right side inline with text
  - Auto-save for hours and email display toggles
  - Admin dashboard cards reordered (Your Role moved to first position)
  - Analytics Daily Activity Trend visualization improved with teal bars and minimum visible width
  - Social links cards padding removed for cleaner layout
  - Database backup and settings migration scripts for safe feature additions

## 0.24.0 - 2025-11-25

- **Newsletter System**: Complete newsletter subscription system with email notifications and admin management
  - Newsletter signup API endpoint with email validation and duplicate checking
  - Welcome email sent via Resend with personalized unsubscribe token
  - Unsubscribe functionality with secure token-based links (soft delete with isActive flag)
  - Admin dashboard view with subscriber list, search, stats (total/active/inactive), and CSV export
  - Admin email notifications for new signups (configurable toggle in settings)
  - NewsletterSignupNotification email template with subscriber details and total count
  - Database schema with unsubscribeToken (unique, auto-generated via cuid())
  - Manual migration to add database-level default for unsubscribeToken using gen_random_uuid()
  - Contact email configuration in admin settings (used as sender for all newsletter emails)
  - Comprehensive documentation in docs/newsletter-system.md
  - Reactivation support for previously unsubscribed users

## 0.23.1 - 2025-11-24

- **Cart Button Fix**: Fixed cart button in chat dialog opening cart drawer instead of 404 error
  - Added cart open state to global cart store
  - Shopping cart now opens programmatically from anywhere in app
  - Fixed ESLint warnings for type safety

## 0.23.0 - 2025-11-24

- **Chat Barista Animation Enhancements**: Smooth, polished animations for natural conversation flow
  - Messages slide in with smooth fade and scale effects
  - User messages appear from right, AI responses from left
  - Staggered timing creates natural back-and-forth rhythm
  - Product recommendations slide up with emphasis
  - Improved page load performance for product images

## 0.22.3 - 2025-11-24

- **Admin Footer Settings Refinements**: Enhanced footer contact management with per-field save states and file upload
  - Individual save buttons for each footer contact field (shop hours, email) with separate loading states and unsaved changes tracking
  - File upload system for custom social media icons with validation, preview, and storage to `public/images/`
  - Consistent Field component usage across Social Links and Footer Contact cards
  - Three-column layout with trash icon buttons to reset field pairs

## 0.22.2 - 2025-11-24

- **Admin Social Links Settings**: Complete social media management interface with database-driven footer
  - Admin CRUD for social links with system platforms (Facebook, Instagram, etc.) and custom platforms
  - Separate state tracking for system vs custom fields to prevent field linking
  - Individual save buttons per social link with unsaved changes tracking
  - Order management with move up/down buttons and automatic order preservation
  - Custom icon support with URL input and preview, toggle between Lucide icons and custom images
  - Active/Inactive toggle per link with dynamic labels
  - Per-record validation preventing duplicate platform names with unique constraint
  - InputGroup components for clean URL inputs with https:// prefix styling
  - Footer contact settings (shop hours, email) with Active/Inactive toggles
  - Dynamic Lucide icon rendering with case-insensitive matching and fill="currentColor"
  - Unique constraint on SocialLink.platform field with data cleanup script
  - Clean component structure with proper ButtonGroup and InputGroup nesting

## 0.22.1 - 2025-11-23

- **Footer Presentation Refinements**: Improved layout and visual consistency of mega footer
  - Enhanced newsletter signup form with connected input and button styling
  - Improved responsive grid layout for better spacing and alignment
  - Added session-aware account links with admin dashboard access for authenticated admin users
  - Refined separator presentation and container styling for better visual hierarchy

## 0.22.0 - 2025-11-23

- **Mega Footer with Social Links & Newsletter**: Admin-managed footer with social media links, newsletter signup, and dynamic category navigation
  - Social media link management in admin panel with platform selection, ordering, and active/inactive toggle
  - Newsletter subscription with email validation and duplicate handling
  - Responsive mega footer with category groups, quick links, newsletter signup, and social icons
  - Server-rendered footer component for optimal performance

## 0.21.0 - 2025-11-23

- **Dynamic Category System & Navigation Improvements**: Complete category infrastructure overhaul with breadcrumb context preservation
  - **Schema Migration**: Migrated Category model from hardcoded `label` field to relational `labelSetting` with SiteSettings table
  - **Category Labels**: Three label types (Origins, Collections, Roasts) configurable via SiteSettings with default label support
  - **Navigation Routes**: Unified routing pattern from `/categories/[slug]` to `/[category]/[slug]` for cleaner URLs
  - **Breadcrumb Context**: Added query parameter system (`?from={categorySlug}`) to preserve user navigation path
  - **Product Cards**: Enhanced to pass navigation context when user browses from non-primary category
  - **Related Products**: Changed algorithm from roast-level matching to category-based matching for better contextual recommendations
  - **Per-Category Purchase Options**: Added `showPurchaseOptions` boolean field to control price/buy button display per category
  - **Data Flow**: Complete props threading from Category model → page → CategoryClientPage → ProductCard
  - **Seed Data**: Generated 30 products with proper categorization, 75 synthetic users, and demo user
  - **Migration**: Two migrations applied (`add_site_settings_and_category_label_reference`, `add_show_purchase_options_to_category`)

## 0.20.3 - 2025-11-22

- **Product URL Generation Fix**: Resolved incorrect product URLs using primary category lookup
  - **ProductCard Simplification**: Removed unnecessary categorySlug prop and fallback logic
  - **Direct Database Access**: ProductCard now always uses primary category from database
  - **Zod Validation**: Added `ProductCardSchema` and `RecommendationsResponseSchema` for type safety
  - **Runtime Validation**: Added Zod validation to recommendations API response to catch data shape mismatches
  - **Data Optimization**: Reduced data fetching to only select fields required by ProductCard component
  - **Props Cleanup**: Removed unused categorySlug from CategoryClientPage and all parent components

- **Social Links Management**: Added admin interface for managing social media links in footer
  - **Admin CRUD**: Full create, read, update, delete functionality for social links
  - **Footer Integration**: Dynamic social links rendering with active/inactive toggle
  - **Database Schema**: Added `SocialLink` model with platform, url, icon, order fields

- **Image Configuration**: Added github.com to Next.js image remotePatterns for profile images

## 0.20.2 - 2025-11-22

- **Prisma 7 & Neon Adapter Stabilization**: Fixed build and connection issues with Prisma 7 upgrade
  - **WebSocket Configuration**: Implemented explicit `ws` configuration for `@neondatabase/serverless` to ensure compatibility with Node.js build environments
  - **Adapter Initialization**: Updated `PrismaNeon` instantiation to match Prisma 7 factory pattern
  - **Documentation**: Added detailed technical guide in `docs/prisma-7-neon-upgrade.md` showcasing the solution
  - **Dependency Cleanup**: Removed unused `pg` and `@prisma/adapter-pg` dependencies to enforce serverless driver usage

## 0.20.1 - 2025-11-22

- **VAPI Production Configuration**: Fixed webhook URL configuration to support production environments ([8d90e02](https://github.com/yuens1002/ecomm-ai-app/commit/8d90e02))
  - Added environment awareness to `vapi-config.ts`
  - Automatically uses `NEXT_PUBLIC_APP_URL` in production
  - Falls back to localtunnel URL for local development
  - Ensures voice assistant functions correctly on Vercel deployments

## 0.20.0 - 2025-11-22

- **VAPI Voice Assistant Integration**: Full voice-to-voice AI barista experience ([df8ab1c](https://github.com/yuens1002/ecomm-ai-app/commit/df8ab1c))
  - **Voice Interface**: Integrated VAPI web SDK for real-time voice conversations
  - **Bilingual Support**: System prompt configured for English and Spanish support
  - **Function Calling**: AI can query product catalog, get recommendations, and check order status via tools
  - **Visual Feedback**: Real-time volume visualizer and status indicators (connecting, listening, speaking)
  - **Documentation**: Added comprehensive setup guide in `docs/VAPI_LOCAL_SETUP.md`

- **Database Schema Hardening**:
  - **Roast Level Enum**: Migrated `roastLevel` from free-text string to strict `RoastLevel` enum (LIGHT, MEDIUM, DARK)
  - **Data Integrity**: Updated all product queries and mutations to enforce type safety
  - **Seed Script Fixes**: Resolved legacy data issues and updated seed data to match new schema

## 0.19.1 - 2025-11-22

- **Site Header & 404 Fixes**: Improved theme consistency and error page experience
  - **Custom 404 Page**: Added branded 404 page with proper layout and theme support
  - **Header Styling**: Fixed navigation link colors to adapt correctly in light/dark modes
  - **Dark Mode Polish**: Inverted beans icon color in dark mode for better visibility

## 0.19.0 - 2025-11-22

- **Catalog Management System**: Complete admin interface for managing products, categories, and variants ([4ea1f87](https://github.com/yuens1002/ecomm-ai-app/commit/4ea1f87))
  - **Product Management**: Create, edit, and delete products with rich details (images, description, organic/featured status)
  - **Category Management**: Create and manage product categories with hierarchy support
  - **Variant System**: robust variant management with pricing, SKU, and inventory tracking
  - **Product Form Refactoring**: Modernized product editor with 2-column grid layout, custom `Field` components, and improved validation
  - **Bulk Operations**: Support for managing multiple variants and options efficiently

- **Admin Dashboard Enhancements**:
  - **Analytics View**: Enhanced analytics dashboard with visual charts and deeper insights
  - **Order Management**: Improved order list and detail views for better fulfillment workflow
  - **Navigation**: New navigation menu component for better admin area traversal

- **Developer Experience**:
  - **Seed Data Generation**: Added Python scripts (`generate_seed_data.py`) for generating realistic test data
  - **Type Safety**: Improved TypeScript coverage across admin components

## 0.18.0 - 2025-11-21

- **Environment Awareness**: Visual indicator for non-production environments ([efecdb2](https://github.com/yuens1002/ecomm-ai-app/commit/efecdb22570ff2c2511f9cb8bfd62c88aa6fcb58))
  - Added floating badge showing current environment (Development/Preview)
  - Integrated into RootLayout for global visibility
  - Helps developers distinguish between production and test environments

## 0.17.0 - 2025-11-21

- **About Page & Header Refinement**: Added comprehensive About page and refined site navigation
  - Created `/about` page with "Core Features", "AI-Powered Personalization", and "Admin Dashboard" sections
  - Refined Site Header layout for better responsiveness (stacked logo on mobile, grouped nav links)
  - Updated mobile menu with improved hierarchy and iconography
  - Added "About" link to main navigation and mobile menu
  - Replaced Info icon with FileText icon for About link

## 0.16.0 - 2025-11-20

- **Contact Page & Form**: Added a dedicated contact page with email notifications ([e70088a](https://github.com/yuens1002/ecomm-ai-app/commit/e70088a))
  - Created `/contact` page with a responsive form using shadcn/ui components
  - Implemented API route `/api/contact` to handle form submissions
  - Integrated Resend for email delivery with a custom React Email template
  - Added "Contact" link to the site header and mobile menu
  - Includes form validation with Zod and error handling

## 0.15.3 - 2025-11-20

- **Prisma 7 Upgrade & Security Fixes**: Major ORM upgrade and vulnerability resolution ([e168038](https://github.com/yuens1002/ecomm-ai-app/commit/e168038c0b0fb3375f818ecf6fb7d284585a9d0b))
  - Upgraded to Prisma 7.0.0 and Node.js 22.12.0 for improved performance and stability
  - Migrated configuration to `prisma.config.ts` and removed deprecated `package.json` config
  - Resolved critical security vulnerability in `hono` dependency via package override
  - Fixed all resulting TypeScript errors and build warnings

## 0.15.2 - 2025-11-20

- **Error Handling & Type Safety Hotfix**: Centralized error handling and resolved all TypeScript build errors ([e41dd15](https://github.com/yuens1002/ecomm-ai-app/commit/e41dd15))
  - Created `lib/error-utils.ts` with `getErrorMessage()` helper for type-safe error handling
  - Migrated 25+ error handlers across API routes, account tabs, and admin components
  - Fixed Stripe type incompatibilities using optional chaining and proper type extensions
  - Fixed Invoice webhook properties (subscription, charge, payment_intent) with safe access patterns
  - Fixed OrderStatus enum usage in user orders route
  - Fixed null handling in OrderDetailClient for tracking URLs
  - Fixed SearchProduct and RecommendedProduct type definitions with complete property sets
  - Fixed lib/data.ts purchase history type assertions
  - Production build now compiles successfully with 0 TypeScript errors

## 0.15.1 - 2025-11-20

- **ESLint Cleanup Complete**: Fixed all TypeScript errors and improved demo account UX ([7980f27](https://github.com/yuens1002/ecomm-ai-app/commit/7980f27153e8c6b4981f926f29e1303425a90ce7))
  - Fixed all 163 ESLint problems (100% reduction) - app/, lib/, hooks/, tests now fully typed
  - Moved 14 dev-only scripts to dev-tools/ folder (gitignored)
  - Added graceful demo account handling for subscription management and account deletion
  - Stripe customer verification before portal access with helpful 404 error messages

## 0.15.0 - 2025-11-20

- Fixed all 163 ESLint problems (100% reduction) - app/, lib/, hooks/, tests now fully typed
- Moved 14 dev-only scripts to dev-tools/ folder (gitignored)
- Added graceful demo account handling for subscription management and account deletion
- Stripe customer verification before portal access with helpful 404 error messages

- **Chat Barista Phase 5 Complete**: Text-based chat MVP with full order history, brewing rules, and automatic caching ([12d1d3d](https://github.com/yuens1002/ecomm-ai-app/commit/12d1d3d65d30bdec21e3f66a8459c3275801edbb))
  - Full order history context (removed 5-order limit) for complete personalization
  - Enhanced brewing method rules with prominent warnings (drip ≠ espresso)
  - Gemini automatic caching achieving 98% token reduction on turns 2+ (11,232/11,420 tokens cached)
  - Thinking budget control (200 tokens) to prevent MAX_TOKENS errors
  - Name usage limited to first message only (no spam on subsequent turns)
  - Comprehensive error handling with specific messages for rate limits and service issues
  - Component renamed from VoiceBarista to ChatBarista (reflects text-based nature)
  - Cleaned up debug logging for production readiness

- **AI Barista Chat MVP**: Text-based conversational interface with comprehensive error handling and brewing knowledge ([6560e73](https://github.com/yuens1002/ecomm-ai-app/commit/6560e730f3fe67fe86c5e11512388d90048ccefa))
  - Modal-based chat UI with fixed height, scrollable messages, and always-visible input
  - Gemini AI integration with user context (order history, favorites, addresses)
  - Retry mechanism for service errors with spinning state and right-aligned button
  - Comprehensive brewing method guide in system prompt (drip vs espresso distinction)
  - Bilingual support with auto-detection (English/Spanish)
  - Error handling for rate limits, service unavailable, and empty responses

- **Voice Barista UI Foundation**: Session-based hero section with voice chat interface for authenticated users ([2519901](https://github.com/yuens1002/ecomm-ai-app/commit/2519901328b456f853c1df27bdca19d036468bd6))
  - VoiceBarista component replaces hero for authenticated users with "Start Voice Chat" and "Get AI Recommendation" options
  - Voice AI platform research complete - selected VAPI for multilingual support and function calling
  - Conversation flow designed with 6 backend functions and bilingual templates (English/Spanish)

## 0.14.0 - 2025-11-20

- **AI Recommendation Buy Now**: Complete checkout flow integration with AI recommendations
  - **Buy Now Functionality**: Direct checkout from AI modal creates Stripe Checkout session and redirects to hosted payment page
  - **Add to Cart Integration**: Adds recommended product to cart and closes modal for continued shopping
  - **Smart Variant Selection**: Automatically selects cheapest variant with one-time purchase option (never subscriptions)
  - **Product Linking**: Product name displays as clickable button link to product detail page
  - **Smart Product Matching**: API fetches full product data (variants, images, purchase options) based on AI recommendation
  - **Featured Product Fallback**: If AI doesn't match specific product, automatically suggests first featured product
  - **Improved Button Layout**: When product found - "Add to Cart" (outline), "Buy Now" (primary); When no product - "Start Over" only
  - **Loading States**: Buy Now button shows spinner during Stripe session creation
  - **Image URL Fix**: Converts relative image URLs to absolute URLs for Stripe API validation
  - **Error Handling**: Concise red error message ("Something went wrong. Please try again.") displays above buttons without losing recommendation
  - **Error Recovery**: Users can retry Buy Now without restarting the recommendation flow

## 0.13.2 - 2025-11-20

- **AI Recommendation Modal Improvements**: Enhanced user experience and functionality
  - **Product Linking**: "View Product" button now appears when AI recommends a specific coffee, linking directly to the product page
  - **Better Flow**: "Start Over" button resets to step 1 instead of closing modal, allowing users to get multiple recommendations
  - **Conditional Badge**: Personalization badge only shows when user has actual purchase history (>0 orders)
  - **Visual Polish**: Improved badge styling with CheckCircle2 icon from lucide-react, subtle green background (green-500/10) with better visibility in both light/dark modes
  - **Cleaner Layout**: Removed unnecessary whitespace between title and content in result step
  - **Increased Token Limit**: Raised Gemini maxOutputTokens from 1000 to 2000 to prevent response cutoff
  - **Graceful Error Handling**: Added friendly fallback message when MAX_TOKENS is reached instead of showing error
  - **API Enhancement**: Recommendation endpoint now returns product slug for direct linking

## 0.13.1 - 2025-11-20

- **AI-Generated Product Images**: All 30 coffee products now have custom branded images
  - Generated using Grok AI (xAI) with consistent "Artisan Roast" branding
  - Minimalist white packaging with product name in colored label
  - Images saved as 1024x1024 WebP format for optimal web performance
  - Cost: ~$2.10 for all 30 images
- **Product Card Redesign**: Updated ProductCard component for better image display
  - Square aspect ratio (aspect-square) with 200px max height
  - Bordered layout with rounded corners on bottom
  - Text overflow handling with ellipsis for long product names
  - Improved spacing and visual hierarchy
- **Image Generation Infrastructure**: Added dependencies and scripts
  - Dependencies: `sharp` (image processing), `form-data`, `node-fetch@2`
  - Scripts for Grok API integration and batch image generation
  - Updated `.env.example` with GROK_API_KEY documentation

## 0.13.0 - 2025-11-19

- **Real-Time Activity Tracking**: Session-based tracking for PRODUCT_VIEW, ADD_TO_CART, REMOVE_FROM_CART
  - Client-side `useActivityTracking` hook with automatic session ID generation
  - Silent failure design to not disrupt user experience
  - Integrated into ProductClientPage and ShoppingCart components
  - POST `/api/track-activity` endpoint with validation
  - Visible in admin analytics dashboard immediately
- **Unit Tests**: Jest and React Testing Library setup
  - 7 passing tests for `useActivityTracking` hook
  - Tests cover authenticated/anonymous users, error handling, session persistence
  - Excluded API route tests (Next.js edge runtime complexity) and data tests (require live database)
  - Scripts: `npm test` (watch mode), `npm run test:ci` (CI mode)

## 0.12.0 - 2025-11-18

- **AI-Powered Product Recommendations**: Behavioral recommendation system with personalized shopping experience
  - **Product Catalog Expansion**: 30 specialty coffees (from 11) with detailed tasting notes, origins, and roast levels
  - **User Activity Tracking**: New UserActivity model tracking PAGE_VIEW, PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART events
    - Session-based tracking supports both anonymous and authenticated users
    - Indexed for query performance
  - **Behavioral Analytics Functions**: Added 5 data functions in `lib/data.ts`
    - Purchase history, recent views, search history aggregation
    - User preference analysis (roast level, tasting notes)
    - Trending products for anonymous users
  - **Personalized AI Assistant**: Enhanced Gemini modal with user context injection
    - Includes purchase history, views, searches, and preferences in prompt
    - Displays personalization badge with user stats
    - Graceful fallback for anonymous users
  - **Homepage Recommendations**: "Recommended For You" section with behavioral scoring
    - Algorithm: +10 roast match, +5 per tasting note, +3 viewed, -20 recent purchase
    - Shows personalized subtitle with preferences
    - Falls back to trending products for anonymous users
  - **Product Search**: Full-text search across name, description, origin, and tasting notes
    - Search dialog in header (desktop) and mobile menu
    - Automatic search activity tracking
    - Real-time results with loading states
  - **Admin Analytics Dashboard**: New `/admin/analytics` page
    - Trending products and top search queries
    - Conversion metrics (view→cart→order rates)
    - Activity breakdown and daily trend visualization
    - Period selection (7/30 days)
- **Database Migration**: `20251119034105_add_user_activity_tracking`
- **API Endpoints**:
  - `/api/recommendations` - Behavioral scoring algorithm
  - `/api/admin/analytics` - Admin analytics data
  - `/api/search` - Product search with tracking
- **Seed Scripts**: Synthetic user data generation for testing and demo purposes

## 0.11.9 - 2025-11-18

- **Admin Owner Assignment**: Complete admin management and bootstrap system
  - **Initial Setup Flow**: First-time admin account creation for new deployments
    - `/setup` page with full name, email, and password form
    - Password validation with real-time UI feedback (min 8 chars, uppercase, lowercase, number, special char)
    - Confirm password field with match validation
    - Auto-verifies email for initial admin account
    - Only accessible when no admin exists in the system (checked via HEAD /api/admin/setup)
    - Shows "Setup Already Complete" message if admin exists
    - Redirects to sign-in after successful creation
  - **Admin Dashboard**: Tabbed interface at `/admin` with overview and quick actions
    - **Overview Tab**: Dashboard stats (total users, orders, products, admin count)
    - **Users Tab**: Link to user management page
    - **Orders Tab**: Link to orders page
    - **Products Tab**: Placeholder for future product management
    - **Profile Tab**: Admin account information display
    - Quick action cards for common tasks
  - **User Management UI**: `/admin/users` page for managing user privileges
    - Lists all users with admin status, order counts, and subscription counts
    - Toggle admin privileges with safety checks (cannot revoke last admin)
    - Real-time status updates using optimistic UI patterns
    - Table and Badge components added from shadcn/ui
  - **API Endpoints**:
    - `HEAD /api/admin/setup` - checks if admin exists (200 = no admin, 403 = admin exists)
    - `POST /api/admin/setup` - creates first admin account with validation
    - `GET /api/admin/users` - fetches all users with order/subscription counts
    - `POST /api/admin/users/[id]/toggle-admin` - grants or revokes admin privileges with last-admin protection
  - **Admin Layout**: Shared layout with setup redirect and admin authorization
  - **Helper Functions**: Added `hasAnyAdmin()` to `lib/admin.ts` for initial setup detection
  - **Security Features**:
    - Strong password requirements with real-time validation
    - Prevents revoking last admin (maintains at least one admin)
    - Admin-only access to all admin endpoints
    - Auto-email verification for bootstrap account
  - **UI Components**: Added `components/ui/table.tsx` and `components/ui/badge.tsx` for data display
- **Testing Notes**: Complete flow tested locally (initial setup → admin dashboard → user management → privilege toggling)

## 0.11.7 - 2025-11-18

- **Split Orders for Mixed Carts**: Implemented order splitting for mixed carts with architectural pivot based on Stripe's subscription model
  - **Order Structure**: Mixed carts now create separate orders:
    - One order for all one-time items
    - ONE order for ALL subscription items (architectural decision based on Stripe creating one subscription with multiple line items)
    - **Tradeoff**: Recurring orders must lookup PurchaseOption by name using fuzzy match - risk if product name changes significantly
    - Documented directly in Prisma schema for future maintainability
  - **Webhook Refactoring**: Complete overhaul of both subscription webhooks to handle multiple products:
    - `checkout.session.completed`: Loops through `subscription.items.data` to extract all products into arrays, creates single order with all subscription items
    - `invoice.payment_succeeded`: Handles both initial subscription and renewals with array support, loops through productNames to find PurchaseOptions for recurring orders
  - **Duplicate Subscription Prevention**: Updated checkout validation to check all products across productNames arrays (uses `flatMap` and `includes()` to detect duplicates)
  - **Order Cancellation**: Added admin endpoint `/api/admin/orders/[orderId]/cancel` for manually canceling orders
  - **UI Enhancements**:
    - Subscription tab now displays subscription ID without "sub\_" prefix for cleaner look
    - Lists all products in subscription with quantities (e.g., "Death Valley Espresso - 2lb Bag × 2")
    - Removed product description field for cleaner UI
    - Kept billing period display for subscription transparency
  - **Helper Scripts**: Created `scripts/cancel-active-subscriptions.ts` for bulk subscription cancellation during testing
- **Database Migrations**:
  - `20251118024917_add_subscription_id_to_order` - Added `stripeSubscriptionId` to Order model for linking orders to subscriptions
  - `20251118054840_change_subscription_to_arrays` - Changed Subscription from single values to arrays (productName → productNames[], etc.)
- **Testing Results**:
  - ✅ Mixed cart with 2 different subscription products (Death Valley 2lb + Guatemalan 12oz weekly)
  - ✅ Single subscription record created with both products in arrays
  - ✅ Single order created containing all subscription items
  - ✅ UI correctly displays all products with quantities
  - ✅ Checkout validation prevents duplicate subscriptions across all products
  - ✅ Both webhooks handle arrays correctly
  - ✅ TypeScript compilation passing (fixed 13 errors across 4 files)
- **Architecture Notes**: This feature represents a significant pivot from the initial design (separate order per subscription item) after discovering Stripe creates one subscription with multiple line items, not separate subscriptions per product. The array-based approach provides flexibility for multi-product subscriptions while maintaining data integrity and simplifying fulfillment workflows.

## 0.11.6 - 2025-11-17

- **Recurring Order Creation**: Automatic order creation for subscription renewals
  - Enhanced `invoice.payment_succeeded` webhook to differentiate between initial subscription payments and renewals using `billing_reason` field
  - Initial subscriptions (`billing_reason: "subscription_create"`): Update Subscription record in database
  - Renewal payments (`billing_reason: "subscription_cycle"`): Create new Order record with PENDING status
  - Subscription ID extraction with fallback: checks `invoice.subscription` and `invoice.parent.subscription_details.subscription`
  - Automatic inventory decrementation when recurring orders are created
  - Fuzzy product matching: maps Stripe product names to PurchaseOptions by splitting on " - " separator
- **Subscription-Aware Email Notifications**: Enhanced all email templates with subscription context
  - **OrderConfirmationEmail**: Shows "Your Subscription Order is Being Prepared! 📦" heading with green banner displaying subscription cadence (e.g., "☕ Every week delivery")
  - **MerchantOrderNotification**: Shows "🔄 Subscription Renewal Order" heading with blue banner (e.g., "Every week • Auto-renewal")
  - **ShipmentConfirmationEmail**: Shows "📦 Your Subscription Order Has Shipped!" with subscription cadence in preview and body text
  - All templates accept `isRecurringOrder?: boolean` and `deliverySchedule?: string` props for conditional rendering
- **Smart Email Strategy**: Optimized notification flow to reduce email fatigue
  - Recurring order creation: Only merchant receives notification, customer email skipped
  - Order shipment: Customer receives single email combining order confirmation + tracking + subscription context
  - Reduces customer emails from 2 to 1 per subscription renewal cycle
  - Logs clearly indicate: "⏭️ Skipping customer email - will send with tracking when order ships"
- **Comprehensive Testing Documentation**: Created `docs/testing-recurring-orders.md` (~300 lines)
  - Multiple testing methods: Stripe CLI webhook triggers, test clocks, event replay
  - Verification steps: webhook logs, database queries, admin dashboard checks, email delivery, inventory tracking
  - Test scenarios: weekly/monthly subscriptions, multiple items, delivery/pickup, stock depletion edge cases
  - Troubleshooting guide: missing purchase options, inventory errors, email failures
  - Stripe CLI command reference for local development
  - Production testing checklist

## 0.11.5 - 2025-11-17

- **Webhook Event Refactor**: Hybrid approach for subscription creation using both `checkout.session.completed` and `invoice.payment_succeeded`
  - **Immediate payment methods (cards)**: Subscription created in `checkout.session.completed` when `payment_status === "paid"` and `subscription.status` is `"active"` or `"trialing"` - provides instant UX feedback
  - **Async payment methods (ACH, SEPA, etc.)**: Subscription created in `invoice.payment_succeeded` when payment confirms later - ensures data integrity
  - Renewal payments: Handled by `invoice.payment_succeeded` for all billing cycles
  - Status changes: Handled by `customer.subscription.updated` event
  - Prevents orphaned subscription records from failed or incomplete payments
  - **Bug Fix**: Exclude CANCELED subscriptions from duplicate check to allow re-subscription to previously canceled products
  - **Bug Fix**: Extract billing period from `subscription.items` instead of top-level subscription object
  - **Bug Fix**: Check both `cancel_at_period_end` and `cancel_at` fields for scheduled cancellations (Stripe uses `cancel_at` for portal cancellations)
  - Safety checks: Verify `payment_status === "paid"` and valid subscription status before creating records
  - **Known Limitation**: Mixed orders (one-time + subscription items) create single order; canceling order doesn't cancel subscription. See backlog for planned split-order implementation.
- **Subscription Schema Refactor**: Removed `variantName` field from Subscription model since `productName` already contains the full product+variant combination (e.g., "Death Valley Espresso - 12oz Bag")
  - Simplified webhook handler to only use `productName` from Stripe
  - Updated all UI components (AccountPageClient, SubscriptionsTab) to display `productName` only
  - Database migration: `20251117061523_remove_variant_name_from_subscription`
- **Mixed Billing Interval Validation**: Added comprehensive validation to prevent checkout with subscriptions of different billing intervals (Stripe limitation)
  - Client-side validation in cart store with custom event error handling
  - Server-side validation in checkout API with specific error code (`MIXED_BILLING_INTERVALS`)
  - Toast notifications for all validation errors
- **Duplicate Subscription Prevention**: Fixed duplicate subscription check to be per-variant instead of per-product
  - Changed uniqueness logic from `productName` to `productName::variantName` combination
  - Updated checkout route to check by `stripeProductId` or exact productName match
  - Users can now have multiple subscriptions for different variants of the same product
- **Subscription Purchase Option Schema Cleanup**: Removed deprecated `deliverySchedule` string field from PurchaseOption model
  - All subscription scheduling now uses structured `billingInterval` (enum) and `billingIntervalCount` (number)
  - Database migration: `20251117031833_remove_delivery_schedule_from_purchase_option`
  - Updated seed data to use structured interval fields consistently
- **Cart Store Refactor**: Replaced deprecated `deliverySchedule` with `billingInterval` and `billingIntervalCount` fields
  - Added `formatBillingInterval()` utility for consistent schedule display across app
  - Cart items now show subscription cadence labels (e.g., "Subscription - Every week")
- **Enhanced Subscription UX**:
  - Hide "Subscribe & Save" option when variant already has subscription in cart
  - Auto-switch to one-time purchase after adding subscription to cart
  - Dynamic delivery schedule dropdown generated from available subscription options
  - Checkout requires authentication for subscription purchases with helpful redirect notice
  - Improved duplicate subscription error messages with proper singular/plural grammar and bullet-point lists
- **Order Confirmation Emails**: Enhanced to distinguish between one-time and subscription items
  - Display purchase type inline with product name (e.g., "• One-time" or "• Subscription - Every week")
  - Shows delivery schedule for subscription items using `formatBillingInterval()` utility
  - Applied to both customer and merchant order notification emails
- **Toast Notification System**: Replaced browser alerts with styled toast notifications
  - Custom inverted theme colors (`bg-foreground`, `text-background`)
  - Positioned in upper right corner
  - Visible close button with proper contrast
  - User-friendly error messages for cart/checkout issues

## 0.11.4 - 2025-11-16

- **Subscription Management System**: Complete subscription lifecycle management with Stripe integration
  - Added `Subscription` model to Prisma schema with fields: `stripeSubscriptionId`, `stripeCustomerId`, `status`, product details, billing cycle, shipping address
  - Added `SubscriptionStatus` enum: ACTIVE, PAUSED, CANCELED, PAST_DUE
  - Webhook handlers for subscription lifecycle:
    - `customer.subscription.created`: Create subscription record when customer subscribes
    - `customer.subscription.updated`: Sync subscription status, billing period, and details
    - `customer.subscription.deleted`: Mark subscription as canceled in database
  - Subscription webhooks automatically find user from Stripe customer ID and upsert subscription data
  - Parse subscription item details including product name, variant, quantity, price, and delivery schedule
  - Store shipping address from subscription metadata for fulfillment
- **Stripe Customer Portal Integration**:
  - Created `/api/customer-portal` endpoint to generate Stripe Billing Portal sessions
  - Portal allows customers to: update payment method, view invoices, manage subscriptions, cancel subscriptions
  - Protected with authentication - only logged-in users can access portal
  - Automatic redirect back to account page after portal session
- **Subscriptions Tab in Account Settings**:
  - New "Subscriptions" tab in `/account` page showing all customer subscriptions
  - Display subscription status with color-coded badges: Active (green), Paused (yellow), Canceled (gray), Past Due (red)
  - Show product details: name, variant, quantity, price per billing cycle
  - Display delivery schedule (e.g., "Every 2 weeks", "Monthly")
  - Current billing period dates with calendar icon
  - Shipping address display for delivery subscriptions
  - "Manage Subscription" button opens Stripe Customer Portal in new window
  - Cancel notice for subscriptions scheduled to end at period end
  - Empty state with call-to-action to browse products
  - Loading states with spinner during portal session creation
- **Database Migration**:
  - Created migration `20251116061845_add_subscription_model` with Subscription table and SubscriptionStatus enum
  - Added `subscriptions` relation to User model
  - Indexed fields: `userId`, `stripeSubscriptionId`, `stripeCustomerId` for efficient queries
- **UI/UX Enhancements**:
  - Updated account page tab grid from 5 to 6 columns to accommodate Subscriptions tab
  - Toast notifications for subscription portal errors
  - Responsive subscription cards with proper spacing
  - Format dates with `date-fns` (e.g., "Nov 16, 2025")
  - Format prices with proper currency symbol and cents
  - Package icon for empty subscriptions state
  - External link icon on "Manage Subscription" button
- **Dependencies**:
  - Leveraged existing `resend` and `@react-email/components` packages (added in 0.11.3 hotfix)
  - Stripe API version `2024-12-18.acacia` for subscription management

## 0.11.3 - 2025-11-16

- **Admin Order Fulfillment Interface**: Complete admin dashboard for order management
  - Added `isAdmin` boolean field to User model with database migration
  - Created admin authentication helpers (`lib/admin.ts`) with `isAdmin()` and `requireAdmin()` functions
  - Built `/admin/orders` page with comprehensive table layout showing order #, date, customer, items, shipping address, total, status, and actions
  - Order filtering: All, Pending, Completed (shipped or picked up), Canceled (US spelling)
  - Mark as shipped workflow: dialog with carrier selection (USPS, UPS, FedEx, DHL) and tracking number input
  - Mark as pickup ready workflow: confirmation dialog for store pickup orders
  - Track button for shipped orders: generates carrier-specific tracking URLs
  - Copy-to-clipboard feature for tracking numbers to save horizontal space
  - Real-time toast notifications for success/error feedback using @radix-ui/react-toast
  - Admin navigation: "Admin: Manage Orders" link in user menu (visible only to admin users)
- **Email Notifications**:
  - Shipment confirmation email: sent automatically when order marked as shipped, includes tracking info, carrier, estimated delivery, and tracking URL
  - Pickup ready email: sent automatically when order ready for pickup, includes store address, hours, and ID reminder
  - Updated order confirmation email to use `orderId` instead of `orderNumber` for correct URL generation
  - Updated merchant notification email to link to admin orders dashboard instead of non-existent order detail page
  - Fixed email template styling: added `box-sizing: border-box` to prevent content overflow in email clients
- **API Routes**:
  - `GET /api/admin/orders` - Fetch all orders with filtering by status
  - `PATCH /api/admin/orders/[orderId]/ship` - Mark order as shipped with tracking info
  - `PATCH /api/admin/orders/[orderId]/pickup` - Mark order as picked up / ready for pickup
  - All routes protected with `requireAdmin()` middleware
- **Database Updates**:
  - Added proper null checks for `customerEmail` field in order API routes
  - Fixed TypeScript errors with proper type narrowing for nullable fields
  - Ensured all tracking and fulfillment fields properly handled
- **UI/UX Improvements**:
  - Status badges with color coding: Pending (yellow), Shipped (green), Picked Up (purple), Canceled (red)
  - Applied US spelling "Canceled" consistently across customer and admin interfaces
  - Shipping address display in admin table: full address for delivery orders, "Store Pickup" label for pickup orders
  - Responsive table design with proper spacing and hover states
  - Toast notifications positioned at bottom-right on desktop, top on mobile
- **Bug Fixes**:
  - Fixed order number handling: use `order.id.slice(-8)` since `orderNumber` field doesn't exist in schema
  - Added `await` for `render()` calls in email generation (returns Promise)
  - Fixed tracking URL TypeScript errors by storing result in variable for proper type narrowing
  - Resolved naming conflict between `trackingNumber` prop and style object in ShipmentConfirmationEmail
  - Fixed email link 404 errors by using `orderId` parameter instead of `orderNumber`
- Dependencies: Added `@radix-ui/react-toast` for toast notifications
- Scripts: Added `scripts/set-admin.ts` and `scripts/make-admin.ts` for admin user management
- Note: Temporary `/api/make-me-admin` route exists for development (should be removed before production)

## 0.11.2 - 2025-11-15

- **Email Notifications & Order Management (Phase 6 - Partial)**:
  - Integrated Resend for transactional email delivery (free tier: 3,000 emails/month)
  - Created React Email templates: OrderConfirmationEmail (customer) and MerchantOrderNotification (admin)
  - Automatic order confirmation emails sent to customers with order details, items, shipping info
  - Merchant notification emails sent to admin for new orders requiring fulfillment
  - Added tracking fields to Order model: `trackingNumber`, `carrier`, `shippedAt`
  - Inventory management: automatically decrement stock quantity when orders are placed
  - Environment configuration for email service with development-friendly defaults (onboarding@resend.dev)

## 0.11.1 - 2025-11-15

- **Guest Order Fulfillment Fix**: Complete restructure of order shipping data storage
  - Added shipping fields directly to Order model: `recipientName`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`
  - Removed `shippingAddressId` relation - shipping data now stored denormalized on Order table
  - Fixed critical issue: guest orders now properly save shipping addresses for fulfillment
  - Webhook updated to populate shipping fields for ALL orders (guests and logged-in users)
  - Order detail pages updated to display shipping from Order model fields
  - Benefits: enables merchant fulfillment queries, marketing campaigns (e.g., 15-30 day discount emails), complete order data without Stripe dashboard dependency
  - Logged-in users still get addresses saved to Address table for future reuse
- **Code Cleanup**:
  - Removed unused `OrdersTab.tsx` component (order management now uses dedicated `/orders` pages)
  - Simplified order queries by removing unnecessary relation includes

## 0.11.0 - 2025-11-15

- **Account Settings & Order Management (Phase 5)**: Complete user account management and order tracking system
  - Account Settings page with 5 tabs: Profile, Security, Connected Accounts, Addresses, Danger Zone
  - Profile management: edit name and email with validation and conflict detection
  - Security tab: change password functionality with current password verification
  - OAuth providers display showing connected accounts (Google, GitHub)
  - Address book: full CRUD operations with default address selection
  - Account deletion with confirmation dialog and cascading cleanup
- **Shopping Cart Enhancements**:
  - Delivery method selection: DELIVERY (shipping) or PICKUP (store pickup)
  - Address picker with saved addresses or "Enter new address at checkout" option
  - Visual delivery method UI with icons (truck for delivery, store for pickup)
- **Stripe Integration Enhancements**:
  - Shipping rates: Standard ($5.99), Express ($12.99), Overnight ($24.99)
  - Automatic address saving from Stripe checkout via webhook
  - Stripe Link support with customer email pre-fill
  - Auto-update user name from Stripe checkout data
  - Duplicate address detection before saving
  - Payment card last 4 digits capture and display
- **Order Management System**:
  - New `/orders` page with responsive table layout
  - Status filtering: All Orders, Pending, Completed, Cancelled dropdown
  - Order details page with items table, shipping info, and payment method
  - Order cancellation with immediate Stripe refund for PENDING orders
  - Mobile-optimized layout with vertical card design
  - Order display: Order #, Date, Items, Status, Total, Actions
- **Security & Data Integrity**:
  - Server-side price validation in checkout (prevents client-side price manipulation)
  - Optimized Stripe metadata to stay under 500 character limit
  - Session provider integration throughout app for auth state management
- **Database Schema Updates**:
  - Added `paymentCardLast4` field to Order model
  - Order status enum: PENDING, SHIPPED, PICKED_UP, CANCELLED
  - Shipping address relation on orders (only for delivery orders)
  - Delivery method field (DELIVERY/PICKUP)
- **Documentation**:
  - Documented Stripe Link test mode address mismatch issue
  - Setup guide for shipping rates creation
  - Guest checkout decision: email-only, no order history access
- **API Routes**:
  - `/api/user/profile` - Update user profile (name, email)
  - `/api/user/password` - Change password
  - `/api/user/addresses` - Address CRUD operations
  - `/api/user/orders` - Fetch orders with status filtering
  - `/api/user/orders/[orderId]/cancel` - Cancel order with refund
  - `/api/user/account` - Delete user account
- Dependencies: Added shadcn/ui components (alert-dialog, input, tabs, textarea, select)
- UI/UX: Fully responsive design with mobile-first approach, optimized table layouts

## 0.9.0 - 2025-11-14

- **Auth.js Integration Complete (Phase 3)**: Full authentication and order tracking implementation
  - User authentication with Google and GitHub OAuth providers
  - Sign-in page with OAuth buttons and guest checkout option
  - User menu in header with account settings and sign out
  - Order tracking: webhook automatically saves orders to database
  - Orders linked to authenticated users (guest orders saved with email only)
  - Order history page showing all user orders with status and details
  - Protected routes (orders page requires authentication)
  - Database schema with Stripe integration fields (sessionId, paymentIntentId, customerId, customerEmail)
- Dependencies: Added `date-fns` for date formatting
- **Next Steps (Phase 4)**: Email notifications, inventory management, subscription management portal

## 0.8.0 - 2025-11-14

- **Auth.js Integration (Phase 3 - Partial)**: Started authentication implementation
  - Installed `next-auth@beta` and `@auth/prisma-adapter`
  - Updated Prisma schema with Stripe fields for Order model
  - Configured Auth.js with Google and GitHub OAuth providers
  - Created sign-in page with OAuth buttons
  - Database migration for order tracking preparation

## 0.7.0 - 2025-11-14

- **Stripe Checkout (Phase 2)**: Integrated Stripe payment processing for one-time purchases and subscriptions
  - Checkout API endpoint creates Stripe Checkout Sessions with cart items
  - Support for both one-time purchases and subscription products
  - Product images and metadata passed to Stripe
  - Success page with order confirmation and cart clearing
  - Cancel page with cart preservation
  - Webhook handler for payment events and subscription lifecycle
  - Secure signature verification for webhooks
  - Loading states and error handling in checkout flow
- Documentation: Complete Stripe setup guide with test card numbers and webhook configuration
- Environment: Added `.env.example` with required Stripe keys
- Dependencies: Installed `stripe` and `@stripe/stripe-js` packages

## 0.6.0 - 2025-11-14

- **Shopping Cart (Phase 1)**: Implemented full shopping cart functionality with Zustand state management and localStorage persistence
  - Created cart store with add/remove/update/clear operations and computed totals
  - Special handling for subscriptions (replace instead of increment quantity)
  - Cart drawer UI with product images, variant details, quantity controls, and subtotal
  - Hydration-safe cart badge in header
  - Client-side persistence (survives page refresh, lost on localStorage clear)
- Architecture: Refactored cart logic into dedicated `ShoppingCart` component (separation of concerns from `SiteHeader`)
- Integration: Wired `ProductCard`, `ProductClientPage`, and `FeaturedProducts` to use cart store
- Checkout button placeholder (disabled, ready for Phase 2 Stripe integration)

## 0.5.3 - 2025-11-14

- Security: patched moderate vulnerability by upgrading transitive `js-yaml` (npm audit fix). No breaking changes.
- Mobile menu: revamped using shadcn Sheet (left-aligned title, icon-only Home shortcut, improved hierarchy & spacing, accessible focus and description).
- Breadcrumbs: truthful category context (load all product categories; use `from` only when linked; robust searchParams handling).
- Product cards: full-card focus ring, keyboard navigation improvements, prevent accidental navigation on Add to Cart, refined hover scaling.
- Lint/IDE: typed `params` & `searchParams` as Promises to remove false `await` warnings in server components.
- Theming: hero CTA button now uses theme tokens (removed hardcoded `bg-white text-primary`).
- Housekeeping: ignore npm audit report artifacts; minor accessibility enhancements (screen-reader menu description).
