"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { bookSupportSession } from "../../actions";
import { startCheckout } from "../actions";
import type { LicenseInfo, AlaCartePackage } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanDetailClientProps {
  plan: Plan;
  license: LicenseInfo;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanDetailClient({ plan, license }: PlanDetailClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { details } = plan;
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  const isActive = license.plan?.slug === plan.slug;
  const isInactive = license.lapsed?.planSlug === plan.slug;

  function handleSubscribe() {
    const formData = new FormData();
    formData.set("planSlug", plan.slug);

    startTransition(async () => {
      const result = await startCheckout(formData);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast({
          title: "Checkout failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleManageBilling() {
    const billingAction = license.availableActions.find(
      (a) => a.slug === "manage-billing"
    );
    if (billingAction) {
      window.open(billingAction.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleBookSession() {
    startTransition(async () => {
      const result = await bookSupportSession();
      if (result.success && result.bookingUrl) {
        window.open(result.bookingUrl, "_blank", "noopener,noreferrer");
        toast({ title: "Session booked" });
      } else {
        toast({
          title: "Booking failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-12">
      <div>
        <PageTitle title={plan.name} subtitle={plan.description} />
        {isActive && license.plan?.snapshotAt && (
          <p className="text-sm text-muted-foreground mt-2">
            Your plan since{" "}
            {new Date(license.plan.snapshotAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
        {!isActive && !isInactive && (
          <p className="text-sm text-muted-foreground mt-2">Current plan details</p>
        )}
      </div>

      {/* Pricing */}
      <FieldSet>
        <div className="flex items-center gap-3">
          <FieldLegend className="mb-0">Pricing</FieldLegend>
          {isActive && <Badge variant="secondary">Active</Badge>}
          {isInactive && <Badge variant="destructive">Inactive</Badge>}
        </div>
        <div>
          <span className="text-2xl font-bold">{priceDisplay}</span>
          <span className="text-muted-foreground">{intervalLabel}</span>
        </div>
      </FieldSet>

      {/* Benefits */}
      {details.benefits && details.benefits.length > 0 && (
        <FieldSet>
          <FieldLegend>Benefits</FieldLegend>
          <ul className="space-y-1.5 text-sm">
            {details.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {benefit}
              </li>
            ))}
          </ul>
        </FieldSet>
      )}

      {/* SLA */}
      {details.sla && (
        <FieldSet>
          <FieldLegend>Service Level</FieldLegend>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {details.sla.responseTime && (
              <>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Response time
                </dt>
                <dd>{details.sla.responseTime}</dd>
              </>
            )}
            {details.sla.availability && (
              <>
                <dt className="text-muted-foreground">Availability</dt>
                <dd>{details.sla.availability}</dd>
              </>
            )}
            {details.sla.videoCallDuration && (
              <>
                <dt className="text-muted-foreground">Video call</dt>
                <dd>{details.sla.videoCallDuration}</dd>
              </>
            )}
            {details.sla.videoCallBooking && (
              <>
                <dt className="text-muted-foreground">Booking</dt>
                <dd>{details.sla.videoCallBooking}</dd>
              </>
            )}
          </dl>
        </FieldSet>
      )}

      {/* Quotas */}
      {details.quotas && Object.keys(details.quotas).length > 0 && (
        <FieldSet>
          <FieldLegend>Monthly Quotas</FieldLegend>
          <div className="space-y-1 text-sm">
            {Object.entries(details.quotas).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize text-muted-foreground">
                  {key.replace(/-/g, " ")}
                </span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </FieldSet>
      )}

      {/* Scope */}
      {details.scope && details.scope.length > 0 && (
        <FieldSet>
          <FieldLegend>What&apos;s Covered</FieldLegend>
          <ul className="space-y-1 text-sm">
            {details.scope.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </FieldSet>
      )}

      {/* Excludes */}
      {details.excludes && details.excludes.length > 0 && (
        <FieldSet>
          <FieldLegend>Not Included</FieldLegend>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {details.excludes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                {item}
              </li>
            ))}
          </ul>
        </FieldSet>
      )}

      {/* Add-On Packages */}
      {license.alaCarte.length > 0 && (
        <FieldSet>
          <FieldLegend>Add-On Packages</FieldLegend>
          <FieldDescription>
            Purchase additional credits. Credits never expire.
          </FieldDescription>

          <div className="space-y-3">
            {license.alaCarte.map((pkg) => (
              <AddOnPackageCard
                key={pkg.id}
                pkg={pkg}
                license={license}
                isPending={isPending}
                onBookSession={handleBookSession}
              />
            ))}
          </div>
        </FieldSet>
      )}

      {/* Plan Terms */}
      {details.terms && details.terms.length > 0 && (
        <FieldSet>
          <FieldLegend>Plan Terms</FieldLegend>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {details.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
          <Link
            href="/admin/support/terms?tab=terms"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View Support Service Terms &rarr;
          </Link>
        </FieldSet>
      )}

      {/* Bottom CTA */}
      <div className="flex items-center gap-3">
        {isActive ? (
          <Button variant="outline" size="sm" onClick={handleManageBilling}>
            Manage Billing
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ) : isInactive ? (
          <Button size="sm" asChild>
            <a
              href={license.lapsed!.renewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Renew
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubscribe} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subscribe
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add-On Package Card
// ---------------------------------------------------------------------------

function AddOnPackageCard({
  pkg,
  license,
  isPending,
  onBookSession,
}: {
  pkg: AlaCartePackage;
  license: LicenseInfo;
  isPending: boolean;
  onBookSession: () => void;
}) {
  const isSessionPack = pkg.id.startsWith("alacarte-sessions");
  const sessionCredits = license.support.oneOnOne;
  const hasSessionCredits = sessionCredits.remaining > 0;

  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{pkg.label}</p>
          <span className="text-sm font-medium">{pkg.price}</span>
        </div>
        <p className="text-xs text-muted-foreground">{pkg.description}</p>
        {/* Show remaining credits for purchased packs */}
        {isSessionPack && sessionCredits.purchased > 0 && (
          <p className="text-xs text-muted-foreground">
            {sessionCredits.remaining} credits remaining
          </p>
        )}
        {!isSessionPack && license.support.tickets.purchased > 0 && (
          <p className="text-xs text-muted-foreground">
            {license.support.tickets.remaining} credits remaining
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {isSessionPack && hasSessionCredits && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBookSession}
            disabled={isPending}
          >
            Book Session
          </Button>
        )}
        {isSessionPack && !hasSessionCredits && sessionCredits.purchased > 0 && (
          <Button variant="outline" size="sm" disabled>
            Book Session
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <a href={pkg.checkoutUrl} target="_blank" rel="noopener noreferrer">
            Purchase
          </a>
        </Button>
      </div>
    </div>
  );
}
