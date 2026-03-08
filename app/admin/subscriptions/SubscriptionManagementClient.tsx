"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MobileRecordCard } from "@/components/shared/MobileRecordCard";
import {
  DataTable,
  DataTableActionBar,
  DataTablePageSizeSelector,
  DataTablePagination,
} from "@/components/shared/data-table";
import { useInfiniteScroll } from "@/components/shared/data-table/hooks/useInfiniteScroll";
import type { ActionBarConfig } from "@/components/shared/data-table/types";
import type { RowActionItem } from "@/components/shared/data-table/RowActionMenu";
import { resolveRowActions } from "@/components/shared/data-table/row-action-config";
import type { RowActionHandlers } from "@/components/shared/data-table/row-action-config";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  cancelSubscription,
  skipBillingPeriod,
  resumeSubscription,
} from "./actions";
import {
  useSubscriptionsTable,
  type Subscription,
} from "./hooks/useSubscriptionsTable";
import { adminSubscriptionRowActions } from "./constants/row-actions";

type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "PAST_DUE" | "CANCELED";

interface SubscriptionManagementClientProps {
  initialSubscriptions: Subscription[];
}

export default function SubscriptionManagementClient({
  initialSubscriptions,
}: SubscriptionManagementClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Filter subscriptions
  const filteredSubscriptions = useMemo(
    () =>
      statusFilter === "all"
        ? initialSubscriptions
        : initialSubscriptions.filter((s) => s.status === statusFilter),
    [statusFilter, initialSubscriptions]
  );

  // ── Dialog handlers ────────────────────────────────────────────────

  async function handleCancelSubscription() {
    if (!selectedSubscription) return;
    setProcessing(true);
    try {
      const result = await cancelSubscription(selectedSubscription.id);
      if (!result.success)
        throw new Error(result.error || "Failed to cancel subscription");
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
      if (!result.success)
        throw new Error(result.error || "Failed to skip billing period");
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
      if (!result.success)
        throw new Error(result.error || "Failed to resume subscription");
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

  // ── Declarative action menu ────────────────────────────────────────

  const actionHandlers = useMemo<RowActionHandlers<Subscription>>(
    () => ({
      skipBilling: (sub) => {
        setSelectedSubscription(sub);
        setSkipDialogOpen(true);
      },
      resume: (sub) => {
        setSelectedSubscription(sub);
        setResumeDialogOpen(true);
      },
      cancel: (sub) => {
        setSelectedSubscription(sub);
        setCancelDialogOpen(true);
      },
      manageStripe: (sub) =>
        window.open(
          `https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`,
          "_blank"
        ),
    }),
    []
  );

  const getActionItems = useCallback(
    (sub: Subscription): RowActionItem[] =>
      resolveRowActions(sub, adminSubscriptionRowActions, actionHandlers),
    [actionHandlers]
  );

  // ── Table hook ─────────────────────────────────────────────────────

  const {
    table,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filterConfigs,
  } = useSubscriptionsTable({
    subscriptions: filteredSubscriptions,
    getActionItems,
  });

  // Infinite scroll
  const allFilteredRows = table.getFilteredRowModel().rows;
  const batchSize = table.getState().pagination.pageSize;
  const {
    visibleCount,
    sentinelRef,
    hasMore,
    reset: resetScroll,
  } = useInfiniteScroll({
    totalCount: allFilteredRows.length,
    batchSize,
  });

  const scrollKey = `${statusFilter}|${searchQuery}|${JSON.stringify(activeFilter)}`;
  const prevScrollKey = useRef(scrollKey);
  useEffect(() => {
    if (scrollKey !== prevScrollKey.current) {
      prevScrollKey.current = scrollKey;
      resetScroll();
    }
  }, [scrollKey, resetScroll]);

  // ── Action bar ─────────────────────────────────────────────────────

  const actionBarConfig: ActionBarConfig = {
    left: [
      {
        type: "custom",
        content: (
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ACTIVE">Active</TabsTrigger>
              <TabsTrigger value="PAUSED">Paused</TabsTrigger>
              <TabsTrigger value="PAST_DUE">Past Due</TabsTrigger>
              <TabsTrigger value="CANCELED">Canceled</TabsTrigger>
            </TabsList>
          </Tabs>
        ),
      },
      {
        type: "search",
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: "Search subscriptions...",
        collapse: { icon: Search },
      },
      {
        type: "filter",
        configs: filterConfigs,
        activeFilter,
        onFilterChange: setActiveFilter,
        collapse: { icon: Filter },
      },
    ],
    right: [
      {
        type: "recordCount",
        count: allFilteredRows.length,
        label: "subscriptions",
      },
      {
        type: "custom",
        content: (
          <div className="hidden lg:block">
            <DataTablePageSizeSelector table={table} />
          </div>
        ),
      },
      {
        type: "custom",
        content: (
          <div className="hidden md:block">
            <DataTablePagination table={table} />
          </div>
        ),
      },
    ],
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div>
      <DataTableActionBar
        config={actionBarConfig}
        className="flex-col-reverse items-start gap-1 md:flex-row md:items-center"
      />

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          table={table}
          rowHoverTitle="Double click for order details"
          onRowDoubleClick={(sub) => {
            if (sub.mostRecentOrderId) {
              router.push(`/admin/orders/${sub.mostRecentOrderId}`);
            }
          }}
          emptyMessage="No subscriptions found."
        />
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {allFilteredRows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 col-span-full">
            No subscriptions found.
          </p>
        ) : (
          <>
            {allFilteredRows.slice(0, visibleCount).map((row) => {
              const sub = row.original;
              const mobileActions = getActionItems(sub)
                .filter(
                  (item): item is Extract<RowActionItem, { type: "item" }> =>
                    item.type === "item"
                )
                .map((item) => ({
                  label: item.label,
                  onClick: item.onClick,
                  variant: item.variant as
                    | "default"
                    | "destructive"
                    | undefined,
                  icon: item.icon ? (
                    <item.icon className="h-4 w-4 mr-2" />
                  ) : undefined,
                }));

              return (
                <Card key={sub.id} className="py-0 gap-0">
                  <MobileRecordCard
                    type="subscription"
                    status={sub.status}
                    statusLabel={
                      sub.cancelAtPeriodEnd ? "Canceling" : undefined
                    }
                    date={new Date(sub.createdAt)}
                    displayId={`#${sub.id.slice(-8)}`}
                    detailHref={
                      sub.mostRecentOrderId
                        ? `/admin/orders/${sub.mostRecentOrderId}`
                        : undefined
                    }
                    customer={{
                      name: sub.user?.name || sub.recipientName,
                      email: sub.user?.email,
                      phone: sub.recipientPhone,
                    }}
                    price={`$${(sub.priceInCents / 100).toFixed(2)}`}
                    detailsSectionHeader="Total"
                    currentPeriod={
                      sub.status !== "CANCELED"
                        ? sub.status === "PAUSED" && sub.pausedUntil
                          ? `Resumes ${format(new Date(sub.pausedUntil), "MMM d, yyyy")}`
                          : sub.status !== "PAUSED"
                            ? `Next: ${format(new Date(sub.currentPeriodEnd), "MMM d, yyyy")}`
                            : undefined
                        : undefined
                    }
                    items={sub.productNames.map((name, idx) => ({
                      id: String(idx),
                      name,
                      variant: sub.deliverySchedule || "",
                      purchaseType: "",
                      quantity: 1,
                    }))}
                    shipping={
                      sub.shippingStreet
                        ? {
                            recipientName: sub.recipientName,
                            street: sub.shippingStreet,
                            city: sub.shippingCity,
                            state: sub.shippingState,
                            postalCode: sub.shippingPostalCode,
                            country: sub.shippingCountry,
                          }
                        : undefined
                    }
                    actions={mobileActions}
                  />
                </Card>
              );
            })}
            {hasMore && (
              <div
                ref={sentinelRef as React.RefObject<HTMLDivElement>}
                className="col-span-full flex justify-center py-4"
              >
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>

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
                "---"}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {selectedSubscription?.user?.email || "---"}
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
              {selectedSubscription?.id.slice(-8)}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Customer:</strong>{" "}
              {selectedSubscription?.user?.name ||
                selectedSubscription?.recipientName ||
                "---"}
            </p>
            <p>
              <strong>Schedule:</strong>{" "}
              {selectedSubscription?.deliverySchedule || "---"}
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
              Resume subscription #{selectedSubscription?.id.slice(-8)}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Customer:</strong>{" "}
              {selectedSubscription?.user?.name ||
                selectedSubscription?.recipientName ||
                "---"}
            </p>
            <p>
              <strong>Schedule:</strong>{" "}
              {selectedSubscription?.deliverySchedule || "---"}
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
