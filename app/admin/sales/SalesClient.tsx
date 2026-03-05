"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Filter,
  MapPin,
  ReceiptText,
  Repeat,
  ShoppingCart,
  TrendingUp,
  Trophy,
  Weight,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { ADMIN_PAGES } from "@/lib/config/admin-pages";
import {
  DashboardToolbar,
  DateRangePicker,
  KpiCard,
  StatGrid,
  ChartCard,
  ChartCardToggleAction,
  TrendChart,
  DonutChart,
  HBarChart,
  RankedList,
  SkeletonDashboard,
} from "@/app/admin/_components/analytics";
import {
  ColumnVisibilityToggle,
  DataTable,
  DataTableActionBar,
  useColumnVisibility,
} from "@/app/admin/_components/data-table";
import type {
  ActiveFilter,
  FilterConfig,
} from "@/app/admin/_components/data-table";
import { Badge } from "@/components/ui/badge";
import type {
  PeriodPreset,
  CompareMode,
  SalesResponse,
  SalesRow,
} from "@/lib/admin/analytics/contracts";
import { computeDelta } from "@/lib/admin/analytics/metrics-registry";
import { formatCurrency } from "@/lib/admin/analytics/formatters";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  });

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Filter & column visibility configs ────────────────────────────────
const salesFilterConfigs: FilterConfig[] = [
  {
    id: "orderType",
    label: "Type",
    filterType: "multiSelect",
    options: [
      { label: "Subscription", value: "SUBSCRIPTION" },
      { label: "One-time", value: "ONE_TIME" },
    ],
  },
  {
    id: "status",
    label: "Status",
    filterType: "multiSelect",
    options: [
      { label: "Pending", value: "PENDING" },
      { label: "Paid", value: "PAID" },
      { label: "Shipped", value: "SHIPPED" },
      { label: "Delivered", value: "DELIVERED" },
      { label: "Cancelled", value: "CANCELLED" },
      { label: "Refunded", value: "REFUNDED" },
    ],
  },
  { id: "amount", label: "Amount", shellLabel: "amount $", filterType: "comparison" },
];

const SALES_TOGGLABLE_COLUMNS = [
  { id: "createdAt", label: "Date" },
  { id: "customerEmail", label: "Customer" },
  { id: "itemCount", label: "Items" },
  { id: "orderType", label: "Type" },
  { id: "status", label: "Status" },
  { id: "total", label: "Total" },
  { id: "refunded", label: "Refunded" },
  { id: "location", label: "Location" },
];

// ── Column definitions (stable, no deps) ────────────────────────────
const salesColumns: ColumnDef<SalesRow, unknown>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    size: 100,
    cell: ({ row }) => row.original.orderNumber,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    size: 110,
    enableSorting: true,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    accessorKey: "customerEmail",
    header: "Customer",
    size: 180,
    cell: ({ row }) =>
      row.original.customerName ?? row.original.customerEmail ?? "—",
  },
  {
    accessorKey: "itemCount",
    header: "Items",
    size: 70,
    enableSorting: true,
    meta: { align: "center" as const },
    cell: ({ row }) => (
      <div className="text-center">{row.original.itemCount}</div>
    ),
  },
  {
    accessorKey: "orderType",
    header: "Type",
    size: 110,
    meta: { align: "center" as const },
    cell: ({ row }) => (
      <div className="text-center">
        <Badge
          variant={
            row.original.orderType === "SUBSCRIPTION" ? "default" : "secondary"
          }
          className="text-xs font-normal"
        >
          {row.original.orderType === "SUBSCRIPTION" ? "Sub" : "One-time"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 110,
    enableSorting: true,
    meta: { align: "center" as const },
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
          {formatStatus(row.original.status)}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    size: 100,
    enableSorting: true,
    meta: { align: "right" as const },
    cell: ({ row }) => (
      <div className="text-right">{formatCurrency(row.original.total)}</div>
    ),
  },
  {
    accessorKey: "refunded",
    header: "Refunded",
    size: 100,
    meta: { align: "right" as const },
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.refunded > 0 ? formatCurrency(row.original.refunded) : "—"}
      </div>
    ),
  },
  {
    id: "location",
    header: "Location",
    size: 140,
    cell: ({ row }) =>
      [row.original.city, row.original.state].filter(Boolean).join(", ") ||
      "—",
  },
];

// ── Component ────────────────────────────────────────────────────────

interface SalesClientProps {
  weightUnit: "METRIC" | "IMPERIAL";
}

