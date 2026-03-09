import { ExternalLink, MapPin, PenLine, Truck, XCircle } from "lucide-react";
import type { RowActionConfigEntry } from "@/components/shared/data-table/row-action-config";
import type { OrderWithItems } from "@/lib/types";

// ── Predicates ─────────────────────────────────────────────────────

const isPending = (o: OrderWithItems) => o.status === "PENDING";
const isDelivery = (o: OrderWithItems) => o.deliveryMethod === "DELIVERY";
const isShippedOrDelivered = (o: OrderWithItems) =>
  o.status === "SHIPPED" ||
  o.status === "OUT_FOR_DELIVERY" ||
  o.status === "DELIVERED";

/**
 * Review eligibility: delivered 7+ days ago, not fully refunded.
 * The sub-menu resolver separately filters for unreviewed products.
 */
const isReviewEligible = (o: OrderWithItems) => {
  if (o.status !== "DELIVERED" || !o.deliveredAt) return false;
  if (o.refundedAmountInCents >= o.totalInCents) return false;
  const daysSinceDelivery =
    (Date.now() - new Date(o.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery >= 7;
};

// ── Config ─────────────────────────────────────────────────────────

export const userOrderRowActions: RowActionConfigEntry<OrderWithItems>[] = [
  {
    id: "seeOrderDetail",
    type: "item",
    label: "See Order Detail",
    icon: ExternalLink,
    when: () => true,
  },
  {
    id: "shipmentStatus",
    type: "item",
    label: "Shipment Status",
    icon: Truck,
    when: isShippedOrDelivered,
  },
  {
    id: "editAddress",
    type: "item",
    label: "Edit Address",
    icon: MapPin,
    when: (o) => isPending(o) && isDelivery(o),
  },
  {
    type: "separator",
    when: isPending,
  },
  {
    id: "cancelOrder",
    type: "item",
    label: "Cancel Order",
    icon: XCircle,
    variant: "destructive",
    when: isPending,
  },
  {
    type: "separator",
    when: isReviewEligible,
  },
  {
    id: "writeReview",
    type: "sub-menu-click",
    label: "Write a Review",
    icon: PenLine,
    when: isReviewEligible,
    getItems: () => [],
  },
];

/**
 * Creates a config with dynamic review sub-menu items.
 * Called once per render with the current reviewedProductIds set.
 */
export function getUserOrderRowActions(
  reviewedProductIds: Set<string>
): RowActionConfigEntry<OrderWithItems>[] {
  return userOrderRowActions.map((entry) => {
    if ("id" in entry && entry.id === "writeReview") {
      return {
        ...entry,
        when: (o: OrderWithItems) =>
          isReviewEligible(o) &&
          o.items.some(
            (item) =>
              !reviewedProductIds.has(item.purchaseOption.variant.product.id)
          ),
        getItems: (o: OrderWithItems) =>
          o.items
            .filter(
              (item) =>
                !reviewedProductIds.has(item.purchaseOption.variant.product.id)
            )
            .map((item) => ({
              key: item.purchaseOption.variant.product.id,
              label: item.purchaseOption.variant.product.name,
            })),
      };
    }
    return entry;
  });
}
