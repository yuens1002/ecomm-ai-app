"use client";

import { ChartCard } from "../analytics/ChartCard";
import { DonutChart } from "../analytics/DonutChart";
import type { StatusBreakdownItem } from "@/lib/admin/analytics/contracts";

interface OrdersStatusSectionProps {
  data: StatusBreakdownItem[];
}

export function OrdersStatusSection({ data }: OrdersStatusSectionProps) {
  const chartData = data.map((s) => ({
    label: s.status,
    value: s.count,
  }));

  const total = data.reduce((sum, s) => sum + s.count, 0);

  return (
    <ChartCard title="Orders by Status" description={`${total} total`}>
      <DonutChart data={chartData} />
    </ChartCard>
  );
}
