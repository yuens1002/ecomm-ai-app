"use client";

import { useEffect, useState, useCallback } from "react";
import { OrderWithItems } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MobileRecordCard } from "@/components/shared/MobileRecordCard";
import { formatPrice } from "@/components/shared/record-utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RecordActionMenu } from "@/components/shared/RecordActionMenu";
import { RecordItemsList } from "@/components/shared/RecordItemsList";
import { ShippingAddressDisplay } from "@/components/shared/ShippingAddressDisplay";
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
import { useToast } from "@/hooks/use-toast";
import { useEditAddress } from "@/app/(site)/_hooks/useEditAddress";
import { EditAddressDialog } from "@/app/(site)/_components/account/EditAddressDialog";
import { PageContainer } from "@/components/shared/PageContainer";

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
              Unfulfilled ({getOrderCount("failed")})
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
        <div className="xl:border xl:border-border xl:rounded-lg xl:bg-card">
          {/* Desktop Table Header - only on xl screens */}
          <div className="hidden xl:block">
            <div className="bg-muted/50 rounded-t-lg px-4 py-3 border-b border-border">
              <div className="grid grid-cols-7 gap-x-[6em] font-semibold text-sm text-text-muted">
                <div>Order</div>
                <div>Date</div>
                <div>Item(s)</div>
                <div>Ship To</div>
                <div className="text-right">Total</div>
                <div className="text-center">Status</div>
                <div className="text-right"></div>
              </div>
            </div>
          </div>
          {/* Mobile/Tablet Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="py-0 gap-0">
                <MobileRecordCard
                  type="order"
                  status={order.status}
                  date={order.createdAt}
                  displayId={`#${order.id.slice(-8)}`}
                  detailHref={`/orders/${order.id}`}
                  items={order.items.map((item) => ({
                    id: item.id,
                    name: item.purchaseOption.variant.product.name,
                    variant: item.purchaseOption.variant.name,
                    purchaseType:
                      item.purchaseOption.type === "SUBSCRIPTION"
                        ? "Subscription"
                        : "One-time",
                    quantity: item.quantity,
                  }))}
                  shipping={
                    order.shippingStreet
                      ? {
                          recipientName: order.recipientName,
                          street: order.shippingStreet,
                          city: order.shippingCity,
                          state: order.shippingState,
                          postalCode: order.shippingPostalCode,
                        }
                      : undefined
                  }
                  deliveryMethod={order.deliveryMethod}
                  actions={
                    hasActions(order)
                      ? [
                          ...(canEditAddress(order)
                            ? [
                                {
                                  label: "Edit Address",
                                  onClick: () => editAddress.openDialog(order),
                                },
                              ]
                            : []),
                          ...(canCancelOrder(order)
                            ? [
                                {
                                  label: "Cancel Order",
                                  onClick: () => openCancelDialog(order),
                                  variant: "destructive" as const,
                                },
                              ]
                            : []),
                        ]
                      : undefined
                  }
                  actionsLoading={cancellingOrderId === order.id}
                />
              </Card>
            ))}
          </div>

          {/* Desktop Table Rows */}
          <div className="hidden xl:block xl:divide-y xl:divide-border">
            {filteredOrders.map((order) => (
              <div key={order.id} className="grid grid-cols-7 gap-x-[6em] p-4 hover:bg-muted/50 transition-colors items-center">
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
                  <RecordItemsList
                    items={order.items.map((item) => ({
                      id: item.id,
                      name: item.purchaseOption.variant.product.name,
                      variant: item.purchaseOption.variant.name,
                      purchaseType:
                        item.purchaseOption.type === "SUBSCRIPTION"
                          ? "Subscription"
                          : "One-time",
                      quantity: item.quantity,
                      href: `/products/${item.purchaseOption.variant.product.slug}`,
                    }))}
                  />
                </div>

                {/* Ship To */}
                <div>
                  <ShippingAddressDisplay
                    recipientName={order.recipientName}
                    phone={order.customerPhone}
                    street={order.deliveryMethod === "DELIVERY" ? order.shippingStreet : null}
                    city={order.shippingCity}
                    state={order.shippingState}
                    postalCode={order.shippingPostalCode}
                    mutedClassName="text-text-muted"
                    muteAddressLines
                  />
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
                    <RecordActionMenu
                      actions={[
                        ...(canEditAddress(order)
                          ? [{ label: "Edit Address", onClick: () => editAddress.openDialog(order) }]
                          : []),
                        ...(canCancelOrder(order)
                          ? [{ label: "Cancel Order", onClick: () => openCancelDialog(order), variant: "destructive" as const }]
                          : []),
                      ]}
                      loading={cancellingOrderId === order.id}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
