"use client";

import { ChartCard } from "../analytics/ChartCard";
import { RankedList } from "../analytics/RankedList";
import type { RankedItem } from "@/lib/admin/analytics/contracts";

interface TopMoversSectionProps {
  topProducts: RankedItem[];
  topLocations: RankedItem[];
  topSearches: RankedItem[];
}

export function TopMoversSection({
  topProducts,
  topLocations,
  topSearches,
}: TopMoversSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ChartCard title="Top Products">
        <RankedList
          items={topProducts}
          valueLabel="Revenue"
          viewAllHref="/admin/sales"
        />
      </ChartCard>
      <ChartCard title="Top Locations">
        <RankedList
          items={topLocations}
          valueLabel="Revenue"
        />
      </ChartCard>
      <ChartCard title="Top Searches">
        <RankedList
          items={topSearches}
          valueLabel="Count"
          viewAllHref="/admin/analytics"
        />
      </ChartCard>
    </div>
  );
}
