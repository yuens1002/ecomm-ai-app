"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal } from "lucide-react";
import {
  cancelSubscription,
  skipBillingPeriod,
  resumeSubscription,
} from "./actions";

type Subscription = {
  id: string;
  stripeSubscriptionId: string;
  status: "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE";
  priceInCents: number;
  deliverySchedule: string | null;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  pausedUntil: Date | null;
  productNames: string[];
  recipientName: string | null;
  recipientPhone: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
};

interface SubscriptionManagementClientProps {
  initialSubscriptions: Subscription[];
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "PAST_DUE", label: "Past Due" },
  { value: "CANCELED", label: "Canceled" },
] as const;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELED: "bg-gray-100 text-gray-800",
};

export default function SubscriptionManagementClient({
  initialSubscriptions,
}: SubscriptionManagementClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Filter subscriptions based on status
  const filteredSubscriptions =
    statusFilter === "all"
      ? initialSubscriptions
      : initialSubscriptions.filter((s) => s.status === statusFilter);

  async function handleCancelSubscription() {
    if (!selectedSubscription) return;

    setProcessing(true);
    try {
      const result = await cancelSubscription(selectedSubscription.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel subscription");
      }

      toast({
        title: "Subscription Canceled",
        description: `Subscription #${selectedSubscription.id.slice(-8)} will be canceled at period end`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });

      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleSkipBilling() {
    if (!selectedSubscription) return;

    setProcessing(true);
    try {
      const result = await skipBillingPeriod(selectedSubscription.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to skip billing period");
      }

      toast({
        title: "Billing Period Skipped",
        description: `Next billing period for subscription #${selectedSubscription.id.slice(-8)} will be skipped`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });

      setSkipDialogOpen(false);
      setSelectedSubscription(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to skip billing period",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleResumeSubscription() {
    if (!selectedSubscription) return;

    setProcessing(true);
    try {
      const result = await resumeSubscription(selectedSubscription.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to resume subscription");
      }

      toast({
        title: "Subscription Resumed",
        description: `Subscription #${selectedSubscription.id.slice(-8)} has been resumed`,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });

      setResumeDialogOpen(false);
      setSelectedSubscription(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to resume subscription",
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setProcessing(false);
    }
  }

  function openCancelDialog(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  }

  function openSkipDialog(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setSkipDialogOpen(true);
  }

  function openResumeDialog(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setResumeDialogOpen(true);
  }

  function getStatusBadge(status: string, cancelAtPeriodEnd: boolean) {
    const labels: Record<string, string> = {
      ACTIVE: cancelAtPeriodEnd ? "Canceling" : "Active",
      PAUSED: "Paused",
      PAST_DUE: "Past Due",
      CANCELED: "Canceled",
    };

    const color = cancelAtPeriodEnd
      ? "bg-orange-100 text-orange-800"
      : statusColors[status] || "bg-gray-100 text-gray-800";

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
        {labels[status] || status}
      </span>
    );
  }

  function getNextDateDisplay(subscription: Subscription) {
    if (subscription.status === "CANCELED") {
      return <span className="text-muted-foreground">—</span>;
    }

    if (subscription.status === "PAUSED") {
      if (subscription.pausedUntil) {
        return format(new Date(subscription.pausedUntil), "MMM d, yyyy");
      }
      // Paused indefinitely
      return <span className="text-muted-foreground">—</span>;
    }

    // ACTIVE or PAST_DUE - show next renewal date
    return format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy");
  }

  function canSkip(subscription: Subscription) {
    return subscription.status === "ACTIVE" && !subscription.cancelAtPeriodEnd;
  }

  function canCancel(subscription: Subscription) {
    return (
      (subscription.status === "ACTIVE" || subscription.status === "PAUSED") &&
      !subscription.cancelAtPeriodEnd
    );
  }

  function canResume(subscription: Subscription) {
    return subscription.status === "PAUSED";
  }

  function formatShippingAddress(subscription: Subscription) {
    if (!subscription.shippingStreet) {
      return <span className="text-muted-foreground italic">No address</span>;
    }

    return (
      <div className="text-sm">
        {subscription.recipientName && (
          <div className="font-medium">{subscription.recipientName}</div>
        )}
        {subscription.recipientPhone && (
          <div className="text-muted-foreground">{subscription.recipientPhone}</div>
        )}
        <div>{subscription.shippingStreet}</div>
        <div>
          {subscription.shippingCity}, {subscription.shippingState}{" "}
          {subscription.shippingPostalCode}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Subscriptions Table */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No subscriptions found
            </p>
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
                    Schedule
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Next / Resumes
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Ship To
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
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-muted/30">
                    <td className="py-4 px-4">
                      <div className="font-medium">
                        {subscription.id.slice(-8)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {subscription.deliverySchedule || "—"}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {getNextDateDisplay(subscription)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium">
                        {subscription.user?.name ||
                          subscription.recipientName ||
                          "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subscription.user?.email || "—"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {subscription.productNames.length > 0
                          ? subscription.productNames.join(", ")
                          : "—"}
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      {formatShippingAddress(subscription)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      ${(subscription.priceInCents / 100).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(
                        subscription.status,
                        subscription.cancelAtPeriodEnd
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={
                              subscription.status === "CANCELED" ||
                              subscription.cancelAtPeriodEnd
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openSkipDialog(subscription)}
                            disabled={!canSkip(subscription)}
                            className={
                              !canSkip(subscription)
                                ? "text-muted-foreground"
                                : ""
                            }
                          >
                            Skip Next Billing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openResumeDialog(subscription)}
                            disabled={!canResume(subscription)}
                            className={
                              canResume(subscription)
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            Resume Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openCancelDialog(subscription)}
                            disabled={!canCancel(subscription)}
                            className={
                              canCancel(subscription)
                                ? "text-red-600"
                                : "text-muted-foreground"
                            }
                          >
                            Cancel Subscription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel subscription #
              {selectedSubscription?.id.slice(-8)}? The customer will retain
              access until the current billing period ends.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Customer:</strong>{" "}
              {selectedSubscription?.user?.name ||
                selectedSubscription?.recipientName ||
                "—"}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {selectedSubscription?.user?.email || "—"}
            </p>
            <p>
              <strong>Current Period Ends:</strong>{" "}
              {selectedSubscription &&
                format(
                  new Date(selectedSubscription.currentPeriodEnd),
                  "MMM d, yyyy"
                )}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={processing}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={processing}
            >
              {processing ? "Processing..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Billing Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Next Billing Period</DialogTitle>
            <DialogDescription>
              Skip the next billing period for subscription #
              {selectedSubscription?.id.slice(-8)}? The subscription will
              automatically resume after one billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Customer:</strong>{" "}
              {selectedSubscription?.user?.name ||
                selectedSubscription?.recipientName ||
                "—"}
            </p>
            <p>
              <strong>Schedule:</strong>{" "}
              {selectedSubscription?.deliverySchedule || "—"}
            </p>
            <p>
              <strong>Next Billing Date:</strong>{" "}
              {selectedSubscription &&
                format(
                  new Date(selectedSubscription.currentPeriodEnd),
                  "MMM d, yyyy"
                )}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSkipDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleSkipBilling} disabled={processing}>
              {processing ? "Processing..." : "Skip Next Billing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Subscription Dialog */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Subscription</DialogTitle>
            <DialogDescription>
              Resume subscription #{selectedSubscription?.id.slice(-8)}? Billing
              will continue from the next billing cycle.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Customer:</strong>{" "}
              {selectedSubscription?.user?.name ||
                selectedSubscription?.recipientName ||
                "—"}
            </p>
            <p>
              <strong>Schedule:</strong>{" "}
              {selectedSubscription?.deliverySchedule || "—"}
            </p>
            {selectedSubscription?.pausedUntil && (
              <p>
                <strong>Was set to resume:</strong>{" "}
                {format(
                  new Date(selectedSubscription.pausedUntil),
                  "MMM d, yyyy"
                )}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResumeDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleResumeSubscription} disabled={processing}>
              {processing ? "Processing..." : "Resume Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