export default function SalesClient({ weightUnit }: SalesClientProps) {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [compare, setCompare] = useState<CompareMode>("previous");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const { columnVisibility, handleVisibilityChange } =
    useColumnVisibility("sales-table-cols");

  // Server-side table state — directly drives the SWR URL
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [showAllCoffee, setShowAllCoffee] = useState(false);

  const sortCol = sorting[0]?.id ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  // Build filter query params from activeFilter state
  const filterParams = buildFilterQueryParams(activeFilter);

  const apiUrl = `/api/admin/sales?period=${period}&compare=${compare}&page=${pagination.pageIndex}&pageSize=${pagination.pageSize}&sort=${sortCol}&dir=${sortDir}${filterParams}`;

  const { data, isLoading } = useSWR<SalesResponse>(apiUrl, fetcher, {
    keepPreviousData: true,
  });

  const handleExportCsv = useCallback(() => {
    window.open(
      `/api/admin/sales?period=${period}&compare=${compare}&export=csv`,
      "_blank"
    );
  }, [period, compare]);

  // Reset pagination when period/compare changes
  const handlePeriodChange = useCallback((p: PeriodPreset) => {
    setPeriod(p);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleCompareChange = useCallback((c: CompareMode) => {
    setCompare(c);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Reset to page 0 when sorting changes
  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      setSorting(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    []
  );

  const handleFilterChange = useCallback(
    (filter: ActiveFilter | null) => {
      setActiveFilter(filter);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    []
  );

  // Server-side table — manual pagination/sorting, no client-side row models
  const salesTable = useReactTable<SalesRow>({
    data: data?.table?.rows ?? [],
    columns: salesColumns,
    state: { sorting, pagination, columnVisibility },
    onSortingChange: handleSortingChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: data?.table?.total ?? 0,
    columnResizeMode: "onChange",
  });

  // ── Loading / error states ─────────────────────────────────────
  if (isLoading && !data) {
    return (
      <>
        <PageTitle title={ADMIN_PAGES.sales.label} subtitle={ADMIN_PAGES.sales.description} />
        <SkeletonDashboard />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageTitle title={ADMIN_PAGES.sales.label} subtitle={ADMIN_PAGES.sales.description} />
        <p className="text-muted-foreground">Failed to load sales data.</p>
      </>
    );
  }

  const { kpis, comparisonKpis } = data;

  // Total coffee weight for KPI card
  const totalCoffeeGrams = data.coffeeByWeight.reduce(
    (sum, c) => sum + c.weightSoldGrams,
    0
  );
  const totalCoffeeWeight =
    weightUnit === "METRIC"
      ? Math.round(totalCoffeeGrams / 1000)
      : Math.round(totalCoffeeGrams / 453.592);
  const weightUnitLabel = weightUnit === "METRIC" ? "kg" : "lbs";

  const kpiCards = [
    {
      label: "Revenue",
      description: "Gross sales for the period",
      value: kpis.revenue,
      format: "currency" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.revenue, comparisonKpis.revenue)
        : undefined,
      icon: DollarSign,
    },
    {
      label: "Orders",
      description: "Total orders placed",
      value: kpis.orders,
      format: "number" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.orders, comparisonKpis.orders)
        : undefined,
      icon: ShoppingCart,
    },
    {
      label: "AOV",
      labelTitle: "Average Order Value",
      description: "Revenue per order",
      value: kpis.aov,
      format: "currency" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.aov, comparisonKpis.aov)
        : undefined,
      icon: TrendingUp,
    },
    {
      label: "Refunds",
      description: "Returned order value",
      value: kpis.refundAmount,
      format: "currency" as const,
      delta: comparisonKpis
        ? computeDelta(kpis.refundAmount, comparisonKpis.refundAmount)
        : undefined,
      icon: ReceiptText,
    },
    {
      label: "Coffee Sold",
      description: "Total weight shipped",
      value: totalCoffeeWeight,
      format: "number" as const,
      valueLabel: weightUnitLabel,
      icon: Weight,
    },
  ];

  return (
    <>
      <PageTitle title={ADMIN_PAGES.sales.label} subtitle={ADMIN_PAGES.sales.description} />

      <div className="space-y-4">
        {/* Period selector + Export */}
        <DashboardToolbar onExport={handleExportCsv}>
          <DateRangePicker
            mode="state"
            period={period}
            compare={compare}
            onPeriodChange={handlePeriodChange}
            onCompareChange={handleCompareChange}
            hideCompare
          />
        </DashboardToolbar>

        {/* KPI cards */}
        <StatGrid columns={5}>
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </StatGrid>

        {/* Revenue trend */}
        <ChartCard
          title="Revenue Over Time"
          titleIcon={TrendingUp}
          description="Daily revenue with comparison overlay"
        >
          <TrendChart
            data={data.revenueByDay}
            primaryLabel="Revenue"
            secondaryLabel="Orders"
            comparisonData={data.comparisonByDay ?? undefined}
            className="aspect-auto h-56"
          />
        </ChartCard>

        {/* Row 2: Top products (60%) + Subscription vs One-time (40%) */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
          <ChartCard title="Top Products" titleIcon={Trophy} description="Best sellers by revenue">
            <RankedList
              items={data.topProducts}
              valueLabel="Revenue"
              limit={10}
            />
          </ChartCard>
          <ChartCard title="Subscription vs One-time" titleIcon={Repeat} description="Revenue split by purchase type">
            <DonutChart
              data={[
                {
                  label: data.purchaseTypeSplit.left.label,
                  value: data.purchaseTypeSplit.left.value,
                },
                {
                  label: data.purchaseTypeSplit.right.label,
                  value: data.purchaseTypeSplit.right.value,
                },
              ]}
              centerLabel={formatCurrency(
                data.purchaseTypeSplit.left.value +
                  data.purchaseTypeSplit.right.value
              )}
              valueFormat="currency"
            />
          </ChartCard>
        </div>

        {/* Row 4: Category breakdown (40%) + Coffee by weight (60%) */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4">
          <ChartCard title="Category Breakdown" titleIcon={BarChart3} description="Revenue by product category">
            <HBarChart
              data={data.categoryBreakdown.map((c) => ({
                label: c.category,
                value: c.revenue,
              }))}
              valueFormat="currency"
              labelPosition="above"
            />
          </ChartCard>
          <ChartCard
            title={`Coffee Sold by Weight (${weightUnitLabel})`}
            titleIcon={Weight}
            description="Total weight shipped per product"
            action={data.coffeeByWeight.length > 10 ? (
              <ChartCardToggleAction
                expanded={showAllCoffee}
                onToggle={() => setShowAllCoffee((v) => !v)}
              />
            ) : undefined}
          >
            {data.coffeeByWeight.length > 0 ? (
              <HBarChart
                data={[...data.coffeeByWeight]
                  .sort((a, b) => b.weightSoldGrams - a.weightSoldGrams)
                  .slice(0, showAllCoffee ? undefined : 10)
                  .map((c) => ({
                    label: c.product,
                    value: parseFloat(
                      (weightUnit === "METRIC"
                        ? c.weightSoldGrams / 1000
                        : c.weightSoldGrams / 453.592
                      ).toFixed(1)
                    ),
                  }))}
                valueFormat="number"
                labelPosition="inline"
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No coffee orders in this period
              </p>
            )}
          </ChartCard>
        </div>

        {/* Row 3: Orders by status + Sales by Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Total Orders by Status" titleIcon={ClipboardList} description="Breakdown by fulfillment stage">
            <DonutChart
              data={data.ordersByStatus.map((s) => ({
                label: formatStatus(s.status),
                value: s.count,
              }))}
            />
          </ChartCard>
          <ChartCard title="Sales by Location" titleIcon={MapPin} description="Revenue by customer location">
            <RankedList
              items={data.topLocations}
              valueLabel="Revenue"
              limit={10}
            />
          </ChartCard>
        </div>

        {/* Sales orders table */}
        <ChartCard title="Orders" titleIcon={ShoppingCart} description="Individual order details">
          <DataTableActionBar
            config={{
              left: [
                {
                  type: "filter",
                  configs: salesFilterConfigs,
                  activeFilter,
                  onFilterChange: handleFilterChange,
                  collapse: { icon: Filter },
                },
                {
                  type: "custom",
                  content: (
                    <ColumnVisibilityToggle
                      columns={SALES_TOGGLABLE_COLUMNS}
                      columnVisibility={columnVisibility}
                      onVisibilityChange={handleVisibilityChange}
                    />
                  ),
                },
              ],
              right: [
                {
                  type: "recordCount",
                  count: data.table?.total ?? 0,
                  label: "orders",
                },
                { type: "pageSizeSelector", table: salesTable },
                { type: "pagination", table: salesTable },
              ],
            }}
          />
          <DataTable table={salesTable} stickyHeader fitContainer />
        </ChartCard>
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function buildFilterQueryParams(filter: ActiveFilter | null): string {
  if (!filter) return "";
  const params = new URLSearchParams();

  if (filter.configId === "orderType") {
    const values = filter.value as string[];
    if (values.length > 0) params.set("orderType", values.join(","));
  } else if (filter.configId === "status") {
    const values = filter.value as string[];
    if (values.length > 0) params.set("status", values.join(","));
  } else if (filter.configId === "amount") {
    const num = Number(filter.value);
    if (filter.value !== "" && !isNaN(num)) {
      const opMap: Record<string, string> = { "=": "=", "\u2265": ">=", "\u2264": "<=" };
      params.set("amountOp", opMap[filter.operator ?? "="] ?? "=");
      params.set("amount", String(Math.round(num * 100))); // dollars → cents
    }
  }

  const str = params.toString();
  return str ? `&${str}` : "";
}
