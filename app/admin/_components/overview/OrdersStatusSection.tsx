"use client";

import { ChartCard } from "../analytics/ChartCard";
import { DonutChart } from "../analytics/DonutChart";
import type { StatusBreakdownItem } from "@/lib/admin/analytics/contracts";

interface OrdersStatusSectionProps {
  data: StatusBreakdownItem[];
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function OrdersStatusSection({ data }: OrdersStatusSectionProps) {
  const chartData = data.map((s) => ({
    label: formatStatus(s.status),
    value: s.count,
  }));

  const total = data.reduce((sum, s) => sum + s.count, 0);

  return (
    <ChartCard title="Total Orders by Status">
      {total > 0 ? (
        <DonutChart data={chartData} />
      ) : (
        <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
          No orders in this period
        </div>
      )}
    </ChartCard>
  );
}
