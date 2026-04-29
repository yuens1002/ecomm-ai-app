# Hosted Store — Trial UI

**Branch:** `feat/hosted-store-s2`
**Base:** `main`
**Worktree:** `c:\Users\yuens\dev\hosted-store-s2`
**Platform-side context:** the cross-repo roadmap for the hosted launch lives at `artisan-roast-platform/docs/products/hosted/product.md` (Features TOC). Specific platform features this work consumes:

- `extended-trial-lifecycle` *(shipped)* — env-var injection, trial-status endpoint, Stripe Payment Links
- `trial-conversion` *(planned)* — `convert-now` endpoint that the in-store `Subscribe Now` CTA swaps to once shipped
- `trial-cancellation` *(planned)* — `cancel` endpoint + `CancellationReason` DB that the in-store Cancel modal writes to
- House Blend plan-detail content lives in platform `prisma/seed.ts`; exposed via existing `GET /api/plans` and consumed via `lib/plans.ts` here

---

## Doc stance

This is a public open-source repo. **This plan is UI-states-only**: it documents what the store admin renders in each lifecycle state. Data shapes (license fields, status response shapes, formatter input types, DB schemas) live in the platform-side companion doc. The store ships as a pure consumer of platform-reported state; it never hardcodes business data.

If you're reading this and need a data shape or sync mechanism, follow the link to the platform-side doc.

---

## Context

