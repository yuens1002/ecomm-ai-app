# AI Recommendations Feature Testing Checklist

## 🎯 Test Environment Setup

- [ ] Database seeded with 30 products
- [ ] Synthetic user data generated (75 users + activities)
- [ ] Demo user created with behavioral history
- [ ] Dev server running (`npm run dev`)
- [ ] No console errors on page load

---

## 1️⃣ Product Search Feature

### Search Functionality

- [ ] **Desktop Search Dialog**
  - [ ] Click search icon in header opens dialog
  - [ ] Dialog displays title "Search Products"
  - [ ] Input field autofocuses
  - [ ] Placeholder text visible: "Try 'Ethiopian' or 'fruity'..."
  - [ ] Press Enter submits search
  - [ ] Dialog closes after submission

- [ ] **Mobile Search**
  - [ ] Search button visible in mobile menu
  - [ ] Tapping opens search page directly
  - [ ] Search input works on mobile viewport

- [ ] **Search Results**
  - [ ] Search for "Ethiopian" returns relevant products
  - [ ] Search for "fruity" matches tasting notes
  - [ ] Search for "light" matches roast level
  - [ ] Search for "Colombia" matches origin
  - [ ] Results display with product cards
  - [ ] Result count accurate (e.g., "Found 3 results for...")
  - [ ] Empty state shows for no results
  - [ ] Can navigate to product details from results

- [ ] **Activity Tracking**
  - [ ] Search logged to database (check UserActivity table)
  - [ ] SessionId generated and persisted
  - [ ] Search appears in admin analytics dashboard

---

## 2️⃣ Homepage Recommendations

### Anonymous User Experience

- [ ] **Trending Products Section**
  - [ ] Section displays with "Trending Now" heading
  - [ ] Shows TrendingUp icon (not Sparkles)
  - [ ] Displays 6 product cards
  - [ ] No user preference subtitle shown
  - [ ] Products match most-viewed from analytics
  - [ ] All product cards clickable
  - [ ] Loading skeleton displays initially

### Authenticated User Experience

- [ ] **Login as Demo User**
  - [ ] Navigate to `/auth/signin`
  - [ ] Sign in with demo credentials
  - [ ] Redirected to homepage

- [ ] **Personalized Recommendations**
  - [ ] Section heading changes to "Recommended For You"
  - [ ] Shows Sparkles icon (not TrendingUp)
  - [ ] Displays user preference subtitle (e.g., "Based on your love for light roasts with berry and citrus notes")
  - [ ] Shows 6 recommended products
  - [ ] Recommendations differ from trending (personalized)
  - [ ] Products align with demo user's roast preference (light roasts)
  - [ ] Products match demo user's tasting note preferences (fruity/floral)

- [ ] **Responsive Design**
  - [ ] Mobile: 1 column grid
  - [ ] Tablet: 2 column grid
  - [ ] Desktop: 3 column grid

---

## 3️⃣ AI Helper Modal Personalization

### Anonymous User

- [ ] **Open AI Modal**
  - [ ] Click "Ask AI for Help" button
  - [ ] Modal opens with chat interface
  - [ ] No personalization badge visible
  - [ ] AI provides generic recommendations

- [ ] **Test Generic Recommendations**
  - [ ] Ask: "Recommend a coffee for me"
  - [ ] AI responds with general suggestions
  - [ ] No mention of purchase history or preferences

### Authenticated User (Demo Account)

- [ ] **Personalization Badge**
  - [ ] Green badge displays: "Personalized Based on Your History"
  - [ ] Checkmark SVG icon visible
  - [ ] Shows stats: "10 past orders • Prefers light roasts" (or similar)

- [ ] **Test Personalized Recommendations**
  - [ ] Ask: "What coffee should I try next?"
  - [ ] AI response references demo user's history
  - [ ] AI mentions light roast preference
  - [ ] AI suggests coffees with fruity/floral notes
  - [ ] Recommendations align with past purchases

- [ ] **Context Injection**
  - [ ] Response quality better than anonymous user
  - [ ] AI aware of products already purchased
  - [ ] AI suggests complementary profiles

