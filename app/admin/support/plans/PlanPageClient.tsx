"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Ticket,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { UsageBar, getNextRenewalDate } from "../UsageBar";
import { refreshLicense } from "../actions";
import { startCheckout } from "./actions";
import type {
  LicenseInfo,
  UsagePool,
  AvailableAction,
} from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Icon map — maps platform icon hints to lucide components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  "credit-card": CreditCard,
  "arrow-up-right": ArrowUpRight,
  plus: Plus,
  ticket: Ticket,
  video: Video,
};

function resolveIcon(icon: string, fallback: LucideIcon = ExternalLink): LucideIcon {
  return ICON_MAP[icon] ?? fallback;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface PlanCardConfig {
  plan: Plan;
  status: "active" | "inactive" | "none";
  badge: { label: string; variant: "secondary" | "destructive" } | null;
  pools: UsagePool[];
  actions: AvailableAction[];
  renewalDate: string | null;
  inactiveInfo: {
    deactivatedAt: string;
    renewUrl: string;
    previousFeatures: string[];
  } | null;
}

function computePlanCardConfig(
  plan: Plan,
  license: LicenseInfo
): PlanCardConfig {
  if (license.plan?.slug === plan.slug) {
    return {
      plan,
      status: "active",
      badge: { label: "Active", variant: "secondary" },
      pools: license.support.pools.filter(
        (p) => p.limit > 0 || p.purchased > 0
      ),
      actions: license.availableActions.filter(
        (a) => a.slug !== "upgrade-pro" && a.slug !== "add-features"
      ),
      renewalDate: license.plan.snapshotAt
        ? getNextRenewalDate(license.plan.snapshotAt, plan.interval)
        : null,
      inactiveInfo: null,
    };
  }

  if (license.lapsed?.planSlug === plan.slug) {
    return {
      plan,
      status: "inactive",
      badge: { label: "Inactive", variant: "destructive" },
      pools: [],
      actions: [],
      renewalDate: null,
      inactiveInfo: {
        deactivatedAt: license.lapsed.deactivatedAt,
        renewUrl: license.lapsed.renewUrl,
        previousFeatures: license.lapsed.previousFeatures,
      },
    };
  }

  return {
    plan,
    status: "none",
    badge: null,
    pools: [],
    actions: [],
    renewalDate: null,
    inactiveInfo: null,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanPageClientProps {
  license: LicenseInfo;
  plans: Plan[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanPageClient({ license, plans }: PlanPageClientProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      startTransition(async () => {
        const result = await refreshLicense();
        if (result.success) {
          toast({
            title: "Plan activated — you now have priority support!",
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubscribe(planSlug: string) {
    const formData = new FormData();
    formData.set("planSlug", planSlug);

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

  const hasPlans = plans.length > 0;
  const configs = plans.map((p) => computePlanCardConfig(p, license));

  return (
    <div className="space-y-8">
      <PageTitle
        title="Plans"
        subtitle="Browse and manage your support plan"
      />

      {/* Compatibility warnings */}
      {license.warnings.length > 0 && (
        <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Compatibility Notice
          </div>
          <ul className="list-disc pl-6 text-sm text-amber-700 dark:text-amber-300">
            {license.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {hasPlans ? (
        <div className="grid gap-4 md:grid-cols-2">
          {configs.map((config) => (
            <PlanCard
              key={config.plan.slug}
              config={config}
              isPending={isPending}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Plans could not be loaded. If you&apos;re a subscriber, your
              existing plan remains active. Please check your connection or try
              again.
            </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanCard — shared card driven by config
// ---------------------------------------------------------------------------

interface PlanCardProps {
  config: PlanCardConfig;
  isPending: boolean;
  onSubscribe: (slug: string) => void;
}

function PlanCard({
  config,
  isPending,
  onSubscribe,
}: PlanCardProps) {
  const router = useRouter();
  const { plan, status } = config;
  const detailHref = `/admin/support/plans/${plan.slug}`;

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if clicking interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [role=menuitem]")) return;
    router.push(detailHref);
  }

  // ── Active: compact status-focused, 60/40 layout ──
  if (status === "active") {
    return (
      <div className="flex flex-col rounded-lg border border-primary p-6 transition-shadow hover:shadow-lg cursor-pointer" onClick={handleCardClick}>
          {/* Header: badge right when no menu (lg+), badge left + menu right on mobile */}
          <div className="flex items-center justify-between lg:justify-end mb-4">
            <Badge variant={config.badge!.variant} className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {config.badge!.label}
            </Badge>

            {/* Mobile: dropdown menu */}
            {config.actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {config.actions.map((action) => {
                    const Icon = resolveIcon(action.icon);
                    return (
                      <DropdownMenuItem key={action.slug} asChild>
                        <a
                          href={action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {action.label}
                          <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem asChild>
                    <Link href={detailHref}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.description}
              </p>
            </div>

            {config.renewalDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Renews on {config.renewalDate}
              </div>
            )}

            {config.pools.map((pool) => {
              const PoolIcon = resolveIcon(pool.icon, Ticket);
              return (
                <UsageBar
                  key={pool.slug}
                  icon={
                    <PoolIcon className="h-4 w-4 text-muted-foreground" />
                  }
                  label={pool.label}
                  pool={pool}
                />
              );
            })}
          </div>

          {/* Desktop: inline buttons — always bottom-aligned */}
          <div className="hidden lg:flex items-center gap-2 mt-auto pt-5">
            <Link
              href={detailHref}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Details
            </Link>
            <div className="flex-1" />
            {config.actions.map((action) => {
              const Icon = resolveIcon(action.icon);
              return (
                <Button
                  key={action.slug}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    {action.label}
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </Button>
              );
            })}
          </div>
      </div>
    );
  }

  // ── Inactive (lapsed): renewal CTA ──
  if (status === "inactive" && config.inactiveInfo) {
    return (
      <div className="flex flex-col rounded-lg border p-6 space-y-4 transition-shadow hover:shadow-lg cursor-pointer" onClick={handleCardClick}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ended on{" "}
                {new Date(
                  config.inactiveInfo.deactivatedAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <Badge variant={config.badge!.variant} className="shrink-0">
              {config.badge!.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Renew to get back:
            </p>
            <ul className="space-y-1.5 text-sm">
              {config.inactiveInfo.previousFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-1">
            <Button size="sm" asChild>
              <a
                href={config.inactiveInfo.renewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Renew
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
      </div>
    );
  }

  // ── None: full details to sell ──
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  return (
    <div className="flex flex-col rounded-lg border p-6 space-y-5 transition-shadow hover:shadow-lg cursor-pointer" onClick={handleCardClick}>
        <div>
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.description}
          </p>
        </div>

        <div>
          <span className="text-3xl font-bold">{priceDisplay}</span>
          <span className="text-muted-foreground">{intervalLabel}</span>
        </div>

        {plan.details.benefits && plan.details.benefits.length > 0 && (
          <ul className="space-y-2 text-sm">
            {plan.details.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2 mt-auto pt-0">
          <Link
            href={detailHref}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View Details
          </Link>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => onSubscribe(plan.slug)}
            disabled={isPending}
          >
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Subscribe
          </Button>
        </div>
    </div>
  );
}
