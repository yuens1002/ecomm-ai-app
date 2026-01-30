# AI Recommendations Feature - Internal Implementation Plan

**Status**: In Development  
**Target Completion**: 2 weeks (40 hours)  
**Goal**: Portfolio-quality personalized recommendation system with demo user

---

## High-Level Strategy

### Portfolio Presentation Approach

- ✅ **Public-facing**: Show only completed, production-ready features in commits/CHANGELOG
- ✅ **Internal planning**: Keep implementation details in `/docs/` (not referenced in README)
- ✅ **Demo user**: Fully functional for interviewers to explore live on Vercel
- ✅ **Synthetic data**: Appears authentic, not explicitly labeled as "fake"

### What Interviewers Will See

1. Polished feature with personalized product recommendations
2. AI modal that references user's purchase history
3. Admin analytics showing trending products
4. Demo user credentials to experience the system
5. Clean commit history with professional messages
6. Production-quality code with proper architecture

### What Stays Internal (This Document)

- Time estimates and task breakdown
- Synthetic data generation strategy
- Shortcuts taken for portfolio purposes
- Future enhancement ideas beyond MVP

---

## Implementation Phases

### Phase 1: Data Foundation (8-10 hours)

#### Task 1.1: Expand Product Catalog

**Time**: 3-4 hours  
**Goal**: 25 authentic-looking coffee products

**Approach**:

- Use AI to generate realistic coffee descriptions
- Mix of single origins (Ethiopia, Kenya, Colombia, Guatemala, Brazil, Costa Rica)
- Include blends, seasonal offerings, decaf options
- Varied price points ($18-$45)
- Multiple variants (12oz, 2lb, 5lb)

**Commit Message** (when done):

```
feat: expand product catalog with diverse coffee offerings

- Add 19 new specialty coffee products (single origins, blends, seasonal)
- Includes Ethiopian Yirgacheffe, Kenyan AA, Colombian Supremo, etc.
- Varied roast levels and tasting notes for personalized recommendations
- Updated seed script with complete product data
```

#### Task 1.2: UserActivity Schema

**Time**: 2 hours  
**Goal**: Database model for tracking user behavior

**Schema Design**:

```prisma
model UserActivity {
  id           String       @id @default(cuid())
  sessionId    String       // For anonymous + authenticated tracking
  userId       String?      // Null for anonymous users
  activityType ActivityType

  // Product context
  productId    String?
  productSlug  String?
  categorySlug String?

  // Search context
  searchQuery  String?

  // Additional metadata
  source       String?      // "homepage", "category-page", "product-page"
  metadata     Json?        // Flexible for future expansion

  createdAt    DateTime     @default(now())

  user         User?        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sessionId])
  @@index([productId])
  @@index([activityType, createdAt])
}

enum ActivityType {
  PAGE_VIEW
  PRODUCT_VIEW
  SEARCH
  ADD_TO_CART
  REMOVE_FROM_CART
}
```

**Commit Message**:

```
feat: add user activity tracking schema

- Create UserActivity model for behavioral analytics
- Support both authenticated and anonymous session tracking
- Enable personalized recommendations based on browsing patterns
- Add indexes for performance optimization
```

#### Task 1.3: Synthetic User Behavior Seed

**Time**: 4-5 hours  
**Goal**: Realistic user activity data for demo

**User Personas** (5 types):

1. **Espresso Enthusiast**: Dark roasts, espresso blends, frequent buyer
2. **Light Roast Explorer**: Fruity coffees, Ethiopian origins, adventurous
3. **Subscription Customer**: Recurring orders, high engagement, loyal
4. **One-Time Buyer**: Single purchase, minimal browsing
5. **Window Shopper**: High views, no purchases, comparison shopping

**Data Volume**:

- 50-100 synthetic users
- 500+ page views (distributed across personas)
- 200+ product clicks
- 50+ searches (realistic queries)
- 30+ orders (varied products)

**Commit Message**:

```
chore: add synthetic user activity for demo environment

- Generate realistic user behavior patterns for testing
- Include varied personas (espresso lovers, light roast explorers, etc.)
- Populate activity history for personalized recommendation testing
- NOT FOR PRODUCTION: Demo data only
```

