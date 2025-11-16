"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface OrdersPageClientProps {
  userId: string;
  statusFilter?: string;
}

export default function OrdersPageClient({
  userId,
  statusFilter,
}: OrdersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const activeTab = statusFilter || "all";

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter
        ? `/api/user/orders?status=${statusFilter}`
        : "/api/user/orders";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "all") {
      router.push("/orders");
    } else {
      router.push(`/orders?status=${value}`);
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

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
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
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  const getOrderCount = (status?: string) => {
    if (!status || status === "all") return orders.length;
    if (status === "completed") {
      return orders.filter(
        (o) => o.status === "SHIPPED" || o.status === "PICKED_UP"
      ).length;
    }
    return orders.filter((o) => o.status === status.toUpperCase()).length;
  };

  const filteredOrders = orders.filter((order) => {
    if (!statusFilter || statusFilter === "all") return true;
    if (statusFilter === "completed") {
      return order.status === "SHIPPED" || order.status === "PICKED_UP";
    }
    return order.status === statusFilter.toUpperCase();
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-base mb-2">
          Order History
        </h1>
        <p className="text-text-muted">View and manage your past orders</p>
      </div>

      <div className="mb-6">
        <Select value={activeTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filter orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Orders ({getOrderCount("all")})
            </SelectItem>
            <SelectItem value="pending">
              Pending ({getOrderCount("pending")})
            </SelectItem>
            <SelectItem value="completed">
              Completed ({getOrderCount("completed")})
            </SelectItem>
            <SelectItem value="cancelled">
              Cancelled ({getOrderCount("cancelled")})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-text-muted mb-4">No orders found</p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="hidden md:block">
            <CardHeader className="pb-3">
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-text-muted">
                <div className="col-span-2">Order</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Item(s)</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-right"></div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredOrders.map((order, index) => (
                <div
                  key={order.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 hover:bg-muted/50 transition-colors md:items-center ${
                    index === 0 ? "pt-0 md:p-4 pb-4 px-4" : "p-4"
                  }`}
                >
                  {/* Status - Mobile First */}
                  <div className="col-span-1 md:col-span-2 md:order-4 md:text-center">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Order Number - Mobile Second */}
                  <div className="col-span-1 md:col-span-2 md:order-1">
                    <h2 className="md:hidden text-lg font-semibold">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        #{order.id.slice(-8)}
                      </Link>
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hidden md:inline-flex"
                    >
                      <Link href={`/orders/${order.id}`}>
                        #{order.id.slice(-8)}
                      </Link>
                    </Button>
                  </div>

                  {/* Date - Desktop Only */}
                  <div className="hidden md:block md:col-span-2 md:order-2">
                    <div className="text-sm text-text-muted">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>

                  {/* Items - Mobile Third */}
                  <div className="col-span-1 md:col-span-2 md:order-3">
                    <div className="space-y-2">
                      {order.items.map((item: any, idx: number) => (
                        <div key={item.id}>
                          <div className="text-sm">
                            <Link
                              href={`/products/${item.purchaseOption.variant.product.slug}`}
                              className="text-text-base hover:text-primary"
                            >
                              {item.purchaseOption.variant.product.name}
                            </Link>
                          </div>
                          <div className="text-xs text-text-muted">
                            {item.purchaseOption.variant.name} •{" "}
                            {item.purchaseOption.type === "SUBSCRIPTION"
                              ? "Subscription"
                              : "One-time"}{" "}
                            • Qty: {item.quantity}
                          </div>
                          {idx < order.items.length - 1 && (
                            <div className="border-t border-border mt-2 pt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total - Desktop Only */}
                  <div className="hidden md:block md:col-span-2 md:order-5 md:text-right">
                    <div className="font-semibold">
                      {formatPrice(order.totalInCents)}
                    </div>
                  </div>

                  {/* Actions - Mobile Fourth (Cancel Button Only) */}
                  <div className="col-span-1 md:col-span-2 md:order-6 flex items-center justify-start md:justify-end">
                    {order.status === "PENDING" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full md:w-auto"
                            disabled={cancellingOrderId === order.id}
                          >
                            {cancellingOrderId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>Cancel Order</span>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel Order #{order.id.slice(-8)}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately cancel your order and
                              process a full refund to your original payment
                              method. This action cannot be undone.
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
