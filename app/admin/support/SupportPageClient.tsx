"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UsageBar } from "./UsageBar";
import { submitTypedTicket, submitCommunityIssue, fetchSupportTickets } from "./actions";
import { SupportTicketsList } from "./SupportTicketsSection";
import type { LicenseInfo, AlaCartePackage, CreditPool } from "@/lib/license-types";
import type { SupportTicket } from "@/lib/support-types";

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
}

function computeTicketPageConfig(
  license: LicenseInfo,
  hasKey: boolean
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
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SupportPageClientProps {
  license: LicenseInfo;
  tickets: SupportTicket[];
  hasKey: boolean;
}

export function SupportPageClient({
  license,
  tickets: initialTickets,
  hasKey,
}: SupportPageClientProps) {
  const config = computeTicketPageConfig(license, hasKey);
  const [tickets, setTickets] = useState(initialTickets);

  async function refreshTickets() {
    const result = await fetchSupportTickets();
    if (result.success && result.data) {
      setTickets(result.data.tickets);
    }
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title="Submit Ticket"
        subtitle="Get support from our team and the community"
      />

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
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [ticketType, setTicketType] = useState<"normal" | "priority">(
    config.defaultType
  );
  const [termsNotice, setTermsNotice] = useState(false);

  const canSubmit =
    title.trim().length > 0 &&
    !isPending &&
    (ticketType === "normal" || !config.priorityDisabled);

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      if (config.hasKey && config.showTypeSelector) {
        const formData = new FormData();
        formData.set("title", title.trim());
        if (steps.trim()) formData.set("steps", steps.trim());
        if (expected.trim()) formData.set("expected", expected.trim());
        formData.set("type", ticketType);

        const result = await submitTypedTicket(formData);
        if (result.success && result.data) {
          setTitle("");
          setSteps("");
          setExpected("");
          setTermsNotice(false);
          await onSubmitted();
          if (ticketType === "priority") {
            toast({
              title: "Ticket created — we'll respond within 48 hours",
            });
          } else {
            const ticket = result.data.ticket;
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
        } else {
          // Handle terms_acceptance_required from platform 403
          if (result.errorCode === "terms_acceptance_required") {
            setTermsNotice(true);
          } else {
            toast({
              title: "Failed to create ticket",
              description: result.error,
              variant: "destructive",
            });
          }
        }
      } else {
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
      }
    });
  }

  return (
    <div className="rounded-lg border p-6 space-y-6">
        {/* Terms updated notice — shown when platform returns 403 terms_acceptance_required */}
        {termsNotice && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Updated terms require acceptance
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Our terms have been updated. Please{" "}
                <Link
                  href="/admin/support/terms?tab=terms"
                  className="font-medium underline underline-offset-4"
                >
                  review and accept
                </Link>{" "}
                the new terms, then try again.
              </p>
            </div>
          </div>
        )}

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

        {/* Type selector */}
        {config.showTypeSelector && (
          <div className="w-48">
            <Label htmlFor="ticket-type" className="text-sm mb-1.5 block">
              Ticket Type
            </Label>
            <Select
              value={ticketType}
              onValueChange={(v) =>
                setTicketType(v as "normal" | "priority")
              }
            >
              <SelectTrigger id="ticket-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <SelectItem
                  value="priority"
                  disabled={config.priorityDisabled}
                >
                  Priority{config.priorityDisabled ? " (no credits)" : ""}
                </SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
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
  const allTicketPacks = config.showUpsell
    ? license.alaCarte.filter((p) => p.id.startsWith("alacarte-tickets"))
    : config.ticketPacks;

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
              <a
                key={pack.id}
                href={pack.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{pack.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.description}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0 ml-3">
                  {pack.price}
                </span>
              </a>
            ))}
          </div>
        )}
    </div>
  );
}