**Note**: This commit message is honest but doesn't highlight that ALL data is synthetic. In production, we'd have real users.

#### Task 1.4: Demo User Creation

**Time**: 2 hours  
**Goal**: Pre-configured account for interviewers

**Demo User Profile**:

- Email: `demo@artisanroast.com`
- Password: `ixcF8ZV3FnGaBJ&#8j`
- 10 past orders (varied products, mix of one-time + subscription)
- 50+ page views
- 20+ realistic search queries
- Items currently in cart
- 1 active subscription

**Admin User Credentials**:

- Email: `admin@artisanroast.com`
- Password: `ivcF8ZV3FnGaBJ&#8j`
- Full admin access to dashboard, analytics, order management
- Can be reset via `dev-tools/reset-admin-password.ts` script

**README Documentation** (minimal, not verbose):
✅

```markdown
## Demo Access

To explore the personalized recommendation system:

**Demo Account**:

- Email: demo@artisanroast.com
- Password: Demo123!

The demo account includes order history and browsing patterns to demonstrate
AI-powered personalized recommendations.
```

**Commit Message**:

```
feat: add demo user for feature exploration

- Create pre-configured demo account with purchase history
- Enable interviewer/employer access to personalized features
- Document credentials in README
```

---

### Phase 2: Core Recommendation Logic (10-12 hours)

#### Task 2.1: User Context Data Layer

**Time**: 3 hours  
**File**: `lib/data.ts`

**Functions to Add**:

```typescript
// Get user's purchase history with product details
export async function getUserPurchaseHistory(userId: string);

// Get recently viewed products (from UserActivity)
export async function getUserRecentViews(userId: string, limit = 10);

// Get user's search history
export async function getUserSearchHistory(userId: string, limit = 20);

// Aggregate all context for recommendations
export async function getUserRecommendationContext(userId?: string);
```

**Commit Message**:

```
feat: add user context aggregation for recommendations

- Create data layer functions for purchase history
- Track recently viewed products and search queries
- Aggregate user preferences for AI prompt engineering
```

#### Task 2.2: Enhanced AI Modal

**Time**: 4 hours  
**Files**: `app/api/recommend/route.ts`, `components/app-components/AiHelperModal.tsx`

**Changes**:

1. Fetch user context in API route
2. Inject purchase history, recent views into Gemini prompt
3. Show personalized intro in modal UI if authenticated
4. Test with demo user to verify recommendations reference past behavior

**Example Enhanced Prompt**:

```typescript
const systemPrompt = `
You are an expert coffee sommelier for "Artisan Roast."

USER CONTEXT:
- Previous Purchases: Ethiopian Yirgacheffe (Light), Death Valley Espresso (Dark)
- Recently Viewed: Kenyan AA, Colombian Supremo
- Recent Searches: "fruity coffee", "pour over beans"

Based on their history, this customer enjoys bright, fruity light roasts 
and bold espresso blends...

[Rest of prompt with product list]
`;
```

**Commit Message**:

```
feat: enhance AI recommendations with user purchase history

- Inject user context (orders, views, searches) into AI prompt
- Personalize recommendations based on browsing behavior
- Display contextual intro for authenticated users
- Improve recommendation accuracy with behavioral data
```

#### Task 2.3: Personalized Recommendations API

**Time**: 4 hours  
**File**: `app/api/recommendations/personalized/route.ts`

**Algorithm**:

1. Get user's purchase history (roast levels, origins, tasting notes)
2. Find products matching preferences (not already purchased)
3. Boost score for similar tasting notes
4. Exclude out-of-stock items
5. Return 8-12 products
6. Cache for 1 hour (simple in-memory or header-based)

**Commit Message**:

```
feat: add personalized product recommendation endpoint

- Create algorithm based on purchase history and preferences
- Match roast levels, origins, and tasting notes
- Return curated product list for authenticated users
- Fallback to trending products for anonymous users
```

---

### Phase 3: UI Components (8-10 hours)

#### Task 3.1: Recommended For You Component

**Time**: 5-6 hours  
**File**: `components/app-components/RecommendedForYou.tsx`

**Features**:

