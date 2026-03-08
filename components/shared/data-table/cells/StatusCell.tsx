"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";

interface StatusCellProps {
  status: string;
  label?: string;
  colorClassName?: string;
}

export function StatusCell({ status, label, colorClassName }: StatusCellProps) {
  return (
    <div className="text-center">
      <StatusBadge
        status={status}
        label={label}
        colorClassName={colorClassName}
      />
    </div>
  );
}
