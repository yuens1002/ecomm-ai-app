"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useMenuContext } from "../MenuContext";

export default function PreviewPanel() {
  const ctx = useMenuContext();
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );

  const labels = Array.isArray(ctx.labels) ? ctx.labels : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={previewMode}
          onValueChange={(v) =>
            setPreviewMode((v as "desktop" | "mobile") || "desktop")
          }
        >
          <TabsList>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="pt-4">
            <div className="flex items-center gap-3 p-3 border rounded-md">
              <span className="inline-flex items-center gap-2 text-sm">
                {ctx.menuIcon ? <span className="inline-block" /> : null}
                {ctx.menuTitle || "Menu"}
              </span>
              <Separator orientation="vertical" />
              <div className="flex flex-wrap gap-2">
                {labels
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((l) => (
                    <Button key={l.id} variant="ghost" size="sm">
                      {l.name}
                    </Button>
                  ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mobile" className="pt-4">
            <div className="space-y-2 p-3 border rounded-md">
              <Button variant="outline" size="sm" className="w-full">
                {ctx.menuTitle || "Menu"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                {labels
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((l) => (
                    <Button
                      key={l.id}
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                    >
                      {l.name}
                    </Button>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
