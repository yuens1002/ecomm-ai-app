"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMenuContext } from "../MenuContext";

export default function Canvas() {
  const ctx = useMenuContext();

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
            Failed to load: {ctx.error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const labels = Array.isArray(ctx.labels) ? ctx.labels : [];
  const categories = Array.isArray(ctx.categories) ? ctx.categories : [];

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
        ) : (
          <div className="space-y-3">
            {labels
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((label) => (
                <Card key={label.id} className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">{label.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .filter((c) => !c.labelId || c.labelId === label.id)
                        .map((c) => (
                          <Button
                            key={c.id}
                            variant="secondary"
                            size="sm"
                            aria-label={`Category ${c.name}`}
                          >
                            {c.name}
                          </Button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
