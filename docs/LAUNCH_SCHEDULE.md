# Artisan Roast Launch Schedule

> **Purpose:** Master checklist for public launch. Reference this doc to avoid losing context.

**Target Launch:** TBD
**Last Updated:** January 29, 2026

---

## Phase 1: Pre-Launch Code (Must-Do Before Launch)

### Critical Path Items

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| One-click deploy + auto-seed | ✅ Done | P0 | SEED_ON_BUILD env var |
| Demo mode (banner + one-click login) | ✅ Done | P0 | NEXT_PUBLIC_DEMO_MODE |
| OG/Twitter meta tags | ✅ Done | P0 | SEO ready |
| Sitemap + robots.txt | ✅ Done | P0 | SEO ready |
| Prisma seed config fix | ✅ Done | P0 | `npx prisma db seed` works |

### Should-Do Before Launch

| Item | Status | Priority | Backlog Ref | Notes |
|------|--------|----------|-------------|-------|
| Fix Analytics Product Links | TODO | P1 | BACKLOG.md | Merch links broken |
| AI Assist Test Coverage | TODO | P1 | BACKLOG.md | API + hook + E2E smoke |
| Hardcoded Values Re-audit | TODO | P1 | BACKLOG.md | Check for "Artisan Roast" strings |
| Failed Order Handling | TODO | P2 | BACKLOG.md | FAILED status + email |
| Admin Profile Management | TODO | P2 | BACKLOG.md | Edit name/email/password |

### Nice-to-Have (Can Ship Without)

| Item | Status | Priority | Backlog Ref |
|------|--------|----------|-------------|
| AdminPageHeader Component | TODO | P3 | BACKLOG.md |
| Reciprocal Add-Ons | TODO | P3 | BACKLOG.md |
| Server Actions Refactor | TODO | P3 | BACKLOG.md |
| Persist AI Wizard Answers | TODO | P3 | BACKLOG.md |
| Category Purchase Options UI | TODO | P3 | BACKLOG.md |

---

## Phase 2: Upgrade Path & Versioning

### The Problem
Self-hosted users need a way to update their installations when we release new features/fixes.

### Proposed Solution: VS Code-Style Updates

**How VS Code Does It:**
- App checks for updates on startup
- Shows notification: "Update available (v0.76.0)"
- User clicks to download/install
- Seamless update preserving settings

**Our Implementation:**

#### 2.1 Version Check API

```
GET https://api.artisanroast.com/version/latest
Response: { version: "0.76.0", releaseNotes: "...", downloadUrl: "..." }
```

- Self-hosted instances call this on admin login
- Compare against local `package.json` version
- Show banner if update available

#### 2.2 Update Notification Component

```tsx
// components/admin/UpdateBanner.tsx
"New version available (v0.76.0) - View changelog"
[Update Now] [Dismiss]
```

- Only shows for admin users
- Dismissible with 24h snooze
- Links to GitHub releases page

#### 2.3 Update Methods (User Choice)

| Method | Audience | How |
|--------|----------|-----|
| **Git Pull** | Technical users | `git pull && npm install && npm run build` |
| **Vercel Redeploy** | Vercel users | Click redeploy in dashboard |
| **Download Release** | Non-git users | Download zip from GitHub releases |

#### 2.4 Migration Handling

- Prisma migrations run automatically on build (`build-resilient.js`)
- Breaking changes documented in CHANGELOG.md
- Major version bumps = manual review required

### Tasks

- [ ] Create version check API endpoint (can be static JSON on GitHub Pages initially)
- [ ] Create `UpdateBanner` component for admin dashboard
- [ ] Add version check on admin layout mount
- [ ] Document update process in SETUP.md
- [ ] Create GitHub release workflow (auto-create releases from tags)

---

## Phase 3: Telemetry & Analytics

### Goals
- Track app installations (how many people deploy)
- Track feature usage (which features are popular)
- Identify issues before users report them
- **Privacy-first**: No PII, opt-out available, transparent

### 3.1 Installation Tracking (Anonymous)

**On First Deploy:**
```
POST https://telemetry.artisanroast.com/install
{
  instanceId: "uuid-generated-on-first-run",
  version: "0.76.0",
  platform: "vercel" | "railway" | "self-hosted",
  nodeVersion: "20.x",
  dbProvider: "neon" | "supabase" | "other"
}
```

- Generate unique `instanceId` on first seed (store in SiteSettings)
- No IP logging, no PII
- Opt-out via `DISABLE_TELEMETRY=true` env var

### 3.2 Feature Usage (Anonymous)

**Weekly Heartbeat:**
```
POST https://telemetry.artisanroast.com/heartbeat
{
  instanceId: "...",
  version: "0.76.0",
  stats: {
    productCount: 42,
    orderCount: 150,
    activeSubscriptions: 12,
    aiChatUsage: 87,
    menuBuilderUsed: true,
    pagesCmsUsed: true
  }
}
```

