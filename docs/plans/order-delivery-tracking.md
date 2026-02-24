# Order Delivered Status + Automated Carrier Tracking — Plan

**Branch:** `feat/order-delivery-tracking`
**Base:** `main`

---

## Context

The feature-gap-analysis lists "order notification emails" as a Tier 1 gap. Investigation reveals emails are mostly complete (confirmation, shipped, pickup, failed). The real gaps:

1. **No DELIVERED status** — lifecycle stops at SHIPPED
2. **No automated delivery detection** — admin shouldn't manually track and mark delivered
3. **No shipment tracking UI on orders list** — customers must drill into detail page
4. **No visual shipment timeline** — no event history for orders

Solution: Add DELIVERED status, carrier API integrations that automatically detect delivery, admin settings for carrier API keys, and customer-facing shipment status UI.

---

## Commit Schedule

| # | Message | Risk |
|---|---------|------|
| 0 | `docs: add plan for order-delivery-tracking` | — |
| 1 | `feat: add DELIVERED status and carrier tracking infrastructure` | Low |
| 2 | `feat: add admin carrier settings and delivery cron` | Medium |
| 3 | `feat: add customer shipment status UI and admin deliver action` | Low |

---

## Acceptance Criteria

### UI (verified by screenshots)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | DELIVERED badge color (blue) | Static: visit orders list with a DELIVERED order | Badge shows blue background with "Delivered" text |
| AC-UI-2 | Admin carrier settings page | Interactive: navigate to Admin > Settings > Shipping | Page shows input fields for USPS, UPS, FedEx, DHL API keys with "Test Connection" buttons |
| AC-UI-3 | Admin "Mark as Delivered" action | Interactive: view SHIPPED order in admin orders | RecordActionMenu shows "Mark as Delivered" and "Track Package" actions |
| AC-UI-4 | Admin delivery confirm dialog | Interactive: click "Mark as Delivered" on a SHIPPED order | Confirmation dialog appears with order number |
| AC-UI-5 | Customer Shipment Status dialog | Interactive: click "Shipment Status" on a SHIPPED/DELIVERED order | Vertical timeline dialog shows Order Placed, Shipped, and Delivered steps with timestamps |
| AC-UI-6 | Customer orders list actions | Interactive: view SHIPPED/DELIVERED order actions on customer orders page | RecordActionMenu shows "Track Package" and "Shipment Status" actions |
| AC-UI-7 | Order detail DELIVERED display | Static: visit order detail page for a DELIVERED order | Shows blue DELIVERED badge, tracking info, and deliveredAt timestamp |
| AC-UI-8 | Completed tab includes DELIVERED | Interactive: click "Completed" tab on admin and customer orders pages | DELIVERED orders appear alongside SHIPPED and PICKED_UP |

### Functional (verified by code review)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | Prisma schema DELIVERED enum | Code review: `prisma/schema.prisma` | `DELIVERED` exists in `OrderStatus` enum after `SHIPPED`; `deliveredAt DateTime?` on Order model |
| AC-FN-2 | Carrier API key settings CRUD | Code review: `app/api/admin/settings/carriers/route.ts` | GET returns masked keys, PUT validates with Zod and upserts; requires `requireAdminApi()` |
| AC-FN-3 | Carrier tracking clients | Code review: `lib/services/carriers/*.ts` | Each carrier implements `CarrierClient` interface; factory returns correct client; error handling returns `{ status: "error" }` |
| AC-FN-4 | Delivery cron logic | Code review: `app/api/cron/check-deliveries/route.ts` | Queries SHIPPED orders with trackingNumber, calls carrier APIs, updates to DELIVERED, sends email; processes in chunks of 10 |
| AC-FN-5 | Manual deliver API route | Code review: `app/api/admin/orders/[orderId]/deliver/route.ts` | Validates order is SHIPPED, updates to DELIVERED with deliveredAt, sends DeliveryConfirmationEmail; mirrors ship route pattern |
| AC-FN-6 | DeliveryConfirmationEmail | Code review: `emails/DeliveryConfirmationEmail.tsx` | Mirrors ShipmentConfirmationEmail pattern; shows order number, delivery date, View Order CTA |
| AC-FN-7 | User orders API completed filter | Code review: `app/api/user/orders/route.ts` | "completed" filter includes `OrderStatus.DELIVERED` alongside SHIPPED and PICKED_UP |
| AC-FN-8 | Navigation route registered | Code review: `lib/navigation/route-registry.ts` | `admin.settings.shipping` route entry exists under `admin.settings` parent |
| AC-FN-9 | Vercel cron config | Code review: `vercel.json` | `/api/cron/check-deliveries` with `"0 * * * *"` schedule alongside existing heartbeat |
| AC-FN-10 | Shared tracking URL utility | Code review: `app/(site)/_components/account/tracking-utils.ts` | `getTrackingUrl` function exported and used by both order detail and dialog |

