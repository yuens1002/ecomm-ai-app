"use client";

import { format } from "date-fns";
import Link from "next/link";
import { MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface RecordAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface MobileRecordCardProps {
  type: "order" | "subscription";
  status: string;
  date: Date;
  displayId: string;
  detailHref?: string;
  items: RecordItem[];
  shipping?: RecordShipping;
  deliveryMethod?: string;
  actions?: RecordAction[];
  actionsLoading?: boolean;
  price?: string;
  deliverySchedule?: string;
  currentPeriod?: string;
  detailsSectionHeader?: string;
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
  deliveryMethod,
  actions,
  actionsLoading,
  price,
  deliverySchedule,
  currentPeriod,
  detailsSectionHeader,
}: MobileRecordCardProps) {
  return (
    <div className="px-4 py-3 space-y-3">
      {/* Header: Date ———— [Status ⋮] */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">
          {format(new Date(date), "MMM d, yyyy")}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
          >
            {getStatusLabel(status)}
          </span>
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
                    disabled={action.disabled}
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
      </div>

      {/* SUB section: ID + delivery schedule */}
      <div className="py-1.5">
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
        {deliverySchedule && (
          <p className="text-sm text-foreground mt-0.5">{deliverySchedule}</p>
        )}
      </div>

      {/* SCHEDULE section: price + current billing (before Items for subscriptions) */}
      {(price || currentPeriod) && (
        <div className="py-1.5">
          <SectionHeader>{detailsSectionHeader || "Details"}</SectionHeader>
          <div className="mt-0.5 text-sm space-y-0.5">
            {price && <p className="text-foreground">{price}</p>}
            {currentPeriod && (
              <>
                <SectionHeader>Current Billing</SectionHeader>
                <p className="text-foreground">{currentPeriod}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Items section */}
      <div className="py-1.5">
        <SectionHeader>Items</SectionHeader>
        <div className="mt-1 space-y-0">
          {items.map((item) => (
            <div key={item.id}>
              <div className="text-sm">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.variant} · {item.purchaseType} · Qty: {item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ship To section */}
      {(shipping?.street || (deliveryMethod && deliveryMethod !== "DELIVERY")) && (
        <div className="py-1.5">
          <SectionHeader>Ship To</SectionHeader>
          <div className="text-sm mt-0.5">
            {shipping?.street ? (
              <>
                {shipping.recipientName && (
                  <p className="font-medium">{shipping.recipientName}</p>
                )}
                <p className="text-foreground">
                  {shipping.street}, {shipping.city}, {shipping.state}{" "}
                  {shipping.postalCode}
                </p>
              </>
            ) : (
              <p className="text-foreground italic">Store Pickup</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
