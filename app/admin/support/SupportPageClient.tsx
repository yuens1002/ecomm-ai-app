"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  Send,
  Ticket,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { IS_DEMO } from "@/lib/demo";
import { UsageBar } from "./UsageBar";
import { usePaidAction } from "./_hooks/usePaidAction";
import { TermsNotice } from "./_components/TermsNotice";
import { submitTypedTicket, submitCommunityIssue, fetchSupportTickets } from "./actions";
import { startAlaCarteCheckout } from "./add-ons/actions";
import { SupportTicketsList } from "./SupportTicketsSection";
import type { LicenseInfo, AlaCartePackage, CreditPool } from "@/lib/license-types";

import type { SupportTicket } from "@/lib/support-types";
import type { PriorityTicketResponse } from "@/lib/support-types";

// ---------------------------------------------------------------------------
// Config-driven state
// ---------------------------------------------------------------------------

interface TicketPageConfig {
  showCredits: boolean;
  ticketCredits: CreditPool;
  showTypeSelector: boolean;
  defaultType: "normal" | "priority";
  priorityDisabled: boolean;
  ticketPacks: AlaCartePackage[];
  showUpsell: boolean;
  hasKey: boolean;
  slaResponseTime?: string;
}

function formatSlaLabel(responseTime: string): string {
  // "48 hours" → "48-hr", "24 hours" → "24-hr", etc.
  return responseTime.replace(/^(\d+)\s+hours?$/i, "$1-hr");
}

