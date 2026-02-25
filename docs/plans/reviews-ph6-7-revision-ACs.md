# Reviews Ph6-7 Revision — AC Verification Report

**Branch:** `feat/reviews-ph6-7`
**Commits:** 0
**Iterations:** 0

---

## Column Definitions

| Column | Filled by | When |
|--------|-----------|------|
| **Agent** | Verification sub-agent | During `/ac-verify` — PASS/FAIL with brief evidence |
| **QC** | Main thread agent | After reading sub-agent report — confirms or overrides |
| **Reviewer** | Human (reviewer) | During manual review — final approval per AC |

---

## UI Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-UI-1 | FLAGGED review on storefront shows flag reason banner | Static: product page with a flagged review | Yellow/amber banner with flag reason text visible on ReviewCard | | | |
| AC-UI-2 | Admin response shown on storefront ReviewCard | Static: product page with review that has adminResponse | "Store Response" section rendered below review content | | | |
| AC-UI-3 | Profanity censored in storefront review content | Static: product page with review containing profanity | Profanity words replaced with asterisks (e.g., "f***") | | | |
| AC-UI-4 | Admin reviews page: Pending tab replaces Removed tab | Static: `/admin/reviews` at 1440px | Tabs: All / Published / Flagged / Pending. No "Removed" tab | | | |
| AC-UI-5 | PENDING review shows Approve + Flag + Delete actions | Interactive: click actions on a PENDING review | Three actions visible in context menu | | | |
| AC-UI-6 | FLAGGED review shows Approve + Delete actions | Interactive: click actions on a FLAGGED review | Two actions visible (Approve returns to PUBLISHED) | | | |
| AC-UI-7 | Reply dialog opens from any review's action menu | Interactive: click Reply on a PUBLISHED review | Dialog with textarea for admin response + Save button | | | |
| AC-UI-8 | PENDING status badge uses distinct color | Static: admin reviews with PENDING review visible | Badge uses blue/indigo color (distinct from PUBLISHED green, FLAGGED amber) | | | |
| AC-UI-9 | Nav dot indicator when unread reviews exist | Static: admin page after new review created | Small dot on Reviews nav item in both desktop More dropdown and mobile drawer | | | |
| AC-UI-10 | Commerce settings has review notification toggle | Static: `/admin/settings/commerce` | Toggle for "Email on new review" visible | | | |

## Functional Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-FN-1 | ReviewStatus enum: PUBLISHED, FLAGGED, PENDING (no REMOVED) | Code review: `prisma/schema.prisma` | Enum has exactly 3 values, REMOVED gone, PENDING added | | | |
| AC-FN-2 | adminResponse field on Review model | Code review: `prisma/schema.prisma` | `adminResponse String?` on Review | | | |
| AC-FN-3 | reviewsLastViewedAt on User model | Code review: `prisma/schema.prisma` | `reviewsLastViewedAt DateTime?` on User | | | |
| AC-FN-4 | Migration handles REMOVED→delete safely | Code review: migration SQL | Deletes REMOVED reviews, recreates enum without REMOVED, adds PENDING | | | |
| AC-FN-5 | Admin PATCH supports flag/approve/reply (no remove/restore) | Code review: `app/api/admin/reviews/[reviewId]/route.ts` | Zod schema: `action: z.enum(["flag", "approve", "reply"])` | | | |
| AC-FN-6 | Storefront query includes FLAGGED reviews | Code review: `app/api/reviews/[productId]/route.ts` | WHERE includes `status: { in: ["PUBLISHED", "FLAGGED"] }` | | | |
| AC-FN-7 | Rating aggregation includes FLAGGED | Code review: `lib/reviews/review-helpers.ts` | `where: { status: { in: ["PUBLISHED", "FLAGGED"] } }` | | | |
| AC-FN-8 | Spam detector flags suspicious reviews | Code review: `lib/reviews/spam-detector.ts` + tests | Heuristic checks (all caps, repeated chars, URL spam, etc.) return risk score | | | |
| AC-FN-9 | Review submission queues spam/profanity as PENDING | Code review: `app/(site)/products/[slug]/review-actions.ts` | Profanity or spam detected → `status: "PENDING"` instead of rejecting | | | |
| AC-FN-10 | censorText() replaces profanity with asterisks | Code review: `lib/reviews/profanity-filter.ts` + tests | `censorText("what the fuck")` → `"what the f***"` | | | |
| AC-FN-11 | Unread count endpoint works | Code review: `app/api/admin/reviews/unread/route.ts` | Returns count of reviews created after admin's `reviewsLastViewedAt` | | | |
| AC-FN-12 | Mark-read endpoint updates timestamp | Code review: `app/api/admin/reviews/mark-read/route.ts` | Updates current admin's `reviewsLastViewedAt` to now | | | |
| AC-FN-13 | Review notification email fires on new review | Code review: `review-actions.ts` → email function | Fire-and-forget call when notifyOnNewReview setting enabled | | | |

## Regression Acceptance Criteria

| AC | What | How | Pass | Agent | QC | Reviewer |
|----|------|-----|------|-------|-----|----------|
| AC-REG-1 | Tests pass | `npm run test:ci` | All tests green, no regressions | | | |
| AC-REG-2 | Precheck clean | via pre-commit hook | No TS/ESLint errors | | | |
| AC-REG-3 | Customer review pages unaffected | Screenshot: product page with reviews | Reviews section renders normally | | | |
| AC-REG-4 | Admin products table unaffected | Screenshot: `/admin/products` | Table renders, filters work | | | |

---

## Agent Notes

{Sub-agent writes iteration-specific notes here.}

## QC Notes

{Main thread writes fix notes here.}

## Reviewer Feedback

{Human writes review feedback here. Items marked for revision go back into the iteration loop.}
