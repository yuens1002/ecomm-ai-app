# Artisan Roast — Product Roadmap

> **Single source of truth for what's being built.**
> Update this doc on every release and before starting any new feature.
> Details live in `docs/features/<name>/` — this is the navigation layer only.

---

## Now — v0.99.x

_Nothing in progress. v0.98.4 just shipped._

---

## Next — Agentic Product Discovery

> **The claim:** Free-tier agentic product discovery — no other e-commerce platform ships this natively in 2026. Platform tier adds personalization on top.

### Phase A — Free Tier (ships as one PR or two)

| # | Item | Notes |
|---|------|-------|
| A0 | Homepage hero swap | Video or image slides; remove floating AI-Barista widget |
| A1 | Structured search JSON backbone | Evolve `/api/search` response shape |
| A2 | NL filter extraction | Gemini Flash: query → intent + filters → explanation |
| A3 | Conversational follow-ups | Session-scoped, stateless, no persistence |

**Spec:** [`docs/features/agentic-search/spec.md`](features/agentic-search/spec.md)

### Phase B — Platform Tier (follows Phase A)

| # | Item | Notes |
|---|------|-------|
| B1 | User context aggregation | `getUserPurchaseHistory`, `getUserRecentViews`, etc. |
| B2 | Personalized search ranking | Inject user context into agentic search prompt |
| B3 | "Recommended For You" | Authenticated carousel, homepage |

---

## Backlog — Prioritized

| Priority | Feature | Spec / Notes |
|----------|---------|--------------|
| P1 | Reviews Tier 2 — AI Roast Master | [`docs/internal/product-reviews-tier2.md`](internal/product-reviews-tier2.md) — depends on Phase B data |
| P2 | A1: AI Assist Tests | `app/admin/(cms)/pages/[id]/ai-assist/` — unit + component tests |
| P3 | Agentic search Phase B + Reviews Tier 2 integration | Platform search uses review utility scores |

---

## Shipped

| Version | Feature |
|---------|---------|
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
- **When planning a sprint:** create `docs/features/<name>/spec.md` and `docs/plans/<name>-plan.md`
- **When shipping:** move the item from Next/Backlog to Shipped, bump the version row
- **`docs/plans/`** — per-sprint ACs and implementation plans (granular, created at sprint start)
- **`docs/features/`** — durable feature specs (created when feature is first planned, updated as it evolves)
- **`docs/internal/`** — gitignored, strategy/competitive/private notes
