"use client";

import { format } from "date-fns";
import { OrderWithItems } from "@/lib/types";
import { getTrackingUrl } from "./tracking-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShipmentStatusDialogProps {
  order: OrderWithItems;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimelineStep {
  label: string;
  detail?: string;
  timestamp: string | null;
  active: boolean;
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
  };
}

export function ShipmentStatusDialog({
  order,
  open,
  onOpenChange,
}: ShipmentStatusDialogProps) {
  const steps: TimelineStep[] = [
    {
      label: "Order Placed",
      timestamp: order.createdAt
        ? format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")
        : null,
      active: true,
    },
  ];

  if (order.shippedAt) {
    const trackingUrl =
      order.carrier && order.trackingNumber
        ? getTrackingUrl(order.carrier, order.trackingNumber)
        : null;

    steps.push({
      label: `Shipped via ${order.carrier || "carrier"}`,
      detail: order.trackingNumber
        ? `Tracking: ${order.trackingNumber}`
        : undefined,
      timestamp: format(
        new Date(order.shippedAt),
        "MMM d, yyyy 'at' h:mm a"
      ),
      active: true,
      trackingInfo:
        order.carrier && order.trackingNumber
          ? {
              carrier: order.carrier,
              trackingNumber: order.trackingNumber,
              trackingUrl,
            }
          : undefined,
    });
  }

  // Out for Delivery step
  const isOfd = order.status === "OUT_FOR_DELIVERY";
  const isDelivered = order.status === "DELIVERED";

  steps.push({
    label: "Out for Delivery",
    timestamp: null,
    active: isOfd || isDelivered,
  });

  if (isDelivered && order.deliveredAt) {
    steps.push({
      label: "Delivered",
      timestamp: format(
        new Date(order.deliveredAt),
        "MMM d, yyyy 'at' h:mm a"
      ),
      active: true,
    });
  } else {
    steps.push({
      label: "Delivered",
      timestamp: null,
      active: false,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Shipment Status</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="relative pl-8">
            {steps.map((step, i) => (
              <div key={i} className="relative pb-8 last:pb-0">
                {/* Vertical line */}
                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-[-20px] top-3 w-0.5 h-full ${
                      step.active && steps[i + 1]?.active
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                )}

                {/* Dot */}
                <div
                  className={`absolute left-[-24px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                    step.active
                      ? "bg-primary border-primary"
                      : "bg-background border-muted-foreground/30"
                  }`}
                />

                {/* Content */}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      step.active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.timestamp}
                    </p>
                  )}
                  {step.detail && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {step.detail}
                    </p>
                  )}
                  {step.trackingInfo?.trackingUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-1 text-xs"
                      asChild
                    >
                      <a
                        href={step.trackingInfo.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Track Package →
                      </a>
                    </Button>
                  )}
                  {!step.active && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      Pending
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
