"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MobileRecordCard } from "@/components/shared/MobileRecordCard";
import { formatPrice } from "@/components/shared/record-utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RecordActionMenu } from "@/components/shared/RecordActionMenu";
import { RecordItemsList } from "@/components/shared/RecordItemsList";
import { ShippingAddressDisplay } from "@/components/shared/ShippingAddressDisplay";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalInCents: number;
  deliveryMethod: string;
  customerEmail: string;
  customerPhone: string | null;
  recipientName: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  trackingNumber: string | null;
  carrier: string | null;
  user: {
    name: string | null;
    email: string;
  } | null;
  items: Array<{
    quantity: number;
    purchaseOption: {
      variant: {
        name: string;
        product: {
          name: string;
        };
      };
    };
  }>;
};

export default function OrderManagementClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
      setFilteredOrders(data.orders);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else if (statusFilter === "completed") {
      setFilteredOrders(
        orders.filter((o) => o.status === "SHIPPED" || o.status === "PICKED_UP")
      );
    } else {
      setFilteredOrders(orders.filter((o) => o.status === statusFilter));
    }
  }, [statusFilter, orders]);

  async function handleMarkAsShipped() {
    if (!selectedOrder || !trackingNumber || !carrier) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/ship`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber, carrier }),
      });

      if (!res.ok) throw new Error("Failed to mark as shipped");

      toast({
        title: "Order Shipped",
        description: `Order #${selectedOrder.orderNumber || selectedOrder.id.slice(-8)} marked as shipped`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });

      setShipDialogOpen(false);
      setTrackingNumber("");
      setCarrier("");
      setSelectedOrder(null);
      fetchOrders();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark order as shipped",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleMarkAsPickedUp(order: Order) {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/pickup`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to mark as picked up");

      toast({
        title: "Order Picked Up",
        description: `Order #${order.orderNumber || order.id.slice(-8)} marked as picked up`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });

      fetchOrders();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark order as picked up",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setProcessing(false);
    }
  }

  function openShipDialog(order: Order) {
    setSelectedOrder(order);
    setShipDialogOpen(true);
  }

  function openFailDialog(order: Order) {
    setSelectedOrder(order);
    setFailureReason("");
    setFailDialogOpen(true);
  }

  async function handleMarkAsFailed() {
    if (!selectedOrder || !failureReason.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/fail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failureReason.trim() }),
      });

      if (!res.ok) throw new Error("Failed to mark as failed");

      toast({
        title: "Order Unfulfilled",
        description: `Order #${selectedOrder.orderNumber || selectedOrder.id.slice(-8)} marked as unfulfilled`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });

      setFailDialogOpen(false);
      setFailureReason("");
      setSelectedOrder(null);
      fetchOrders();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark order as failed",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setProcessing(false);
    }
  }

  function getTrackingUrl(carrier: string, trackingNumber: string): string {
    const carriers: Record<string, string> = {
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };

    return (
      carriers[carrier] ||
      `https://www.google.com/search?q=${encodeURIComponent(carrier + " " + trackingNumber)}`
    );
  }

  function getOrderActions(order: Order) {
    const actions: import("@/components/shared/MobileRecordCard").RecordAction[] = [];

    if (order.status === "PENDING") {
      if (order.deliveryMethod === "DELIVERY") {
        actions.push({ label: "Ship", onClick: () => openShipDialog(order) });
      } else {
        actions.push({
          label: "Pickup Ready",
          onClick: () => { setSelectedOrder(order); setPickupDialogOpen(true); },
        });
      }
      actions.push({
        label: "Unfulfill",
        onClick: () => openFailDialog(order),
        variant: "destructive",
      });
    } else if (order.status === "SHIPPED" && order.trackingNumber) {
      actions.push({
        label: "Track Package",
        onClick: () => window.open(getTrackingUrl(order.carrier!, order.trackingNumber!), "_blank"),
      });
    }

    return actions;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="FAILED">Unfulfilled</TabsTrigger>
          <TabsTrigger value="CANCELLED">Canceled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile/Tablet Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="py-0 gap-0">
                <MobileRecordCard
                  type="order"
                  status={order.status}
                  date={new Date(order.createdAt)}
                  displayId={`#${order.orderNumber || order.id.slice(-8)}`}
                  badge={order.stripeSubscriptionId ? (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Sub</span>
                  ) : undefined}
                  customer={{ name: order.user?.name || order.recipientName, email: order.customerEmail }}
                  items={order.items.map((item, idx) => ({
                    id: String(idx),
                    name: item.purchaseOption.variant.product.name,
                    variant: item.purchaseOption.variant.name,
                    purchaseType: "",
                    quantity: item.quantity,
                  }))}
                  price={`$${(order.totalInCents / 100).toFixed(2)}`}
                  detailsSectionHeader="Total"
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
                  actions={getOrderActions(order)}
                />
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden xl:block border rounded-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Ship To</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="py-4 px-4">
                        {order.stripeSubscriptionId && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full inline-block mb-1">
                            Sub
                          </span>
                        )}
                        <div className="font-medium">
                          {order.orderNumber || order.id.slice(-8)}
                        </div>
                        {order.trackingNumber && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.trackingNumber!);
                              toast({ title: "Copied!", description: `Tracking #: ${order.trackingNumber}` });
                            }}
                            className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1"
                            title={`${order.carrier}: ${order.trackingNumber}`}
                          >
                            {order.carrier} tracking
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                        <br />
                        <span className="text-xs">{format(new Date(order.createdAt), "h:mm a")}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium">{order.user?.name || order.recipientName || "Guest"}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                      </td>
                      <td className="py-4 px-4">
                        <RecordItemsList
                          items={order.items.map((item, idx) => ({
                            id: String(idx),
                            name: item.purchaseOption.variant.product.name,
                            variant: item.purchaseOption.variant.name,
                            purchaseType: "",
                            quantity: item.quantity,
                          }))}
                        />
                      </td>
                      <td className="py-4 px-4 text-sm max-w-xs">
                        <ShippingAddressDisplay
                          recipientName={order.recipientName}
                          phone={order.customerPhone}
                          street={order.deliveryMethod === "DELIVERY" ? order.shippingStreet : null}
                          city={order.shippingCity}
                          state={order.shippingState}
                          postalCode={order.shippingPostalCode}
                          country={order.shippingCountry}
                          showCountry
                        />
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">{formatPrice(order.totalInCents)}</td>
                      <td className="py-4 px-4 text-center">
                        <StatusBadge
                          status={order.status}
                          colorClassName={order.status === "PICKED_UP" ? "bg-purple-100 text-purple-800" : undefined}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <RecordActionMenu actions={getOrderActions(order)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Ship Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Enter tracking information for order #
              {selectedOrder?.orderNumber || selectedOrder?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger id="carrier">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShipDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsShipped}
              disabled={!trackingNumber || !carrier || processing}
            >
              {processing ? "Processing..." : "Mark as Shipped"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pickup Ready Dialog */}
      <Dialog open={pickupDialogOpen} onOpenChange={setPickupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Ready for Pickup</DialogTitle>
            <DialogDescription>
              Confirm that order #
              {selectedOrder?.orderNumber || selectedOrder?.id.slice(-8)} is
              ready for customer pickup. The customer will receive an email
              notification.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Customer:{" "}
              {selectedOrder?.user?.name ||
                selectedOrder?.recipientName ||
                "Guest"}
            </p>
            <p className="text-sm text-muted-foreground">
              Email: {selectedOrder?.customerEmail}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPickupDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder) {
                  handleMarkAsPickedUp(selectedOrder);
                  setPickupDialogOpen(false);
                }
              }}
              disabled={processing}
            >
              {processing ? "Processing..." : "Confirm Pickup Ready"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unfulfill Order Dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unfulfill Order</DialogTitle>
            <DialogDescription>
              Provide a reason for failing order #
              {selectedOrder?.orderNumber || selectedOrder?.id.slice(-8)}. The
              customer will be notified via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="failureReason">Failure Reason</Label>
              <Input
                id="failureReason"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="e.g., Out of stock, Payment issue, Unable to ship"
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the customer notification.
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Customer:</strong>{" "}
                {selectedOrder?.user?.name ||
                  selectedOrder?.recipientName ||
                  "Guest"}
              </p>
              <p>
                <strong>Email:</strong> {selectedOrder?.customerEmail}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFailDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkAsFailed}
              disabled={!failureReason.trim() || processing}
            >
              {processing ? "Processing..." : "Unfulfill Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
