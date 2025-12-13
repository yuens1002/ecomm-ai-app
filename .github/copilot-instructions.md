# Copilot Project Guidance

## Architecture & Stack

- **Platform**: Next.js 16 App Router + React 19 + TypeScript (strict mode), Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL via Prisma ORM with multi-adapter support (Neon serverless, pg Pool, or standard)
- **Auth**: Auth.js (formerly NextAuth) with GitHub/Google OAuth + credentials provider, Prisma session storage
- **Payments**: Stripe Checkout + webhooks for order fulfillment, subscription management via Billing Portal
- **AI**: Google Gemini API for recommendations (direct context injection, no RAG—catalog is ~30 products)
- **State**: React hooks + Zustand for cart (localStorage persistence), server actions for DB operations
- **Email**: Resend for transactional emails (order confirmations, password resets)

## Project Structure

- **Routing**: App Router route groups split customer pages (`app/(site)/`) and admin features (`app/admin/`)
  - Shared root layout at `app/layout.tsx` wires `SessionProvider`, `ThemeProvider`, Vercel Analytics, `EnvironmentIndicator`
  - Sub-layouts live under route groups—follow the grouping when adding pages
- **Path aliases**: `@/*` points to root, `@components/*` points to `components/` (see `tsconfig.json`)
- **Data access**: `lib/prisma.ts` creates singleton Prisma client with adapter detection:
  - Checks `DATABASE_ADAPTER` env var (`neon|postgres|standard`) or auto-detects `neon.tech` in URL
  - Forces `node-api` engine type, loads `.env.local` if `DATABASE_URL` missing, uses WebSockets only for Neon
  - Keep this detection logic intact when touching DB code

## Database & Schema

- **Core models** (`prisma/schema.prisma`): Products/variants/purchase options, orders/subscriptions, user activity tracking (5 types: PAGE_VIEW, PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART), CMS pages + blocks
- **Dual content models**: `Page` has both `blocks` (production block-based CMS) and legacy `content` (demo HTML)—see `docs/demo-pages-architecture.md`
- **Page types**: `PageType` enum (SINGLE_COLUMN, TWO_COLUMN, LOCATION_INFO, LINK) drives rendering; shop owners use blocks, demo HTML is fallback
- **Telemetry**: `AiTokenUsage` tracks LLM API usage per feature
- **Safety**: `npm run db:backup` → JSON snapshots under `dev-tools/backups/`; `npm run db:restore` rehydrates in FK-safe order
- **Pre-migration**: `npm run db:safe-migrate` backs up before migrations; `npm run check:backup-models` guards schema drift
- **Build safety**: `npm run build:safe` = backup coverage check + backup + build

## Seeding & Dev Data

- **Structure**: Modular seeds in `prisma/seed/*.ts`, orchestrated by `npm run seed` (see `prisma/seed/README.md`)
- **Execution order**: settings → categories → products → users → CMS pages → synthetic data (maintains FK dependencies)
- **Idempotent**: All seeds use `upsert` to avoid duplication
- **Location types**: `SEED_LOCATION_TYPE` env var (SINGLE vs MULTI) controls café page layouts
- **Synthetic data**: Realistic user activities, orders, newsletter signups for testing recommendations/analytics
- **Selective seeding**: Import individual modules (e.g., `seedProducts(prisma)`) for targeted scripts in `dev-tools/`

## Development Workflows

**Local setup** (full details in `SETUP.md`):

