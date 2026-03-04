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
  const hasData = data.some((d) => d.primary > 0 || (d.secondary ?? 0) > 0);

  return (
    <ChartCard title="Revenue & Orders Trend" description="Daily revenue with order count overlay">
      {hasData ? (
        <TrendChart
          data={data}
          primaryLabel="Revenue"
          secondaryLabel="Orders"
          comparisonData={comparisonData ?? undefined}
        />
      ) : (
        <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No revenue data in this period
        </div>
      )}
    </ChartCard>
  );
}
