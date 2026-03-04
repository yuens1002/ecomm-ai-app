/**
 * Dashboard analytics service.
 *
 * Orchestrates queries → metrics → typed response.
 * Route handler only validates params, calls this, returns JSON.
 */

import type {
  DashboardResponse,
  DashboardKpis,
  ChipPayload,
  AlertPayload,
  PeriodPreset,
  CompareMode,
} from "../contracts";
import {
  getDateRange,
  getComparisonRange,
  toDateRangeDTO,
  type DateRange,
} from "../time";
import {
  computeAov,
  computeNetRevenue,
  computeRefundRate,
  computeConversionRate,
  computeSplit,
} from "../metrics-registry";
import { buildKpiOrderWhere } from "../filters/build-order-where";
import {
  getRevenueAggregate,
  getRevenueByDay,
  getOrdersByStatus,
  getTopProducts,
  getTopLocations,
  getPromoOrderCount,
  getFulfilledCount,
  getPurchaseTypeSplit,
} from "../queries/order-aggregates";
import { getBehaviorFunnel, getTopSearches } from "../queries/activity-queries";
import {
  getReviewsSummary,
  getEntityCounts,
  getCustomerSplit,
} from "../queries/entity-queries";

export interface GetDashboardParams {
  period: PeriodPreset;
  compare: CompareMode;
}