Platform Session 1 (PR #43, merged) ships the **lifecycle backend**: provisioning, 30-day grace period, per-customer Stripe Payment Links, env-var injection. Today the store does nothing with those env vars — a customer who signs up has no in-store visibility into their trial state and no path to convert from inside their admin.

This iteration adds the **trial-side UI**:

- A **House Blend Trial** plan card visible during the trial window
- A **House Blend** (paid) plan card visible alongside it during trial, then in active state after conversion
- A **Cancel modal** with reason capture
- A **Download Your Data** ZIP export on the License & Privacy → Data Privacy tab

**The full feature ships as a single product release.** Trial UI ships only when all platform sessions in the launch dependency graph (held in the platform's `feature-plan.md`) merge and the E2E lifecycle suite passes. That means this work is purely UI/presentational scaffolding to account for backend functions across the launch sessions — no customer-experience concerns apply to broken-in-isolation paths.

**Explicitly out of scope here:** the post-conversion `/admin/settings/hosting` page (custom domain, billing config). That work is documented in [`../hosting-settings/plan.md`](../hosting-settings/plan.md) and depends on the platform `custom-domains` + `billing-portal` features landing.

---

## Visibility model

Plan cards render declaratively from `lib/plans.ts`, filtered by `IS_HOSTED` (and trial status for the House Blend Trial card). **Self-hosted and hosted instances see disjoint sets of plans** — no card overlap.

| Lifecycle state | Plans page cards (left → right) |
| --- | --- |
| Self-hosted (Community current) | Community *(active · "Current Plan")* · Priority Support *(none)* |
| Self-hosted (Priority Support active) | Community *(inactive)* · Priority Support *(active)* |
| Trial · active · no-card | House Blend Trial *(active)* · House Blend *(none)* |
| Trial · active · card-added | House Blend Trial *(active · "Extended Trial")* · House Blend *(none)* |
| Trial · expired (grace period) | House Blend Trial *(active · "Expired")* · House Blend *(none)* |
| Hosted Paid · converted from trial | House Blend *(active)* — Trial card hidden |
| Hosted Paid · direct-subscribe (never had a trial) | House Blend *(active)* — Trial card hidden |
| Deprovisioned | (terminal — store no longer accessible) |

**Trial card visibility rule:** show only when the trial-status response indicates ACTIVE or EXPIRED. Hide on CONVERTED, hide on direct-subscribe (no trial record), hide self-hosted.

**Hosted instances do NOT show Community or Priority Support cards.** The Hosted plan bundles 5 priority support tickets/month — separate Priority Support card would be redundant. Bundled tickets render as a status bar on the House Blend card's `active` state post-conversion.

**Self-hosted instances do NOT show House Blend Trial or House Blend cards.** Discovery of the hosted offering happens on the marketing site.

Filtering is declarative: each plan entry in the catalog gets a `visibility: "self-hosted" | "hosted"` discriminator. `PlanPageClient` filters by `IS_HOSTED` before rendering.

---

## UI state inventory (every state Trial UI must render)

This is the Trial UI verification target — every row gets screenshot-verified at desktop + mobile breakpoints. Screenshots saved to `.screenshots/hosted-store-trial-ui/`.

> **Stance:** Generalized state inventory; specific data shapes / pricing strings / quotas are owned by the platform and pulled at render time.

| # | Lifecycle state | Plan card | Card state | Distinguishing UI |
| --- | --- | --- | --- | --- |
| 1a | Self-hosted (Community current) | Community | `active` | "Current Plan" badge, free pricing, View Terms link |
| 1b | Self-hosted (Priority Support active) | Community | `inactive` | Lapsed-style badge, no current actions |
| 2a | Self-hosted (Priority Support not subscribed) | Priority Support | `none` | Pricing + benefits + [Subscribe] |
| 2b | Self-hosted (Priority Support active) | Priority Support | `active` | "Active" badge, renewal date, support pools status bar, [Manage] |
| 3 | Trial · active · no-card | House Blend Trial | `active` | Clock icon, "Active Trial" badge, trial-days status bar (out of 14), tagline, 4 benefit bullets, [Add Billing] right enabled, "Cancel" left text-link (no Details — Trial has no detail page) |
| 4 | Trial · active · no-card | House Blend | `none` | "House Blend" name, tagline + benefit copy from gated marketing, sale label, [Details] left, [Subscribe Now] right |
| 5 | Trial · active · card-added | House Blend Trial | `active` (variant) | Clock icon, "Extended Trial" badge, trial-days status bar (out of 30 — variable per billing status), [Add Billing] **disabled + tooltip**, "Cancel" |
| 6 | Trial · active · card-added | House Blend | `none` | Same as state 4 — [Subscribe Now] always visible |
| 7 | Trial · expired (grace) | House Blend Trial | `active` (variant) | Clock icon, "Expired" badge, trial-days status bar at 0, copy noting deprovisioning date, [Add Billing] enabled, "Cancel" |
| 8 | Trial · expired (grace) | House Blend | `none` | Same as state 4 |
| 9 | Hosted Paid · converted from trial | House Blend Trial | hidden | Card NOT in DOM (visibility rule) |
| 10 | Hosted Paid · converted from trial | House Blend | `active` | CheckCircle2 icon, "Active" badge, renewal date, Priority Tickets status bar, [Details], [Manage billing] |
| 10b | Hosted Paid · direct-subscribe | House Blend | `active` | Same as state 10 — visually identical regardless of conversion path |
| 10c | Hosted Paid · direct-subscribe | House Blend Trial | hidden | Card NOT in DOM (no trial record) |
| 11 | Cancel modal — Trial · no-card | (modal over Trial card) | open | "Cancel your trial?" copy, **reason dropdown + Other-textarea**, [Keep trial] / [Cancel trial] (UI mock for v1) |
| 12 | Cancel modal — Trial · card-added | (modal over Trial card) | open | "Cancel your subscription?" copy, **reason dropdown + Other-textarea**, [Keep subscription] / [Continue to Stripe →] |
| 13 | Cancel modal — Hosted Paid (Manage Billing flow) | (modal over House Blend card) | open | Same reason-capture UX as states 11/12. Reason saved before redirect to Stripe Portal |
| 14 | Download Your Data card | (terms page Data Privacy tab) | always | Visible regardless of build mode; "Download ZIP" button |
| 15 | Platform-status fetch fails | House Blend Trial | error fallback | Skeleton/fallback message; does NOT crash plans page |

States 11–15 are not lifecycle states but distinct UI surfaces requiring verification.

---

## House Blend Trial card — UI spec

- **Card primitive:** existing PlanCard `active` state (border-primary)
- **Icon:** lucide `Clock` — differentiates the time-bounded trial card from the converted Hosted card (which keeps `CheckCircle2`)
- **Badge** by sub-state:
  - `no-card`: `"Active Trial"`
  - `card-added`: `"Extended Trial"`
  - `expired`: `"Expired"`
- **Tagline:** *"Risk-free for 14 days — full hosting, no card, no commitment."*
- **Trial-days status bar** — adapt the existing `UsageBar` with a custom formatter so it reads in a direct format (e.g. `"4 / 14 remaining"` or `"4 days remaining"`). The trial-days limit is variable based on billing status (14 default → 30 when card added). Underlying `<Progress>` primitive unchanged so visuals match existing PlanCard active-state aesthetics. *(Formatter input shape, license-status field driving the limit — see platform doc.)*
- **Benefits list** (customer-facing copy, 4 bullets):
  - "No billing needed — or add billing to extend your trial up to 30 days"
  - "You own your trial data — download a ZIP anytime during the trial"
  - "100% feature parity from day 1 — subscribe anytime to assign a custom domain"
  - "Cancel anytime during your trial — no contract, no commitment"
- **Actions** (Trial card has no detail page — the House Blend card next to it owns the [Details] affordance for plan content. Trial card has only Cancel + Add Billing):
  - **Left bottom (text link):** `"Cancel"` — opens Cancel modal. Rendered as a text link / ghost button, not a primary button — minor affordance
  - **Right bottom (primary button):** `Add Billing` — opens `PLATFORM_EXTEND_URL` Stripe Payment Link in new tab. **Disabled when card has been added** with tooltip indicating billing is already on file

---

## House Blend card — UI spec (during trial)

- **Card primitive:** existing PlanCard `none` state (default border, price shown — both sourced from platform plan spec)
- **Plan name:** `"House Blend"` (display label; matches marketing brand)
- **Tagline + benefits list:** pulled from the **gated** `HouseBlendCard()` in `artisan-roast-platform/components/pricing-section.tsx` (the live form variant when `NEXT_PUBLIC_HOUSE_BLEND_OPEN === "true"`, not the static "Coming Soon" placeholder). Long-term: marketing copy exposed through a platform plan-spec endpoint that this card fetches; this work may hand-sync via shared constants
- **Important:** the benefits list should explicitly include **"5 priority support tickets, 48-hr SLA"** — marketing copy may not list this and it's a real benefit customers should see on the in-store card
- **Actions:**
  - **Left bottom (button):** `Details` — opens the House Blend plan detail page at `/admin/support/plans/house-blend` (existing PlanDetailClient pattern; spec/copy populated from the platform's plan record)
  - **Right bottom (primary button):** `Subscribe Now` — matches the action-oriented CTA copy used across all admin plan cards (Priority Support, etc.). Admin context is "what action do I take?", which differs from the marketing context's coffee-themed sales patch. Opens `PLATFORM_SUBSCRIBE_URL` Stripe Payment Link in new tab. Always present regardless of card-added state. *(Double-subscription risk when card-added is resolved by the platform `trial-conversion` feature's `convert-now` endpoint.)*

---

## House Blend card — UI spec (after conversion / direct subscribe)

- **Card primitive:** existing PlanCard `active` state (border-primary, `CheckCircle2` icon)
- **Badge:** `"Active"`
- **Plan name + price + renewal date:** rendered from license/plan-spec data (platform-owned)
- **Priority-tickets status bar** rendered from license-supplied support pool data (platform owns shape; store treats it like any other UsagePool the existing PlanCard renders today)
- **Actions:**
  - **Left bottom (button):** `Details` — same plan detail page as during-trial; populated from platform plan record
  - **Right bottom (primary button):** `Manage billing` — calls existing `POST /api/billing/portal` (license-key Bearer auth), opens returned Stripe Portal URL in new tab

*Sync mechanism — how the store learns about state transitions from Stripe checkout / Portal cancellation / usage-pool updates: see platform `trial-conversion` and `trial-cancellation` feature plans. Store is a pure consumer of platform-reported state via license-validate poll (`revalidate: 60`).*

---

## Cancel modal — UI spec

> Cancel reason capture is a real product feature. Reasons are written to a platform-side DB table (schema lives in platform doc). Customer-facing UI is identical regardless of trial / paid-subscription state.

- **All cancel flows include reason capture:**
  - **Reason dropdown** with curated options — final list locked in implementation against platform copy (likely: "Too expensive", "Missing features", "Switching to another platform", "Don't need it anymore", "Other")
  - **"Other" reveals a textarea** for free-form input (max ~500 chars)
  - Reason submitted on confirm; modal closes after platform write succeeds (or with toast if it fails)
- **Variants** (same UX shape, different downstream effect):
  - **Trial · no card:** UI mock for v1 — reason captured client-side, real cancel endpoint ships in platform `trial-cancellation` feature
  - **Trial · card-added:** Reason captured, "Continue to Stripe" button calls existing `POST /api/billing/portal` and opens returned Stripe Portal URL in new tab
  - **Hosted Paid (Manage Billing → cancel intent):** Same reason-capture UX before redirect to Stripe Portal

---

## Download Your Data — UI spec

Visible to all users (not gated on `IS_HOSTED`) on `/admin/support/terms` → Data Privacy tab. Streams ZIP from new `GET /api/admin/export` (admin-auth, `archiver` library, includes `data/*.json` per Prisma model + `media/*` from Vercel Blob + `manifest.json`).

---

## Files changed

### New (4)

- `lib/hosted.ts` — exports `IS_HOSTED`, `getTrialStatus()` *(types live in platform doc)*
- `app/admin/support/plans/_components/CancelTrialDialog.tsx` (or co-located inside `PlanPageClient.tsx`)
- `app/admin/support/terms/_components/DownloadDataCard.tsx` (final placement TBD)
- `app/api/admin/export/route.ts`
- `lib/__tests__/hosted.test.ts`

### Modified (5)

- `lib/plans.ts` — add `house-blend-trial` and `house-blend` plan entries to `MOCK_PLANS`; add `visibility` discriminator to all entries
- `app/admin/support/plans/PlanPageClient.tsx` — filter plans list by `IS_HOSTED`; map trial-status → PlanCard state for the two House Blend entries; wire trial-days status bar; render Cancel + Add Billing on trial card; render Subscribe Now on House Blend card
- `app/admin/support/terms/page.tsx` (or relevant Data Privacy tab file) — add Download Your Data card
- `.env.example` — add `HOSTED_TRIAL_ID`, `PLATFORM_API_URL`, `PLATFORM_EXTEND_URL`, `PLATFORM_SUBSCRIBE_URL`, `LICENSE_KEY`
- `package.json` — add `archiver`

---

## Reuse — existing primitives

| Primitive | Location | How used |
| --- | --- | --- |
| `PlanCard` (inline component) | `app/admin/support/plans/PlanPageClient.tsx` | Renders both House Blend cards via existing `active` / `inactive` / `none` states |
| `UsageBar` | `app/admin/support/UsageBar.tsx` | Already used in PlanCard's `active` branch — extend with formatter override for direct trial-days display |
| Plan detail page pattern | `app/admin/support/plans/[slug]/PlanDetailClient.tsx` | Same shape used for House Blend Trial + House Blend detail pages |
| `lib/demo.ts` pattern | `lib/demo.ts` | Mirror for `IS_HOSTED` constant |
| `POST /api/billing/portal` | Platform (already shipped) | Hosted-active card "Manage billing" + card-added Cancel modal "Continue to Stripe" |

---

## Commit Schedule

| # | Message | Risk |
| --- | --- | --- |
| 0 | `docs: add hosted-store trial-ui plan + ACs` | — |
| 1 | `feat(hosted): IS_HOSTED detection + trial status fetcher` | Low |
| 2 | `feat(hosted): House Blend Trial + House Blend plan entries in plans catalog` | Low |
| 3 | `feat(hosted): plans page filters by IS_HOSTED + maps trial status to PlanCard config` | Medium |
| 4 | `feat(hosted): cancel trial dialog with reason capture` | Low |
| 5 | `feat(hosted): Download Your Data ZIP export` | Medium |
| 6 | `chore: env.example + archiver dependency` | Low |

---

## Verification

Per [`ACs.md`](ACs.md). Pre-flight:

1. Worktree dev server on port 4000 (`npm run dev -- -p 4000` from `c:\Users\yuens\dev\hosted-store-s2`)
2. Branch `feat/hosted-store-s2` registered in `.claude/verification-status.json` as `"planned"`
3. `.screenshots/` directory at repo root (gitignored)
4. **`.env.local` in the worktree contains the four hosted env vars + `LICENSE_KEY`** — `HOSTED_TRIAL_ID`, `PLATFORM_API_URL`, `PLATFORM_EXTEND_URL`, `PLATFORM_SUBSCRIBE_URL`, `LICENSE_KEY`. Verify present before running dev server
5. Mock platform on port 3001 returning fixture trial statuses (or stub via `PLATFORM_API_URL`)

---

## Out of scope (deferred)

- `/admin/settings/hosting` page — see [`../hosting-settings/plan.md`](../hosting-settings/plan.md)
- Custom domain configuration — see hosting-settings plan
- Real cancel-no-card endpoint — platform `trial-cancellation` feature (UI mock ships in this iteration)
- Migration from self-hosted to hosted — Phase 4 (separate feature)
- Email notification specifics — platform-side; see relevant platform features under `artisan-roast-platform/docs/products/hosted/features/`
- Server-side persistence of UI dismissals — pre-launch, no live customers
- Banner in admin shell — dropped (cards on plans page provide visibility)
- Post-cancellation reinstatement window — parked for research, see plan-mode plan
