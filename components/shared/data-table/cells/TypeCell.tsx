"use client";

import { Badge } from "@/components/ui/badge";

interface TypeCellProps {
  type: "Subscription" | "One-time" | "Mixed";
}

export function TypeCell({ type }: TypeCellProps) {
  const colorClass =
    type === "Subscription"
      ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 font-normal"
      : type === "Mixed"
        ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 font-normal"
        : "font-normal";

  return (
    <div className="text-center">
      <Badge
        variant={type === "Subscription" || type === "Mixed" ? "default" : "secondary"}
        className={colorClass}
      >
        {type}
      </Badge>
    </div>
  );
}
