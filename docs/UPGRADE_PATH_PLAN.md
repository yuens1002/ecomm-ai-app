# Artisan Roast: Ghost-Style Business Model Plan

> **Vision:** Open-source e-commerce for coffee roasters with optional managed hosting.
> **Model:** Ghost CMS style - free self-hosted, paid managed/Pro version.

**Last Updated:** January 29, 2026

---

## Executive Summary

### The Ghost Model Applied to Artisan Roast

| Ghost CMS | Artisan Roast |
|-----------|---------------|
| Free self-hosted blog | Free self-hosted coffee store |
| Ghost(Pro) managed hosting | Artisan Pro managed hosting |
| Custom themes | Custom themes (future) |
| Members & subscriptions | Already built-in |
| Native integrations | AI barista, Stripe, etc. |

### Key Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Pro Infrastructure | Vercel per-tenant | Simple until scale; migrate/hire when needed |
| Launch Order | Open source first | Get feedback, real-world testing |
| Pricing Model | Flat fee (2x cost) | $5 cost → $10/mo; users pay own AI |
| Custom Domains | Yes (when ready) | Essential for Pro value prop |
| Data Ownership | Always exportable | Trust signal, user-first philosophy |

---

## Phase 1: Open Source Foundation (Current → Launch)

### What We Have Now
- ✅ Full e-commerce functionality
- ✅ AI chat assistant
- ✅ Subscription management
- ✅ Menu Builder
- ✅ Pages CMS
- ✅ One-click Vercel deploy
- ✅ Demo mode

### What We Need for Launch

#### 1.1 Version Management System

**Purpose:** Track versions, enable update notifications, prepare for Pro feature flags.

```typescript
// lib/version.ts
export const APP_VERSION = "0.76.0";
export const EDITION = "community"; // "community" | "pro"

export interface VersionInfo {
  current: string;
  latest: string;
  edition: "community" | "pro";
  updateAvailable: boolean;
  releaseNotes?: string;
  downloadUrl?: string;
}
```

**Tasks:**
- [ ] Create `lib/version.ts` with version constants
- [ ] Add version to admin footer/settings
- [ ] Create version check endpoint (GitHub releases API or static JSON)

#### 1.2 Feature Flags Infrastructure

**Purpose:** Gate Pro features in the same codebase (Ghost approach).

```typescript
// lib/features.ts
export const FEATURES = {
  // Community (always available)
  AI_CHAT: true,
  MENU_BUILDER: true,
  PAGES_CMS: true,
  SUBSCRIPTIONS: true,

  // Pro (gated)
  CUSTOM_DOMAIN: process.env.EDITION === "pro",
  PRIORITY_SUPPORT: process.env.EDITION === "pro",
  ADVANCED_ANALYTICS: process.env.EDITION === "pro",
  WHITE_LABEL: process.env.EDITION === "pro",
  MULTI_STORE: process.env.EDITION === "pro",
} as const;

export function hasFeature(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] ?? false;
}
```

**Tasks:**
- [ ] Create `lib/features.ts` with feature flag system
- [ ] Add `EDITION` env var to `.env.example`
- [ ] Create `useFeature()` hook for client components
- [ ] Add feature checks to relevant components (prepared, not enforced yet)

#### 1.3 Instance Identity

**Purpose:** Unique identifier for telemetry, support, and future Pro licensing.

```typescript
// Generated on first seed, stored in SiteSettings
{
  key: "instance_id",
  value: "ar_inst_abc123xyz" // Unique per installation
}
```

**Tasks:**
- [ ] Add instance ID generation to seed script
- [ ] Store in SiteSettings table
- [ ] Expose in admin settings (for support requests)

#### 1.4 Update Notification System

**Purpose:** VS Code-style update notifications for self-hosted users.

