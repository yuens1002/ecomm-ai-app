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
  Calendar,
  PauseCircle,
  PlayCircle,
  XCircle,
  MapPin,
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
import { useEditAddress } from "@/hooks/useEditAddress";
import { EditAddressDialog } from "@/components/EditAddressDialog";

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

  const getStatusBadgeClass = (status: SubscriptionStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "CANCELED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "PAST_DUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="space-y-4">
      {localSubscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {subscription.stripeSubscriptionId.replace("sub_", "")}
                </CardTitle>
                <CardDescription className="mt-1 space-y-0">
                  {subscription.productNames.map((name, idx) => (
                    <span key={idx} className="block">
                      {name}
                      {subscription.quantities[idx] > 1 &&
                        ` × ${subscription.quantities[idx]}`}
                    </span>
                  ))}
                </CardDescription>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                  subscription.status
                )}`}
              >
                {subscription.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing & Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold">
                  {formatPrice(subscription.priceInCents)}
                  {subscription.deliverySchedule && (
                    <span className="text-sm text-muted-foreground font-normal ml-1">
                      / {subscription.deliverySchedule.toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
              {subscription.deliverySchedule && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivery</p>
                  <p className="font-semibold">
                    {subscription.deliverySchedule}
                  </p>
                </div>
              )}
            </div>

            {/* Billing Period */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Current period:{" "}
                <span className="text-foreground">
                  {format(
                    new Date(subscription.currentPeriodStart),
                    "MMM d, yyyy"
                  )}
                  {" - "}
                  {format(
                    new Date(subscription.currentPeriodEnd),
                    "MMM d, yyyy"
                  )}
                </span>
              </span>
            </div>

            {/* Shipping Address */}
            {subscription.shippingStreet && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-muted-foreground">
                    Shipping to
                  </p>
                  {canEditAddress(subscription) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => editAddress.openDialog(subscription)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="text-sm">
                  {subscription.recipientName && (
                    <p className="font-medium">{subscription.recipientName}</p>
                  )}
                  <p>{subscription.shippingStreet}</p>
                  <p>
                    {subscription.shippingCity}, {subscription.shippingState}{" "}
                    {subscription.shippingPostalCode}
                  </p>
                  {subscription.shippingCountry && (
                    <p>{subscription.shippingCountry}</p>
                  )}
                </div>
              </div>
            )}

            {/* Status Notices */}
            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ This subscription will be canceled on{" "}
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
                  ⏸️ Next delivery skipped. Resumes{" "}
                  {format(new Date(subscription.pausedUntil), "MMM d, yyyy")}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {subscription.status !== "CANCELED" &&
              !subscription.cancelAtPeriodEnd && (
                <div className="flex flex-wrap gap-2">
                  {subscription.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirmDialog("skip", subscription)}
                      disabled={actionLoading === subscription.id}
                    >
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Skip Next Delivery
                    </Button>
                  )}
                  {subscription.status === "PAUSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirmDialog("resume", subscription)}
                      disabled={actionLoading === subscription.id}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Resume Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConfirmDialog("cancel", subscription)}
                    disabled={actionLoading === subscription.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                </div>
              )}

            {/* Manage Button or Info Message */}
            {subscription.status !== "CANCELED" && (
              <>
                {invalidCustomerIds.has(subscription.stripeCustomerId) ? (
                  <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground text-center">
                    <p>Subscription management is not available for demo accounts.</p>
                    <p className="mt-1 text-xs">Create a real order to access the billing portal.</p>
                  </div>
                ) : (
                  <Button
                    onClick={() =>
                      handleManageSubscription(
                        subscription.stripeCustomerId,
                        subscription.id
                      )
                    }
                    disabled={loadingId === subscription.id}
                    className="w-full"
                  >
                    {loadingId === subscription.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening Portal...
                      </>
                    ) : (
                      <>
                        Manage Subscription
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Canceled Date */}
            {subscription.canceledAt && (
              <p className="text-sm text-muted-foreground text-center">
                Canceled on{" "}
                {format(new Date(subscription.canceledAt), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
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
        title="Edit Shipping Address"
        description="Update the shipping address for this subscription. Changes apply to future renewals only."
        savedAddresses={editAddress.savedAddresses}
        addressForm={editAddress.addressForm}
        formLoading={editAddress.formLoading}
        onAddressSelect={editAddress.handleSelect}
        onFieldChange={(field, value) =>
          editAddress.setAddressForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={editAddress.handleSubmit}
      />
    </div>
  );
}
