"use client";

import { Badge } from "@/components/ui/badge";

interface TypeCellProps {
  type: "Subscription" | "One-time";
}

export function TypeCell({ type }: TypeCellProps) {
  return (
    <div className="text-center">
      <Badge
        variant={type === "Subscription" ? "default" : "secondary"}
        className={
          type === "Subscription"
            ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 font-normal"
            : "font-normal"
        }
      >
        {type}
      </Badge>
    </div>
  );
}