### Regression (verified by test suite + spot-check)

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | TypeScript + ESLint clean | Test run: `npm run precheck` | Zero errors |
| AC-REG-2 | Existing tests pass | Test run: `npm run test:ci` | All tests pass, no new failures |
| AC-REG-3 | Existing order flows intact | Screenshot: admin orders page, customer orders page | PENDING/SHIPPED/PICKED_UP/CANCELLED/FAILED orders display as before |
| AC-REG-4 | Ship order flow unchanged | Code review: `app/api/admin/orders/[orderId]/ship/route.ts` | Ship route unmodified or only additive changes |

---

## Implementation Details

### Commit 1: Schema + Carrier Infrastructure

**Files:**
- `prisma/schema.prisma` — Add DELIVERED to enum, deliveredAt to Order
- `lib/types.ts` — Add deliveredAt to OrderWithItems
- `components/shared/record-utils.ts` — DELIVERED status color (blue) and label
- `lib/services/carriers/types.ts` — CarrierClient interface
- `lib/services/carriers/usps.ts` — USPS WebTools client
- `lib/services/carriers/ups.ts` — UPS OAuth2 client
- `lib/services/carriers/fedex.ts` — FedEx OAuth2 client
- `lib/services/carriers/dhl.ts` — DHL API key client
- `lib/services/carriers/index.ts` — Factory function
- `emails/DeliveryConfirmationEmail.tsx` — Email template

### Commit 2: Admin Settings + Cron

**Files:**
- `app/admin/settings/shipping/page.tsx` — Carrier API key settings page
- `app/api/admin/settings/carriers/route.ts` — Settings CRUD route
- `lib/navigation/route-registry.ts` — Add shipping settings route
- `app/api/cron/check-deliveries/route.ts` — Hourly delivery check
- `vercel.json` — Add cron schedule
- `app/api/admin/orders/[orderId]/deliver/route.ts` — Manual deliver route

### Commit 3: Customer + Admin UI

**Files:**
- `app/admin/orders/OrderManagementClient.tsx` — DELIVERED filter + deliver action
- `app/(site)/_components/account/tracking-utils.ts` — Shared getTrackingUrl
- `app/(site)/_components/account/ShipmentStatusDialog.tsx` — Timeline dialog
- `app/(site)/orders/OrdersPageClient.tsx` — Track/status actions
- `app/(site)/orders/[orderId]/OrderDetailClient.tsx` — DELIVERED display
- `app/api/user/orders/route.ts` — Completed filter includes DELIVERED

---

## Files Changed (14 modified, 8 new)

| File | Commit |
|------|--------|
| `prisma/schema.prisma` | 1 |
| `lib/types.ts` | 1 |
| `components/shared/record-utils.ts` | 1 |
| `lib/services/carriers/types.ts` (NEW) | 1 |
| `lib/services/carriers/usps.ts` (NEW) | 1 |
| `lib/services/carriers/ups.ts` (NEW) | 1 |
| `lib/services/carriers/fedex.ts` (NEW) | 1 |
| `lib/services/carriers/dhl.ts` (NEW) | 1 |
| `lib/services/carriers/index.ts` (NEW) | 1 |
| `emails/DeliveryConfirmationEmail.tsx` (NEW) | 1 |
| `app/admin/settings/shipping/page.tsx` (NEW) | 2 |
| `app/api/admin/settings/carriers/route.ts` (NEW) | 2 |
| `lib/navigation/route-registry.ts` | 2 |
| `app/api/cron/check-deliveries/route.ts` (NEW) | 2 |
| `vercel.json` | 2 |
| `app/api/admin/orders/[orderId]/deliver/route.ts` (NEW) | 2 |
| `app/admin/orders/OrderManagementClient.tsx` | 3 |
| `app/(site)/_components/account/tracking-utils.ts` (NEW) | 3 |
| `app/(site)/_components/account/ShipmentStatusDialog.tsx` (NEW) | 3 |
| `app/(site)/orders/OrdersPageClient.tsx` | 3 |
| `app/(site)/orders/[orderId]/OrderDetailClient.tsx` | 3 |
| `app/api/user/orders/route.ts` | 3 |

---

## Verification & Workflow Loop

After plan approval:

1. Commit plan to branch
2. Register `verification-status.json`: `{ status: "planned", acs_total: 24 }`
3. Extract ACs into `docs/plans/order-delivery-tracking-ACs.md` using the ACs template
4. Transition to `"implementing"` when coding begins

After implementation:

1. Transition to `"pending"`
2. Run `npm run precheck`
3. Spawn `/ac-verify` sub-agent — sub-agent fills the **Agent** column
4. Main thread reads report, fills **QC** column
5. If any fail -> fix -> re-verify ALL ACs
6. When all pass -> hand off ACs doc to human -> human fills **Reviewer** column
