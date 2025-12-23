"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductMenu } from "../ProductMenuProvider";

export default function Canvas() {
  const ctx = useProductMenu();

  if (ctx.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-16 w-full rounded bg-muted animate-pulse" />
            <div className="h-16 w-full rounded bg-muted animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ctx.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load: {ctx.error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const labels = Array.isArray(ctx.labels) ? ctx.labels : [];
  const categories = Array.isArray(ctx.categories) ? ctx.categories : [];
  const assignedIds = new Set(
    labels.flatMap((l) => (l.categories || []).map((c) => c.id))
  );
  categories
    .filter((c) => !assignedIds.has(c.id))
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Canvas</CardTitle>
      </CardHeader>
      <CardContent>
        {labels.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No labels yet. Use the sidebar to add one.
          </div>
        ) : null}
        {/* Canvas content omitted for brevity; uses ctx to manage labels/categories */}
      </CardContent>
    </Card>
  );
}
