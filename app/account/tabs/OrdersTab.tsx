"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrdersTabProps {
  userId: string;
}

/**
 * Orders Tab Component
 *
 * Features:
 * - Display user's order history
 * - Show order status and details
 * - Link to product pages
 * - Empty state for new users
 *
 * Educational Notes:
 * - Orders are fetched client-side to keep account page responsive
 * - Could be optimized with server-side rendering if needed
 * - Pagination should be added for users with many orders
 */
export default function OrdersTab({ userId }: OrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/user/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data.orders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

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

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel order");
      }

      // Update the order in the local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "CANCELLED" } : order
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            Error loading orders: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and track your past orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-text-muted">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No orders yet.</p>
            <p className="text-sm mb-6">
              Start shopping to see your order history here!
            </p>
            <Button asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            View and track your past orders. Total orders: {orders.length}
          </CardDescription>
        </CardHeader>
      </Card>

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
              <div className="flex items-center gap-3">
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
                {order.status === "PENDING" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={cancellingOrderId === order.id}
                      >
                        {cancellingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Cancel Order #{order.id.slice(-8)}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately cancel your order and process a
                          full refund to your original payment method. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelOrder(order.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel Order & Refund
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.purchaseOption.variant.product.slug}`}
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

            <div className="mt-4 pt-4 border-t space-y-2">
              <div>
                <p className="text-sm font-medium text-text-base">
                  Delivery Method
                </p>
                <p className="text-sm text-text-muted">
                  {order.deliveryMethod === "DELIVERY"
                    ? "🚚 Shipping"
                    : "🏪 Store Pickup"}
                </p>
              </div>
              {order.shippingAddress && order.deliveryMethod === "DELIVERY" && (
                <div>
                  <p className="text-sm font-medium text-text-base">
                    Shipping Address
                  </p>
                  <p className="text-sm text-text-muted">
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}
              {order.paymentCardLast4 && (
                <div>
                  <p className="text-sm font-medium text-text-base">
                    Payment Method
                  </p>
                  <p className="text-sm text-text-muted">
                    💳 {order.paymentCardLast4}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
