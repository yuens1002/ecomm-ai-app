"use client";

import { useMenuBuilder } from "./MenuBuilderContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/app-components/IconPicker";

export default function SettingsBar() {
  const ctx = useMenuBuilder();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="menu-title">Menu Text</Label>
        <Input
          id="menu-title"
          placeholder="e.g. Shop"
          value={ctx.menuTitleDraft}
          onChange={(e) => ctx.setMenuTitleDraft(e.target.value)}
          aria-describedby="menu-title-help"
        />
      </div>
      <p id="menu-title-help" className="text-xs text-muted-foreground">
        Text shown next to the menu icon in the header.
      </p>
      <div className="flex items-center justify-between">
        <Label>Menu Icon</Label>
        <IconPicker
          value={ctx.menuIconDraft}
          onValueChange={ctx.setMenuIconDraft}
          placeholder="Pick an icon or none..."
        />
      </div>
    </div>
  );
}
