"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/error-utils";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ExternalLink,
  Package,
} from "lucide-react";
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
import { MobileRecordCard } from "@/app/(site)/_components/account/MobileRecordCard";

type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE";

interface Subscription {
  id: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: SubscriptionStatus;
  productNames: string[];
  productDescription?: string | null;
  quantities: number[];
  priceInCents: number;
  deliverySchedule: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  pausedUntil: Date | null;
  recipientName: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  createdAt: Date;
}

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
}

export default function SubscriptionsTab({
  subscriptions,
}: SubscriptionsTabProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invalidCustomerIds, setInvalidCustomerIds] = useState<Set<string>>(
    new Set()
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "skip" | "resume" | "cancel" | null;
    subscription: Subscription | null;
  }>({ open: false, action: null, subscription: null });
  const [localSubscriptions, setLocalSubscriptions] =
    useState<Subscription[]>(subscriptions);
  const { toast } = useToast();
  const editAddress = useEditAddress({
    getEndpointUrl: (id) => `/api/user/subscriptions/${id}/address`,
    successMessage: "Shipping address updated for this subscription.",
    onSuccess: (id, form) => {
      setLocalSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                recipientName: form.recipientName,
                shippingStreet: form.street,
                shippingCity: form.city,
                shippingState: form.state,
                shippingPostalCode: form.postalCode,
                shippingCountry: form.country,
              }
            : s
        )
      );
    },
  });

  const canEditAddress = (sub: Subscription) =>
    sub.status === "ACTIVE" || sub.status === "PAUSED";

  const handleAction = async (
    action: "skip" | "resume" | "cancel",
    subscription: Subscription
  ) => {
    setActionLoading(subscription.id);
    try {
      const res = await fetch(`/api/user/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} subscription`);
      }

      const result = await res.json();

      // Update local state
      setLocalSubscriptions((prev) =>
        prev.map((s) => {
          if (s.id !== subscription.id) return s;
          if (action === "skip") {
            return {
              ...s,
              status: "PAUSED" as SubscriptionStatus,
              pausedUntil: result.resumesAt ? new Date(result.resumesAt) : null,
            };
          }
          if (action === "resume") {
            return {
              ...s,
              status: "ACTIVE" as SubscriptionStatus,
              pausedUntil: null,
            };
          }
          if (action === "cancel") {
            return { ...s, cancelAtPeriodEnd: true };
          }
          return s;
        })
      );

      const messages = {
        skip: "Next delivery will be skipped",
        resume: "Subscription has been resumed",
        cancel: "Subscription will be canceled at period end",
      };

      toast({
        title: "Success",
        description: messages[action],
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, `Failed to ${action} subscription`),
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, action: null, subscription: null });
    }
  };

  const openConfirmDialog = (
    action: "skip" | "resume" | "cancel",
    subscription: Subscription
  ) => {
    setConfirmDialog({ open: true, action, subscription });
  };

  const handleManageSubscription = async (
    stripeCustomerId: string,
    subId: string
  ) => {
    setLoadingId(subId);
    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripeCustomerId,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If customer not found (404), mark as invalid and don't show error toast
        if (response.status === 404) {
          setInvalidCustomerIds(prev => new Set(prev).add(stripeCustomerId));
          return;
        }
        
        throw new Error(errorData.error || "Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to open subscription management portal"),
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (localSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>
            You don&apos;t have any active subscriptions yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Subscribe to your favorite coffee and get regular deliveries
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>
          Manage your coffee subscriptions, delivery schedules, and shipping details.
        </CardDescription>
      </CardHeader>
      <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {localSubscriptions.map((subscription) => (
        <div key={subscription.id} className="space-y-2">
          <Card className="py-0 gap-0">
            <MobileRecordCard
              type="subscription"
              status={subscription.status}
              date={subscription.createdAt}
              displayId={`#${subscription.stripeSubscriptionId.replace("sub_", "").slice(-8)}`}
              detailsSectionHeader="Schedule"
              items={subscription.productNames.map((name, idx) => ({
                id: `${subscription.id}-${idx}`,
                name,
                variant: "",
                purchaseType: subscription.deliverySchedule || "Subscription",
                quantity: subscription.quantities[idx] || 1,
              }))}
              shipping={
                subscription.shippingStreet
                  ? {
                      recipientName: subscription.recipientName,
                      street: subscription.shippingStreet,
                      city: subscription.shippingCity,
                      state: subscription.shippingState,
                      postalCode: subscription.shippingPostalCode,
                    }
                  : undefined
              }
              actions={
                subscription.status !== "CANCELED" &&
                !subscription.cancelAtPeriodEnd
                  ? [
                      // Manage Subscription (first, only if valid customer)
                      ...(!invalidCustomerIds.has(subscription.stripeCustomerId)
                        ? [{
                            label: loadingId === subscription.id ? "Opening..." : "Manage Subscription",
                            onClick: () => handleManageSubscription(subscription.stripeCustomerId, subscription.id),
                            icon: loadingId === subscription.id
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              : <ExternalLink className="mr-2 h-4 w-4" />,
                          }]
                        : []),
                      ...(canEditAddress(subscription)
                        ? [
                            {
                              label: "Edit Shipping",
                              onClick: () => editAddress.openDialog(subscription),
                            },
                          ]
                        : []),
                      ...(subscription.status === "ACTIVE"
                        ? [
                            {
                              label: "Skip Next Delivery",
                              onClick: () => openConfirmDialog("skip", subscription),
                            },
                          ]
                        : []),
                      ...(subscription.status === "PAUSED"
                        ? [
                            {
                              label: "Resume Now",
                              onClick: () => openConfirmDialog("resume", subscription),
                            },
                          ]
                        : []),
                      {
                        label: "Cancel Subscription",
                        onClick: () => openConfirmDialog("cancel", subscription),
                        variant: "destructive" as const,
                      },
                    ]
                  : undefined
              }
              actionsLoading={actionLoading === subscription.id}
              price={`${formatPrice(subscription.priceInCents)}${subscription.deliverySchedule ? ` / ${subscription.deliverySchedule.toLowerCase()}` : ""}`}
              currentPeriod={`${format(new Date(subscription.currentPeriodStart), "MMM d, yyyy")} – ${format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}`}
            />
          </Card>

          {/* Status notices */}
          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                This subscription will be canceled on{" "}
                {format(
                  new Date(subscription.currentPeriodEnd),
                  "MMM d, yyyy"
                )}
              </p>
            </div>
          )}

          {subscription.status === "PAUSED" && subscription.pausedUntil && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Next delivery skipped. Resumes{" "}
                {format(new Date(subscription.pausedUntil), "MMM d, yyyy")}
              </p>
            </div>
          )}

          {/* Canceled date */}
          {subscription.canceledAt && (
            <p className="text-sm text-muted-foreground text-center">
              Canceled on{" "}
              {format(new Date(subscription.canceledAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
      ))}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({ open: false, action: null, subscription: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "skip" && "Skip Next Delivery?"}
              {confirmDialog.action === "resume" && "Resume Subscription?"}
              {confirmDialog.action === "cancel" && "Cancel Subscription?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "skip" &&
                "Your next delivery will be skipped and your subscription will automatically resume after one billing cycle."}
              {confirmDialog.action === "resume" &&
                "Your subscription will be resumed and billing will continue from the next cycle."}
              {confirmDialog.action === "cancel" &&
                "Your subscription will be canceled at the end of the current billing period. You will still receive any remaining deliveries."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog.action &&
                confirmDialog.subscription &&
                handleAction(confirmDialog.action, confirmDialog.subscription)
              }
              disabled={actionLoading !== null}
              className={
                confirmDialog.action === "cancel"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {confirmDialog.action === "skip" && "Skip Delivery"}
                  {confirmDialog.action === "resume" && "Resume"}
                  {confirmDialog.action === "cancel" && "Cancel Subscription"}
                </>
              )}
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
    </div>
      </CardContent>
    </Card>
  );
}
