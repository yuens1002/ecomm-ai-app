"use client";

import Link from "next/link";
import { OrderWithItems, OrderItemWithDetails } from "@/lib/types";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface OrderDetailClientProps {
  order: OrderWithItems;
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const { settings } = useSiteSettings();

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getTrackingUrl = (
    carrier: string,
    trackingNumber: string
  ): string | null => {
    const carriers: Record<string, string> = {
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };

    return carriers[carrier] || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "SHIPPED":
      case "PICKED_UP":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PICKED_UP":
        return "Picked Up";
      case "CANCELLED":
        return "Canceled";
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  // Calculate subtotal (sum of all items)
  const subtotal = order.items.reduce(
    (sum: number, item: OrderItemWithDetails) =>
      sum + item.purchaseOption.priceInCents * item.quantity,
    0
  );

  // Calculate shipping (total - subtotal)
  const shipping = order.totalInCents - subtotal;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/orders" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-base">
              Order #{order.id.slice(-8)}
            </h1>
            <p className="text-text-muted mt-1">
              Placed on{" "}
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Order Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-text-muted">
                      Product
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-text-muted">
                      Price
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-text-muted">
                      Quantity
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-text-muted">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item: OrderItemWithDetails) => (
                    <tr key={item.id}>
                      <td className="py-4 px-4">
                        <Link
                          href={`/products/${item.purchaseOption.variant.product.slug}`}
                          className="text-primary hover:underline font-medium truncate block max-w-[200px] sm:max-w-none"
                        >
                          {item.purchaseOption.variant.product.name}
                        </Link>
                        <div className="text-sm text-text-muted mt-1">
                          {item.purchaseOption.variant.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {item.purchaseOption.type === "SUBSCRIPTION"
                            ? `Subscription${
                                item.purchaseOption.billingInterval
                                  ? ` • Every ${item.purchaseOption.intervalCount || 1} ${item.purchaseOption.billingInterval}${(item.purchaseOption.intervalCount || 1) > 1 ? "s" : ""}`
                                  : ""
                              }`
                            : "One-time purchase"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {formatPrice(item.purchaseOption.priceInCents)}
                      </td>
                      <td className="py-4 px-4 text-center">{item.quantity}</td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {formatPrice(
                          item.purchaseOption.priceInCents * item.quantity
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">
                  Shipping (
                  {order.deliveryMethod === "DELIVERY"
                    ? "Standard"
                    : "Store Pickup"}
                  )
                </span>
                <span className="font-medium">{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.totalInCents)} USD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        {order.deliveryMethod === "DELIVERY" && order.shippingStreet && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-text-muted mb-2">
                    Shipping Address
                  </h3>
                  <address className="not-italic text-sm">
                    {order.recipientName && (
                      <>
                        {order.recipientName}
                        <br />
                      </>
                    )}
                    {order.shippingStreet}
                    <br />
                    {order.shippingCity}, {order.shippingState}{" "}
                    {order.shippingPostalCode}
                    <br />
                    {order.shippingCountry}
                  </address>
                </div>

                {/* Tracking information */}
                {order.status === "SHIPPED" && order.trackingNumber && (
                  <div>
                    <h3 className="font-semibold text-sm text-text-muted mb-2">
                      Tracking Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-text-muted" />
                        <span className="text-sm">
                          Shipped{" "}
                          {order.shippedAt &&
                            format(
                              new Date(order.shippedAt),
                              "MMMM d, yyyy 'at' h:mm a"
                            )}
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">
                          Carrier
                        </p>
                        <p className="text-sm font-medium">{order.carrier}</p>
                        <p className="text-xs text-muted-foreground mt-2 mb-1">
                          Tracking Number
                        </p>
                        <p className="text-sm font-mono">
                          {order.trackingNumber}
                        </p>
                      </div>
                      {(() => {
                        const trackingUrl =
                          order.carrier && order.trackingNumber
                            ? getTrackingUrl(
                                order.carrier,
                                order.trackingNumber
                              )
                            : null;
                        return trackingUrl ? (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Track Shipment →
                            </a>
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Pickup Information */}
        {order.deliveryMethod === "PICKUP" && (
          <Card>
            <CardHeader>
              <CardTitle>Pickup Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-text-muted">
                  Your order is ready for pickup at:
                </p>
                <address className="not-italic text-sm">
                  <strong>{settings.storeName}</strong>
                  <br />
                  123 Coffee Street
                  <br />
                  San Francisco, CA 94102
                  <br />
                  United States
                </address>
                <p className="text-sm text-text-muted mt-4">
                  Store hours: Monday - Friday, 8am - 6pm
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Information */}
        {order.paymentCardLast4 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <span>💳</span>
                <span>{order.paymentCardLast4}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
