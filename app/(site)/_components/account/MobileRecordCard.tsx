"use client";

import { format } from "date-fns";
import Link from "next/link";
import { MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusColor, getStatusLabel } from "./record-utils";

interface RecordItem {
  id: string;
  name: string;
  variant: string;
  purchaseType: string;
  quantity: number;
}

interface RecordShipping {
  recipientName?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

interface RecordAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

interface MobileRecordCardProps {
  type: "order" | "subscription";
  status: string;
  date: Date;
  displayId: string;
  detailHref?: string;
  items: RecordItem[];
  shipping?: RecordShipping;
  actions?: RecordAction[];
  actionsLoading?: boolean;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function MobileRecordCard({
  type,
  status,
  date,
  displayId,
  detailHref,
  items,
  shipping,
  actions,
  actionsLoading,
}: MobileRecordCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header: Status — Date | ⋮ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
            >
              {getStatusLabel(status)}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          </div>
          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={actionsLoading}>
                  {actionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={action.onClick}
                    className={action.variant === "destructive" ? "text-red-600" : ""}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* ID section */}
        <div className="py-3 border-t border-border">
          <SectionHeader>
            {type === "order" ? "Order" : "Subscription"}
          </SectionHeader>
          {type === "order" && detailHref ? (
            <Button variant="outline" size="sm" asChild className="mt-1">
              <Link href={detailHref}>{displayId}</Link>
            </Button>
          ) : (
            <p className="text-sm font-medium mt-0.5">{displayId}</p>
          )}
        </div>

        {/* Items section */}
        <div className="py-3 border-t border-border">
          <SectionHeader>Items</SectionHeader>
          <div className="mt-1 space-y-0">
            {items.map((item, idx) => (
              <div key={item.id}>
                <div className="text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.variant} · {item.purchaseType} · Qty: {item.quantity}
                </div>
                {idx < items.length - 1 && (
                  <div className="border-t border-border my-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ship To section */}
        {shipping && shipping.street && (
          <div className="py-3 border-t border-border">
            <SectionHeader>Ship To</SectionHeader>
            <div className="text-sm mt-0.5">
              {shipping.recipientName && (
                <p className="font-medium">{shipping.recipientName}</p>
              )}
              <p className="text-muted-foreground">
                {shipping.street}, {shipping.city}, {shipping.state}{" "}
                {shipping.postalCode}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
