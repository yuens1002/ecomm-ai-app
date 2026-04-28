# Hosted Store — Iteration 3: Hosting Settings Page

**Branch:** TBD — proposed `feat/hosting-settings-page`
**Base:** `main` (after iterations 1 and 2 merge)
**Status:** Scoped, not started
**Companion (private platform doc):** parts of iter-2 platform endpoints + `artisan-roast-platform/docs/products/hosted/features/hosted-store/iter-1-store-data-and-sync/` (sync mechanisms)

> **Doc stance:** This is the public open-source repo — UI-states-only. Data shapes (domain CRUD response shapes, billing-portal session shapes, license states) live in the private platform docs. The store ships as a pure consumer of platform-reported state.

**Visibility gate (locked from approved iter-1 plan):** Hosting Settings page only visible when `IS_HOSTED && status === "CONVERTED"`. Hidden during trial (cancel flows happen on the plans page Trial card in iter-1). Hidden on self-hosted.

**Cancel-during-trial:** owned by iter-1 (Trial card → Cancel modal → reason capture → Stripe Portal or platform cancel endpoint).
**Subscription management on Hosted Settings:** Stripe Portal redirect — no native cancel button duplicated here.
**Domain CRUD + DNS/SSL polling:** depend on iter-2 platform endpoints landing first.
**Depends on:** [Iteration 2](../iter-2-platform-endpoints/plan.md) merged

---

## Context

Iteration 1 closes the trial visibility loop — customers see their trial state, can extend / subscribe via Stripe Payment Links. But once they convert (`status: CONVERTED`), the store admin gives them no way to manage their hosting: no custom domain configuration, no in-store billing access, no cancel flow.

This iteration adds `/admin/settings/hosting` — visible **only when the instance is paid hosted** (`status: CONVERTED` or any future paid-hosting state). It is the customer's home for managing the infrastructure their store runs on.

Architecturally this is the store-side completion of platform `Phase 3f`.

---

## Visibility gate

The page and its nav entry render only when:

```ts
const showHostingSettings = IS_HOSTED && trialStatus?.status === "CONVERTED";
```

Trial users (`status: ACTIVE | EXPIRED`) do **not** see the page or its nav entry. Self-hosted users do not see it. Only converted (paid) customers see it.

---

## Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Page location | `/admin/settings/hosting` | Sibling to other settings pages (`/admin/settings/{search,storefront,...}`). "Settings" is the right home — `/admin/support/plans` already covers subscription state |
| Page sections | Three: Plan & Billing, Custom Domain, Danger Zone | Clear separation: *what plan you have* / *where your store lives* / *how to leave* |
| Nav registration | `lib/navigation/route-registry.ts` + `lib/config/admin-nav.ts` — entry conditional on `showHostingSettings` (server-rendered) | Self-hosted and trial users don't see a "Hosting" nav child at all; no broken links |
| Custom domain UI primitives | shadcn `Input` + `Button` for add form; status badge + Recheck button for pending state | Existing primitives; nothing new to build |
| Domain status polling | `useEffect` poll every 30s while status is "pending"; stop on "active" or "error" | Matches platform endpoint cache TTL; avoids manual refresh during DNS propagation |
| Cancel flow | "Cancel hosting" button → opens Stripe Customer Portal in new tab (not in-store cancel UI) | Stripe Portal already supports cancellation. Avoids building duplicate cancel logic on platform side. v1 = redirect; in-store cancel is a future polish item |
| Failure mode for domain ops | Toast + inline error; no full-page error states | Domain ops are quick; toast is appropriate noise level |
| Loading states | Skeleton only on initial page load; subsequent ops use button spinner | Matches existing settings page conventions |

---

## Page sections — detail

### 1. Plan & Billing

```text
┌─────────────────────────────────────────────────────┐
│ Plan & Billing                                      │
│                                                     │
│ Plan: Hosted · Active                               │
│ Billing cycle: Monthly · Next charge {date}         │
│ Card on file: Visa ending 4242                      │
│                                                     │
│ [Manage billing] (→ Stripe Portal, new tab)         │
└─────────────────────────────────────────────────────┘
```

- `Plan` and `Active` status come from `getTrialStatus()` (extended in iteration 1)
- `Next charge {date}` from extended status response (Stripe subscription `current_period_end`) — confirm field exists in iteration 2 response
- "Manage billing" button calls `POST /api/trial/hosted/[id]/billing-portal` (iteration 2), opens returned URL in new tab

### 2. Custom Domain

Multi-state component. Initial state is "no domain set":

```text
[No domain set]
┌─────────────────────────────────────────────────────┐
│ Custom Domain                                       │
│                                                     │
│ Your store is currently live at                     │
│ https://acme.artisanroast.app                       │
│                                                     │
│ Add a custom domain you own (e.g. store.acme.com).  │
│                                                     │
│ Domain: [_________________________] [Add Domain]    │
└─────────────────────────────────────────────────────┘

[Pending DNS]
┌─────────────────────────────────────────────────────┐
│ Custom Domain                                       │
│                                                     │
│ store.acme.com                  ⚠ DNS pending       │
│                                                     │
│ Add this CNAME record at your DNS provider:         │
│   Name:   store.acme.com                            │
│   Value:  cname.vercel-dns.com    [Copy]            │
│   TTL:    Auto (or 3600)                            │
│                                                     │
│ Once your DNS provider has updated (usually a few   │
│ minutes, but can take up to 48 hours), this will    │
│ activate automatically.                             │
│                                                     │
│ [Recheck status]    [Remove domain]                 │
└─────────────────────────────────────────────────────┘

[Active]
┌─────────────────────────────────────────────────────┐
│ Custom Domain                                       │
│                                                     │
│ store.acme.com                  ✓ Active            │
│ SSL: Active · Last verified {time ago}              │
│                                                     │
│ [Change domain]    [Remove domain]                  │
└─────────────────────────────────────────────────────┘

[Error]
┌─────────────────────────────────────────────────────┐
│ Custom Domain                                       │
│                                                     │
│ store.acme.com                  ✗ Verification failed│
│                                                     │
│ {errorMessage from verify endpoint}                 │
│                                                     │
│ [Retry verification]    [Remove domain]             │
└─────────────────────────────────────────────────────┘
```

