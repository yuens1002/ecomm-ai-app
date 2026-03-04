"use client";

import { Suspense } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Package,
  TrendingUp,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import {
  PeriodSelector,
  KpiCard,
  KpiChipBar,
  AlertStrip,
  StatGrid,
} from "@/app/admin/_components/analytics";
import { RevenueTrendSection } from "@/app/admin/_components/overview/RevenueTrendSection";
import { OrdersStatusSection } from "@/app/admin/_components/overview/OrdersStatusSection";
import { ReviewsSummarySection } from "@/app/admin/_components/overview/ReviewsSummarySection";
import { ConversionFunnelSection } from "@/app/admin/_components/overview/ConversionFunnelSection";
import { MixRetentionSection } from "@/app/admin/_components/overview/MixRetentionSection";
import { TopMoversSection } from "@/app/admin/_components/overview/TopMoversSection";
import type { DashboardResponse } from "@/lib/admin/analytics/contracts";
import { computeDelta } from "@/lib/admin/analytics/metrics-registry";

interface AdminDashboardClientProps {
  userName: string;
  data: DashboardResponse;
}

export default function AdminDashboardClient({
  userName,
  data,
}: AdminDashboardClientProps) {
  const { kpis, comparisonKpis } = data;

  const kpiCards = [
    {
      label: "Revenue",
      value: kpis.revenue,
      format: "currency" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.revenue, comparisonKpis.revenue)
        : undefined,
      icon: DollarSign,
      href: "/admin/sales",
    },
    {
      label: "Orders",
      value: kpis.orders,
      format: "number" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.orders, comparisonKpis.orders)
        : undefined,
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "AOV",
      value: kpis.aov,
      format: "currency" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.aov, comparisonKpis.aov)
        : undefined,
      icon: TrendingUp,
    },
    {
      label: "Reviews",
      value: kpis.reviews,
      format: "number" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.reviews, comparisonKpis.reviews)
        : undefined,
      icon: Star,
      href: "/admin/reviews",
    },
    {
      label: "Products",
      value: kpis.products,
      format: "number" as const,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Users",
      value: kpis.users,
      format: "number" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.newUsers, comparisonKpis.newUsers)
        : undefined,
      deltaLabel: "new",
      icon: Users,
      href: "/admin/users",
    },
  ];

  return (
    <>
      <PageTitle
        title="Admin Dashboard"
        subtitle={`Welcome back, ${userName}`}
      />

      <div className="space-y-6">
        {/* Period selector */}
        <Suspense fallback={null}>
          <PeriodSelector mode="url" />
        </Suspense>

        {/* Alerts */}
        <AlertStrip alerts={data.alerts} />

        {/* KPI cards */}
        <StatGrid columns={6}>
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </StatGrid>

        {/* Supporting chips */}
        <KpiChipBar chips={data.chips} />

        {/* Row 1: Revenue trend + Orders by status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueTrendSection
              data={data.revenueByDay}
              comparisonData={data.comparisonRevenueByDay}
            />
          </div>
          <OrdersStatusSection data={data.ordersByStatus} />
        </div>

        {/* Row 2: Conversion funnel + Mix & retention */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConversionFunnelSection steps={data.behaviorFunnel} />
          <MixRetentionSection
            subscriptionSplit={data.subscriptionSplit}
            customerSplit={data.customerSplit}
          />
        </div>

        {/* Row 3: Reviews + Top movers */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <ReviewsSummarySection data={data.reviewsSummary} />
          <div className="lg:col-span-3">
            <TopMoversSection
              topProducts={data.topProducts}
              topLocations={data.topLocations}
              topSearches={data.topSearches}
            />
          </div>
        </div>
      </div>
    </>
  );
}
