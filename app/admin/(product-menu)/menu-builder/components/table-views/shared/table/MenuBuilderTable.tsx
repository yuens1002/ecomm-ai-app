"use client";

import * as React from "react";
import { Table as ShadcnTable } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MenuBuilderTableProps = React.ComponentProps<typeof ShadcnTable> & {
  minWidthClassName?: string;
};

export function MenuBuilderTable({
  className,
  minWidthClassName = "min-w-[660px]",
  ...props
}: MenuBuilderTableProps) {
  return <ShadcnTable className={cn("table-fixed", minWidthClassName, className)} {...props} />;
}
