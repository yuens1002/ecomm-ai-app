# Hosted Store — Cross-Repo Feature

**Status:** Iteration 1 plan + ACs approved · 3 further iterations scoped · feature ships as a single product release

The customer-facing path from *"I signed up for a hosted trial"* to *"my paid storefront has my custom domain pointed at it."* Spans `ecomm-ai-app` (store UI) and `artisan-roast-platform` (lifecycle, store-callable APIs, E2E test suite).

## Why this exists

A hosted trial without a clear path to paid hosting + custom domain is a dead-end demo. Platform Session 1 (PR #43) shipped the **lifecycle backend** — provisioning, 30-day grace period, per-customer Stripe Payment Links, env-var injection. This feature closes the **customer-facing loop**: trial visibility → conversion → managed hosting controls.

## Iteration roadmap

The feature ships as a **single product release** when all iterations merge and the E2E suite passes. None of the individual iterations ship to live customers in isolation.

| # | Iteration | Repo | Status | Depends on |
|---|---|---|---|---|
| **1** | [Trial UI — UI states](iter-1-trial-ui/plan.md) | `ecomm-ai-app` (public) | **In planning** | Platform Session 1 (shipped) |
| 1' | Trial UI — data + sync (companion) | `artisan-roast-platform` (private) | Scoped | — |
| 2 | Store-callable platform endpoints | `artisan-roast-platform` (private) | Scoped | — |
| 3 | [Hosting Settings page](iter-3-hosting-settings/plan.md) | `ecomm-ai-app` (public) | Scoped, not started | Iteration 2 merged |
| 4 | E2E lifecycle suite (launch gate) | `artisan-roast-platform` (private) | Scoped | Iters 1–3 |

**Repo split rationale.** Public open-source store docs (this directory) cover **UI states only**. Data shapes, lifecycle internals, sync mechanisms, DB schemas, email-notification specs all live in private platform docs at `artisan-roast-platform/docs/products/hosted/features/hosted-store/`. The store-side public doc never references DB schemas or specific data shapes — it ships as a pure consumer of platform-reported state.

## Visibility model

The plans page renders disjoint sets of plans for self-hosted vs hosted instances — there's no card overlap.

| Lifecycle state | Plans page cards (left → right) | Hosting Settings (iter-3) | Download Your Data |
|---|---|---|---|
| Self-hosted (Community current) | Community *(active · "Current Plan")* · Priority Support *(none)* | Hidden | Visible |
| Self-hosted (Priority Support active) | Community *(inactive)* · Priority Support *(active)* | Hidden | Visible |
| Trial · active · no-card | House Blend Trial *(active)* · House Blend *(none)* | Hidden | Visible |
| Trial · active · card-added | House Blend Trial *(active · "Extended Trial")* · House Blend *(none)* | Hidden | Visible |
| Trial · expired (grace period) | House Blend Trial *(active · "Expired")* · House Blend *(none)* | Hidden | Visible |
| Hosted Paid · converted from trial | House Blend *(active)* — Trial card hidden | **Visible** | Visible |
| Hosted Paid · direct-subscribe (never had a trial) | House Blend *(active)* — Trial card hidden | **Visible** | Visible |
| Deprovisioned | (terminal — store no longer accessible) | n/a | n/a |

**Strict separation:** hosted instances do NOT show Community or Priority Support cards (the Hosted plan bundles 5 priority support tickets at 48-hr SLA, no 1:1 sessions — separate Priority Support card would be redundant). Self-hosted instances do NOT show House Blend cards (discovery happens on the marketing site).

Filtering is declarative: each plan entry in the catalog gets a `visibility: "self-hosted" | "hosted"` discriminator. `PlanPageClient` filters by `IS_HOSTED` before rendering. Trial card hides whenever there's no in-flight trial record (covers CONVERTED, direct-subscribe, self-hosted).

## Cross-repo coordination

- **Iter-1 (this repo)** is UI-states-only. Pre-launch — no live customers, so broken-in-isolation paths from missing platform endpoints are deferred to iter-2 fixes.
- **Iter-1' platform companion doc** lives at `artisan-roast-platform/docs/products/hosted/features/hosted-store/iter-1-store-data-and-sync/`. Owns license-shape extensions, status-fetch + webhook sync mechanisms, the cancel-reason DB table, email notification specs.
- **Iter-2 (platform repo)** ships the store-callable endpoints iter-1 UI mocks or wires to placeholders: `convert-now`, no-card cancel, `subscription.deleted` webhook handler, `EXPIRED → CONVERTED` guard fix, domain CRUD, domain verify, trial-id-authed billing-portal wrapper, HOSTED-tier license shape.
- **Iter-3 (this repo)** depends on iter-2 endpoints landing first.
- **Iter-4 (platform repo)** is the Playwright E2E lifecycle suite — the launch gate.

## Launch gate

The hosted trial cannot launch publicly (`NEXT_PUBLIC_HOUSE_BLEND_OPEN=true`) until:

1. Iter-1 (trial UI) merged
2. Iter-2 (platform endpoints) merged
3. Iter-3 (Hosting Settings page) merged
4. Iter-4 (E2E lifecycle suite) passing on a semi-durable dev environment with failure-mode observability

After the trial → convert / cancel → custom-domain loop is functional and exercised by the E2E suite, we flip the launch flag.

## Companion marketing-side change (iter-2 era)

The marketing pricing-section's House Blend card CTA inversion (paid Subscribe primary, trial signup secondary) is tracked alongside iter-2 platform work. Marketing-side copy choices are marketing's domain — they don't bind the in-store admin plan card copy (which uses action-oriented `Subscribe Now`).

## Open product discussion (parked for research)

Post-cancellation 30-day reinstatement window — an email + payment-link offer to reactivate after cancel. Implications: GDPR/CCPA, custom domain hold, storage cost, Stripe reactivation mechanics, cron interaction. Parked until research completes; hosted trial ships with simple "deprovision on cancel" semantics in v1.

## Related

- Platform Session 1 plan: [`artisan-roast-platform/docs/products/hosted/features/hosted-store/feature-plan.md`](https://github.com/dev-yuen-agency/artisan-roast-platform/blob/main/docs/products/hosted/features/hosted-store/feature-plan.md)
- Platform Session 1 PR: [#43](https://github.com/dev-yuen-agency/artisan-roast-platform/pull/43)
- Platform roadmap: `artisan-roast-platform/docs/platform/platform.md` (Phase 3e Inc2 + Phase 3f)
