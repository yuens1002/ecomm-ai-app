import type {
  ActiveFilter,
  FilterConfig,
} from "@/components/shared/data-table/types";
import type { DateRangeFilterValue } from "@/components/shared/data-table/DataTableFilter";
import type { ColumnFiltersState } from "@tanstack/react-table";

// ── Purchase type detection ─────────────────────────────────────────────

interface OrderLike {
  stripeSubscriptionId: string | null;
  items: Array<{
    purchaseOption: {
      type: string;
    };
  }>;
}

export function getPurchaseType(order: OrderLike): "Subscription" | "One-time" | "Mixed" {
  const hasSub = order.stripeSubscriptionId || order.items.some((i) => i.purchaseOption.type === "SUBSCRIPTION");
  const hasOneTime = order.items.some((i) => i.purchaseOption.type === "ONE_TIME");
  if (hasSub && hasOneTime) return "Mixed";
  if (hasSub) return "Subscription";
  return "One-time";
}

// ── Cadence formatting ──────────────────────────────────────────────────

export function formatCadence(
  interval: string | null | undefined,
  count: number | null | undefined
): string {
  if (!interval || !count) return "";
  const unit = interval.toLowerCase();
  return count === 1 ? `Every ${unit}` : `Every ${count} ${unit}s`;
}

// ── Shared filter configs for order tables ──────────────────────────────

export const ORDER_FILTER_CONFIGS: FilterConfig[] = [
  {
    id: "date",
    label: "Date",
    shellLabel: "dates",
    filterType: "dateRange",
  },
  {
    id: "total",
    label: "Total",
    shellLabel: "total $",
    filterType: "comparison",
  },
  {
    id: "type",
    label: "Frequency",
    filterType: "multiSelect",
    options: [
      { label: "Subscription", value: "Subscription" },
      { label: "One-time", value: "One-time" },
      { label: "Mixed", value: "Mixed" },
    ],
  },
];

// ── Shared filter → column filters mapping ──────────────────────────────

export function orderFilterToColumnFilters(
  filter: ActiveFilter
): ColumnFiltersState {
  if (filter.configId === "date" && filter.value) {
    return [{ id: "date", value: filter.value as DateRangeFilterValue }];
  }
  if (filter.configId === "total" && typeof filter.value === "number") {
    return [
      {
        id: "total",
        value: { operator: filter.operator ?? "\u2265", num: filter.value },
      },
    ];
  }
  if (filter.configId === "type" && Array.isArray(filter.value)) {
    return filter.value.length > 0
      ? [{ id: "type", value: filter.value }]
      : [];
  }
  return [];
}
