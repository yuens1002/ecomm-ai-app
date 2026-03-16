"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Video,
  X,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumb } from "@/app/admin/_components/dashboard/BreadcrumbContext";
import { usePaidAction } from "@/app/admin/support/_hooks/usePaidAction";
import { TermsNotice } from "@/app/admin/support/_components/TermsNotice";
import { bookSupportSession } from "@/app/admin/support/actions";
import type { Plan } from "@/lib/plan-types";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatQuotaLabel(key: string): string {
  if (/one.?on.?one/i.test(key)) return "1:1 Sessions";
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

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
  const breadcrumbs = useMemo(() => [{ label: plan.name }], [plan.name]);
  useBreadcrumb(breadcrumbs);
  const { toast } = useToast();

  // Session booking via usePaidAction
  const sessionAction = usePaidAction<{ bookingUrl: string }>({
    onSuccess: (data) => {
      window.open(data.bookingUrl, "_blank", "noopener");
      toast({ title: "Session booked", description: "Opening booking page…" });
    },
    onError: (error) => {
      toast({ title: "Booking failed", description: error, variant: "destructive" });
    },
  });

  // Check if the active plan matches this plan and has session credits
  const isActivePlan = license.plan?.slug === plan.slug;
  const sessionPool = license.support?.pools?.find(
    (p) => p.slug === "one-on-one" || /session/i.test(p.label ?? "")
  );
  const hasSessionCredits = sessionPool ? sessionPool.remaining > 0 : false;

  const { details } = plan;
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  const hasSlaOrQuotas =
    details.sla || (details.quotas && Object.keys(details.quotas).length > 0);

  return (
    <div className="max-w-5xl space-y-8">
      <PageTitle title={plan.name} subtitle={plan.description} />

      {/* Two-column: Pricing+Benefits left, SLA+Quotas right */}
      <div className={hasSlaOrQuotas ? "grid gap-8 lg:grid-cols-[1fr_340px]" : ""}>
        {/* Left: Pricing + Benefits */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <span className="text-3xl font-bold">{priceDisplay}</span>
              <span className="text-muted-foreground">{intervalLabel}</span>
            </div>

            {details.benefits && details.benefits.length > 0 && (
              <>
                <Separator />
                <ul className="space-y-2 text-sm">
                  {details.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: SLA + Quotas */}
        {hasSlaOrQuotas && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              {details.sla && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Service Level
                  </p>
                  <dl className="space-y-2.5 text-sm">
                    {details.sla.responseTime && (
                      <div className="flex justify-between">
                        <dt className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Response time
                        </dt>
                        <dd className="font-medium">
                          {details.sla.responseTime}
                        </dd>
                      </div>
                    )}
                    {details.sla.availability && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Availability</dt>
                        <dd className="font-medium">
                          {details.sla.availability}
                        </dd>
                      </div>
                    )}
                    {details.sla.videoCallDuration && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Video call</dt>
                        <dd className="font-medium">
                          {details.sla.videoCallDuration}
                        </dd>
                      </div>
                    )}
                    {details.sla.videoCallBooking && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Booking</dt>
                        <dd className="font-medium">
                          {details.sla.videoCallBooking}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {details.sla &&
                details.quotas &&
                Object.keys(details.quotas).length > 0 && <Separator />}

              {details.quotas && Object.keys(details.quotas).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Monthly Quotas
                  </p>
                  <div className="space-y-2.5 text-sm">
                    {Object.entries(details.quotas).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {formatQuotaLabel(key)}
                        </span>
                        <span className="font-medium">
                          {value === -1 ? "Unlimited" : `${value} / month`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scope + Excludes side by side */}
      {((details.scope && details.scope.length > 0) ||
        (details.excludes && details.excludes.length > 0)) && (
        <div className="grid gap-6 md:grid-cols-2">
          {details.scope && details.scope.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">What&apos;s Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {details.scope.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {details.excludes && details.excludes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Not Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {details.excludes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Plan Terms */}
      {details.terms && details.terms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Plan Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
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
          </CardContent>
        </Card>
      )}

      {/* Book Session CTA — only on the active plan with session credits */}
      {isActivePlan && hasSessionCredits && (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="space-y-1">
              <p className="text-sm font-medium">Schedule a 1:1 Session</p>
              <p className="text-xs text-muted-foreground">
                {sessionPool!.remaining} session{sessionPool!.remaining !== 1 ? "s" : ""} remaining
              </p>
            </div>
            <Button
              onClick={() => sessionAction.execute(() => bookSupportSession())}
              disabled={sessionAction.isPending}
            >
              <Video className="mr-2 h-4 w-4" />
              {sessionAction.isPending ? "Booking…" : "Book Session"}
            </Button>
          </CardContent>
        </Card>
      )}

      {sessionAction.showTermsNotice && <TermsNotice />}
    </div>
  );
}