```
┌─────────────────────────────────────────────────────────┐
│ 🎉 Update Available: v0.77.0                            │
│                                                         │
│ New features:                                           │
│ • Inventory management                                  │
│ • Improved AI recommendations                           │
│                                                         │
│ [View Changelog]  [Update Guide]  [Dismiss for 7 days] │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// components/admin/UpdateBanner.tsx
export function UpdateBanner() {
  const { data: versionInfo } = useSWR('/api/version/check', fetcher, {
    revalidateOnFocus: false,
    revalidateInterval: 86400000, // Check daily
  });

  if (!versionInfo?.updateAvailable) return null;

  return (
    <Alert>
      <h4>Update Available: v{versionInfo.latest}</h4>
      <p>{versionInfo.releaseNotes}</p>
      <div>
        <Button asChild><Link href={versionInfo.changelogUrl}>View Changelog</Link></Button>
        <Button variant="outline" onClick={dismiss}>Dismiss</Button>
      </div>
    </Alert>
  );
}
```

**Version Check API:**

```typescript
// app/api/version/check/route.ts
export async function GET() {
  // Fetch latest version from GitHub releases or static endpoint
  const latest = await fetch('https://api.github.com/repos/yuens1002/ecomm-ai-app/releases/latest');
  const release = await latest.json();

  return Response.json({
    current: APP_VERSION,
    latest: release.tag_name.replace('v', ''),
    updateAvailable: semver.gt(release.tag_name, APP_VERSION),
    releaseNotes: release.body,
    changelogUrl: release.html_url,
  });
}
```

**Tasks:**
- [ ] Create `/api/version/check` endpoint
- [ ] Create `UpdateBanner` component
- [ ] Add banner to admin layout
- [ ] Add dismiss logic with localStorage (7-day snooze)
- [ ] Document update process in SETUP.md

---

## Phase 2: Telemetry & Analytics (Post-Launch)

### 2.1 Anonymous Installation Tracking

**On First Run (seed completion):**

```typescript
// prisma/seed/telemetry.ts
async function reportInstallation() {
  if (process.env.DISABLE_TELEMETRY === 'true') return;

  const instanceId = await getOrCreateInstanceId();

  await fetch('https://telemetry.artisanroast.com/install', {
    method: 'POST',
    body: JSON.stringify({
      instanceId,
      version: APP_VERSION,
      edition: EDITION,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {}); // Silent fail - telemetry should never break install
}
```

### 2.2 Weekly Heartbeat (Aggregate Stats)

```typescript
// Cron job or edge function - runs weekly
async function sendHeartbeat() {
  if (process.env.DISABLE_TELEMETRY === 'true') return;

  const stats = await prisma.$transaction([
    prisma.product.count(),
    prisma.order.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.userActivity.count({ where: { type: 'AI_CHAT' } }),
  ]);

  await fetch('https://telemetry.artisanroast.com/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      instanceId: await getInstanceId(),
      version: APP_VERSION,
      stats: {
        products: stats[0],
        orders: stats[1],
        activeSubscriptions: stats[2],
        aiChatUsage: stats[3],
      },
    }),
  }).catch(() => {});
}
```

### 2.3 Telemetry Backend (Simple Start)

**Option A: Supabase (Quick)**
- Free tier handles initial volume
- Easy to query with SQL
- Can migrate later

**Option B: Simple JSON API**
- Store in GitHub Gist or S3
- Parse with scripts
- Zero cost

**Tasks:**
- [ ] Choose telemetry backend (Supabase recommended)
- [ ] Create telemetry API endpoints
- [ ] Add install event to seed script
- [ ] Create heartbeat cron/edge function
- [ ] Build internal dashboard to view stats
- [ ] Document telemetry in README (transparency)

---

## Phase 3: Pro Infrastructure Planning

### 3.1 Architecture: Vercel Per-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                    Artisan Roast Pro                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Joe's Coffee │  │ Bean Scene   │  │ Daily Grind  │      │
│  │   (Vercel)   │  │   (Vercel)   │  │   (Vercel)   │      │
│  │              │  │              │  │              │      │
│  │ joes.app     │  │ bean.app     │  │ daily.app    │      │
│  │ Neon DB      │  │ Neon DB      │  │ Neon DB      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │   Provisioning API     │                      │
│              │   (artisanroast.com)  │                      │
│              └───────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Per-Tenant Resources:**
- Vercel project (from template)
- Neon database (branched or separate)
- Stripe Connect account (for payments)
- Custom domain (CNAME to Vercel)