0. Ensure Node.js v22 LTS or higher is installed (`node --version`)
1. Copy `.env.example` → `.env.local`, configure database/Stripe/OAuth/email credentials
2. `npx prisma generate && npx prisma migrate deploy && npm run seed`
3. `npm run dev` (port 3000) + `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (separate terminal)

**Key commands**:

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build (runs `prisma generate` first)
- `npm run typecheck` — TypeScript validation
- `npm run lint` — ESLint checks (see linting standards below)
- `npm test` — Jest watch mode; `npm run test:ci` for CI
- `npm run seed` — full database seed
- `npm run db:backup` — snapshot to JSON
- `npm run db:restore` — restore from JSON
- `npm run db:safe-migrate` — backup + migrate
- `npm run build:safe` — check coverage + backup + build

**Git workflow**:

1. Update `CHANGELOG.md` with a summary of changes
2. Stage changes: `git add -A`
3. Commit with concise one-liner message: `git commit -m "feat: add feature description"`
4. Always update changelog BEFORE staging commits

## CMS & Navigation

- **Block system**: Production pages use `Block` table (hero, richText, image, gallery blocks) with flexible layouts
- **Legacy content**: Demo pages may have HTML in `Page.content`—render with `dangerouslySetInnerHTML` or convert to basic block
- **Navigation**: Server actions in `app/actions.ts` fetch published pages for header/footer with ordering (`headerOrder`, `footerOrder`)
- **Page creation**: Admin UI for blocks; maintain `showInHeader`, `showInFooter`, and order fields when adding nav items

## AI Recommendations

- **Architecture**: Direct context injection (no RAG)—full catalog + user behavioral signals passed to Gemini per request
- **Why no RAG**: Small catalog (~30 products), simple data, fits in ~2-3K tokens—see `docs/ai-recommendations-architecture-internal.md`
- **Scoring**: +10 roast match, +5 per tasting note match, +3 viewed, -20 recent purchase
- **Context**: Purchase history, recent views, searches, preferences (roast level, tasting notes)
- **Fallback**: Trending products (view counts) for anonymous users

## Testing & Quality

- **Jest config** (`jest.config.js`): next/jest, jsdom env, aliases (`@/`, `@components/`), ignores API routes for now
- **Coverage**: Targets `lib/`, `hooks/`, `app/api/` (excluding `.d.ts`, `node_modules`, `.next`)
- **TypeScript**: Strict mode enforced (`tsconfig.json`)
- **Linting standards** (ESLint strict rules):
  - **ERROR**: no `any`, no `setState` in effects, no components created during render, `@next/next/no-html-link-for-pages`
  - **WARN**: `react-hooks/exhaustive-deps`, unused vars (prefix `_` to bypass)
  - **Ignored**: `dev-tools/`, AI wizard paths (`app/admin/pages/new/wizard`, `app/admin/pages/edit/[id]`, `app/api/admin/pages/generate-about`)

## Patterns & Best Practices

- **API type safety**: ALL API routes must validate input with Zod schemas before processing
  - Define schema at top of file: `const schema = z.object({ email: z.string().email() })`
  - Use `.safeParse()` for validation: `const validation = schema.safeParse(body)`
  - Return 400 with error message on validation failure
  - Example pattern in `app/api/newsletter/route.ts`, `app/api/admin/products/[id]/addons/route.ts`
- **Server actions**: Use `"use server"` for DB-backed fetches (e.g., header/footer pages, cart variants)
- **Prisma singleton**: `lib/prisma.ts` maintains single instance to avoid connection exhaustion—don't recreate clients
- **Image hosts**: Next.js image config whitelists only `placehold.co`, `lh3.googleusercontent.com`, `avatars.githubusercontent.com`, `github.com`—add new hosts in `next.config.ts`
- **Session handling**: Root layout provides `SessionProvider`; auth state propagates to all routes
- **Theme**: `next-themes` with system detection, light/dark modes via CSS variables
- **Analytics**: Vercel Analytics wired in root layout
- **Dev indicators**: `EnvironmentIndicator` shows dev/staging/prod badge

## Key Files & Docs

- `SETUP.md` — Complete local setup, OAuth/Stripe config, deployment guide
- `prisma/seed/README.md` — Seed module order, selective seeding, recovery patterns
- `docs/demo-pages-architecture.md` — Explains dual content model (blocks vs HTML)
- `docs/ai-recommendations-architecture-internal.md` — Why direct context injection, no RAG needed
- `docs/database-backup-restore.md` — Backup/restore system details
- `lib/prisma.ts` — Database adapter detection logic
- `app/actions.ts` — Server actions for navigation, cart operations
- `app/layout.tsx` — Root layout with providers

If anything here is unclear or missing for your task, tell me what to adjust and I'll update this guidance.
