"use client";

import { ChartCard } from "../analytics/ChartCard";
import { FunnelChart } from "../analytics/FunnelChart";
import type { FunnelStep } from "@/lib/admin/analytics/contracts";

interface ConversionFunnelSectionProps {
  steps: FunnelStep[];
}

export function ConversionFunnelSection({
  steps,
}: ConversionFunnelSectionProps) {
  return (
    <ChartCard title="Conversion Funnel" description="Views → Cart → Orders">
      <FunnelChart steps={steps} />
    </ChartCard>
  );
}