### 3.2 Provisioning Flow

```
Customer Signs Up
       │
       ▼
┌──────────────────┐
│ Collect Info     │
│ - Store name     │
│ - Email          │
│ - Subdomain      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Create Resources │
│ - Vercel project │
│ - Neon database  │
│ - Set env vars   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Deploy & Seed    │
│ - Build app      │
│ - Run migrations │
│ - Minimal seed   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Notify Customer  │
│ - Welcome email  │
│ - Login link     │
│ - Setup guide    │
└──────────────────┘
```

### 3.3 Pricing Model

**Cost Breakdown (per tenant/month):**

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Pro | ~$20 | Required for commercial use |
| Neon | $0-19 | Free tier often sufficient |
| Stripe | % per txn | Customer pays directly |
| Support | $5 (amortized) | Email support |
| **Total Cost** | **~$25-45** | |
| **Price to Customer** | **$50-90** | 2x markup |

**Proposed Tiers:**

| Tier | Price | Includes |
|------|-------|----------|
| **Starter** | $49/mo | 100 products, 500 orders/mo, email support |
| **Growth** | $99/mo | Unlimited products, 2000 orders/mo, priority support |
| **Scale** | $199/mo | Unlimited everything, custom domain, phone support |

**AI Costs:** Customer provides own API keys (Gemini, etc.) - keeps our costs predictable.

### 3.4 Custom Domains

**Implementation:**
1. Customer adds domain in Pro dashboard
2. We add domain to Vercel project via API
3. Customer updates DNS (CNAME to cname.vercel-dns.com)
4. Vercel handles SSL automatically

**Tasks (Future):**
- [ ] Vercel API integration for domain management
- [ ] Domain verification flow in admin
- [ ] DNS setup instructions component

---

## Phase 4: Pro Dashboard (Provisioning App)

### 4.1 Customer-Facing Dashboard

**URL:** app.artisanroast.com (or manage.artisanroast.com)

**Features:**
- Sign up / Login
- Store setup wizard
- Billing management (Stripe Customer Portal)
- Domain settings
- Support tickets
- Usage stats

### 4.2 Admin Dashboard (Internal)

**Features:**
- View all tenants
- Monitor health/uptime
- Manage deployments
- Handle support escalations
- Revenue reporting

### 4.3 Tech Stack for Pro Dashboard

| Component | Technology |
|-----------|------------|
| Framework | Next.js (same as main app) |
| Auth | Clerk or NextAuth |
| Database | Supabase or PlanetScale |
| Payments | Stripe Billing |
| Deployment | Vercel |

---

## Phase 5: Implementation Roadmap

### Stage 1: Foundation (Now → Launch)
**Timeline:** 2-3 weeks

- [x] One-click deploy
- [x] Demo mode
- [ ] Version management system
- [ ] Feature flags infrastructure
- [ ] Instance ID generation
- [ ] Update notification banner
- [ ] Basic telemetry (install + heartbeat)

### Stage 2: Community Growth (Launch → +3 months)
**Timeline:** 3 months post-launch

- [ ] Gather user feedback
- [ ] Fix bugs from real-world usage
- [ ] Build community (Discord/GitHub Discussions)
- [ ] Document common customizations
- [ ] Identify Pro feature candidates from feedback

### Stage 3: Pro MVP (Month 4-6)
**Timeline:** 3 months

- [ ] Provisioning API (Vercel + Neon)
- [ ] Pro dashboard MVP
- [ ] Stripe Billing integration
- [ ] Basic support system
- [ ] Custom domain support
- [ ] Beta with 5-10 paying customers

### Stage 4: Pro General Availability (Month 7+)
**Timeline:** Ongoing

