"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { useMenuContext } from "../MenuContext";

export default function SidebarActions() {
  const ctx = useMenuContext();
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={isSaving}
        onClick={async () => {
          try {
            setIsSaving(true);
            const name = "New Label";
            await ctx.createLabel({ name, icon: null });
          } finally {
            setIsSaving(false);
          }
        }}
      >
        + Add Label
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          ctx.createCategory({ name: "New Category", slug: "new-category" })
        }
      >
        + Add Category
      </Button>
      <Separator />
      <Button variant="default" size="sm" className="w-full">
        <Sparkles className="mr-2 h-4 w-4" /> AI Assist (soon)
      </Button>
    </div>
  );
}
