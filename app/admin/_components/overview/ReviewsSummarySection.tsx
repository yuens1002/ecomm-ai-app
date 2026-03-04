"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { ChartCard } from "../analytics/ChartCard";
import { Badge } from "@/components/ui/badge";
import type { DashboardResponse } from "@/lib/admin/analytics/contracts";

type ReviewsSummary = DashboardResponse["reviewsSummary"];

interface ReviewsSummarySectionProps {
  data: ReviewsSummary;
}

export function ReviewsSummarySection({ data }: ReviewsSummarySectionProps) {
  return (
    <ChartCard title="Reviews">
      <div className="space-y-4">
        {/* Average rating */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(data.avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium">
            {data.avgRating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({data.total} reviews)
          </span>
        </div>

        {/* Pending */}
        {data.pendingCount > 0 && (
          <Link
            href="/admin/reviews?status=PENDING"
            className="flex items-center gap-2 hover:opacity-80"
          >
            <Badge variant="outline" className="text-xs">
              {data.pendingCount} pending
            </Badge>
          </Link>
        )}

        {/* Top reviewed product */}
        {data.topReviewed && (
          <div className="text-sm">
            <span className="text-muted-foreground">Most reviewed: </span>
            <Link
              href={`/admin/products/${data.topReviewed.slug}`}
              className="font-medium hover:underline"
            >
              {data.topReviewed.name}
            </Link>
            <span className="text-muted-foreground">
              {" "}
              ({data.topReviewed.count})
            </span>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