---

## 4️⃣ Admin Analytics Dashboard

### Access Control

- [ ] **Unauthenticated Access**
  - [ ] Navigate to `/admin/analytics`
  - [ ] Redirected to sign-in page

- [ ] **Non-Admin User**
  - [ ] Sign in as regular user
  - [ ] Navigate to `/admin/analytics`
  - [ ] Receives 403 Forbidden or redirected

- [ ] **Admin User Access**
  - [ ] Sign in as admin user
  - [ ] Navigate to `/admin`
  - [ ] "Analytics" card visible in Quick Actions
  - [ ] Click "Analytics" card
  - [ ] Dashboard loads successfully

### Dashboard Functionality

- [ ] **Period Selection**
  - [ ] "7 Days" button selected by default
  - [ ] Click "30 Days" button changes data
  - [ ] URL updates with query parameter
  - [ ] Data refreshes correctly

- [ ] **Metrics Overview Cards**
  - [ ] Product Views shows total with icon
  - [ ] Add to Cart shows total with icon
  - [ ] Orders shows total with icon
  - [ ] Conversion Rate shows percentage (view→order)
  - [ ] All metrics display "Last 7 days" (or selected period)

- [ ] **Trending Products Table**
  - [ ] Shows top 8 products (or fewer if less data)
  - [ ] Displays rank (#1, #2, etc.)
  - [ ] Product names are clickable links
  - [ ] Shows roast level for each product
  - [ ] View counts displayed with eye icon
  - [ ] Products ordered by view count (descending)

- [ ] **Top Search Queries**
  - [ ] Shows top 8 searches (or fewer)
  - [ ] Displays rank (#1, #2, etc.)
  - [ ] Queries wrapped in quotes
  - [ ] Shows frequency count (e.g., "5×")
  - [ ] Ordered by frequency (descending)
  - [ ] Empty state message if no searches

- [ ] **Daily Activity Trend**
  - [ ] Bar chart displays for selected period
  - [ ] Dates formatted correctly (e.g., "Nov 16")
  - [ ] Bar widths proportional to activity count
  - [ ] Activity counts displayed on right
  - [ ] Most recent day at bottom (chronological order)

- [ ] **Activity Breakdown**
  - [ ] Shows 5 activity type cards
  - [ ] Displays: PAGE_VIEW, PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART
  - [ ] Each card shows count
  - [ ] Labels formatted (spaces instead of underscores)
  - [ ] Responsive grid (2 cols mobile, 5 cols desktop)

- [ ] **Navigation**
  - [ ] Back arrow returns to `/admin`
  - [ ] Admin menu still accessible
  - [ ] Can navigate to other admin pages

### Data Accuracy

- [ ] **Cross-Reference with Database**
  - [ ] Run: `SELECT activityType, COUNT(*) FROM "UserActivity" GROUP BY activityType;`
  - [ ] Counts match Activity Breakdown
  - [ ] Trending products match `SELECT productId, COUNT(*) FROM "UserActivity" WHERE activityType='PRODUCT_VIEW' GROUP BY productId ORDER BY COUNT(*) DESC LIMIT 10;`

- [ ] **Real-Time Updates**
  - [ ] Perform a search on the site
  - [ ] Refresh analytics dashboard
  - [ ] Search appears in top queries
  - [ ] Activity breakdown updates

---

## 5️⃣ User Behavior Tracking

### Activity Logging

- [ ] **Search Activity**
  - [ ] Search for a product
  - [ ] Check database: `SELECT * FROM "UserActivity" WHERE activityType='SEARCH' ORDER BY createdAt DESC LIMIT 1;`
  - [ ] Verify: sessionId, searchQuery, timestamp

- [ ] **Product View** (if implemented)
  - [ ] Visit a product page
  - [ ] Check database for PRODUCT_VIEW record
  - [ ] Verify productId matches visited product

- [ ] **Session Persistence**
  - [ ] Open browser DevTools → Application → Session Storage
  - [ ] Verify `artisan_session_id` exists
  - [ ] Close browser and reopen
  - [ ] SessionId should persist in sessionStorage

### Data Functions

- [ ] **getUserRecommendationContext**
  - [ ] Sign in as demo user
  - [ ] Open AI modal (triggers context fetch)
  - [ ] Check browser Network tab for `/api/recommend` call
  - [ ] Response includes `userContext` with `totalOrders` and `preferredRoastLevel`

---

## 6️⃣ Edge Cases & Error Handling

### Search Edge Cases

- [ ] Empty search query returns gracefully
- [ ] Special characters in search (e.g., "caf\u00e9")
- [ ] Very long search queries (100+ characters)
- [ ] Search with no results shows empty state
- [ ] Network error displays error message

### Recommendations Edge Cases

- [ ] New user with no history shows trending products
- [ ] User with only one order gets recommendations
- [ ] All recommended products in cart (check fallback)
- [ ] API timeout shows error state

### Analytics Edge Cases

- [ ] No data in selected period shows zero states
- [ ] Admin with no UserActivity records
- [ ] Period change while data loading
- [ ] Very large activity counts (formatting)

---

## 7️⃣ Performance & UX

### Loading States

- [ ] Homepage recommendations show skeleton (animate-pulse)
- [ ] Search results show loading spinner
- [ ] AI modal shows "..." while thinking
- [ ] Analytics dashboard shows loader on period change

### Responsive Design

- [ ] Test all pages at 375px (mobile)
- [ ] Test all pages at 768px (tablet)
- [ ] Test all pages at 1440px (desktop)
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets ≥44px on mobile

### Accessibility

- [ ] Search dialog has proper focus trap
- [ ] Can navigate recommendations with keyboard (Tab)
- [ ] Screen reader announces search results count
- [ ] All icons have `sr-only` labels
- [ ] Color contrast meets WCAG AA standards

---

## 8️⃣ Integration Testing

### End-to-End User Flow

- [ ] **Anonymous User Journey**
  1. Visit homepage
  2. See "Trending Now" recommendations
  3. Search for "Ethiopian"
  4. View search results
  5. Click a product
  6. Open AI modal (generic recommendations)
  7. Add to cart
  8. Checkout as guest

- [ ] **Demo User Journey**
  1. Sign in with demo credentials
  2. Homepage shows "Recommended For You"
  3. Open AI modal (personalized badge visible)
  4. Ask AI for recommendation
  5. Search for a product
  6. View analytics dashboard (if admin)
  7. Verify search appears in analytics
  8. Sign out

### Cross-Feature Integration

- [ ] Search tracking appears in admin analytics
- [ ] Product views from recommendations logged
- [ ] AI recommendations align with homepage recommendations
- [ ] Demo user preferences consistent across all features

---

## 9️⃣ Database Integrity

### Schema Validation

- [ ] UserActivity table exists
- [ ] ActivityType enum has 5 values
- [ ] Indexes created on userId, sessionId, productId, activityType
- [ ] Foreign key to User is nullable (supports anonymous)

### Data Quality

- [ ] No orphaned activities (productId references valid products)
- [ ] SessionIds follow expected format
- [ ] Timestamps are accurate (UTC)
- [ ] No duplicate activities within same second for same session

---

## 🔟 Production Readiness

### Environment Variables

- [ ] GEMINI_API_KEY configured
- [ ] DATABASE_URL configured (pooled connection)
- [ ] DIRECT_URL configured (direct connection)
- [ ] All required env vars in Vercel dashboard

### Security

- [ ] Admin routes protected (authentication + authorization)
- [ ] API endpoints validate user permissions
- [ ] No sensitive data in client-side logs
- [ ] Rate limiting considered for AI endpoints

### Monitoring

- [ ] Error boundaries catch React errors
- [ ] API errors logged to console with context
- [ ] 404 pages for invalid routes
- [ ] Webhook errors logged (if applicable)

---

## ✅ Sign-Off Checklist

- [ ] All critical tests passing
- [ ] No console errors in production build
- [ ] Mobile experience polished
- [ ] Demo user can showcase all features
- [ ] Documentation updated (README, CHANGELOG)
- [ ] Feature branch ready for merge
- [ ] Deployment plan reviewed