- Aggregate counts only, no order details
- Helps prioritize features
- Shows which features are actually used

### 3.3 Error Reporting (Opt-In)

**On Unhandled Error:**
```
POST https://telemetry.artisanroast.com/error
{
  instanceId: "...",
  version: "0.76.0",
  error: "TypeError: Cannot read property...",
  stack: "...",
  context: { route: "/admin/products", action: "create" }
}
```

- Requires explicit opt-in: `ENABLE_ERROR_REPORTING=true`
- Sanitize any potential PII from stack traces
- Helps fix bugs proactively

### 3.4 Privacy Controls

```env
# .env.example additions
DISABLE_TELEMETRY=false          # Set to true to disable all telemetry
ENABLE_ERROR_REPORTING=false     # Set to true to send error reports
```

- Document in README and SETUP.md
- Show telemetry status in admin settings
- Provide "What we collect" link

### Tasks

- [ ] Design telemetry API (can start with simple Supabase table)
- [ ] Create `lib/telemetry.ts` with send functions
- [ ] Add install event to seed script
- [ ] Add weekly heartbeat cron/edge function
- [ ] Add opt-in error boundary wrapper
- [ ] Document telemetry in README
- [ ] Create telemetry dashboard (internal)

---

## Phase 4: Marketing & Launch

### Content Ready (from docs/marketing/)

| Asset | Status | File |
|-------|--------|------|
| Product Hunt post | ✅ Ready | `launch-posts.md` |
| r/selfhosted post | ✅ Ready | `launch-posts.md` |
| Hacker News Show HN | ✅ Ready | `launch-posts.md` |
| Twitter/X thread | ✅ Ready | `launch-posts.md` |
| LinkedIn post | ✅ Ready | `launch-posts.md` |
| Video script (2min) | ✅ Ready | `video-script.md` |
| Outreach templates | ✅ Ready | `outreach-list.md` |

### Content Needed

| Asset | Status | Notes |
|-------|--------|-------|
| Hero screenshot/GIF | TODO | README has placeholder |
| Product video | TODO | Need to record |
| 10 roaster targets | TODO | Research needed |

### Launch Sequence

**T-7 Days:**
- [ ] Record product video (2min + 60s + 30s cuts)
- [ ] Create hero GIF for README
- [ ] Research and fill outreach-list.md with 10 roasters
- [ ] Start engaging with roasters on social (no pitch yet)

**T-3 Days:**
- [ ] Schedule Product Hunt launch
- [ ] Prep all social posts in scheduler
- [ ] Send outreach DMs to roasters (free setup offer)
- [ ] Final code review / bug sweep

**Launch Day (T-0):**
- [ ] Post to Product Hunt (early AM)
- [ ] Post to r/selfhosted
- [ ] Post Show HN
- [ ] Twitter thread
- [ ] LinkedIn post
- [ ] Monitor and respond to comments

**T+7 Days:**
- [ ] Follow up with interested roasters
- [ ] Collect feedback from early users
- [ ] Plan next sprint based on feedback

---

## Phase 5: Post-Launch

### Immediate (Week 1)
- Monitor error reports (if telemetry enabled)
- Respond to GitHub issues
- Fix critical bugs
- Collect user feedback

### Short-Term (Month 1)
- Ship most-requested features
- Improve documentation based on questions
- Build hosted version waitlist
- Start on Omni-Roast vision (hardware integration)

### Medium-Term (Quarter 1)
- Hosted/managed version beta
- Multi-store support
- Inventory management
- Mobile app consideration

---

## Quick Reference

### Environment Variables for Launch

```env
# Required for all deployments
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
NEXT_PUBLIC_APP_URL=...

# Demo mode (for demo.artisanroast.com)
NEXT_PUBLIC_DEMO_MODE=true

# One-click deploy seeding
SEED_ON_BUILD=true

# Telemetry (future)
DISABLE_TELEMETRY=false
ENABLE_ERROR_REPORTING=false
```

### Key Commands

```bash
npm run dev           # Local development
npm run build         # Production build
npm run seed          # Seed database
npm run test          # Run tests
npm run precheck      # TypeScript + ESLint
```

### Important URLs

- **Live Demo:** https://ecomm-ai-app.vercel.app/
- **GitHub:** https://github.com/yuens1002/ecomm-ai-app
- **Setup Guide:** SETUP.md
- **Backlog:** BACKLOG.md
- **Marketing Assets:** docs/marketing/

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-29 | VS Code-style updates | Simple, user-friendly, no forced updates |
| 2026-01-29 | Anonymous telemetry | Need data to prioritize, privacy-first |
| 2026-01-29 | Opt-in error reporting | Respect user privacy, still get bug info |
| 2026-01-29 | SEED_ON_BUILD for one-click | New users shouldn't see empty store |

---

*This document is the source of truth for launch planning. Update it as decisions are made.*
