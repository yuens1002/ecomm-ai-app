"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Search,
  ShoppingCart,
  Eye,
  BarChart3,
  Loader2,
} from "lucide-react";

interface TrendingProduct {
  id: string;
  name: string;
  slug: string;
  roastLevel: string;
  views: number;
}

interface SearchQuery {
  query: string;
  count: number;
}

interface Metrics {
  totalProductViews: number;
  totalAddToCart: number;
  totalOrders: number;
  conversionRate: number;
  cartConversionRate: number;
}

interface ActivityBreakdown {
  activityType: string;
  _count: { activityType: number };
}

interface DailyActivity {
  date: string;
  count: number;
}

interface AnalyticsData {
  period: string;
  trendingProducts: TrendingProduct[];
  topSearches: SearchQuery[];
  metrics: Metrics;
  activityBreakdown: ActivityBreakdown[];
  dailyActivity: DailyActivity[];
}

interface AnalyticsViewProps {
  embedded?: boolean;
}

export default function AnalyticsView({
  embedded = false,
}: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/analytics?days=${selectedPeriod}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedPeriod]);

  if (isLoading) {
    return (
      <div className={embedded ? "py-6" : "container mx-auto p-6"}>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={embedded ? "py-6" : "container mx-auto p-6"}>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading analytics: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxDailyActivity = Math.max(
    ...data.dailyActivity.map((d) => d.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          {[7, 30].map((days) => (
            <Button
              key={days}
              variant={selectedPeriod === days ? "default" : "outline"}
              onClick={() => setSelectedPeriod(days)}
              size="sm"
            >
              {days} Days
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalProductViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add to Cart</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalAddToCart.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Views to Orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Products
            </CardTitle>
            <CardDescription>
              Most viewed products in {data.period.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.trendingProducts.slice(0, 8).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${(product.roastLevel || "medium").toLowerCase()}-roast/${product.slug}`}
                        className="text-sm font-medium hover:text-accent truncate block"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {product.roastLevel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{product.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Search Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Top Search Queries
            </CardTitle>
            <CardDescription>Most popular search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topSearches.slice(0, 8).map((search, index) => (
                <div
                  key={search.query}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium truncate">
                      &quot;{search.query}&quot;
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {search.count}×
                  </span>
                </div>
              ))}
              {data.topSearches.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No search queries in this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity Trend</CardTitle>
          <CardDescription>
            Total user activities per day (views, searches, cart adds, orders)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.dailyActivity.map((day) => {
              const percentage =
                maxDailyActivity > 0 ? (day.count / maxDailyActivity) * 100 : 0;
              // Ensure minimum visible width for non-zero values
              const displayWidth = day.count > 0 ? Math.max(percentage, 2) : 0;

              return (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-20">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1 h-8 bg-secondary rounded-sm overflow-hidden relative">
                    {day.count > 0 && (
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{
                          width: `${displayWidth}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {day.count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
          <CardDescription>Distribution by activity type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.activityBreakdown.map((activity) => (
              <div
                key={activity.activityType}
                className="text-center p-4 bg-secondary rounded-lg"
              >
                <div className="text-2xl font-bold">
                  {activity._count.activityType}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {activity.activityType.replace("_", " ")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
