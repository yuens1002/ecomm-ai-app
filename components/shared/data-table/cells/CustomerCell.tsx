"use client";

import { formatPhoneNumber } from "@/components/shared/record-utils";

interface CustomerCellProps {
  name: string | null | undefined;
  email?: string | null;
  phone?: string | null;
  fallback?: string;
}

export function CustomerCell({
  name,
  email,
  phone,
  fallback = "Guest",
}: CustomerCellProps) {
  return (
    <div>
      <div className="text-sm">{name || fallback}</div>
      {email && (
        <div className="text-xs text-muted-foreground">{email}</div>
      )}
      {phone && (
        <div className="text-xs text-muted-foreground">
          {formatPhoneNumber(phone)}
        </div>
      )}
    </div>
  );
}
