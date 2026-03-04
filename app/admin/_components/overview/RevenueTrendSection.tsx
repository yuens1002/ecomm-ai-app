"use client";

import { ChartCard } from "../analytics/ChartCard";
import { TrendChart } from "../analytics/TrendChart";
import type { ChartDataPoint } from "@/lib/admin/analytics/contracts";

interface RevenueTrendSectionProps {
  data: ChartDataPoint[];
  comparisonData?: ChartDataPoint[] | null;
}

export function RevenueTrendSection({
  data,
  comparisonData,
}: RevenueTrendSectionProps) {
  return (
    <ChartCard title="Revenue & Orders Trend" description="Daily revenue with order count overlay">
      <TrendChart
        data={data}
        primaryLabel="Revenue"
        secondaryLabel="Orders"
        comparisonData={comparisonData ?? undefined}
      />
    </ChartCard>
  );
}