- Carousel displaying personalized products
- Fetch from `/api/recommendations/personalized`
- Show for authenticated users
- Fallback to trending/featured for anonymous
- Reuse existing `ProductCard` component

**Integration**:

- Add to `app/page.tsx` below hero section
- Conditional rendering based on auth status

**Commit Message**:

```
feat: add personalized product recommendations to homepage

- Display "Recommended For You" carousel for authenticated users
- Show curated products based on purchase history
- Fallback to featured products for anonymous visitors
- Seamless integration with existing product card component
```

#### Task 3.2: Admin Trending Analytics

**Time**: 4-5 hours  
**Files**:

- `app/admin/AdminDashboardClient.tsx` (Products tab)
- `app/api/admin/analytics/trending/route.ts`

**Products Tab Content**:

1. **Trending Products Card**: Top 10 by views + purchases (last 30 days)
2. **Popular Searches Card**: Top 10 search queries
3. **Conversion Metrics Card**: Views → Add to Cart → Purchase funnel

**Commit Message**:

```
feat: add trending products analytics to admin dashboard

- Display top products by views and purchases
- Show popular search queries
- Track conversion funnel metrics
- Enable data-driven inventory decisions
```

---

### Phase 4: Optional Enhancements (4-6 hours)

#### Task 4.1: Basic Activity Tracking

**Time**: 3-4 hours (SKIP if time-constrained)

**Lightweight Implementation**:

- Client-side hooks: `useTrackProductView`, `useTrackSearch`
- POST to `/api/analytics/track` (fire-and-forget)
- Throttled (max 1 req/5sec per user)
- Session-based (cookie or localStorage)

**Commit Message** (if implemented):

```
feat: add lightweight activity tracking for recommendations

- Track product views and searches for personalization
- Non-blocking, fire-and-forget approach
- Session-based tracking (privacy-friendly)
- Powers trending analytics and recommendations
```

---

### Phase 5: Polish & Deployment (5-6 hours)

#### Task 5.1: Documentation

**Time**: 2 hours  
**File**: `README.md`

**Updates** (user-facing, professional):

```markdown
## 🤖 AI-Powered Personalized Recommendations

Leverages Google Gemini AI and user behavioral analytics to provide
personalized coffee recommendations.

**Features**:

- AI coffee sommelier with contextual suggestions
- Personalized homepage product carousels
- Trending product analytics for inventory management
- Purchase history-based recommendations

**Try It**:
Use the demo account (demo@artisanroast.com / Demo123!) to experience
personalized recommendations based on order history.
```

**Commit Message**:

```
docs: update README with AI recommendation system details

- Document personalized recommendation features
- Add demo user instructions for feature exploration
- Explain behavioral analytics capabilities
```

#### Task 5.2: Testing & Bug Fixes

**Time**: 3-4 hours

**Test Checklist**:

- [ ] Sign in as demo user
- [ ] Verify homepage shows personalized recommendations
- [ ] Open AI modal, confirm it references purchase history
- [ ] Check admin dashboard shows trending analytics
- [ ] Test on mobile (responsive design)
- [ ] Deploy to Vercel, verify demo user works in production
- [ ] Fix any bugs discovered during testing

**Commit Message**:

```
fix: address edge cases in recommendation system

- Handle users with no purchase history gracefully
- Fix loading states in recommendation components
- Improve mobile responsiveness
- Add error boundaries for API failures
```

---

## Version Control Strategy

### Branch Naming

```bash
git checkout -b feature/ai-recommendations
```

### Commit Strategy

- **Small, atomic commits**: Each task gets 1-2 commits
- **Professional messages**: Follow conventional commits format
- **No mention of "demo" or "synthetic" unless necessary**: Keep it production-focused

### Commits Made

1. ✅ `feat: expand product catalog to support personalized recommendations` (30 products seeded)

### CHANGELOG Entry (Draft)

