"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { MenuProvider } from "./MenuContext";
import SettingsBar from "./components/SettingsBar";
import Canvas from "./components/Canvas";
import SidebarActions from "./components/SidebarActions";
import PreviewPanel from "./components/PreviewPanel";
import { useState } from "react";

export default function ProductMenuBuilder() {
  const [previewMode, setPreviewMode] = useState("desktop" as "desktop" | "mobile");
  return (
    <MenuProvider>
      <div className="container py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Product Menu Builder</CardTitle>
              <p className="text-sm text-muted-foreground">Configure labels, categories, and preview your storefront menu.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" aria-label="Preview desktop" onClick={() => setPreviewMode("desktop")} className={previewMode === "desktop" ? "border-primary" : undefined}>
                <Eye className="mr-2 h-4 w-4" /> Desktop
              </Button>
              <Button variant="outline" size="sm" aria-label="Preview mobile" onClick={() => setPreviewMode("mobile")} className={previewMode === "mobile" ? "border-primary" : undefined}>
                <EyeOff className="mr-2 h-4 w-4" /> Mobile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-[320px_auto] gap-6">
              <SettingsBar />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
                <Canvas />
                <SidebarActions />
              </div>
            </div>
          </CardContent>
        </Card>

        <PreviewPanel />
      </div>
    </MenuProvider>
  );
}
