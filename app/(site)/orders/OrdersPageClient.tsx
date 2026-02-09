"use client";

import { useEffect, useState, useCallback } from "react";
import { OrderWithItems, OrderItemWithDetails } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useEditAddress } from "@/app/(site)/_hooks/useEditAddress";
import { EditAddressDialog } from "@/app/(site)/_components/account/EditAddressDialog";
import { PageContainer } from "@/components/shared/PageContainer";

// --- Shared Helper Functions ---

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "SHIPPED":
    case "PICKED_UP":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "FAILED":
      return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PICKED_UP":
      return "Picked Up";
    case "CANCELLED":
      return "Canceled";
    case "FAILED":
      return "Failed";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function formatPrice(priceInCents: number) {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

// --- Shared Components ---

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function OrderItemsList({ items }: { items: OrderItemWithDetails[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
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
          {idx < items.length - 1 && (
            <div className="border-t border-border mt-2 pt-2" />
          )}
        </div>
      ))}
    </div>
  );
}

function ShipToInfo({
  order,
  variant = "default",
}: {
  order: OrderWithItems;
  variant?: "default" | "card";
}) {
  if (order.deliveryMethod !== "DELIVERY" || !order.shippingStreet) {
    return (
      <span className="text-text-muted italic text-sm">Store Pickup</span>
    );
  }

  const content = (
    <>
      {order.recipientName && (
        <div className="font-medium">{order.recipientName}</div>
      )}
      {order.customerPhone && (
        <div className="text-text-muted">{order.customerPhone}</div>
      )}
      <div className="text-text-muted">
        {order.shippingStreet}
        {variant === "card" && `, ${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`}
      </div>
      {variant === "default" && (
        <div className="text-text-muted">
          {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
        </div>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <div className="text-sm bg-muted/30 rounded-md p-3">
        <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
          Ship To
        </div>
        {content}
      </div>
    );
  }

  return <div className="text-sm">{content}</div>;
}

// --- Main Component ---

interface OrdersPageClientProps {
  statusFilter?: string;
}

export default function OrdersPageClient({
  statusFilter,
}: OrdersPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrder, setCancelOrder] = useState<OrderWithItems | null>(null);
  const editAddress = useEditAddress({
    getEndpointUrl: (id) => `/api/user/orders/${id}/address`,
    successMessage: "Shipping address updated.",
    onSuccess: (id, form) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                recipientName: form.recipientName,
                shippingStreet: form.street,
                shippingCity: form.city,
                shippingState: form.state,
                shippingPostalCode: form.postalCode,
                shippingCountry: form.country,
              }
            : o
        )
      );
    },
  });
  const activeTab = statusFilter || "all";

  const fetchOrders = useCallback(async () => {
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
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (value: string) => {
    if (value === "all") {
      router.push("/orders");
    } else {
      router.push(`/orders?status=${value}`);
    }
  };

  // --- Cancel Order ---

  const openCancelDialog = (order: OrderWithItems) => {
    setCancelOrder(order);
    setCancelDialogOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;
    const orderId = cancelOrder.id;
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
      setCancelDialogOpen(false);
      setCancelOrder(null);
      toast({
        title: "Order Canceled",
        description: `Order #${orderId.slice(-8)} has been canceled and refunded.`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  // --- Helpers ---

  const canEditAddress = (order: OrderWithItems) =>
    order.status === "PENDING" && order.deliveryMethod === "DELIVERY";

  const canCancelOrder = (order: OrderWithItems) =>
    order.status === "PENDING";

  const hasActions = (order: OrderWithItems) =>
    canEditAddress(order) || canCancelOrder(order);

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

  // --- Render ---

  return (
    <PageContainer>
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
            <SelectItem value="failed">
              Failed ({getOrderCount("failed")})
            </SelectItem>
            <SelectItem value="cancelled">
              Canceled ({getOrderCount("cancelled")})
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
          {/* Desktop Table Header - only on lg screens */}
          <div className="hidden lg:block">
            <CardHeader className="pb-3">
              <div className="grid grid-cols-7 gap-x-[6em] font-semibold text-sm text-text-muted">
                <div>Order</div>
                <div>Date</div>
                <div>Item(s)</div>
                <div>Ship To</div>
                <div className="text-right">Total</div>
                <div className="text-center">Status</div>
                <div className="text-right"></div>
              </div>
            </CardHeader>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div key={order.id}>
                  {/* Mobile/Tablet Card Layout */}
                  <div className="lg:hidden p-4 space-y-3">
                    {/* Header Row: Status, Order #, Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          #{order.id.slice(-8)}
                        </Link>
                      </div>
                      <div className="text-sm text-text-muted">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>

                    {/* Items */}
                    <OrderItemsList items={order.items} />

                    {/* Ship To */}
                    <ShipToInfo order={order} variant="card" />

                    {/* Footer Row: Total and Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="font-semibold text-lg">
                        {formatPrice(order.totalInCents)}
                      </div>
                      {hasActions(order) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={cancellingOrderId === order.id}
                            >
                              {cancellingOrderId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditAddress(order) && (
                              <DropdownMenuItem
                                onClick={() => editAddress.openDialog(order)}
                              >
                                Edit Address
                              </DropdownMenuItem>
                            )}
                            {canCancelOrder(order) && (
                              <DropdownMenuItem
                                onClick={() => openCancelDialog(order)}
                                className="text-red-600"
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Desktop Table Row - only on lg screens */}
                  <div className="hidden lg:grid grid-cols-7 gap-x-[6em] p-4 hover:bg-muted/50 transition-colors items-center">
                    {/* Order */}
                    <div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>
                          #{order.id.slice(-8)}
                        </Link>
                      </Button>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-text-muted">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </div>

                    {/* Items */}
                    <div>
                      <OrderItemsList items={order.items} />
                    </div>

                    {/* Ship To */}
                    <div>
                      <ShipToInfo order={order} />
                    </div>

                    {/* Total */}
                    <div className="text-right font-semibold">
                      {formatPrice(order.totalInCents)}
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      {hasActions(order) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={cancellingOrderId === order.id}
                            >
                              {cancellingOrderId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditAddress(order) && (
                              <DropdownMenuItem
                                onClick={() => editAddress.openDialog(order)}
                              >
                                Edit Address
                              </DropdownMenuItem>
                            )}
                            {canCancelOrder(order) && (
                              <DropdownMenuItem
                                onClick={() => openCancelDialog(order)}
                                className="text-red-600"
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel Order #{cancelOrder?.id.slice(-8)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately cancel your order and process a full refund
              to your original payment method. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order & Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Address Dialog */}
      <EditAddressDialog
        open={editAddress.dialogOpen}
        onOpenChange={editAddress.setDialogOpen}
        title="Edit Shipping Information"
        description="Choose from address book or edit ship to information below."
        savedAddresses={editAddress.savedAddresses}
        addressForm={editAddress.addressForm}
        formLoading={editAddress.formLoading}
        formErrors={editAddress.formErrors}
        onAddressSelect={editAddress.handleSelect}
        onFieldChange={(field, value) => {
          editAddress.setAddressForm((prev) => ({ ...prev, [field]: value }));
          editAddress.setFormErrors((prev) => ({ ...prev, [field]: undefined }));
        }}
        onSubmit={editAddress.handleSubmit}
      />
    </PageContainer>
  );
}