export async function getDashboardAnalytics(
  params: GetDashboardParams
): Promise<DashboardResponse> {
  const range = getDateRange(params.period);
  const compRange = getComparisonRange(range, params.compare);

  const kpiWhere = buildKpiOrderWhere({ range });
  const allWhere = { createdAt: { gte: range.from, lt: range.to } };

  // Run all queries in parallel
  const [
    revenueAgg,
    revenueByDay,
    ordersByStatus,
    purchaseTypeSplit,
    topProducts,
    topLocations,
    topSearches,
    promoCount,
    fulfilledCount,
    funnel,
    reviewsSummary,
    entityCounts,
    customerSplit,
    comparisonKpis,
    comparisonRevenueByDay,
  ] = await Promise.all([
    getRevenueAggregate(kpiWhere),
    getRevenueByDay(kpiWhere, range),
    getOrdersByStatus(allWhere),
    getPurchaseTypeSplit(kpiWhere),
    getTopProducts(kpiWhere, 5),
    getTopLocations(kpiWhere, 5),
    getTopSearches(range, 5),
    getPromoOrderCount(kpiWhere),
    getFulfilledCount(allWhere),
    getBehaviorFunnel(range, 0), // orderCount placeholder, replaced below
    getReviewsSummary(range),
    getEntityCounts(range),
    getCustomerSplit(kpiWhere),
    compRange ? getComparisonKpis(compRange) : Promise.resolve(null),
    compRange
      ? getRevenueByDay(buildKpiOrderWhere({ range: compRange }), compRange)
      : Promise.resolve(null),
  ]);

  // Fix funnel's order count (we needed to run queries in parallel)
  funnel[2] = {
    ...funnel[2],
    value: revenueAgg.orderCount,
    conversionFromPrevious: computeConversionRate(
      revenueAgg.orderCount,
      funnel[1].value
    ),
  };

  // Build KPIs
  const kpis = buildKpis(revenueAgg, reviewsSummary, entityCounts);

  // Build chips (supporting metrics)
  const chips: ChipPayload[] = [
    { label: "Net Revenue", value: computeNetRevenue(revenueAgg.revenue, revenueAgg.refunds), format: "currency" },
    { label: "Fulfillment", value: fulfilledCount / Math.max(revenueAgg.orderCount + /* cancelled/failed from allWhere */ 0, 1), format: "percent" },
    { label: "Promo Orders", value: promoCount, format: "number" },
    { label: "Newsletter", value: entityCounts.newsletterActive, format: "number" },
  ];

  // Build alerts
  const alerts = buildAlerts(revenueAgg, ordersByStatus);

  // Build comparison deltas
  const kpisWithDeltas = comparisonKpis
    ? buildDeltaKpis(kpis, comparisonKpis)
    : kpis;

  // Build subscription and customer splits
  const subscriptionSplit = computeSplit(
    "Subscription",
    purchaseTypeSplit.subscriptionRevenue,
    "One-time",
    purchaseTypeSplit.oneTimeRevenue
  );

  const customerSplitPayload = computeSplit(
    "New",
    customerSplit.newCustomers,
    "Repeat",
    customerSplit.repeatCustomers
  );

  return {
    period: toDateRangeDTO(range),
    comparison: compRange ? toDateRangeDTO(compRange) : null,
    kpis: kpisWithDeltas,
    comparisonKpis: comparisonKpis,
    chips,
    alerts,
    revenueByDay,
    comparisonRevenueByDay,
    ordersByStatus,
    behaviorFunnel: funnel,
    subscriptionSplit,
    customerSplit: customerSplitPayload,
    topProducts: topProducts.map((p, i) => ({
      rank: i + 1,
      label: p.name,
      value: p.revenue,
      href: `/admin/products/${p.slug}`,
    })),
    topLocations: topLocations.map((l, i) => ({
      rank: i + 1,
      label: l.state,
      value: l.revenue,
    })),
    topSearches,
    reviewsSummary,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildKpis(
  rev: Awaited<ReturnType<typeof getRevenueAggregate>>,
  reviews: Awaited<ReturnType<typeof getReviewsSummary>>,
  entities: Awaited<ReturnType<typeof getEntityCounts>>
): DashboardKpis {
  return {
    revenue: rev.revenue,
    netRevenue: computeNetRevenue(rev.revenue, rev.refunds),
    orders: rev.orderCount,
    aov: computeAov(rev.revenue, rev.orderCount),
    refundAmount: rev.refunds,
    refundRate: computeRefundRate(rev.refunds, rev.revenue),
    reviews: reviews.total,
    avgRating: reviews.avgRating,
    products: entities.products,
    users: entities.users,
    newUsers: entities.newUsers,
    newsletterActive: entities.newsletterActive,
  };
}

async function getComparisonKpis(
  compRange: DateRange
): Promise<DashboardKpis> {
  const compWhere = buildKpiOrderWhere({ range: compRange });
  const [compRev, compReviews, compEntities] = await Promise.all([
    getRevenueAggregate(compWhere),
    getReviewsSummary(compRange),
    getEntityCounts(compRange),
  ]);
  return buildKpis(compRev, compReviews, compEntities);
}

function buildDeltaKpis(
  current: DashboardKpis,
  _previous: DashboardKpis
): DashboardKpis {
  // Deltas are computed client-side via computeDelta(current.x, comparisonKpis.x).
  // Both kpis objects are returned in the response.
  return current;
}

function buildAlerts(
  rev: Awaited<ReturnType<typeof getRevenueAggregate>>,
  statusBreakdown: Awaited<ReturnType<typeof getOrdersByStatus>>
): AlertPayload[] {
  const alerts: AlertPayload[] = [];

  // Refund rate > 10%
  const refundRate = computeRefundRate(rev.refunds, rev.revenue);
  if (refundRate > 0.1) {
    alerts.push({
      severity: "warning",
      message: `Refund rate at ${(refundRate * 100).toFixed(1)}%`,
      href: "/admin/orders?status=refunded",
    });
  }

  // Failed/cancelled > 5% of all orders
  const totalOrders = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const failedCancelled = statusBreakdown
    .filter((s) => s.status === "FAILED" || s.status === "CANCELLED")
    .reduce((sum, s) => sum + s.count, 0);
  if (totalOrders > 0 && failedCancelled / totalOrders > 0.05) {
    alerts.push({
      severity: "error",
      message: `${failedCancelled} failed/cancelled orders (${((failedCancelled / totalOrders) * 100).toFixed(1)}%)`,
      href: "/admin/orders?status=FAILED",
    });
  }

  return alerts;
}