function computeTicketPageConfig(
  license: LicenseInfo,
  hasKey: boolean,
  slaResponseTime?: string,
): TicketPageConfig {
  const ticketCredits = license.support.pools.find((p) => p.slug === "tickets") ?? { limit: 0, purchased: 0, used: 0, remaining: 0 };
  const hasCredits = ticketCredits.remaining > 0;
  const hasPurchased = ticketCredits.purchased > 0;
  const hasPlan = ticketCredits.limit > 0;

  const ticketPacks = license.alaCarte.filter((p) =>
    p.id.startsWith("alacarte-tickets")
  );

  return {
    showCredits: hasKey && (hasCredits || hasPurchased || hasPlan),
    ticketCredits,
    showTypeSelector: hasKey && (hasCredits || hasPurchased || hasPlan),
    defaultType: hasCredits ? "priority" : "normal",
    priorityDisabled: ticketCredits.remaining === 0,
    ticketPacks: !hasCredits || !hasKey ? ticketPacks : [],
    showUpsell: !hasKey,
    hasKey,
    slaResponseTime,
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SupportPageClientProps {
  license: LicenseInfo;
  tickets: SupportTicket[];
  hasKey: boolean;
  slaResponseTime?: string;
}

export function SupportPageClient({
  license,
  tickets: initialTickets,
  hasKey,
  slaResponseTime,
}: SupportPageClientProps) {
  const config = computeTicketPageConfig(license, hasKey, slaResponseTime);
  const [tickets, setTickets] = useState(initialTickets);

  async function refreshTickets() {
    const result = await fetchSupportTickets();
    if (result.success && result.data) {
      setTickets(result.data.tickets);
    }
  }

  const hasPendingTerms = (license.legal?.pendingAcceptance?.length ?? 0) > 0;

  return (
    <div className="max-w-5xl space-y-8">
      <PageTitle
        title="Submit Ticket"
        subtitle="Get support from our team and the community"
      />

      {hasPendingTerms && <TermsNotice />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-8">
          <TicketFormCard config={config} onSubmitted={refreshTickets} />

          {(config.ticketPacks.length > 0 || config.showUpsell) && (
            <UpsellSection config={config} license={license} />
          )}
        </div>

        <SupportTicketsList tickets={tickets} onTicketsChange={setTickets} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ticket form card — includes support status, form fields, submit
// ---------------------------------------------------------------------------

function TicketFormCard({
  config,
  onSubmitted,
}: {
  config: TicketPageConfig;
  onSubmitted: () => Promise<void>;
}) {
  const { toast } = useToast();
  const ticketTypeId = useId();
  const [communityPending, startCommunityTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [ticketType, setTicketType] = useState<"normal" | "priority">(
    config.defaultType
  );

  // Paid action hook — handles 403 terms_acceptance_required automatically
  const paidAction = usePaidAction<PriorityTicketResponse>({
    onSuccess: async (data) => {
      setTitle("");
      setSteps("");
      setExpected("");
      await onSubmitted();
      if (ticketType === "priority") {
        toast({ title: "Ticket created — we'll respond within 48 hours" });
      } else {
        const ticket = data.ticket;
        toast({
          title: "Issue created",
          description: ticket.githubUrl ? (
            <a
              href={ticket.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          ) : undefined,
        });
      }
    },
    onError: (error) => {
      toast({ title: "Failed to create ticket", description: error, variant: "destructive" });
    },
  });

  const isPending = paidAction.isPending || communityPending;
  const canSubmit =
    title.trim().length > 0 &&
    !isPending &&
    (ticketType === "normal" || !config.priorityDisabled);

  function handleSubmit() {
    if (IS_DEMO) {
      toast({ title: "Changes are disabled in demo mode.", variant: "demo" });
      setTitle("");
      setSteps("");
      setExpected("");
      return;
    }
    if (!canSubmit) return;

    if (config.hasKey && config.showTypeSelector) {
      const formData = new FormData();
      formData.set("title", title.trim());
      if (steps.trim()) formData.set("steps", steps.trim());
      if (expected.trim()) formData.set("expected", expected.trim());
      formData.set("type", ticketType);

      paidAction.execute(() => submitTypedTicket(formData));
    } else {
      startCommunityTransition(async () => {
        const formData = new FormData();
        formData.set("title", title.trim());
        const bodyParts: string[] = [];
        if (steps.trim())
          bodyParts.push(`**Steps to reproduce:**\n${steps.trim()}`);
        if (expected.trim())
          bodyParts.push(`**Expected / actual:**\n${expected.trim()}`);
        if (bodyParts.length > 0)
          formData.set("body", bodyParts.join("\n\n"));

        const result = await submitCommunityIssue(formData);
        if (result.success && result.data) {
          setTitle("");
          setSteps("");
          setExpected("");
          await onSubmitted();
          toast({
            title: `Issue #${result.data.issueNumber} created`,
            description: (
              <a
                href={result.data.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            ),
          });
        } else {
          toast({
            title: "Failed to create issue",
            description: result.error,
            variant: "destructive",
          });
        }
      });
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-6">
        {/* Terms notice — shown when platform returns 403 terms_acceptance_required */}
        {paidAction.showTermsNotice && <TermsNotice />}

        {/* Credits — ticket credits only (sessions managed on Plans page) */}
        {config.showCredits && (
          <div className="rounded-lg bg-muted/30 p-4 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Credits
            </p>
            <UsageBar
              icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
              label="Priority Tickets"
              pool={config.ticketCredits}
            />
          </div>
        )}

        {/* Support level selector — radio cards */}
        {config.showTypeSelector && (
          <div>
            <Label className="text-sm mb-1.5 block">Support Level</Label>
            <RadioGroup
              value={ticketType}
              onValueChange={(v) => setTicketType(v as "normal" | "priority")}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className={cn(
                "border-input has-data-[state=checked]:border-primary/50 relative flex flex-1 items-center gap-3 rounded-md border p-4 shadow-xs",
                config.priorityDisabled && "opacity-50 cursor-not-allowed"
              )}>
                <RadioGroupItem
                  value="priority"
                  id={`${ticketTypeId}-priority`}
                  disabled={config.priorityDisabled}
                  className="size-4 after:absolute after:inset-0 [&_svg]:size-2.5"
                />
                <div className="grid gap-0.5">
                  <Label htmlFor={`${ticketTypeId}-priority`} className="text-sm font-medium leading-none">
                    Priority
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {config.priorityDisabled
                      ? "No credits remaining"
                      : `${config.slaResponseTime ? `${formatSlaLabel(config.slaResponseTime)} response time` : "Priority response"} · Uses 1 credit`}
                  </p>
                </div>
              </div>

              <div className="border-input has-data-[state=checked]:border-primary/50 relative flex flex-1 items-center gap-3 rounded-md border p-4 shadow-xs">
                <RadioGroupItem
                  value="normal"
                  id={`${ticketTypeId}-normal`}
                  className="size-4 after:absolute after:inset-0 [&_svg]:size-2.5"
                />
                <div className="grid gap-0.5">
                  <Label htmlFor={`${ticketTypeId}-normal`} className="text-sm font-medium leading-none">
                    Normal
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Community-triaged · No credits needed
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="ticket-title" className="text-sm mb-1.5 block">
              Title
            </Label>
            <Input
              id="ticket-title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              A brief summary helps us triage faster
            </p>
          </div>
          <div>
            <Label htmlFor="ticket-steps" className="text-sm mb-1.5 block">
              Steps to Reproduce
            </Label>
            <Textarea
              id="ticket-steps"
              placeholder={"1. Go to...\n2. Click on...\n3. See error"}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              disabled={isPending}
              rows={3}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              What steps lead to the issue?
            </p>
          </div>
          <div>
            <Label htmlFor="ticket-expected" className="text-sm mb-1.5 block">
              Expected / Actual Behavior
            </Label>
            <Textarea
              id="ticket-expected"
              placeholder="Expected: ... / Actual: ..."
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              disabled={isPending}
              rows={2}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              What did you expect vs what happened?
            </p>
          </div>
        </div>

        {/* Submit + anonymous note */}
        <div className="space-y-3">
          <Button onClick={handleSubmit} disabled={!canSubmit} size="sm">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Ticket
          </Button>
          <p className="text-xs text-muted-foreground">
            Tickets are viewable on{" "}
            <a
              href="https://github.com/artisanroast/artisan-roast/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              GitHub
            </a>
            {" "}— no personal information is shared
          </p>
        </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upsell section — a la carte CTAs for users who need more credits
// ---------------------------------------------------------------------------

function UpsellSection({
  config,
  license,
}: {
  config: TicketPageConfig;
  license: LicenseInfo;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const allTicketPacks = config.showUpsell
    ? license.alaCarte.filter((p) => p.id.startsWith("alacarte-tickets"))
    : config.ticketPacks;

  function handlePurchase(alaCarteSlug: string) {
    const formData = new FormData();
    formData.set("alaCarteSlug", alaCarteSlug);

    startTransition(async () => {
      const result = await startAlaCarteCheckout(formData);
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

  return (
    <div className="rounded-lg border p-6 space-y-4">
        {config.showUpsell && (
          <p className="text-sm text-muted-foreground">
            For priority response times, subscribe to{" "}
            <Link
              href="/admin/support/plans"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Priority Support
            </Link>{" "}
            or purchase credits below.
          </p>
        )}

        {allTicketPacks.length > 0 && (
          <div className="space-y-2">
            {!config.showUpsell && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Need more credits?
              </p>
            )}
            {allTicketPacks.map((pack) => (
              <button
                key={pack.id}
                type="button"
                disabled={isPending}
                onClick={() => handlePurchase(pack.id)}
                className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-left">
                  <p className="text-sm font-medium">{pack.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.description}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0 ml-3">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    pack.price
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
