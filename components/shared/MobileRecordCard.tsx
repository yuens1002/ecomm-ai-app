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
  className?: string;
}

interface MobileRecordCardProps {
  type: "order" | "subscription";
  status: string;
  statusLabel?: string;
  date: Date;
  displayId: string;
  detailHref?: string;
  items: RecordItem[];
  shipping?: RecordShipping;
  deliveryMethod?: string;
  actions?: RecordAction[];
  actionsLoading?: boolean;
  price?: string;
  currentPeriod?: string;
  detailsSectionHeader?: string;
  customer?: { name?: string | null; email?: string | null };
  badge?: React.ReactNode;
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
  statusLabel,
  date,
  displayId,
  detailHref,
  items,
  shipping,
  deliveryMethod,
  actions,
  actionsLoading,
  price,
  currentPeriod,
  detailsSectionHeader,
  customer,
  badge,
}: MobileRecordCardProps) {
  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Status + badge + actions row */}
      <div className="flex items-center justify-end gap-2">
        {badge}
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
        >
          {statusLabel || getStatusLabel(status)}
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
                  className={action.className || (action.variant === "destructive" ? "text-red-600" : "")}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Date */}
      <span className="text-sm text-foreground">
        {format(new Date(date), "MMM d, yyyy")}
      </span>

      {/* ID section */}
      <div>
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

      {/* Customer section (admin) */}
      {customer && (
        <div>
          <SectionHeader>Customer</SectionHeader>
          <p className="text-sm font-medium mt-0.5">{customer.name || "Guest"}</p>
          {customer.email && (
            <p className="text-xs text-muted-foreground">{customer.email}</p>
          )}
        </div>
      )}

      {/* SCHEDULE section */}
      {price && (
        <div>
          <SectionHeader>{detailsSectionHeader || "Details"}</SectionHeader>
          <p className="mt-0.5 text-sm text-foreground">{price}</p>
        </div>
      )}

      {/* CURRENT BILLING section */}
      {currentPeriod && (
        <div>
          <SectionHeader>Current Billing</SectionHeader>
          <p className="mt-0.5 text-sm text-foreground">{currentPeriod}</p>
        </div>
      )}

      {/* Items section */}
      <div>
        <SectionHeader>Items</SectionHeader>
        <div className="mt-1 flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id}>
              <div className="text-sm">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {[item.variant, item.purchaseType, `Qty: ${item.quantity}`].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ship To section */}
      {(shipping?.street || (deliveryMethod && deliveryMethod !== "DELIVERY")) && (
        <div>
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
