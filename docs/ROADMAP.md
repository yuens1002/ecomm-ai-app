# Artisan Roast — Product Roadmap

> **Single source of truth for what's being built.**
> Update this doc on every release and before starting any new feature.
> Details live in `docs/features/<name>/` — this is the navigation layer only.

---

## Now — v0.100.7

_Patch release — plan detail quota label fix + plans page ACs spec closure. Clean state._

---

## Next — Iter 4: Conversation Context & Domain Intelligence

> **Goal:** Make Counter conversationally aware and coffee-domain-smart. Each query builds on the last; the AI understands "approachable" and "gift for mom" as concrete product attributes.

| # | Item | Notes |
|---|------|-------|
| 4a | Lazy voice surface init | GET generates + caches surfaces on first Counter open; no TS fallback flash |
| 4b | Conversation history | Pass prior turns to AI extraction — follow-up queries narrow context |
| 4c | Context-aware greeting + placeholder | Greeting updates on page nav; placeholder adapts to product type (coffee vs merch) |
| 4d | Pre-validate follow-up chips | Filter chips that would return zero results before rendering |
| 4e | Coffee domain knowledge | Roast/origin/brew/experiential mappings in system prompt |
| 4f | Admin two-part textarea | Voice answer + AI-generated preview per Q&A block |
| 4g | pgvector semantic search | Per-store toggle; embeddings on product save; vector + keyword fallback |

**Spec:** [`docs/features/smart-search-ux/iter-4-conversation-context/plan.md`](features/smart-search-ux/iter-4-conversation-context/plan.md)

---

## Backlog — Prioritized

| Priority | Feature | Spec / Notes |
|----------|---------|--------------|
| P1 | Phase B1 — User context aggregation | `getUserPurchaseHistory`, `getUserRecentViews`, `getUserSearchHistory` |
| P2 | Phase B2 — Personalized ranking | Inject user context into Counter prompt for authed users |
| P3 | Phase B3 — "Recommended For You" carousel | Authenticated; falls back to trending for anon |
| P4 | Reviews Tier 2 — AI Roast Master | `docs/internal/product-reviews-tier2.md` — depends on Phase B data |
| P5 | Phase B4 — Reviews + search integration | Utility scores in agentic results (BLOCKED on Reviews Tier 2) |
| P6 | Counter — service tier (platform premium) | Extend Counter beyond product discovery to service queries: order lookup, reorder from history, return initiation. Requires order data access + auth context. Counter redirects these in-character until this ships. |

---

## Shipped

| Version | Feature |
|---------|---------|
| v0.100.7 | Fix — plan detail quota labels (`[object Object]` → correct label/limit) |
| v0.100.6 | Fix — admin nav active state (Dashboard no longer highlights on every page) |
| v0.100.5 | Fix — Counter keyboard retention, focus steal, viewport offset, voice surface defaults |
| v0.100.4 | Fix — hero 16:9 mobile, theme switcher visibility, stepper border, product card aspect |
| v0.100.3 | Feat — Counter UX overhaul: panel rename, voice surfaces, admin consolidation, cadence rules |
| v0.100.2 | Fix — lazy-require pg/adapter-pg (Turbopack static analysis) |
| v0.100.1 | Fix — search quality hotfix: AI clears keyword OR + pg full-text ranking |
| v0.100.0 | Feat — Agentic Smart Search (Phase A + Phase 2): Counter panel, NL extraction, voice persona, Smart Search admin, salutation, response cadence, animated waiting indicator |
| v0.99.x | Fixes — pg/ws adapter, Copilot review feedback, hook portability guards |
| v0.98.4 | Repo cleanup — dev-tools removed, docs/internal tsconfig excluded |
| v0.98.3 | Security — patched 17 npm vulnerabilities |
| v0.98.2 | Platform — acceptedAt/acceptedVersions wiring + ticket reply thread |
| v0.98.1 | Profile — admin password change via SecurityTab |
| v0.98.0 | QA — self-healing pipeline (auto-classify, repair, close issues) |
| v0.97.x | Demo mode — build variant system, amber toast, demo badges, banner hydration |
| v0.96.x | Install — graceful degradation, auto-seed, setup checklist, QA agent |
| v0.95.x | Platform — SaaS wiring, legal/EULA gate, platform API |
| v0.94.x | Admin — order detail page, dashboard mobile responsiveness |
| v0.93.x | Analytics — custom date ranges, analytics page restyle |
| v0.92.x | Images — Vercel Blob migration |
| v0.91.x | Reviews — full Brew Report system (Tier 1 all 8 phases) |
| v0.90.x | Storefront — theme switcher, storefront polish |
| v0.89.x | Tables — shared data-table, table UI polish |
| v0.88.x | Admin — orders, subscriptions responsive, refund flow |
| v0.87.x | Products — table v1/v2, add/edit form |
| v0.86.x | Mobile — audit, nav, responsive polish |
| v0.85.x | Email — provider settings, SVG logo, templates |
| v0.84.x | Support — services, nav, ticket system |
| v0.83.x | Stripe — promo codes, billing portal |
| v0.82.x | Cart — add-to-cart standardization, price alignment |
| v0.81.x | Add-ons — undo/redo, add-on links |
| v0.80.x | Auth — admin profile API, version check endpoint |
| v0.79.x | Telemetry — install tracking, heartbeat cron |
| v0.78.x | Feedback — in-app widget, `/api/feedback` |
| v0.77.x | Orders — failed order status, FAILED badge |
| v0.76.x | Version system — `lib/version.ts`, update banner |
| v0.75.x | Menu Builder — v1.0 launch (all 3 phases complete) |
| v0.72.x | AI — pages CMS, About Page wizard, AI content generation |

---

## Convention

- **Before starting a feature:** add it to Next or Backlog with a link to its spec
- **On every release:** update the "Now" section, move shipped items to the Shipped table
- **When planning a sprint:** ensure `docs/features/<name>/spec.md` exists and create `docs/plans/<name>-plan.md`
- **`docs/plans/`** — per-sprint ACs and implementation plans (granular, created at sprint start)
- **`docs/features/`** — durable feature specs (created when feature is first planned, updated as it evolves)
- **`docs/internal/`** — gitignored, strategy/competitive/private notes
