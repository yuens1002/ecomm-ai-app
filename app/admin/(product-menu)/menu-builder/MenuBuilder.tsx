"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

import SettingsBar from "./SettingsBar";
import Canvas from "./Canvas";
import SidebarActions from "./SidebarActions";
import PreviewPanel from "./PreviewPanel";
import { ProductMenuProvider } from "../ProductMenuProvider";
import { MenuBuilderProvider } from "./MenuBuilderContext";
import { useMenuBuilder } from "./MenuBuilderContext";

export default function MenuBuilder() {
  return (
    <ProductMenuProvider>
      <MenuBuilderProvider>
        <MenuBuilderBody />
      </MenuBuilderProvider>
    </ProductMenuProvider>
  );
}

function MenuBuilderBody() {
  const { previewMode, setPreviewMode } = useMenuBuilder();

  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Product Menu Builder</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure labels, categories, and preview your storefront menu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Preview desktop"
              onClick={() => setPreviewMode("desktop")}
              className={
                previewMode === "desktop" ? "border-primary" : undefined
              }
            >
              <Eye className="mr-2 h-4 w-4" /> Desktop
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Preview mobile"
              onClick={() => setPreviewMode("mobile")}
              className={
                previewMode === "mobile" ? "border-primary" : undefined
              }
            >
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
  );
}
