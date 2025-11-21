"use client";

import Link from "next/link";
import { OrderWithItems, OrderItemWithDetails } from "@/lib/types";
import { format } from "date-fns";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrdersClientProps {
  orders: OrderWithItems[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "PICKED_UP":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">No Orders Yet</h1>
          <p className="text-text-muted mb-8">
            You haven&apos;t placed any orders. Start shopping to see your order
            history here!
          </p>
          <Button asChild size="lg">
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-text-base mb-8">Order History</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(-8)}
                  </CardTitle>
                  <p className="text-sm text-text-muted mt-1">
                    Placed on {format(new Date(order.createdAt), "PPP")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-text-base">
                    {formatPrice(order.totalInCents)}
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item: OrderItemWithDetails) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/${item.purchaseOption.variant.product.roastLevel.toLowerCase()}-roast/${item.purchaseOption.variant.product.slug}`}
                        className="font-medium text-text-base hover:text-primary"
                      >
                        {item.purchaseOption.variant.product.name}
                      </Link>
                      <p className="text-sm text-text-muted">
                        {item.purchaseOption.variant.name} •{" "}
                        {item.purchaseOption.type === "SUBSCRIPTION"
                          ? "Subscription"
                          : "One-time"}{" "}
                        • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-medium">
                      {formatPrice(
                        item.purchaseOption.priceInCents * item.quantity
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {order.stripeSessionId && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-text-muted">
                    Order ID: {order.stripeSessionId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