Polling cadence (Pending state only): every 30s; pause when tab is backgrounded; resume on focus.

### 3. Danger Zone

```text
┌─────────────────────────────────────────────────────┐
│ Danger Zone                                         │
│                                                     │
│ Cancel your hosting subscription                    │
│ Your store will remain accessible until the end of  │
│ your billing period. Download your data first if    │
│ you want a copy.                                    │
│                                                     │
│ [Cancel via Stripe Portal] (→ Stripe, new tab)      │
└─────────────────────────────────────────────────────┘
```

- "Cancel via Stripe Portal" calls the same billing-portal endpoint as Plan & Billing's Manage button
- Helper text reminds the customer about data export (iteration 1's Download Your Data card on the License & Privacy page)

---

## API surface (called from store)

All endpoints from iteration 2:

- `GET /api/trial/hosted/[id]/domain` — current domain
- `POST /api/trial/hosted/[id]/domain` — add domain
- `PUT /api/trial/hosted/[id]/domain` — change domain
- `DELETE /api/trial/hosted/[id]/domain` — remove domain
- `GET /api/trial/hosted/[id]/domain/verify` — DNS + SSL status
- `POST /api/trial/hosted/[id]/billing-portal` — Stripe Portal session URL
- `GET /api/trial/hosted/[id]/status` — extended status (existing endpoint, may need extension to return billing details)

---

## Files changed

### New

- `app/admin/settings/hosting/page.tsx`
- `app/admin/settings/hosting/_components/PlanBillingSection.tsx`
- `app/admin/settings/hosting/_components/CustomDomainSection.tsx`
- `app/admin/settings/hosting/_components/DomainAddForm.tsx`
- `app/admin/settings/hosting/_components/DomainStatusCard.tsx`
- `app/admin/settings/hosting/_components/DangerZoneSection.tsx`
- `app/admin/settings/hosting/hooks/useDomainStatus.ts` — polling hook
- `lib/hosted.ts` — extend with `getDomainStatus()`, `getBillingPortalUrl()`, domain CRUD client helpers

### Modified

- `lib/navigation/route-registry.ts` — add `admin.settings.hosting` route
- `lib/config/admin-nav.ts` — add Hosting nav child (gated on `showHostingSettings`)

---

## Commit Schedule (preliminary)

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add iter-3 plan + ACs for hosting settings page` | — |
| 1 | `feat(hosted): extend lib/hosted.ts with domain + billing client helpers` | Low |
| 2 | `feat(hosted): hosting settings page scaffold + Plan & Billing section` | Low |
| 3 | `feat(hosted): custom domain section — view, add, remove flows` | Medium |
| 4 | `feat(hosted): custom domain section — pending state with polling` | Medium |
| 5 | `feat(hosted): hosting settings — Danger Zone (Stripe Portal link)` | Low |
| 6 | `feat(hosted): nav registration with conditional visibility` | Low |
| 7 | `chore: update verification status` | — |

---

## Open questions for review

1. **Stripe Portal return URL** — where does the customer land after closing the Portal? Back to `/admin/settings/hosting`? Configured in iteration 2.
2. **Domain change while pending** — current proposal blocks it (force DELETE first). Alternative: allow PUT to cancel pending and start new. Operationally simpler if blocked; UX-friendly if allowed. Confirm.
3. **In-store cancel UI** — recommended deferral to a later iteration; v1 = redirect to Stripe Portal. Confirm.
4. **Status polling cadence** — 30s while pending. Could be 15s for more responsive UX, 60s for less platform load. Tied to iteration 2's verify endpoint cache TTL.
5. **What happens at trial expiry → CONVERTED** — does the new banner state ("subscription active") need explicit dismiss before Hosting Settings becomes visible? Probably no — visibility gate is just on `status`. Confirm.
6. **First-time hint** — when a customer first lands on Hosting Settings post-conversion, should there be a one-time helper banner ("You're now on a paid plan — configure your custom domain here")? Polish item, deferrable.

---

## ACs

Will be drafted when implementation begins. Estimated:

- **UI** (~18): Page sections × 3, Custom Domain states × 4, conditional visibility × 2, mobile checks × 3, copy/CTA × 6
- **FN** (~10): Visibility gate logic, all 6 endpoint calls, polling lifecycle, error handling
- **TST** (~5): Endpoint client helpers, polling hook, visibility gate
- **REG** (~4): Trial / self-hosted / no-status all unaffected; precheck + tests

Total: ~37 ACs (similar order of magnitude to iteration 1).

---

## Out of scope (deferred)

- In-store cancel hosting form (use Stripe Portal in v1)
- Multiple custom domains
- Domain analytics
- SSL certificate expiry alerts
- Migration from self-hosted to hosted (Phase 4)
- Vanity subdomain on `*.artisanroast.app`