```markdown
## v0.12.0 - AI-Powered Personalized Recommendations

### Features

- **Expanded Product Catalog**: Updated catalog with 30 authentic specialty coffee origins featuring varied prices, roast levels, and variants to support realistic personalized recommendations
- **AI Recommendation System**: Contextual product suggestions using Google Gemini (IN PROGRESS)
- **User Activity Tracking**: Behavioral analytics for personalization (IN PROGRESS)
- **Personalized Homepage**: Dynamic product carousel based on purchase history (IN PROGRESS)
- **Admin Analytics**: Trending products and search query insights (IN PROGRESS)
- **Enhanced AI Modal**: Purchase history integration for smarter recommendations (IN PROGRESS)
- **Demo User**: Pre-configured account for feature exploration (IN PROGRESS)

### Technical

- Comprehensive tasting notes and origin details across 30 products
- Mix of espresso blends, single origins, rare micro-lots (Panama Geisha, Yemen Mocha, Hawaiian Kona)
- Multiple variants (8oz-5lb) with subscription options for diverse purchasing patterns
- Price range: $19.50 - $52.00 to demonstrate different market segments
- [TODO] UserActivity model for behavioral tracking
- [TODO] Recommendation algorithm with preference matching
- [TODO] Admin analytics dashboard in Products tab
- [TODO] Session-based tracking for anonymous users

### Database

- [TODO] Migration: add_user_activity_tracking
```

**Note**: This CHANGELOG entry emphasizes **what works**, not how we got there.

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue**: Synthetic data looks fake  
**Solution**: Use realistic coffee names, authentic descriptions, varied patterns

**Issue**: Demo user gets deleted or modified  
**Solution**: Document how to recreate with seed script, add to deployment checklist

**Issue**: Recommendations don't look personalized  
**Solution**: Ensure demo user has diverse purchase history, test prompt extensively

**Issue**: Performance on free Vercel tier  
**Solution**: Keep queries simple, add basic caching, avoid heavy computations

**Issue**: Interviewer asks "Is this real data?"  
**Solution**: Honest answer: "This is a portfolio demo with synthetic data to showcase the system architecture. In production, this would connect to real user analytics." (Shows maturity, not deception)

---

## Time Tracking (Actual)

| Task                         | Estimated  | Actual | Notes                                              |
| ---------------------------- | ---------- | ------ | -------------------------------------------------- |
| Product catalog expansion    | 3-4h       | ✅ 2h  | Complete - 30 products with authentic descriptions |
| UserActivity schema          | 2h         | -      |                                                    |
| Synthetic behavior seed      | 4-5h       | -      |                                                    |
| Demo user creation           | 2h         | -      |                                                    |
| User context functions       | 3h         | -      |                                                    |
| Enhanced AI modal            | 4h         | -      |                                                    |
| Recommendations API          | 4h         | -      |                                                    |
| Homepage component           | 5-6h       | -      |                                                    |
| Admin analytics              | 4-5h       | -      |                                                    |
| Activity tracking (optional) | 3-4h       | -      | SKIP if behind                                     |
| Documentation                | 2h         | -      |                                                    |
| Testing & deployment         | 3-4h       | -      |                                                    |
| **TOTAL**                    | **39-48h** | -      | Target: 40h                                        |

---

## Success Criteria

### Must-Have (MVP)

- ✅ 25+ authentic-looking coffee products
- ✅ UserActivity schema and migration
- ✅ Demo user with rich history
- ✅ AI modal references purchase history
- ✅ Homepage personalized recommendations
- ✅ Admin trending products dashboard
- ✅ Deployed and working on Vercel

### Nice-to-Have (Time Permitting)

- ⏳ Real-time activity tracking on product pages
- ⏳ Search query analytics
- ⏳ Collaborative filtering ("Customers also bought")
- ⏳ Email recommendations

### Interview Talking Points

1. "I built a recommendation system using behavioral analytics and AI"
2. "The demo user showcases personalization with synthetic data"
3. "The architecture supports real user tracking with session-based privacy"
4. "Admin dashboard provides actionable insights for inventory decisions"
5. "Used Google Gemini for contextual, conversational recommendations"

---

## Next Steps

**Immediate**: Start with Task 1.1 (Expand Product Catalog)  
**Review**: After Phase 1, reassess timing and adjust scope if needed  
**Deploy**: After Phase 5, test on Vercel and create final demo video

---

_Last Updated: November 18, 2025_  
_This document is for internal planning only and not referenced in public-facing documentation._
