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
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalInCents: number;
  deliveryMethod: string;
  customerEmail: string;
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
        title: "Order Failed",
        description: `Order #${selectedOrder.orderNumber || selectedOrder.id.slice(-8)} marked as failed`,
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

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-green-100 text-green-800",
      PICKED_UP: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-red-100 text-red-800",
      FAILED: "bg-red-200 text-red-900",
    };

    const labels: Record<string, string> = {
      PENDING: "Pending",
      PROCESSING: "Processing",
      SHIPPED: "Shipped",
      PICKED_UP: "Picked Up",
      CANCELLED: "Canceled",
      FAILED: "Failed",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[status] || status}
      </span>
    );
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
      {/* Filters */}
      <div className="flex justify-between items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Order #
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Shipping Address
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="py-4 px-4">
                      <div className="font-medium flex items-center gap-2">
                        <span>{order.orderNumber || order.id.slice(-8)}</span>
                        {order.stripeSubscriptionId && (
                          <span
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                            title="Subscription order"
                          >
                            🔄 Sub
                          </span>
                        )}
                      </div>
                      {order.trackingNumber && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              order.trackingNumber!
                            );
                            toast({
                              title: "Copied!",
                              description: `Tracking #: ${order.trackingNumber}`,
                            });
                          }}
                          className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center gap-1"
                          title={`${order.carrier}: ${order.trackingNumber}`}
                        >
                          📋 {order.carrier} tracking
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                      <br />
                      <span className="text-xs">
                        {format(new Date(order.createdAt), "h:mm a")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium">
                        {order.user?.name || order.recipientName || "Guest"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            {item.quantity}x{" "}
                            {item.purchaseOption.variant.product.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm max-w-xs">
                      {order.deliveryMethod === "DELIVERY" &&
                      order.shippingStreet ? (
                        <div className="text-sm">
                          {order.recipientName && (
                            <div className="font-medium">
                              {order.recipientName}
                            </div>
                          )}
                          <div>{order.shippingStreet}</div>
                          <div>
                            {order.shippingCity}, {order.shippingState}{" "}
                            {order.shippingPostalCode}
                          </div>
                          <div className="text-muted-foreground">
                            {order.shippingCountry}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Store Pickup
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      ${(order.totalInCents / 100).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {order.status === "PENDING" ? (
                        <div className="flex gap-2 justify-center flex-wrap">
                          {order.deliveryMethod === "DELIVERY" ? (
                            <Button
                              size="sm"
                              onClick={() => openShipDialog(order)}
                            >
                              Ship
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setPickupDialogOpen(true);
                              }}
                            >
                              Pickup Ready
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openFailDialog(order)}
                          >
                            Fail
                          </Button>
                        </div>
                      ) : order.status === "SHIPPED" && order.trackingNumber ? (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={getTrackingUrl(
                              order.carrier!,
                              order.trackingNumber
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Track
                          </a>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

      {/* Fail Order Dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Failed</DialogTitle>
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
              {processing ? "Processing..." : "Mark as Failed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
