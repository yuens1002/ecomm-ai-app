"use client";

import { useState } from "react";
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
import { Loader2, ExternalLink, Package, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management portal",
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

  if (subscriptions.length === 0) {
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
      {subscriptions.map((subscription) => (
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
                <p className="text-sm text-muted-foreground mb-1">
                  Shipping to
                </p>
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

            {/* Cancel Notice */}
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

            {/* Manage Button */}
            {subscription.status !== "CANCELED" && (
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
    </div>
  );
}
