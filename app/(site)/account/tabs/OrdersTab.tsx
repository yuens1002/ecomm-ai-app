"use client";

import { useEffect, useState } from "react";
import { OrderWithItems, OrderItemWithDetails } from "@/lib/types";
import { getErrorMessage } from "@/lib/error-utils";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Loader2, X, MoreHorizontal, CheckCircle, PenLine } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrewReportForm } from "@/app/(site)/_components/review/BrewReportForm";

interface OrdersTabProps {
  userId: string;
}

interface ReviewFormTarget {
  productId: string;
  productName: string;
  productTastingNotes: string[];
}

export default function OrdersTab({ userId }: OrdersTabProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [reviewFormTarget, setReviewFormTarget] = useState<ReviewFormTarget | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, reviewedRes] = await Promise.all([
          fetch("/api/user/orders"),
          fetch("/api/user/reviewed-products"),
        ]);

        if (!ordersRes.ok) throw new Error("Failed to fetch orders");
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders);

        if (reviewedRes.ok) {
          const reviewedData = await reviewedRes.json();
          setReviewedProductIds(new Set(reviewedData.productIds));
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load orders"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "CANCELLED" } : order
        )
      );
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to cancel order"));
    } finally {
      setCancellingOrderId(null);
    }
  };

  const isCompletedOrder = (status: string) =>
    status === "SHIPPED" || status === "PICKED_UP";

  const isCoffeeProduct = (item: OrderItemWithDetails) =>
    item.purchaseOption.variant.product.type === "COFFEE";

  const handleReviewSuccess = () => {
    if (reviewFormTarget) {
      setReviewedProductIds((prev) => new Set([...prev, reviewFormTarget.productId]));
    }
    setReviewFormTarget(null);
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
    <>
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
                {order.items.map((item: OrderItemWithDetails) => {
                  const product = item.purchaseOption.variant.product;
                  const isReviewed = reviewedProductIds.has(product.id);
                  const canReview = isCompletedOrder(order.status) && isCoffeeProduct(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            className="font-medium text-text-base hover:text-primary truncate"
                          >
                            {product.name}
                          </Link>
                          {canReview && isReviewed && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                              <CheckCircle className="h-3 w-3" />
                              Reported
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted">
                          {item.purchaseOption.variant.name} •{" "}
                          {item.purchaseOption.type === "SUBSCRIPTION"
                            ? "Subscription"
                            : "One-time"}{" "}
                          • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right font-medium">
                          {formatPrice(
                            item.purchaseOption.priceInCents * item.quantity
                          )}
                        </div>
                        {canReview && !isReviewed && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setReviewFormTarget({
                                    productId: product.id,
                                    productName: product.name,
                                    productTastingNotes: product.tastingNotes,
                                  })
                                }
                              >
                                <PenLine className="h-4 w-4 mr-2" />
                                Write Brew Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                <div>
                  <p className="text-sm font-medium text-text-base">
                    Delivery Method
                  </p>
                  <p className="text-sm text-text-muted">
                    {order.deliveryMethod === "DELIVERY"
                      ? "Shipping"
                      : "Store Pickup"}
                  </p>
                </div>
                {order.shippingStreet && order.deliveryMethod === "DELIVERY" && (
                  <div>
                    <p className="text-sm font-medium text-text-base">
                      Shipping Address
                    </p>
                    <p className="text-sm text-text-muted">
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
                    </p>
                  </div>
                )}
                {order.paymentCardLast4 && (
                  <div>
                    <p className="text-sm font-medium text-text-base">
                      Payment Method
                    </p>
                    <p className="text-sm text-text-muted">
                      **** {order.paymentCardLast4}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brew Report Dialog */}
      <Dialog
        open={reviewFormTarget !== null}
        onOpenChange={(open) => !open && setReviewFormTarget(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Brew Report</DialogTitle>
            {reviewFormTarget && (
              <p className="text-sm text-text-muted">{reviewFormTarget.productName}</p>
            )}
          </DialogHeader>
          {reviewFormTarget && (
            <BrewReportForm
              productId={reviewFormTarget.productId}
              productName={reviewFormTarget.productName}
              productTastingNotes={reviewFormTarget.productTastingNotes}
              onSuccess={handleReviewSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