- [ ] Public Pro launch
- [ ] Marketing push
- [ ] Scale infrastructure as needed
- [ ] Hire support if volume warrants
- [ ] Consider VPS migration if Vercel costs too high

---

## Data Portability (Ghost-Style Promise)

### Export Functionality

Every Artisan Roast user (Community or Pro) can export:

```
Export Package (.zip)
├── database/
│   ├── products.json
│   ├── categories.json
│   ├── orders.json (last 12 months)
│   ├── customers.json (hashed emails)
│   ├── pages.json
│   └── settings.json
├── media/
│   └── (all uploaded images)
└── README.md (import instructions)
```

### Pro → Self-Hosted Migration

1. Customer requests export in Pro dashboard
2. We generate export package
3. Customer downloads and deploys to own Vercel/server
4. Import script restores data
5. Customer updates DNS to new deployment
6. We delete their Pro instance after 30 days

**Trust Signal:** This is explicitly documented and easy. No vendor lock-in.

**Tasks:**
- [ ] Create `/api/admin/export` endpoint
- [ ] Build export UI in admin settings
- [ ] Create import script for self-hosted
- [ ] Document migration process

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Vercel costs spike | Monitor usage, migrate to VPS at threshold |
| Neon free tier limits | Upgrade or move to Supabase/self-hosted PG |
| Multi-tenant security | Strict tenant isolation, regular audits |
| Update breaks instances | Staged rollouts, easy rollback |

### Business Risks

| Risk | Mitigation |
|------|------------|
| No Pro customers | Community is the product; Pro is bonus |
| Support overwhelm | Good docs, community help, paid tiers only |
| Competition | Focus on coffee niche, AI differentiation |
| Churn | Export freedom builds trust, reduces churn anxiety |

---

## Success Metrics

### Community Edition

| Metric | Target (6 months) |
|--------|-------------------|
| GitHub Stars | 500+ |
| Active Installations | 100+ |
| Contributors | 10+ |
| Discord Members | 200+ |

### Pro Edition

| Metric | Target (12 months) |
|--------|-------------------|
| Paying Customers | 50+ |
| MRR | $2,500+ |
| Churn Rate | <5%/month |
| NPS Score | 50+ |

---

## Next Actions

### Immediate (This Week)
1. [ ] Create `lib/version.ts` with version constants
2. [ ] Create `lib/features.ts` with feature flag system
3. [ ] Add instance ID to seed script
4. [ ] Create basic `/api/version/check` endpoint

### Short-Term (This Month)
1. [ ] Build UpdateBanner component
2. [ ] Set up telemetry backend (Supabase)
3. [ ] Implement install + heartbeat telemetry
4. [ ] Launch open source (Product Hunt, Reddit, HN)

### Medium-Term (Next Quarter)
1. [ ] Gather community feedback
2. [ ] Start Pro dashboard planning
3. [ ] Prototype provisioning API
4. [ ] Find 5 beta customers for Pro

---

## Appendix: Ghost CMS Reference

### What Ghost Does Well
- Clear free vs Pro distinction
- Same codebase, feature-gated
- Excellent documentation
- Strong community
- Easy migration in both directions
- Transparent pricing

### What We Can Learn
- Don't gate too many features (community should be fully usable)
- Pro = convenience + support, not essential features
- Export functionality is a trust builder
- Community is marketing

### Ghost Features We'll Gate for Pro

| Feature | Community | Pro |
|---------|-----------|-----|
| Core e-commerce | ✅ | ✅ |
| AI assistant | ✅ | ✅ |
| Menu Builder | ✅ | ✅ |
| Subscriptions | ✅ | ✅ |
| Custom domain | ❌ | ✅ |
| Priority support | ❌ | ✅ |
| Auto-updates | ❌ | ✅ |
| Advanced analytics | ❌ | ✅ |
| White-label (remove branding) | ❌ | ✅ |
| Multi-store | ❌ | ✅ (future) |

---

*This document evolves as we learn. Update after each milestone.*
